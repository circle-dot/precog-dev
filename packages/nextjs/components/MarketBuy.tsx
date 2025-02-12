import {parseEther} from "viem";
import {useReadContract, useWriteContract} from "wagmi";
import {useScaffoldContract, useTransactor} from "~~/hooks/scaffold-eth";
import {fromNumberToInt128, fromInt128toNumber} from "~~/utils/numbers"

type MarketBuyProps = {
    marketId: number;
    marketOutcome: number;
    outcomeLabel?: string;
    sharesToTrade?: number
};

export const MarketBuy = ({marketId, marketOutcome, outcomeLabel = "", sharesToTrade = 1}: MarketBuyProps) => {
    const {data: master} = useScaffoldContract({contractName: "PrecogMasterV7"});
    const ABI = master ? master.abi : [];

    const {writeContractAsync, isPending} = useWriteContract();
    const writeTx = useTransactor();

    const market = BigInt(marketId);
    const outcome = BigInt(marketOutcome);
    const shares = fromNumberToInt128(sharesToTrade);

    const {data: priceInt128, isLoading: isPriceLoading, error} = useReadContract({
        abi: ABI, address: master?.address, functionName: 'marketBuyPrice', args: [market, outcome, shares]
    });

    if (error) {
        return (
            <span className="leading-4">No price</span>
        );
    }

    const price = priceInt128 ? fromInt128toNumber(priceInt128) : 1;
    const maxTokenIn = price * 1.001  // Add 0.1% of slippage
    const maxIn: bigint = parseEther(maxTokenIn.toString());

    if (isPriceLoading || !master) {
        return (
            <span className="loading loading-spinner loading-sm"></span>
        );
    }

    const writeContractAsyncWithParams = () =>
        writeContractAsync({
            address: master.address,
            abi: ABI,
            functionName: "marketBuy",
            args: [market, outcome, shares, maxIn],
        });
    const handleWriteAction = async () => {
        try {
            await writeTx(writeContractAsyncWithParams, {blockConfirmations: 1});
        } catch (e) {
            console.log("Unexpected error in writeTx", e);
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
