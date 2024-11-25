import {Address as AddressType} from "viem";
import {useScaffoldContract, useScaffoldReadContract} from "~~/hooks/scaffold-eth";
import {usePrecogLogs} from "~~/hooks/usePrecogLogs";
import {useReadContract} from "wagmi";
import {PrecogBalance} from "~~/components/PrecogBalance";
import {MarketBalance} from "~~/components/MarketBalance";
import {Address} from "~~/components/scaffold-eth";

export const MarketHolders = ({address}: { address: AddressType }) => {
    // Get all chain data from of received market address
    const {data: marketContract, isLoading: isMarketLoading} = useScaffoldContract({
        contractName: "PrecogMarketV7"
    });
    const marketABI = marketContract ? marketContract.abi : [];
    const contractLogs = usePrecogLogs(address);
    const {data: marketId, isLoading: isIdLoading} = useReadContract(
        {abi: marketABI, address: address, functionName: 'id'}
    );
    const {data: marketData, isLoading: isDataLoading} = useScaffoldReadContract({
        contractName: "PrecogMasterV7", functionName: "markets", args: [marketId]
    });

    if (isMarketLoading || isIdLoading || isDataLoading) {
        return (
            <div className="flex flex-col px-2">
                <span>Fetching data...</span>
            </div>
        );
    }

    if (!marketContract || contractLogs.length == 0 || marketId == undefined || !marketData) {
        return (
            <div className="flex flex-col px-2">
                <strong>No data found (yet)</strong>
            </div>
        );
    }

    // Parse and format received data to display
    const logAccounts = contractLogs.map(log => log.transaction.from);
    const uniqueAccounts = Array.from(new Set(logAccounts));
    const marketOutcomes = marketData[3].toString().split(",");

    return (
        <div className="flex flex-col px-2 py-2 gap-2 rounded-xl overflow-auto max-h-52">
            {uniqueAccounts.map((address, i) => (
                <div key={i} className='flex flex-row gap-2 px-1 w-fit'>
                    <span>{i + 1}-</span>
                    <Address address={address} size={"base"}/>
                    <span>[</span>
                    <PrecogBalance address={address}/>
                    <span>,</span>
                    <MarketBalance id={marketId} address={address} outcomes={marketOutcomes}/>
                    <span>]</span>
                </div>
            ))}
        </div>
    );
};
