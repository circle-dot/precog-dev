import { useMemo } from "react";
import { usePublicClient } from "wagmi";
import { useQuery } from "@tanstack/react-query";
import { useScaffoldContract } from "./scaffold-eth";
import { fromInt128toNumber, fromNumberToInt128 } from "~~/utils/numbers";

// =================================================================================================
// PRIMARY HOOKS
// =================================================================================================

/**
 * Hook to calculate market data for buying shares.
 * It takes a number of shares to buy and calculates the actual cost and future price.
 */
export const useMarketBuyCalculations = (
  chainId: number,
  marketId: number,
  marketAddress: string,
  outcome: number,
  sharesToBuy: number,
  enabled: boolean = true,
) => {
  const publicClient = usePublicClient();
  const { data: masterContract } = useScaffoldContract({
    contractName: "PrecogMasterV7",
  });

  return useQuery({
    queryKey: ["marketBuyPrice", chainId, marketId, outcome, sharesToBuy],
    queryFn: async () => {
      try {
        // Get current buy price for the requested shares
        const currentPrice = await getShareBuyPrice(
          marketId,
          outcome,
          sharesToBuy,
          publicClient,
          masterContract,
        );

        // Get future price by calculating for one more share
        const futurePriceTotal = await getShareBuyPrice(
          marketId,
          outcome,
          sharesToBuy + 1,
          publicClient,
          masterContract,
        );

        // Calculate future price as the difference
        const futurePrice = futurePriceTotal - currentPrice;

        return {
          maxShares: sharesToBuy,
          actualShares: sharesToBuy,
          actualPrice: currentPrice,
          pricePerShare: currentPrice / sharesToBuy,
          futurePrice,
          hasError: false,
          error: null,
        };
      } catch (error) {
        console.error("Error fetching buy price:", error);
        return {
          maxShares: 0,
          actualShares: 0,
          actualPrice: 0,
          pricePerShare: 0,
          futurePrice: 0,
          hasError: true,
          error: error instanceof Error ? error.message : "Failed to fetch buy price",
        };
      }
    },
    enabled: enabled && !!masterContract && !!publicClient && sharesToBuy > 0,
  });
};

/**
 * Hook to calculate market data for selling shares.
 * It takes a number of shares and calculates the expected collateral to receive.
 */
export const useMarketSellCalculations = (
  chainId: number,
  marketId: number,
  outcome: number,
  sharesToSell: number,
  enabled: boolean = true,
) => {
  const publicClient = usePublicClient();
  const { data: masterContract } = useScaffoldContract({
    contractName: "PrecogMasterV7",
  });

  return useQuery({
    queryKey: ["marketSellPrice", chainId, marketId, outcome, sharesToSell],
    queryFn: async () => {
      try {
        // Get current sell price
        const collateralToReceive = await getShareSellPrice(
          marketId,
          outcome,
          sharesToSell,
          publicClient,
          masterContract,
        );

        // Get future price by calculating for one more share
        const futurePriceTotal = await getShareSellPrice(
          marketId,
          outcome,
          sharesToSell + 1,
          publicClient,
          masterContract,
        );

        // Calculate future price as the difference
        const futurePrice = futurePriceTotal - collateralToReceive;

        return {
          collateralToReceive,
          pricePerShare: collateralToReceive / sharesToSell,
          futurePrice,
          hasError: false,
          error: null,
        };
      } catch (error) {
        console.error("Error fetching sell price:", error);
        return {
          collateralToReceive: 0,
          pricePerShare: 0,
          futurePrice: 0,
          hasError: true,
          error: error instanceof Error ? error.message : "Failed to fetch sell price",
        };
      }
    },
    enabled: enabled && !!masterContract && !!publicClient && sharesToSell > 0,
  });
};

// =================================================================================================
// DATA FETCHER HOOKS (reading from contract)
// =================================================================================================

const useMarketAlpha = (marketAddress: string, publicClient: any, enabled: boolean = true) => {
  return useQuery({
    queryKey: ["marketAlpha", marketAddress, publicClient?.chain.id],
    queryFn: () => getMarketV7Alpha(marketAddress, publicClient),
    enabled: enabled && !!publicClient,
    staleTime: Infinity,
    gcTime: Infinity,
  });
};

const useMarketSharesInfo = (marketId: number, publicClient: any, masterContract: any, enabled: boolean = true) => {
  return useQuery({
    queryKey: ["marketSharesInfo", marketId, publicClient?.chain.id],
    queryFn: () => getMarketSharesInfo(marketId, publicClient, masterContract),
    enabled: enabled && !!publicClient && !!masterContract,
  });
};

async function getMarketV7Alpha(marketAddress: string, publicClient: any): Promise<number> {
  const rawValue = await publicClient.getStorageAt({
    address: marketAddress as `0x${string}`,
    slot: "0xb",
  });
  const alphaInt128 = BigInt(rawValue?.slice(0, 34) ?? "0");
  return fromInt128toNumber(alphaInt128);
}

interface MarketSharesInfo {
  sharesBalances: number[];
}

async function getMarketSharesInfo(
  marketId: number,
  publicClient: any,
  masterContract: any,
): Promise<MarketSharesInfo> {
  const [, sharesBalances] = (await publicClient.readContract({
    address: masterContract.address,
    abi: masterContract.abi,
    functionName: "marketSharesInfo",
    args: [BigInt(marketId)],
  })) as [bigint, bigint[], bigint, bigint, bigint];

  return {
    sharesBalances: sharesBalances.map(balance => fromInt128toNumber(balance)),
  };
}

async function getShareBuyPrice(
  marketId: number,
  outcomeId: number,
  shares: number,
  publicClient: any,
  masterContract: any,
) {
  const priceInt128 = (await publicClient.readContract({
    address: masterContract.address as `0x${string}`,
    abi: masterContract.abi,
    functionName: "marketBuyPrice",
    args: [BigInt(marketId), BigInt(outcomeId), fromNumberToInt128(shares)],
  })) as bigint;
  return fromInt128toNumber(priceInt128);
}

async function getShareSellPrice(
  marketId: number,
  outcomeId: number,
  shares: number,
  publicClient: any,
  masterContract: any,
) {
  const priceInt128 = (await publicClient.readContract({
    address: masterContract.address as `0x${string}`,
    abi: masterContract.abi,
    functionName: "marketSellPrice",
    args: [BigInt(marketId), BigInt(outcomeId), fromNumberToInt128(shares)],
  })) as bigint;
  return fromInt128toNumber(priceInt128);
}

// =================================================================================================
// PURE MATH HELPERS (client-side calculations)
// =================================================================================================

const marketCost = (shares: number[], alpha: number): number => {
  const totalShares = shares.reduce((sum, s) => sum + s, 0);
  if (totalShares === 0) return 0;
  const beta = totalShares * alpha;
  const sumTotal = shares.reduce((sum, s) => (s === 0 ? sum : sum + Math.exp(s / beta)), 0);
  return beta * Math.log(sumTotal);
};

const marketCostAfterTrade = (shares: number[], alpha: number, outcome: number, amount: number): number => {
  const newShares = [...shares];
  newShares[outcome] += amount;
  return marketCost(newShares, alpha);
};

const marketTradeCost = (shares: number[], alpha: number, outcome: number, amount: number): number => {
  const cost = marketCost(shares, alpha);
  const costAfterTrade = marketCostAfterTrade(shares, alpha, outcome, amount);
  return Math.abs(costAfterTrade - cost);
};

export const marketSharesFromCost = (shares: number[], alpha: number, outcome: number, totalCost: number): number => {
  const maxIterations = 100;
  const tolerance = 0.0001;
  let low = 0;
  let high = totalCost * 10000;
  let mid = 0;
  for (let i = 0; i < maxIterations; i++) {
    mid = (low + high) / 2;
    if (mid === 0) {
      low = tolerance;
      continue;
    }
    const cost = marketTradeCost(shares, alpha, outcome, mid);
    if (Math.abs(cost - totalCost) < tolerance) return mid;
    if (cost < totalCost) low = mid;
    else high = mid;
  }
  return mid;
};

const marketPrice = (shares: number[], alpha: number, outcome: number): number => {
  const totalShares = shares.reduce((sum, s) => sum + s, 0);
  if (totalShares === 0) return 0;
  const beta = totalShares * alpha;
  return Math.exp(shares[outcome] / beta) / shares.reduce((sum, s) => (s === 0 ? sum : sum + Math.exp(s / beta)), 0);
};

const marketPriceAfterTrade = (shares: number[], alpha: number, outcome: number, amount: number): number => {
  const newShares = [...shares];
  newShares[outcome] += amount;
  return marketPrice(newShares, alpha, outcome);
};
