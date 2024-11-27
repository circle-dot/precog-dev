import {formatEther, parseEther, encodeFunctionData, Hash} from "viem";
import {useReadContract, usePublicClient} from "wagmi";
import {useScaffoldContract, useTransactor} from "~~/hooks/scaffold-eth";
import {fromNumberToInt128, fromInt128toNumber} from "~~/utils/numbers"
import { usePrivy, useWallets } from "@privy-io/react-auth";
import { useState } from "react";

type MarketSellProps = {
    marketId: number;
    marketOutcome: number;
    outcomeLabel: string;
    outcomeBalance?: bigint;
    sharesToTrade?: number;
};

export const MarketSell = ({
                               marketId,
                               marketOutcome,
                               outcomeLabel,
                               outcomeBalance = BigInt(0),
                               sharesToTrade = 0
                           }: MarketSellProps) => {
    const {data: master} = useScaffoldContract({contractName: "PrecogMasterV7"});
    const ABI = master ? master.abi : [];
    const { user } = usePrivy();
    const { wallets } = useWallets();
    const publicClient = usePublicClient();
    const [isPending, setIsPending] = useState(false);
    const writeTx = useTransactor();

    const market = BigInt(marketId);
    const outcome = BigInt(marketOutcome);
    const sellAmount = Math.min(sharesToTrade, Number(formatEther(outcomeBalance)));
    const shares = fromNumberToInt128(sellAmount);
    const {data: priceInt128, isLoading: isPriceLoading} = useReadContract({
        abi: ABI, address: master?.address, functionName: 'marketSellPrice', args: [market, outcome, shares]
    });

    if (isPriceLoading || !master) {
        return (<span className="loading loading-spinner loading-sm"></span>);
    }

    if (outcomeBalance == BigInt(0)) {
        return null;
    }

    const price = priceInt128 ? fromInt128toNumber(priceInt128) : 1;
    const minTokenOut = price * 0.999  // Add 0.1% of slippage
    const minOut: bigint = parseEther(minTokenOut.toString());

    const handleWriteAction = async () => {
        if (!publicClient || !master || !user?.wallet) return;
        setIsPending(true);

        try {
            let provider: { request(args: { method: string; params?: any[] }): Promise<any> };
            let address: string;

            if (user.wallet.walletClientType === 'privy') {
                const wallet = wallets[0];
                
                const currentChainId = wallet.chainId;
                console.log("Current Chain ID:", currentChainId);
                
                if (currentChainId !== '84532') {
                    console.log("Switching to Base Sepolia...");
                    await wallet.switchChain(84532);
                    console.log("Switched to Base Sepolia");
                }

                provider = await wallet.getEthereumProvider();
                address = wallet.address;
            } else {
                const wallet = wallets.find((w: { walletClientType: string }) => 
                    w.walletClientType === user?.wallet?.walletClientType
                );
                if (!wallet) {
                    throw new Error('Desired wallet not found');
                }
                provider = await wallet.getEthereumProvider();
                address = wallet.address;
            }

            console.log("=== Wallet Details ===");
            console.log("Wallet Address:", address);
            console.log("Wallet Type:", user.wallet.walletClientType);

            const marketSellTxData = encodeFunctionData({
                abi: ABI,
                functionName: "marketSell",
                args: [market, outcome, shares, minOut],
            });

            await writeTx(async () => {
                const tx = await provider.request({
                    method: 'eth_sendTransaction',
                    params: [{
                        from: address,
                        to: master.address,
                        data: marketSellTxData,
                    }],
                });
                return tx as Hash;
            }, { blockConfirmations: 1 });

        } catch (e) {
            console.log("=== Transaction Failed ===");
            console.log("Error Type:", typeof e);
            console.log("Error Details:", e);
            if (e instanceof Error) {
                console.log("Error Stack:", e.stack);
            }
        } finally {
            setIsPending(false);
        }
    };

    let outcomeText = `Sell ${outcomeLabel}`;
    if (sellAmount != sharesToTrade) {
        outcomeText = `${outcomeText} [${sellAmount}]`;
    }
    const sellReturn = sellAmount > 1 ? `return: ${price.toFixed(2)}` : price.toFixed(2);

    return (
        <button className="btn btn-accent rounded-lg" onClick={handleWriteAction} disabled={isPending}>
            {isPending ?
                <span className="loading loading-spinner loading-sm"></span> :
                <div>
                    <div className="leading-4">
                        <span className="text-[1.1em]">{outcomeText}</span>
                        <br/>
                        <span>({sellReturn}</span>
                        <span className="text-[0.6em] font-bold ml-1">PRE</span>
                        <span>)</span>
                    </div>
                </div>
            }
        </button>
    );
};
