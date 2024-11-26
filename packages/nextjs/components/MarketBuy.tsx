import {parseEther, encodeFunctionData, createWalletClient, custom} from "viem";
import {useReadContract, useWriteContract} from "wagmi";
import {usePublicClient} from "wagmi";
import {useScaffoldContract, useTransactor} from "~~/hooks/scaffold-eth";
import {fromNumberToInt128, fromInt128toNumber} from "~~/utils/numbers";
import { usePrivy, useWallets } from "@privy-io/react-auth";
import {baseSepolia} from 'viem/chains';

type MarketBuyProps = {
    marketId: number;
    marketOutcome: number;
    outcomeLabel?: string;
    sharesToTrade?: number
};

// ERC20 ABI - just the functions we need
const erc20Abi = [
    {
        "inputs": [
            { "name": "spender", "type": "address" },
            { "name": "amount", "type": "uint256" }
        ],
        "name": "approve",
        "outputs": [{ "name": "", "type": "bool" }],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [{ "name": "account", "type": "address" }],
        "name": "balanceOf",
        "outputs": [{ "name": "", "type": "uint256" }],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            { "name": "owner", "type": "address" },
            { "name": "spender", "type": "address" }
        ],
        "name": "allowance",
        "outputs": [{ "name": "", "type": "uint256" }],
        "stateMutability": "view",
        "type": "function"
    }
] as const;

export const MarketBuy = ({marketId, marketOutcome, outcomeLabel = "", sharesToTrade = 1}: MarketBuyProps) => {
    const {data: master} = useScaffoldContract({contractName: "PrecogMasterV7"});
    const ABI = master ? master.abi : [];
    const { authenticated, user } = usePrivy();
    const { wallets } = useWallets();
    const publicClient = usePublicClient();

    const {writeContractAsync, isPending} = useWriteContract();
    const writeTx = useTransactor();

    const market = BigInt(marketId);
    const outcome = BigInt(marketOutcome);
    const shares = fromNumberToInt128(sharesToTrade);
    const {data: priceInt128, isLoading: isPriceLoading} = useReadContract({
        abi: ABI, address: master?.address, functionName: 'marketBuyPrice', args: [market, outcome, shares]
    });

    if (isPriceLoading || !master) {
        return (
            <span className="loading loading-spinner loading-sm"></span>
        );
    }
    const price = priceInt128 ? fromInt128toNumber(priceInt128) : 1;
    const maxTokenIn = price * 1.001  // Add 0.1% of slippage
    const maxIn: bigint = parseEther(maxTokenIn.toString());

    const handleWriteAction = async () => {
        if (!publicClient || !master || !user?.wallet) return;

        try {
            let provider;
            let address;
            let walletClient;

            if (user.wallet.walletClientType === 'privy') {
                const wallet = wallets[0];
                provider = await wallet.getEthereumProvider();
                address = wallet.address;
            } else {
                const wallet = wallets.find(w => w.walletClientType === user.wallet?.walletClientType);
                if (!wallet) {
                    throw new Error('Desired wallet not found');
                }
                provider = await wallet.getEthereumProvider();
                address = wallet.address;
                walletClient = createWalletClient({
                    account: address as `0x${string}`,
                    chain: baseSepolia,
                    transport: custom(provider),
                });
            }

            console.log("=== Wallet Details ===");
            console.log("Wallet Address:", address);
            console.log("Wallet Type:", user.wallet.walletClientType);

            const tokenAddress = await master.read.token();
            console.log("=== Token Details ===");
            console.log("Token Contract:", tokenAddress);
            
            const balance = await publicClient.readContract({
                address: tokenAddress,
                abi: erc20Abi,
                functionName: 'balanceOf',
                args: [address as `0x${string}`],
            });

            const allowance = await publicClient.readContract({
                address: tokenAddress,
                abi: erc20Abi,
                functionName: 'allowance',
                args: [address as `0x${string}`, master.address],
            });

            console.log("Token Balance:", balance.toString());
            console.log("Token Allowance:", allowance.toString());
            console.log("Required Amount:", maxIn.toString());

            if (allowance < maxIn) {
                console.log("Insufficient allowance, approving tokens...");
                
                const approveTxData = encodeFunctionData({
                    abi: erc20Abi,
                    functionName: 'approve',
                    args: [master.address, maxIn],
                });

                let approveTx;
                if (user.wallet.walletClientType === 'privy') {
                    approveTx = await provider.request({
                        method: 'eth_sendTransaction',
                        params: [{
                            from: address,
                            to: tokenAddress,
                            data: approveTxData,
                        }],
                    });
                } else {
                    approveTx = await walletClient?.sendTransaction({
                        to: tokenAddress,
                        data: approveTxData,
                    });
                }
                
                console.log("Approval transaction:", approveTx);
                await publicClient.waitForTransactionReceipt({ 
                    hash: approveTx as `0x${string}` 
                });
            }

            const marketBuyTxData = encodeFunctionData({
                abi: ABI,
                functionName: "marketBuy",
                args: [market, outcome, shares, maxIn],
            });

            let marketBuyTx;
            if (user.wallet.walletClientType === 'privy') {
                marketBuyTx = await provider.request({
                    method: 'eth_sendTransaction',
                    params: [{
                        from: address,
                        to: master.address,
                        data: marketBuyTxData,
                    }],
                });
            } else {
                marketBuyTx = await walletClient?.sendTransaction({
                    to: master.address,
                    data: marketBuyTxData,
                });
            }

            console.log("Market Buy Transaction:", marketBuyTx);
            const receipt = await publicClient.waitForTransactionReceipt({ 
                hash: marketBuyTx as `0x${string}` 
            });
            
            console.log("Transaction Receipt:", receipt);
        } catch (e) {
            console.log("=== Transaction Failed ===");
            console.log("Error Type:", typeof e);
            console.log("Error Details:", e);
            if (e instanceof Error) {
                console.log("Error Stack:", e.stack);
            }
        }
    };

    let outcomeText = `OUTCOME-${marketOutcome}`;
    if (outcomeLabel) {
        outcomeText = `Bet ${outcomeLabel}`;
    }
    const buyCost = sharesToTrade > 1 ? `cost: ${price.toFixed(2)}` : price.toFixed(2);

    return (
        <button className="btn btn-neutral rounded-lg" onClick={handleWriteAction} disabled={isPending}>
            {isPending ?
                <span className="loading loading-spinner loading-sm"></span> :
                <div className="leading-4">
                    <span className="text-[1.1em]">{outcomeText}</span>
                    <br/>
                    <span>({buyCost}</span>
                    <span className="text-[0.6em] font-bold ml-1">PRE</span>
                    <span>)</span>
                </div>
            }
        </button>
    );
};
