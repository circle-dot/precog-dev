import {Address as AddressType, formatEther} from "viem";
import {useScaffoldContract, useScaffoldReadContract} from "~~/hooks/scaffold-eth";
import {useReadContract} from "wagmi";
import React from "react";

export const MarketPrices = ({address}: { address: AddressType }) => {
    // Get all chain data from of received market address
    const {data: marketContract} = useScaffoldContract({contractName: "PrecogMarketV7"});
    const marketABI = marketContract ? marketContract.abi : [];
    const {data: marketId} = useReadContract({abi: marketABI, address: address, functionName: 'id'});
    const {data: marketData} = useScaffoldReadContract({
        contractName: "PrecogMasterV7", functionName: "markets", args: [marketId]
    });
    const {data: marketPrices, isLoading: isLoading} = useScaffoldReadContract({
        contractName: "PrecogMasterV7", functionName: "marketPrices", args: [marketId]
    });

    if (isLoading) {
        return (
            <div className="flex flex-col px-2">
                <span>Fetching data...</span>
            </div>
        );
    }

    if (!marketData || !marketPrices) {
        return (
            <div className="flex flex-col px-2">
                <strong>No data found</strong>
            </div>
        );
    }

    // Parse data and calculate current market prediction
    const marketOutcomes = marketData[3].toString().split(",");
    marketOutcomes.unshift(...[""]); // Add empty slot at the start to match market prices indexing
    let predictionOutcome = "NN";
    let predictionPrice = 0;
    const buyData = []
    const sellData = []
    for (let i = 1; i < marketOutcomes.length; i++) {
        const outcome = marketOutcomes[i];
        const buyPrice = Number(formatEther(marketPrices[0][i]));
        const sellPrice = Number(formatEther(marketPrices[1][i]));
        buyData.push({"outcome": outcome, "price": buyPrice});
        sellData.push({"outcome": outcome, "price": sellPrice})

        // Calculate prediction (higher outcome one share price)
        if (buyPrice > predictionPrice) {
            predictionOutcome = outcome;
            predictionPrice = buyPrice;
        }
    }
    const predictionProbability = (predictionPrice * 100).toFixed(1);

    return (
        <div className="flex flex-col gap-2 overflow-x-auto">
            <div className="flex flex-row px-5 gap-5">
                <span className="text-md">BUY:</span>
                {buyData.map((value, key) => (
                    <span key={key} className="text-md font-bold">
                            {value.outcome} ({value.price.toFixed(4)})
                        </span>
                ))}
            </div>
            <div className="flex flex-row px-5 gap-5">
                <span className="text-md">SELL:</span>
                {sellData.map((value, key) => (
                    <span key={key} className="text-md font-bold">
                            {value.outcome} ({value.price.toFixed(4)})
                        </span>
                ))}
            </div>
            <div className="flex flex-row px-5 gap-4">
                <span className="text-xl">PREDICTION:</span>
                <span className="text-xl font-bold">{predictionOutcome} ({predictionProbability}%)</span>
            </div>
        </div>
    );
};
