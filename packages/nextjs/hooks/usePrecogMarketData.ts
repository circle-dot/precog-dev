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
};

export type MarketDetails = {
  marketInfo: readonly [bigint, readonly bigint[], bigint, bigint, bigint];
  token: Address;
  tokenSymbol: string;
  marketResultInfo: readonly [bigint, bigint, Address];
};

export const usePrecogMarkets = () => {
  const { data: masterContract } = useScaffoldContract({
    contractName: "PrecogMasterV7",
  });
  const publicClient = usePublicClient();
  const { chain } = useAccount();

  return useQuery({
    queryKey: ["markets", chain?.id],
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
          };
        })
        .filter((market): market is MarketInfo => market !== null);

      return {
        markets,
        totalMarkets,
      };
    },
    enabled: !!masterContract?.address && !!publicClient,
    refetchOnWindowFocus: false,
    refetchInterval: 60000, // 1 minute
  });
};

export const usePrecogMarketDetails = (marketId: number, marketAddress: Address, enabled: boolean) => {
  const publicClient = usePublicClient();
  const { data: marketContract } = useScaffoldContract({
    contractName: "PrecogMarketV7",
  });
  const { data: masterContract } = useScaffoldContract({
    contractName: "PrecogMasterV7",
  });

  return useQuery({
    queryKey: ["marketDetails", marketAddress],
    queryFn: async () => {
      if (!publicClient || !marketContract?.abi || !masterContract?.abi || !masterContract?.address) {
        throw new Error("Public client or contract ABIs not available");
      }

      const multicallData = await publicClient.multicall({
        contracts: [
          {
            address: marketAddress,
            abi: marketContract.abi,
            functionName: "getMarketInfo",
          },
          {
            address: marketAddress,
            abi: marketContract.abi,
            functionName: "token",
          },
          {
            address: masterContract.address,
            abi: masterContract.abi,
            functionName: "marketResultInfo",
            args: [BigInt(marketId)],
          },
        ],
        allowFailure: true,
      });

      const [marketInfoResult, tokenResult, marketResultInfoResult] = multicallData;

      const marketInfo =
        marketInfoResult?.status === "success"
          ? (marketInfoResult.result as (typeof marketInfoResult.result))
          : undefined;
      const token = tokenResult?.status === "success" ? (tokenResult.result as Address) : undefined;
      const marketResultInfo =
        marketResultInfoResult?.status === "success"
          ? (marketResultInfoResult.result as (typeof marketResultInfoResult.result))
          : undefined;

      if (!marketInfo || !token || !marketResultInfo) {
        throw new Error("Failed to fetch market details");
      }

      const tokenSymbol = (await publicClient.readContract({
        address: token,
        abi: [
          {
            inputs: [],
            name: "symbol",
            outputs: [{ name: "", type: "string" }],
            stateMutability: "view",
            type: "function",
          },
        ] as const,
        functionName: "symbol",
      })) as string;

      return {
        marketInfo,
        token,
        tokenSymbol,
        marketResultInfo,
      } as MarketDetails;
    },
    enabled: enabled && !!publicClient && !!marketContract?.abi && !!masterContract?.abi,
    refetchOnWindowFocus: false,
  });
};

export const usePrecogMarketPrices = (marketAddress: Address, outcomes: string[], enabled: boolean) => {
  const publicClient = usePublicClient();
  const { data: marketContract } = useScaffoldContract({
    contractName: "PrecogMarketV7",
  });

  const query = useQuery({
    queryKey: ["marketPrices", marketAddress],
    queryFn: async () => {
      if (!publicClient || !marketContract?.abi) {
        throw new Error("Public client or market contract ABI not available");
      }

      const multicallData = await publicClient.multicall({
        contracts: [
          {
            address: marketAddress,
            abi: marketContract.abi,
            functionName: "getPrices",
          },
        ],
        allowFailure: true,
      });

      const pricesResult = multicallData[0];

      const outcomeData: {
        name: string;
        buyPrice?: bigint;
        sellPrice?: bigint;
      }[] = [];

      if (outcomes && pricesResult?.status === "success") {
        const prices = pricesResult.result as [bigint[], bigint[]];

        for (let i = 0; i < outcomes.length; i++) {
          outcomeData.push({
            name: outcomes[i],
            buyPrice: prices[0]?.[i + 1],
            sellPrice: prices[1]?.[i + 1],
          });
        }
      }

      const isAnyError = multicallData.some(d => d.status === "failure");

      return {
        outcomeData,
        isError: isAnyError,
        errors: {
          prices: pricesResult?.error,
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
    },
  };
};