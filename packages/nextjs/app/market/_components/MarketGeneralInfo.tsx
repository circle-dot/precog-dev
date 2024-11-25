import {Address as AddressType} from "viem";
import {useScaffoldContract, useScaffoldReadContract} from "~~/hooks/scaffold-eth";
import {useReadContract} from "wagmi";
import {Address} from "~~/components/scaffold-eth";
import {displayTxResult} from "~~/app/debug/_components/contract";

export const MarketGeneralInfo = ({address}: { address: AddressType }) => {
    const {data: marketContract} = useScaffoldContract({contractName: "PrecogMarketV7"});
    const ABI = marketContract ? marketContract.abi : [];

    // Get all data from Market contract
    const {data: owner} = useReadContract({abi: ABI, address: address, functionName: 'owner'});
    const {data: token} = useReadContract({abi: ABI, address: address, functionName: 'token'});
    const {data: marketId} = useReadContract({abi: ABI, address: address, functionName: 'id'});
    const {data: starts} = useReadContract({abi: ABI, address: address, functionName: 'startTimestamp'});
    const {data: ends} = useReadContract({abi: ABI, address: address, functionName: 'endTimestamp'});
    const {data: oracle} = useReadContract({abi: ABI, address: address, functionName: 'oracle'});
    const {data: closed} = useReadContract({abi: ABI, address: address, functionName: 'closeTimestamp'});
    const {data: result} = useReadContract({abi: ABI, address: address, functionName: 'result'});

    const {data: marketData, isLoading: isLoading} = useScaffoldReadContract({
        contractName: "PrecogMasterV7", functionName: "markets", args: [marketId]
    });

    // Checking loading state only on last read contract call (just for readability)
    if (isLoading) {
        return (
            <div className="flex flex-col px-2">
                <span>Fetching data...</span>
            </div>
        );
    }

    if (!marketData) {
        return (
            <div className="flex flex-col px-2">
                <strong>No data found</strong>
            </div>
        );
    }

    const name = marketData[0];
    const description = marketData[1];
    const category = marketData[2];
    const outcomes = marketData[3];
    const creator = marketData[6];
    const startDate = new Date(Number(starts) * 1000).toUTCString();
    const endDate = new Date(Number(ends) * 1000).toUTCString();

    const outcomeLabels = outcomes.toString().split(",");
    outcomeLabels.unshift(...[""]); // Add empty slot at the start to match outcome indexing
    let outcomeDetails = "";
    for (let i = 1; i < outcomeLabels.length; i++) {
        outcomeDetails += ` [${i}] ${outcomeLabels[i]} , `;
    }
    outcomeDetails = outcomeDetails.substring(0, outcomeDetails.length - 2);

    const marketResult = result && Number(result) > 0 ? (Number(result) == 1 ? 'YES' : 'NO') : '-';


    const closedDate = closed ? new Date(Number(closed) * 1000).toUTCString() : '-';


    return (
        <>
            <div className="flex flex-col gap-2 px-2">
                <div className="flex flex-row px-4 gap-2">
                    <span className="text-md">Market Id:</span>
                    <span className="text-md font-bold">{displayTxResult(marketId)}</span>
                </div>
                <div className="flex flex-row px-4 gap-2">
                    <span className="text-md">Name:</span>
                    <span className="text-md font-bold">{name}</span>
                </div>
                <div className="flex flex-row px-4 gap-2 overflow-x-auto max-h-[500]">
                    <span className="text-md">Description:</span>
                    <span className="text-md font-bold">{description}</span>
                </div>
                <div className="flex flex-row px-4 gap-2">
                    <span className="text-md">Category:</span>
                    <span className="text-md font-bold">{category}</span>
                </div>
                <div className="flex flex-row px-4 gap-2">
                    <span className="text-md">Outcomes:</span>
                    <span className="text-md font-bold">{outcomeDetails}</span>
                </div>
                <div className="flex flex-row px-4 gap-2">
                    <span className="text-md">Starts:</span>
                    <span className="text-md font-bold">{startDate}</span>
                </div>
                <div className="flex flex-row px-4 gap-2">
                    <span className="text-md">Ends:</span>
                    <span className="text-md font-bold">{endDate}</span>
                </div>
                <div className="flex flex-row px-4 gap-2">
                    <span className="text-md">Creator:</span>
                    <Address address={creator}/>
                </div>
                <div className="flex flex-row px-4 gap-3">
                    <span className="text-md">Owner:</span>
                    <Address address={owner}/>
                </div>
                <div className="flex flex-row px-4 gap-3">
                    <span className="text-md">Token:</span>
                    <Address address={token}/>
                </div>
                <div className="flex flex-row px-4 gap-3">
                    <span className="text-md">Oracle:</span>
                    <Address address={oracle} disableAddressLink={true}/>
                </div>
                <div className="flex flex-row px-4 gap-2">
                    <span className="text-md">Result:</span>
                    <span className="text-md font-bold">{marketResult}</span>
                </div>
                <div className="flex flex-row px-4 gap-2">
                    <span className="text-md">Reported:</span>
                    <span className="text-md font-bold">{closedDate}</span>
                </div>
            </div>
        </>
    );
};
