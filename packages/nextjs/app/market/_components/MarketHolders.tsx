import {Address as AddressType} from "viem";
import {useScaffoldContract, useScaffoldReadContract} from "~~/hooks/scaffold-eth";
import {usePrecogLogs} from "~~/hooks/usePrecogLogs";
import {useReadContract} from "wagmi";
import {MarketBalance} from "~~/components/MarketBalance";
import {Address} from "~~/components/scaffold-eth";

export const MarketHolders = ({address}: { address: AddressType }) => {
    // Get all chain data from of received market address
    const {data: marketContract, isLoading: isMarketLoading} = useScaffoldContract({
        contractName: "PrecogMarketV7"
    });
    const marketABI = marketContract ? marketContract.abi : [];
    const {data: marketId, isLoading: isIdLoading} = useReadContract(
        {abi: marketABI, address: address, functionName: 'id'}
    );
    const {data: marketData, isLoading: isDataLoading} = useScaffoldReadContract({
        contractName: "PrecogMasterV7", functionName: "markets", args: [marketId]
    });
    const contractLogs = usePrecogLogs(address);
    const isFetchingLogs = contractLogs == undefined;

    if (isMarketLoading || isIdLoading || isDataLoading || isFetchingLogs) {
        return (
            <div className="flex flex-col px-2">
                <span>Fetching data (may take a minute)...</span>
            </div>
        );
    }

    if (contractLogs.length == 0 || !marketContract || marketId == undefined || !marketData) {
        return (
            <div className="flex flex-col px-2">
                <strong>No data found (yet)</strong>
            </div>
        );
    }

    // Parse and format received data to display (TODO this could be optimized a lot!)
    const logAccounts = contractLogs.filter(log => log.transaction).map(log => log.transaction.from);
    const uniqueAccounts = Array.from(new Set(logAccounts));
    const marketOutcomes = marketData[3].toString().split(",");

    return (
        <div className="flex flex-col px-2 py-2 gap-2 rounded-xl overflow-auto max-h-52">
            {uniqueAccounts.map((address, i) => (
                <div key={i} className='flex flex-row gap-2 px-1 w-fit'>
                    <span>{i + 1}-</span>
                    <div className="min-w-[140px]">
                        <Address address={address} size={"base"}/>
                    </div>
                    <span className="">Shares:</span>
                    <MarketBalance id={marketId} address={address} outcomes={marketOutcomes}/>
                </div>
            ))}
        </div>
    );
};
