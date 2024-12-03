import {Address, formatEther} from "viem";
import {useReadContracts} from "wagmi";
import {useScaffoldContract, useScaffoldReadContract} from "~~/hooks/scaffold-eth";

export const usePrecogMarketData = (address: Address | string | undefined) => {
    const {data: marketContract} = useScaffoldContract({contractName: "PrecogMarketV7"});
    const market = address ? (address as Address) : '0x0000000000000000000000000000000000000000';
    const ABI = marketContract ? marketContract.abi : [];

    // Create multicall request for all market data
    const marketRequests = [
        {address: market, abi: ABI, functionName: 'id'},
        {address: market, abi: ABI, functionName: 'owner'},
        {address: market, abi: ABI, functionName: 'token'},
        {address: market, abi: ABI, functionName: 'startTimestamp'},
        {address: market, abi: ABI, functionName: 'endTimestamp'},
        {address: market, abi: ABI, functionName: 'oracle'},
        {address: market, abi: ABI, functionName: 'closeTimestamp'},
        {address: market, abi: ABI, functionName: 'result'}
    ] as const;

    const {data: marketResults} = useReadContracts({
        contracts: marketRequests
    });

    const {data: marketMetadata} = useScaffoldReadContract({
        contractName: "PrecogMasterV7", functionName: "markets", args: [marketResults?.[0]?.result]
    });

    const {data: marketPrices, isLoading} = useScaffoldReadContract({
        contractName: "PrecogMasterV7", functionName: "marketPrices", args: [marketResults?.[0]?.result]
    });

    // Check that all data was loaded
    if (isLoading || !marketMetadata || !marketPrices || !marketResults) return {};

    const [
        {result: marketId},
        {result: owner},
        {result: token},
        {result: starts},
        {result: ends},
        {result: oracle},
        {result: closed},
        {result: result}
    ] = marketResults;

    const startDate = new Date(Number(starts) * 1000).toUTCString();
    const endDate = new Date(Number(ends) * 1000).toUTCString();
    const closedDate = closed ? new Date(Number(closed) * 1000).toUTCString() : "";

    let marketOutcomes = marketMetadata[3].toString().split(",");
    marketOutcomes.unshift(""); // Add empty slot at the start to match market prices indexing

    let predictionOutcome = "NN";
    let predictionPrice = 0;
    for (let i = 1; i < marketOutcomes.length; i++) {
        const outcome = marketOutcomes[i];
        const buyPrice = Number(formatEther(marketPrices[0][i]));

        if (buyPrice > predictionPrice) {
            predictionOutcome = outcome;
            predictionPrice = buyPrice;
        }
    }

    const prediction = `${predictionOutcome} (${(predictionPrice * 100).toFixed(1)}%)`;
    const marketResult = result && Number(result) > 0 ? marketOutcomes[Number(result)] : '';

    return {
        id: marketId,
        owner,
        token,
        startDate,
        endDate,
        oracle,
        prediction,
        result: marketResult,
        closedDate
    };
};
