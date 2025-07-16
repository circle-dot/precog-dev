import { useQuery } from "@tanstack/react-query";
import { useAccount, usePublicClient } from "wagmi";
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
  token: Address;
  marketInfo: readonly [bigint, readonly bigint[], bigint, bigint, bigint] | undefined;
};

export const usePrecogMarkets = () => {
  const { data: masterContract } = useScaffoldContract({
    contractName: "PrecogMasterV7",
  });
  const { data: marketContract } = useScaffoldContract({
    contractName: "PrecogMarketV7",
  });
  const publicClient = usePublicClient();
  const { chain } = useAccount();

  return useQuery({
    queryKey: ["markets", chain?.id],
    queryFn: async () => {
      if (!masterContract?.address || !publicClient || !marketContract?.abi) return { markets: [], totalMarkets: 0n };

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
      let markets = marketsData
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

      // multicall for extra market info
      const extraInfoRequests = markets.flatMap(market => [
        {
          address: market.market,
          abi: marketContract.abi,
          functionName: "getMarketInfo",
        },
        {
          address: market.market,
          abi: marketContract.abi,
          functionName: "token",
        },
      ]);

      const extraInfoData = await publicClient.multicall({
        contracts: extraInfoRequests,
        allowFailure: true,
      });

      markets = markets.map((market, index) => {
        const marketInfoResult = extraInfoData[index * 2];
        const tokenResult = extraInfoData[index * 2 + 1];

        const marketInfo =
          marketInfoResult.status === "success"
            ? (marketInfoResult.result as readonly [bigint, readonly bigint[], bigint, bigint, bigint])
            : undefined;

        const token = tokenResult.status === "success" ? (tokenResult.result as Address) : "0x0";

        return {
          ...market,
          marketInfo,
          token,
        };
      });

      return {
        markets,
        totalMarkets,
      };
    },
    enabled: !!masterContract?.address && !!publicClient && !!marketContract?.abi,
    refetchOnWindowFocus: false,
    refetchInterval: 60000, // 1 minute
  });
};

export const usePrecogMarketPrices = (marketAddress: Address, outcomes: string[], enabled: boolean) => {
  const { address: userAddress } = useAccount();
  const publicClient = usePublicClient();
  const { data: marketContract } = useScaffoldContract({
    contractName: "PrecogMarketV7",
  });

  const query = useQuery({
    queryKey: ["marketPrices", marketAddress, userAddress],
    queryFn: async () => {
      if (!publicClient || !marketContract?.abi) {
        throw new Error("Public client or market contract ABI not available");
      }

      const multicallContracts: any[] = [
        {
          address: marketAddress,
          abi: marketContract.abi,
          functionName: "getPrices",
        },
      ];

      if (userAddress) {
        multicallContracts.push({
          address: marketAddress,
          abi: marketContract.abi,
          functionName: "getAccountOutcomeBalances",
          args: [userAddress],
        });
      }

      const multicallData = await publicClient.multicall({
        contracts: multicallContracts,
        allowFailure: true,
      });

      const pricesResult = multicallData[0];
      const balancesResult = userAddress ? multicallData[1] : undefined;

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
            buyPrice: prices[0]?.[i + 1],
            sellPrice: prices[1]?.[i + 1],
            balance: balances?.[i],
          });
        }
      }

      const isAnyError = multicallData.some(d => d.status === "failure");

      return {
        outcomeData,
        isError: isAnyError,
        errors: {
          prices: pricesResult?.error,
          balances: balancesResult?.error,
        },
      };
    },
    enabled: enabled && !!publicClient && !!marketContract?.abi,
    refetchOnWindowFocus: false,
    refetchInterval: 60000, // 1 minute
  });

  return {
    outcomeData: query.data?.outcomeData ?? [],
    isLoading: query.isLoading,
    isError: query.isError || !!query.data?.isError,
    errors: {
      multicall: query.error,
      prices: query.data?.errors?.prices,
      balances: query.data?.errors?.balances,
    },
  };
};