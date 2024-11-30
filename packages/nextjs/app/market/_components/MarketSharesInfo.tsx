import {Address} from "viem";
import {useScaffoldContract, useScaffoldReadContract} from "~~/hooks/scaffold-eth";
import {useReadContract} from "wagmi";
import React from "react";

export const MarketSharesInfo = ({address}: { address: Address }) => {
    // Get all chain data from of received market address
    const {data: marketContract} = useScaffoldContract({contractName: "PrecogMarketV7"});
    const marketABI = marketContract ? marketContract.abi : [];
    const {data: marketId} = useReadContract({abi: marketABI, address: address, functionName: 'id'});
    const {data: marketInfo, isLoading: isMarketInfoLoading} = useReadContract({
        abi: marketABI, address: address, functionName: 'getMarketInfo'
    });
    const {data: marketData} = useScaffoldReadContract({
        contractName: "PrecogMasterV7", functionName: "markets", args: [marketId]
    });

    if (isMarketInfoLoading) {
        return (
            <div className="flex flex-col px-2">
                <span>Fetching data...</span>
            </div>
        );
    }

    if (!marketInfo || !marketData) {
        return (
            <div className="flex flex-col px-2">
                <strong>No data found</strong>
            </div>
        );
    }

    // Parse and format received data to display
    const marketOutcomes = marketData[3].toString().split(",");
    marketOutcomes.unshift(""); // Add empty slot at the start to match outcome indexing
    const outcomeBalances = []
    for (let i = 1; i < marketOutcomes.length; i++) {
        const outcome = marketOutcomes[i];
        const balance = Number(fromInt128toNumber(marketInfo[1][i]));
        outcomeBalances.push({"outcome": outcome, "balance": balance});
    }
    const totalShares = fromInt128toNumber(marketInfo[0]);
    const cost = fromInt128toNumber(marketInfo[2]);
    const totalBuys = Number(marketInfo[3]);
    const totalSells = Number(marketInfo[4]);
    const totalTrades = totalBuys + totalSells;

    return (
        <div className="flex flex-col gap-2 overflow-x-auto">
            <div className="flex gap-1 px-2">
                <div className="flex flex-row px-4 gap-1">
                    <span>Total Shares:</span>
                    <span className="font-bold accent-blue-600">{totalShares}</span>
                    <span>(</span>
                    {outcomeBalances.map((value, index) => (
                        <>
                            <span>{value.outcome}:</span>
                            <span className="font-bold accent-blue-600">{value.balance}</span>
                            {index < outcomeBalances.length - 1 && <span>,</span>}
                        </>
                    ))}
                    <span>)</span>
                </div>
            </div>
            <div className="flex gap-1 px-2">
                <div className="flex flex-row px-4 gap-1">
                    <span>Total Trades:</span>
                    <span className="font-bold accent-blue-600">{totalTrades}</span>
                    <span>(</span>
                    <span>BUYs:</span>
                    <span className="font-bold accent-blue-600">{totalBuys}</span>
                    <span>,</span>
                    <span>SELLs:</span>
                    <span className="font-bold accent-blue-600">{totalSells}</span>
                    <span>)</span>
                </div>
            </div>
            <div className="flex gap-1 px-2">
                <div className="flex flex-row px-4 gap-1">
                    <span>Liquidity:</span>
                    <span className="font-bold accent-blue-600">{cost.toFixed(2)}</span>
                </div>
            </div>
        </div>
    );
};

function fromInt128toNumber(a: bigint) {
    return Number(BigInt(a)) / Number((BigInt(2) ** BigInt(64)));
}
