import {useState} from "react";
import {Address} from "viem";
import {useReadContract, useWriteContract} from "wagmi";
import {useScaffoldContract, useTransactor} from "~~/hooks/scaffold-eth";

export const MarketReportResult = ({marketAddress, connectedAddress}: {
    marketAddress: Address,
    connectedAddress?: Address
}) => {
    const {data: marketContract} = useScaffoldContract({contractName: "PrecogMarketV7"});
    const ABI = marketContract ? marketContract.abi : [];
    const {data: marketId} = useReadContract({abi: ABI, address: marketAddress, functionName: 'id'});
    const {data: oracle} = useReadContract({abi: ABI, address: marketAddress, functionName: 'oracle'});

    const [marketResult, setMarketResult] = useState<number>(0);
    const {writeContractAsync, isPending} = useWriteContract();
    const writeTx = useTransactor();

    if (marketId == undefined || connectedAddress == undefined || oracle == undefined) {
        return (
            <span>Fetching data...</span>
        )
    }

    // Front end validation to only show component to market oracle (is also validated in the contract)
    if (connectedAddress != oracle) {
        return;
    }

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
                <div className="flex flex-row gap-2 w-full">
                    <input type="number" min="0" max="10" placeholder="Result outcome (1=YES, 2=NO)"
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

