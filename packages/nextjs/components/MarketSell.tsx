import {formatEther, parseEther} from "viem";
import {useReadContract, useWriteContract} from "wagmi";
import {useScaffoldContract, useTransactor} from "~~/hooks/scaffold-eth";
import {fromNumberToInt128, fromInt128toNumber} from "~~/utils/numbers"

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

    const {writeContractAsync, isPending} = useWriteContract();
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

    // Avoid showing sell button if account has no shares to sell
    if (outcomeBalance == BigInt(0)) {
        return;
    }

    const price = priceInt128 ? fromInt128toNumber(priceInt128) : 1;
    const minTokenOut = price * 0.999  // Add 0.1% of slippage
    const minOut: bigint = parseEther(minTokenOut.toString());

    const writeContractAsyncWithParams = () =>
        writeContractAsync({
            address: master.address,
            abi: ABI,
            functionName: "marketSell",
            args: [market, outcome, shares, minOut],
        });
    const handleWriteAction = async () => {
        try {
            await writeTx(writeContractAsyncWithParams, {blockConfirmations: 1});
        } catch (e) {
            console.log("Unexpected error in writeTx", e);
        }
    };

    let outcomeText = `Sell ${outcomeLabel}`;
    if (sellAmount != sharesToTrade) {
        // Case: selected "shares to trade" is bigger than the current balance to sell
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
