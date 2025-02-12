import {Address, formatEther} from "viem";
import {useReadContract} from "wagmi";
import {useScaffoldContract, useScaffoldReadContract} from "~~/hooks/scaffold-eth";

export const usePrecogMarketData = (address: Address | string | undefined) => {
    const {data: marketContract} = useScaffoldContract({contractName: "PrecogMarketV7"});

    const market = address ? address as Address : '0x0000000000000000000000000000000000000000';
    const ABI = marketContract ? marketContract.abi : [];

    // Get general market data
    const {data: marketId} = useReadContract({abi: ABI, address: market, functionName: 'id'});
    const {data: owner} = useReadContract({abi: ABI, address: market, functionName: 'owner'});
    const {data: token} = useReadContract({abi: ABI, address: market, functionName: 'token'});
    const {data: starts} = useReadContract({abi: ABI, address: market, functionName: 'startTimestamp'});
    const {data: ends} = useReadContract({abi: ABI, address: market, functionName: 'endTimestamp'});
    const {data: oracle} = useReadContract({abi: ABI, address: market, functionName: 'oracle'});
    const {data: closed} = useReadContract({abi: ABI, address: market, functionName: 'closeTimestamp'});
    const {data: result} = useReadContract({abi: ABI, address: market, functionName: 'result'});

    // Get prices and outcome labels
    const {data: marketMetadata} = useScaffoldReadContract({
        contractName: "PrecogMasterV7", functionName: "markets", args: [marketId]
    });
    const {data: marketPrices, isLoading: isLoading} = useScaffoldReadContract({
        contractName: "PrecogMasterV7", functionName: "marketPrices", args: [marketId]
    });

    // Check that all data was loaded (currently avoiding any calculation when market is not closed)
    if (isLoading || !marketMetadata || !marketPrices || result === undefined) return {};

    const startDate = new Date(Number(starts) * 1000).toUTCString();
    const endDate = new Date(Number(ends) * 1000).toUTCString();
    const closedDate = closed ? new Date(Number(closed) * 1000).toUTCString() : "";

    const marketOutcomes = marketMetadata[3].toString().split(",");
    marketOutcomes.unshift(""); // Add empty slot at the start to match market prices indexing
    let predictionOutcome = "NN";
    let predictionPrice = 0;
    for (let i = 1; i < marketOutcomes.length; i++) {
        const outcome = marketOutcomes[i];
        const buyPrice = Number(formatEther(marketPrices[0][i]));

        // Calculate prediction (higher outcome one share price)
        if (buyPrice > predictionPrice) {
            predictionOutcome = outcome;
            predictionPrice = buyPrice;
        }
    }
    const prediction = `${predictionOutcome} (${(predictionPrice * 100).toFixed(1)}%)`;
    const marketResult = result && Number(result) > 0 ? marketOutcomes[Number(result)] : '';

    const marketData = {
        id: marketId,
        owner: owner,
        token: token,
        startDate: startDate,
        endDate: endDate,
        oracle: oracle,
        prediction: prediction,
        result: marketResult,
        closedDate: closedDate
    };
    // Only for debug
    // console.log('Market Data:', marketData);

    return marketData;
};
