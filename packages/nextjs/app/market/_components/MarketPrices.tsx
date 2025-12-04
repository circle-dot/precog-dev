import {Address as AddressType, erc20Abi, formatUnits} from "viem";
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

    // Get market address from marketData (index 7)
    const marketAddress = marketData?.[7] as AddressType | undefined;
    
    // Get token address from market contract
    const {data: tokenAddress} = useReadContract({
        abi: marketABI,
        address: marketAddress,
        functionName: 'token',
        query: { enabled: !!marketAddress }
    });

    // Get token decimals from ERC20 token contract
    const {data: tokenDecimals} = useReadContract({
        abi: erc20Abi,
        address: tokenAddress as AddressType | undefined,
        functionName: 'decimals',
        query: { enabled: !!tokenAddress }
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
    marketOutcomes.unshift(""); // Add empty slot at the start to match market prices indexing
    let predictionOutcome = "NN";
    let predictionPrice = 0;
    const buyData = []
    const sellData = []
    
    // Use token decimals if available, otherwise default to 18
    const decimals = tokenDecimals ?? 18;
    
    for (let i = 1; i < marketOutcomes.length; i++) {
        const outcome = marketOutcomes[i];
        const buyPrice = Number(formatUnits(marketPrices[0][i], decimals));
        const sellPrice = Number(formatUnits(marketPrices[1][i], decimals));
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
