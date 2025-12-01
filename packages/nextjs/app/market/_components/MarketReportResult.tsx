import {useState} from "react";
import {Address} from "viem";
import {useReadContract, useWriteContract} from "wagmi";
import {useScaffoldContract, useScaffoldReadContract, useTransactor} from "~~/hooks/scaffold-eth";

export const MarketReportResult = ({marketAddress, connectedAddress, isAdmin}: {
    marketAddress: Address,
    connectedAddress?: Address
    isAdmin?: boolean
}) => {
    const {data: marketContract} = useScaffoldContract({contractName: "PrecogMarketV7"});
    const ABI = marketContract ? marketContract.abi : [];
    const {data: marketId} = useReadContract({abi: ABI, address: marketAddress, functionName: 'id'});
    const {data: oracle} = useReadContract({abi: ABI, address: marketAddress, functionName: 'oracle'});

    const {data: marketData} = useScaffoldReadContract({
        contractName: "PrecogMasterV7", functionName: "markets", args: [marketId]
    });

    const [marketResult, setMarketResult] = useState<number>(0);
    const {writeContractAsync, isPending} = useWriteContract();
    const writeTx = useTransactor();

    if (marketId == undefined || connectedAddress == undefined || oracle == undefined || marketData == undefined) {
        return (
            <span>Fetching data...</span>
        )
    }

    // Only show this component to market oracle (is also validated in the contract)
    if (connectedAddress != oracle && !isAdmin) {
        return;
    }

    const outcomes: string = marketData[3].toString();  // CSV string of outcomes
    const outcomeLabels: string[] = outcomes.toString().split(",");

    // Only for debug
    // console.log("Result Outcomes", outcomeLabels);

    const writeContractAsyncWithParams = () =>
        writeContractAsync({
            address: marketAddress,
            abi: ABI,
            functionName: "reportResult",
            args: [BigInt(marketId), BigInt(marketResult)],
        });

    const handleWriteAction = async () => {
        try {
            await writeTx(writeContractAsyncWithParams, {blockConfirmations: 1});
        } catch (e) {
            console.log("Unexpected error in writeTx", e);
        }
    };

    return (
        <>
            <div className="flex flex-col items-start gap-0.5 py-2 w-1/3 min-w-[380px]">
                <span className="text-sm">Report result</span>
                <div className="flex flex-col gap-1 w-full overflow-x-auto pl-3">
                    {outcomeLabels.map((outcome: string, index: number) => (
                        <span className="text-sm font-mono bg-base-300 max-w-[400px] rounded" key={index}>
                            {index + 1}. {outcome}
                        </span>
                    ))}
                </div>
                <div className="flex flex-row gap-2 w-full">
                    <input type="number" min="1" max="30" placeholder="Result outcome index (1 to N)"
                           className="input border border-primary rounded-xl w-full"
                           onChange={e => setMarketResult(Number(e.target.value))}
                    />
                    <button className="btn btn-primary rounded-xl" onClick={handleWriteAction} disabled={isPending}>
                        {isPending ? <span className="loading loading-spinner loading-sm"></span> : "Report"}
                    </button>
                </div>
            </div>
        </>
    );
};
