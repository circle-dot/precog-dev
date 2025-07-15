import { useQuery } from '@tanstack/react-query';
import { useAccount, usePublicClient, useReadContracts } from "wagmi";
import { useScaffoldContract } from "./scaffold-eth";
import { Address } from "viem";

export type MarketInfo = {
  marketId: number;
  name: string;
  description: string;
  category: string;
  outcomes: string[];
  startTimestamp: bigint;
  endTimestamp: bigint;
  creator: Address;
  market: Address;
};

export const usePrecogMarkets = () => {
  const { data: masterContract } = useScaffoldContract({
    contractName: "PrecogMasterV7",
  });
  const publicClient = usePublicClient();

  return useQuery({
    queryKey: ["markets"],
    queryFn: async () => {
      if (!masterContract?.address || !publicClient) return { markets: [], totalMarkets: 0n };

      // Get total markets count
      const totalMarkets = (await publicClient.readContract({
        address: masterContract.address,
        abi: masterContract.abi,
        functionName: "createdMarkets",
      })) as bigint;

      if (totalMarkets === 0n) {
        return { markets: [], totalMarkets };
      }

      // Create array of all market IDs to fetch in descending order
      const marketIds = Array.from({ length: Number(totalMarkets) }, (_, i) => totalMarkets - 1n - BigInt(i));

      // Prepare multicall contracts array
      const marketRequests = marketIds.map(
        marketId =>
          ({
            address: masterContract.address,
            abi: masterContract.abi,
            functionName: "markets",
            args: [marketId],
          } as const),
      );

      // Execute multicall
      const marketsData = await publicClient.multicall({
        contracts: marketRequests,
        allowFailure: true,
      });

      // Process results
      const markets = marketsData
        .map((result, index) => {
          if (!result.status || !result.result) return null;

          const marketData = result.result as [string, string, string, string, bigint, bigint, Address, Address];
          return {
            marketId: Number(marketIds[index]),
            name: marketData[0],
            description: marketData[1],
            category: marketData[2],
            outcomes: marketData[3].split(","),
            startTimestamp: marketData[4],
            endTimestamp: marketData[5],
            creator: marketData[6],
            market: marketData[7],
          } as MarketInfo;
        })
        .filter((market): market is MarketInfo => market !== null);

      return {
        markets,
        totalMarkets,
      };
    },
    enabled: !!masterContract?.address && !!publicClient,
    refetchOnWindowFocus: false,
    refetchInterval: 60000 // 10 minute
  });
};

export const usePrecogMarketDetails = (marketAddress: Address, outcomes: string[], enabled: boolean) => {
  const { address: userAddress } = useAccount();

  const { data: marketContract } = useScaffoldContract({
    contractName: "PrecogMarketV7",
  });

  const contractReadsEnabled = !!marketContract?.abi && enabled;

  const {
    data: multicallData,
    isError,
    isLoading,
    error: multicallError,
  } = useReadContracts({
    contracts: [
      {
        address: marketAddress,
        abi: marketContract?.abi,
        functionName: "getPrices",
      },
      {
        address: marketAddress,
        abi: marketContract?.abi,
        functionName: "token",
      },
      {
        address: marketAddress,
        abi: marketContract?.abi,
        functionName: "getAccountOutcomeBalances",
        args: [userAddress],
      },
    ],
    query: {
      enabled: contractReadsEnabled,
      refetchOnWindowFocus: false,
      refetchInterval: 60000 // 10 minutes
    },
  });

  const pricesResult = multicallData?.[0];
  const tokenResult = multicallData?.[1];
  const balancesResult = multicallData?.[2];

  const outcomeData: {
    name: string;
    buyPrice?: bigint;
    sellPrice?: bigint;
    balance?: bigint;
  }[] = [];

  if (outcomes && pricesResult?.status === "success" && (!userAddress || balancesResult?.status === "success")) {
    const prices = pricesResult.result as [bigint[], bigint[]];
    const balances = balancesResult?.result as bigint[] | undefined;

    for (let i = 0; i < outcomes.length; i++) {
      outcomeData.push({
        name: outcomes[i],
        buyPrice: prices[0]?.[i],
        sellPrice: prices[1]?.[i],
        balance: balances?.[i],
      });
    }
  }

  const isAnyError = isError || multicallData?.some(d => d.status === "failure");

  return {
    collateralTokenAddress: tokenResult?.result as Address | undefined,
    outcomeData,
    isLoading,
    isError: isAnyError,
    errors: {
      multicall: multicallError,
      prices: pricesResult?.error,
      token: tokenResult?.error,
      balances: balancesResult?.error,
    },
  };
};