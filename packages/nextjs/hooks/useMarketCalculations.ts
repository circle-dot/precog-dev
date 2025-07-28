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
  enabled = true,
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
  marketAddress: string,
  outcome: number,
  sharesToSell: number,
  enabled = true,
) => {
  const publicClient = usePublicClient();
  const { data: masterContract } = useScaffoldContract({
    contractName: "PrecogMasterV7",
  });

  const { data: sharesInfo, isLoading: isSharesInfoLoading } = useMarketSharesInfo(
    marketId,
    publicClient,
    masterContract,
    enabled && sharesToSell > 0,
  );

  const { data: alpha, isLoading: isAlphaLoading } = useMarketAlpha(marketAddress, publicClient, enabled && sharesToSell > 0);

  const query = useQuery({
    queryKey: ["marketSellPrice", chainId, marketId, outcome, sharesToSell, sharesInfo, alpha],
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

        if (!sharesInfo || !alpha) {
          throw new Error("Market data not available for future price calculation.");
        }
        // Calculate future buy price after the sell is completed
        const futurePrice = getFuturePriceAfterTrade(
          sharesInfo.sharesBalances,
          alpha,
          outcome,
          -sharesToSell // Negative for sell
        );

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
          futureBuyPrice: 0,
          hasError: true,
          error: error instanceof Error ? error.message : "Failed to fetch sell price",
        };
      }
    },
    enabled: enabled && !!masterContract && !!publicClient && sharesToSell > 0 && !!sharesInfo && !!alpha,
  });

  const isLoading = isSharesInfoLoading || isAlphaLoading || query.isLoading;

  return {
    ...query,
    isLoading,
  };
};

// =================================================================================================
// DATA FETCHER HOOKS (reading from contract)
// =================================================================================================

const useMarketAlpha = (marketAddress: string, publicClient: any, enabled = true) => {
  return useQuery({
    queryKey: ["marketAlpha", marketAddress, publicClient?.chain.id],
    queryFn: () => getMarketV7Alpha(marketAddress, publicClient),
    enabled: enabled && !!publicClient,
    staleTime: Infinity,
    gcTime: Infinity,
  });
};

const useMarketSharesInfo = (marketId: number, publicClient: any, masterContract: any, enabled = true) => {
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

/**
 * Simulates a trade to calculate the market's new total collateral after the trade is completed.
 * If this trade were to happen, what would the market's new total value be?
 */
const marketCostAfterTrade = (shares: number[], alpha: number, outcome: number, amount: number): number => {
  const newShares = [...shares];
  newShares[outcome] += amount;
  return marketCost(newShares, alpha);
};

/**
 * Calculates the exact cost of a trade by finding the difference
 * in the market's total collateral before and after the trade.
 * Is the precise amount to pay to buy those shares, or to receive for selling them
 */
const marketTradeCost = (shares: number[], alpha: number, outcome: number, amount: number): number => {
  const cost = marketCost(shares, alpha);
  const costAfterTrade = marketCostAfterTrade(shares, alpha, outcome, amount);
  return Math.abs(costAfterTrade - cost);
};

/**
 * Calculates the price of buying/selling one share after a trade is completed
 * @param shares Current share balances
 * @param alpha Market alpha parameter
 * @param outcome Outcome index
 * @param tradeAmount Amount of shares being traded (positive for buy, negative for sell)
 * @returns Price of 1 share after the trade
 */
export const getFuturePriceAfterTrade = (
  shares: number[],
  alpha: number, 
  outcome: number,
  tradeAmount: number
): number => {
  // First simulate the trade by updating shares
  const sharesAfterTrade = [...shares];
  sharesAfterTrade[outcome] += tradeAmount;
  
  // Then calculate the cost of trading 1 more share from that state
  return marketTradeCost(sharesAfterTrade, alpha, outcome, 1);
};
