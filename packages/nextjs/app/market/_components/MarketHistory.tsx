import {Address, decodeEventLog} from "viem";
import {useScaffoldContract, useScaffoldReadContract} from "~~/hooks/scaffold-eth";
import {usePrecogLogs} from "~~/hooks/usePrecogLogs";
import {TransactionHash} from "~~/app/market/_components/TransactionHash";
import {toDateString} from "~~/utils/dates";
import {useReadContract} from "wagmi";

export const MarketHistory = ({address}: { address: Address }) => {
    // Get all chain data from of received market address
    const {data: marketContract} = useScaffoldContract({contractName: "PrecogMarketV7"});
    const marketABI = marketContract ? marketContract.abi : [];
    const {data: marketId} = useReadContract({abi: marketABI, address: address, functionName: "id"});
    const {data: marketData, isLoading: isLoading} = useScaffoldReadContract({
        contractName: "PrecogMasterV7", functionName: "markets", args: [marketId]
    });
    const contractLogs = usePrecogLogs(address);

    if (isLoading) {
        return (
            <div className="flex flex-col px-2">
                <span>Fetching data...</span>
            </div>
        );
    }

    if (!marketContract || contractLogs.length == 0 || !marketData) {
        return (
            <div className="flex flex-col px-2">
                <strong>No data found (yet)</strong>
            </div>
        );
    }

    // Decode chain data
    const outcomeLabels = marketData[3].toString().split(",");
    outcomeLabels.unshift(""); // Add empty slot at the start to match outcome indexing
    let eventLogs;
    try {
        eventLogs = contractLogs.map((log) => {
            const event = decodeEventLog({abi: marketABI, data: log.data, topics: log.topics});
            return {...event, ...log};
        });
    } catch (error) {
        return (
            <div className="font-bold px-10">Nothing found</div>
        );
    }

    const events = [];
    for (const log of eventLogs) {
        const eventDate = toDateString(log.blockTimestamp);
        const eventType = log.eventName.padEnd(12);
        const txHash = log.transactionHash ? log.transactionHash : "";

        let eventDetails;
        if (log.eventName == "SharesBought") {
            const account = log.args.account;
            const outcome = log.args.outcome ? Number(log.args.outcome) : 0;
            const amount = Number(log.args.amount) / 10 ** 18;
            const tokens = (Number(log.args.tokenIn) / 10 ** 18).toFixed(2);
            const outcomeLabel = outcomeLabels[outcome] || "NN";
            eventDetails = `${amount} ${outcomeLabel}, In: ${tokens} PRE, Acc: ${account}`;

        } else if (log.eventName == "SharesSold") {
            const account = log.args.account;
            const outcome = log.args.outcome ? Number(log.args.outcome) : 0;
            const amount = Number(log.args.amount) / 10 ** 18;
            const tokens = (Number(log.args.tokenOut) / 10 ** 18).toFixed(2);
            const outcomeLabel = outcomeLabels[outcome] || "NN";
            eventDetails = `${amount} ${outcomeLabel}, Out: ${tokens} PRE, Acc: ${account}`

        } else if (log.eventName == "SharesRedeemed") {
            // Dev note: keeping this flow independent to customize it in the future
            const account = log.args.account;
            const outcome = log.args.outcome ? Number(log.args.outcome) : 0;
            const amount = Number(log.args.amount) / 10 ** 18;
            const tokens = (Number(log.args.tokenOut) / 10 ** 18).toFixed(2);
            const outcomeLabel = outcomeLabels[outcome] || "NN";
            eventDetails = `${amount} ${outcomeLabel}, Out: ${tokens} PRE, Acc: ${account}`;

        } else {
            eventDetails = `${log.args}`
        }

        events.push({date: eventDate, type: eventType, details: eventDetails, txHash: txHash});
        // Only for debug
        // console.log("LOG:", log);
    }
    events.reverse();

    return (
        <div className="flex flex-col px-2 bg-base-200 rounded-xl">
            <pre className="px-4 break-words overflow-auto min-h-52 max-h-52">
              {events.map((event, i) => (
                  <div key={i} className="flex flex-row gap-2 px-1">
                      <span>{event.date}</span>
                      <span>{">"}</span>
                      <span>{event.type}</span>
                      <span>{">"}</span>
                      <span>{event.details}</span>
                      <TransactionHash hash={event.txHash}/>
                  </div>
              ))}
            </pre>
        </div>
    );
};
