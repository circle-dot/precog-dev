import { Address } from "viem";
import { useAccount, usePublicClient } from "wagmi";
import { useQuery } from "@tanstack/react-query";
import { useScaffoldContract } from "./scaffold-eth";

/**
 * Core types for market data structures
 */

/**
 * Represents the basic information of a prediction market
 */
export interface MarketInfo {
  marketId: number;
  name: string;
  description: string;
  category: string;
  outcomes: string[];
  startTimestamp: bigint;
  endTimestamp: bigint;
  creator: Address;
  market: Address;
}

/**
 * Represents detailed market information including trading stats and resolution data
 * @property marketInfo - Tuple containing [totalShares, sharesBalances, lockedCollateral, totalBuys, totalSells]
 * @property token - Address of the collateral token used for trading
 * @property tokenSymbol - Symbol of the collateral token (e.g., "DAI")
 * @property marketResultInfo - Tuple containing [outcome, resolutionTime, oracleAddress]
 */
export interface MarketDetails {
  marketInfo: readonly [bigint, readonly bigint[], bigint, bigint, bigint];
  token: Address;
  tokenSymbol: string;
  marketResultInfo: readonly [bigint, bigint, Address];
}

/**
 * Hook to fetch all prediction markets from the master contract
 * @returns Object containing markets array and total count
 */
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

      // Get total markets count from master contract
      const totalMarkets = (await publicClient.readContract({
        address: masterContract.address,
        abi: masterContract.abi,
        functionName: "createdMarkets",
      })) as bigint;

      if (totalMarkets === 0n) {
        return { markets: [], totalMarkets };
      }

      // Create array of market IDs in descending order (newest first)
      const marketIds = Array.from({ length: Number(totalMarkets) }, (_, i) => totalMarkets - 1n - BigInt(i));

      // Prepare multicall requests to fetch all markets data in a single call
      const marketRequests = marketIds.map(
        marketId =>
          ({
            address: masterContract.address,
            abi: masterContract.abi,
            functionName: "markets",
            args: [marketId],
          } as const),
      );

      // Execute multicall and process results
      const marketsData = await publicClient.multicall({
        contracts: marketRequests,
        allowFailure: true,
      });

      // Transform raw contract data into MarketInfo objects
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
    refetchInterval: 300000, // Refresh every 5 minutes
  });
};

/**
 * Hook to fetch detailed information about a specific market
 * @param marketId - Unique identifier of the market
 * @param marketAddress - Contract address of the market
 * @param enabled - Whether to enable the query
 * @returns Detailed market information including trading stats and resolution data
 */
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

      // Fetch market details, token info, and result info in a single multicall
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

      // Extract and validate results
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

      // Fetch token symbol from the collateral token contract
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

/**
 * Hook to fetch current market prices and shares for all outcomes
 * @param marketAddress - Contract address of the market
 * @param outcomes - Array of outcome names
 * @param enabled - Whether to enable the query
 * @returns Current prices and shares for each outcome
 */
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

      // Fetch prices and market info in a single multicall
      const multicallData = await publicClient.multicall({
        contracts: [
          {
            address: marketAddress,
            abi: marketContract.abi,
            functionName: "getPrices",
          },
          {
            address: marketAddress,
            abi: marketContract.abi,
            functionName: "getMarketInfo",
          },
        ],
        allowFailure: true,
      });

      const [pricesResult, marketInfoResult] = multicallData;

      // Combine prices and shares data for each outcome
      const outcomeData: {
        name: string;
        buyPrice?: bigint;
        sellPrice?: bigint;
        shares?: bigint;
      }[] = [];

      if (outcomes && pricesResult?.status === "success") {
        const prices = pricesResult.result as [bigint[], bigint[]];
        const marketInfo =
          marketInfoResult?.status === "success"
            ? (marketInfoResult.result as readonly [bigint, readonly bigint[], bigint, bigint, bigint])
            : undefined;
        const shares = marketInfo?.[1];

        // Map outcome data with corresponding prices and shares
        for (let i = 0; i < outcomes.length; i++) {
          outcomeData.push({
            name: outcomes[i],
            buyPrice: prices[0]?.[i + 1],
            sellPrice: prices[1]?.[i + 1],
            shares: shares?.[i + 1],
          });
        }
      }

      const isAnyError = multicallData.some(d => d.status === "failure");

      return {
        outcomeData,
        isError: isAnyError,
        errors: {
          prices: pricesResult?.error,
          marketInfo: marketInfoResult?.error,
        },
      };
    },
    enabled: enabled && !!publicClient && !!marketContract?.abi,
    refetchOnWindowFocus: false,
    refetchInterval: 300000, // Refresh every 5 minutes
  });

  return {
    outcomeData: query.data?.outcomeData ?? [],
    isLoading: query.isLoading,
    isError: query.isError || !!query.data?.isError,
    errors: {
      multicall: query.error,
      prices: query.data?.errors?.prices,
      marketInfo: query.data?.errors?.marketInfo,
    },
  };
};