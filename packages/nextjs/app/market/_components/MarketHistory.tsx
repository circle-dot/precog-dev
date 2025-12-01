import {Address} from "viem";
import {useEffect, useState} from "react";
import {useTargetNetwork} from "~~/hooks/scaffold-eth/useTargetNetwork";
import {TransactionHash} from "~~/app/market/_components/TransactionHash";
import {useScaffoldContract} from "~~/hooks/scaffold-eth";
import {useReadContract} from "wagmi";
import scaffoldConfig from "~~/scaffold.config";

interface MarketTrade {
    account_address: string
    account_action: string
    trade_type: string
    block_date: string
    outcome: string
    amount_in: number
    amount_out: number
    token_in: string
    token_out: string
    tx_hash: string
}

export const MarketHistory = ({address}: { address: Address }) => {
    const {data: marketContract} = useScaffoldContract({contractName: "PrecogMarketV7"});
    const marketABI = marketContract ? marketContract.abi : [];
    const {data: marketId} = useReadContract({abi: marketABI, address: address, functionName: 'id'});

    const [marketTrades, setMarketTrades] = useState<MarketTrade[] | undefined>(undefined);
    const {targetNetwork} = useTargetNetwork();
    const chain_id = targetNetwork.id;

    useEffect(() => {
        const fetchData = async () => {
            try {
                // Only for debug
                // console.log("Precog tracker data requested...");
                const tracker_api_url = 'https://tracker.precog.market/api/v1/market-trades/';
                const api_url = `${tracker_api_url}?chain_id=${chain_id}&master_market_id=${Number(marketId)}`;
                const response = await fetch(api_url, {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-API-KEY': scaffoldConfig.precogTrackerApiKey,
                    },
                });
                if (!response.ok) throw new Error("Network response was not ok");
                const result = await response.json();
                // Only for debug
                // console.log("Precog tracker data received!", result);
                setMarketTrades(result);

            } catch (e) {
                console.error('Fetching Precog Trades', e);
            }
        };

        fetchData();
    }, [chain_id, marketId]);

    // Check for loading state
    if (marketTrades == undefined || marketId == undefined) {
        return (
            <div className="flex flex-col px-2">
                <span>Fetching data (may take a minute)...</span>
            </div>
        );
    }

    // Only for debug
    // console.log('Parsing market trades', marketTrades);
    const events = [];
    for (const trade of marketTrades) {
        const eventDate = new Date(trade.block_date)
            .toISOString()
            .replaceAll('T', ' ')
            .substring(0, 16);
        const eventType = trade.trade_type.padEnd(12);
        const txHash = trade.tx_hash;
        const eventName = trade.trade_type;

        let eventDetails;
        if (eventName == "SharesBought") {
            const amount = trade.amount_out;
            const outcome = trade.outcome;
            const tokens = trade.amount_in.toFixed(2);
            const collateral = trade.token_in;
            const account = trade.account_address;
            eventDetails = `${amount} ${outcome}, In: ${tokens} ${collateral}, Acc: ${account}`

        } else if (eventName == "SharesSold") {
            const amount = trade.amount_in;
            const outcome = trade.outcome;
            const tokens = trade.amount_out.toFixed(2);
            const collateral = trade.token_out;
            const account = trade.account_address;
            eventDetails = `${amount} ${outcome}, Out: ${tokens} ${collateral}, Acc: ${account}`

        } else if (eventName == "SharesRedeemed") {
            // Dev note: keeping this flow independent to customize it in the future
            const amount = trade.amount_in;
            const outcome = trade.outcome;
            const tokens = trade.amount_out.toFixed(2);
            const collateral = trade.token_out;
            const account = trade.account_address;
            eventDetails = `${amount} ${outcome}, Out: ${tokens} ${collateral}, Acc: ${account}`

        } else {
            eventDetails = 'Unknown'
        }
        events.push({date: eventDate, type: eventType, details: eventDetails, txHash: txHash});
        // Only for debug
        // console.log("Market Trade >", trade);
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
