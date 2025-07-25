import { useState } from "react";
import Link from "next/link";
import { formatEther } from "viem";
import { ArrowTopRightOnSquareIcon, ChartBarSquareIcon, XCircleIcon } from "@heroicons/react/24/outline";
import { useAccount } from "wagmi";
import { useTargetNetwork } from "~~/hooks/scaffold-eth/useTargetNetwork";
import {
  MarketInfo,
  useAccountOutcomeBalances,
  usePrecogMarketDetails,
  usePrecogMarketPrices,
} from "~~/hooks/usePrecogMarketData";
import { useMarketBuyCalculations, useMarketSellCalculations } from "~~/hooks/useMarketCalculations";
import { getBlockExplorerAddressLink } from "~~/utils/scaffold-eth/networks";
import { ChainWithAttributes } from "~~/utils/scaffold-eth/networks";
import { fromInt128toNumber } from "~~/utils/numbers";
import { parseEther } from "viem";
import { useMarketTrade } from "~~/hooks/useMarketTrade";

/**
 * Returns the current market status and associated styling class
 */
const getMarketStatus = (startTimestamp: bigint, endTimestamp: bigint): { status: string; className: string } => {
  const now = BigInt(Math.floor(Date.now() / 1000));

  if (now < startTimestamp) {
    return { status: "CREATED", className: "text-warning" };
  } else if (now >= startTimestamp && now < endTimestamp) {
    return { status: "OPEN", className: "text-success animate-pulse" };
  } else {
    return { status: "CLOSED", className: "text-error" };
  }
};

/**
 * Main component that renders a list of prediction markets
 */
export const MarketList = ({ markets }: { markets: MarketInfo[] }) => {
  const { targetNetwork } = useTargetNetwork();
  const [searchFilter, setSearchFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const statusStyles: { [key: string]: string } = {
    all: "text-base-content",
    created: "text-warning",
    open: "text-success",
    closed: "text-error",
  };

  if (markets.length === 0) {
    return (
      <div className="flex flex-wrap justify-center py-40">
        <p className="font-mono text-2xl text-accent">-- NO MARKETS DETECTED --</p>
      </div>
    );
  }

  const filteredMarkets = markets.filter(market => {
    const nameMatches = market.name.toLowerCase().includes(searchFilter.toLowerCase());
    const status = getMarketStatus(market.startTimestamp, market.endTimestamp).status.toLowerCase();
    const statusMatches = statusFilter === "all" || status === statusFilter;
    return nameMatches && statusMatches;
  });

  return (
    <div className="w-full flex flex-col gap-4 font-mono">
      <div className="flex justify-between items-center mb-4 flex-col sm:flex-row">
        <h2 className="text-2xl font-bold m-0">Prediction Markets</h2>
        <div className="flex items-center gap-2">
          <div className="relative">
            <input
              type="text"
              value={searchFilter}
              onChange={e => setSearchFilter(e.target.value)}
              placeholder="Search Market"
              className="input input-bordered input-sm pr-8 min-w-60"
            />
            {searchFilter && (
              <button className="absolute inset-y-0 right-3 flex items-center" onClick={() => setSearchFilter("")}>
                <XCircleIcon className="h-5 w-5 text-base-content/60 hover:text-error" />
              </button>
            )}
          </div>
          <select
            className={`select select-bordered select-sm font-bold uppercase text-xs ${statusStyles[statusFilter]}`}
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
          >
            <option value="all" className="text-base-content font-bold">
              All
            </option>
            <option value="created" className="text-warning font-bold">
              Created
            </option>
            <option value="open" className="text-success font-bold">
              Open
            </option>
            <option value="closed" className="text-error font-bold">
              Closed
            </option>
          </select>
        </div>
      </div>
      {filteredMarkets.length > 0 ? (
        filteredMarkets.map(market => <MarketItem key={market.market} market={market} targetNetwork={targetNetwork} />)
      ) : (
        <div className="flex flex-wrap justify-center py-10">
          <p className="font-mono text-lg text-accent">-- NO MARKETS FOUND --</p>
        </div>
      )}
    </div>
  );
};

/**
 * Individual market item component with collapsible details
 */
const MarketItem = ({ market, targetNetwork }: { market: MarketInfo; targetNetwork: ChainWithAttributes }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [showPrices, setShowPrices] = useState(false);
  const [showTrading, setShowTrading] = useState(false);

  const { status, className } = getMarketStatus(market.startTimestamp, market.endTimestamp);

  return (
    <div className="collapse collapse-arrow bg-base-100 transition-colors duration-300 rounded-lg shadow-lg shadow-primary/10">
      <input type="checkbox" className="peer" checked={isOpen} onChange={e => setIsOpen(e.target.checked)} />
      {/* Market Header */}
      <div className="collapse-title peer-checked:bg-base-200/10 text-xs">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
            <h3 className="text-lg font-bold text-base-content/70 truncate m-0" title={market.name}>
              <span className="text-base-content/70 mr-2">[{market.marketId}]</span>
              {market.name}
            </h3>
            <div className="text-sm">
              <span>
                <span className="text-success">{formatDate(market.startTimestamp)}</span> →{" "}
                <span className="text-error">{formatDate(market.endTimestamp)}</span>
              </span>
            </div>
          </div>
          <div className="font-bold">
            <span className={className}>[{status}]</span>
          </div>
        </div>
      </div>

      {/* Market Content */}
      <div className="collapse-content bg-base-300/20 text-sm">
        <div className="pt-4 flex flex-col gap-4">
          {/* Basic Market Info */}
          <div className="gap-2 flex flex-col">
            <h4 className="font-bold text-base-content/70 m-0">:: Market Basic Info ::</h4>
            <div className="p-4 border border-dashed border-base-content/20 rounded-md flex flex-col gap-1">
              <div className="break-words">
                <span className="font-bold text-base-content/70">Market Description: </span>
                {market.description}
              </div>
              <div>
                <span className="font-bold text-base-content/70">Category: </span>
                {market.category}
              </div>
              <div className="break-words">
                <span className="font-bold text-base-content/70">Outcomes: </span>
                {market.outcomes.join(", ")}
              </div>
              <div className="break-all">
                <span className="font-bold text-base-content/70">Creator: </span>
                <a
                  href={getBlockExplorerAddressLink(targetNetwork, market.creator)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 hover:underline"
                >
                  {market.creator}
                  <ArrowTopRightOnSquareIcon className="w-3 h-3" />
                </a>
              </div>
              <div className="break-all">
                <span className="font-bold text-base-content/70">Market Contract: </span>
                <a
                  href={getBlockExplorerAddressLink(targetNetwork, market.market)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 hover:underline"
                >
                  {market.market}
                  <ArrowTopRightOnSquareIcon className="w-3 h-3" />
                </a>
                <Link
                  href={`/market?address=${market.market}`}
                  className="ml-4 inline-flex items-center gap-1 hover:underline"
                  passHref
                >
                  Market Details
                  <ChartBarSquareIcon className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4 pt-4">
            <button className="btn btn-sm btn-primary" onClick={() => setShowDetails(!showDetails)}>
              {showDetails ? "Hide" : "Show"} Market Info
            </button>
            <button className="btn btn-sm btn-primary" onClick={() => setShowPrices(!showPrices)}>
              {showPrices ? "Hide" : "Show"} Prices
            </button>
            <button className="btn btn-sm btn-primary" onClick={() => setShowTrading(!showTrading)}>
              {showTrading ? "Hide" : "Start"} Trading
            </button>
          </div>

          {/* Conditional Renders so that we don't have to fetch the data if the user doesn't want to see it */}
          {showDetails && <MarketDetailedInfo market={market} />}
          {showPrices && <MarketPrices market={market} />}
          {showTrading && <MarketTradingPanel market={market} targetNetwork={targetNetwork} />}
        </div>
      </div>
    </div>
  );
};

/**
 * Displays more market information including resolution and trading data
 */
const MarketDetailedInfo = ({ market }: { market: MarketInfo }) => {
  const {
    data: details,
    isLoading,
    isError,
  } = usePrecogMarketDetails(market.marketId, market.market, true);
  const { targetNetwork } = useTargetNetwork();

  if (isLoading) {
    return (
      <div className="flex justify-center items-center pt-4">
        <span className="loading loading-spinner loading-md"></span>
      </div>
    );
  }

  if (isError || !details) {
    return (
      <div className="flex justify-center items-center pt-4 flex-col">
        <p className="text-error">--! ERROR: COULD NOT LOAD MARKET TRADING INFO !--</p>
      </div>
    );
  }

  const { marketInfo, token, tokenSymbol, marketResultInfo } = details;
  const status = getDetailedMarketStatus(market.startTimestamp, market.endTimestamp, marketResultInfo[0]);

  return (
    <div className="flex flex-col gap-4">
      {/* Market Resolution Section */}
    <div className="flex flex-col gap-4">
    <h4 className="font-bold text-base-content/70 m-0">:: Market Resolution Info ::</h4>
      <div className="p-2 border border-dashed border-base-content/20 rounded-md flex flex-col gap-1">
        <p className="m-0">
          <span className="font-bold text-base-content/70">Market Status:</span> {status}
        </p>
        <p className="m-0">
          <span className="font-bold text-base-content/70">Oracle:</span>{" "}
            <a
              href={getBlockExplorerAddressLink(targetNetwork, marketResultInfo[2])}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 hover:underline"
            >
              {marketResultInfo[2]}
              <ArrowTopRightOnSquareIcon className="w-3 h-3" />
            </a>
        </p>
        <p className="m-0">
          <span className="font-bold text-base-content/70">Reported Outcome:</span>{" "}
          {marketResultInfo[0] === 0n ? "Pending Resolution" : market.outcomes[Number(marketResultInfo[0]) - 1]}
        </p>
        <p className="m-0">
          <span className="font-bold text-base-content/70">Resolution Date:</span>{" "}
          {marketResultInfo[0] === 0n ? "Pending Resolution" : formatDate(marketResultInfo[1], true)}
        </p>
      </div>
    </div>

      {/* Market Trading Section */}
    <div className="flex flex-col gap-4">
    <h4 className="font-bold text-base-content/70 m-0">:: Market Trading Info ::</h4>
      <div className="p-2 border border-dashed border-base-content/20 rounded-md flex flex-col gap-1">
        <p className="m-0">
          <span className="font-bold text-base-content/70">Trading Starts:</span>{" "}
          {formatDate(market.startTimestamp, true)}
        </p>
        <p className="m-0">
          <span className="font-bold text-base-content/70">Trading Ends:</span> {formatDate(market.endTimestamp, true)}
        </p>
        <p className="m-0">
          <span className="font-bold text-base-content/70">Collateral Token:</span>{" "}
          <a
            href={getBlockExplorerAddressLink(targetNetwork, token)}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 hover:underline"
          >
            {token}
            <ArrowTopRightOnSquareIcon className="w-3 h-3" />
          </a>{" "}
          ({tokenSymbol})
        </p>
        <p className="m-0">
          <span className="font-bold text-base-content/70">Locked Collateral:</span>{" "}
          {formatMarketValue(marketInfo[2], v => fromInt128toNumber(v).toFixed())} ({tokenSymbol})
        </p>
        <p className="m-0">
          <span className="font-bold text-base-content/70">Total Buys:</span> {formatMarketValue(marketInfo[3])}
        </p>
        <p className="m-0">
          <span className="font-bold text-base-content/70">Total Sells:</span> {formatMarketValue(marketInfo[4])}
        </p>
        <p className="m-0">
          <span className="font-bold text-base-content/70">Total Shares:</span>{" "}
          {formatMarketValue(marketInfo[0], fromInt128toNumber)}
        </p>
        <p className="m-0">
          <span className="font-bold text-base-content/70">Shares Balances:</span>{" "}
          {formatSharesBalances(marketInfo[1], market.outcomes)}
        </p>
      </div>
    </div>
    </div>
  );
};

/**
 * Displays current market prices and outcome probabilities
 */
const MarketPrices = ({ market }: { market: MarketInfo }) => {
  const { outcomeData, isLoading, isError } = usePrecogMarketPrices(market.market, market.outcomes, true);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center pt-4">
        <span className="loading loading-spinner loading-md"></span>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex justify-center items-center pt-4 flex-col">
        <p className="text-error">--! ERROR: COULD NOT LOAD PRICES !--</p>
      </div>
    );
  }

  // Find the outcome with the highest buy price (most likely to win)
  const outcomesWithPrices = outcomeData.filter(o => typeof o.buyPrice !== "undefined");
  const winningOutcome =
    outcomesWithPrices.length > 0
      ? outcomesWithPrices.reduce((prev, current) =>
          (prev.buyPrice || 0n) > (current.buyPrice || 0n) ? prev : current,
        )
      : null;

  const calculateProbability = (buyPrice?: bigint): number => {
    if (!buyPrice) return 0;
    return Number(formatEther(buyPrice)) * 100;
  };

  const winningProbability = calculateProbability(winningOutcome?.buyPrice);

  return (
    <div className="flex flex-col gap-4">
      <h4 className="font-bold text-base-content/70 m-0">:: Outcome Prices ::</h4>
      <div className="p-2 border border-dashed border-base-content/20 rounded-md flex flex-col gap-1 font-mono text-xs">
      {winningOutcome && (
        <div className="text-xs">
        PREDICTION: {winningOutcome.name} ({winningProbability.toFixed(2)}%)
        </div>
      )}
        {outcomeData.map((outcome, i) => (
          <div key={i}>
            <span className="font-semibold text-base-content/80">{`> ${outcome.name}`}</span>
            <span className="pl-2">
              - BUY: {outcome.buyPrice ? Number(formatEther(outcome.buyPrice)).toFixed(4) : "N/A"}
              <span className="px-2">|</span>
              SELL: {outcome.sellPrice ? Number(formatEther(outcome.sellPrice)).toFixed(4) : "N/A"}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

/**
 * Displays a trading panel for a market
 */
const MarketTradingPanel = ({
  market,
  targetNetwork,
}: {
  market: MarketInfo;
  targetNetwork: ChainWithAttributes;
}) => {
  const { address: connectedAddress } = useAccount();
  const [tradeType, setTradeType] = useState("BUY");
  const [selectedOutcome, setSelectedOutcome] = useState("");
  const [inputValue, setInputValue] = useState("");
  const [costToQuote, setCostToQuote] = useState<number | null>(null);
  const [sharesToQuote, setSharesToQuote] = useState<number | null>(null);

  const handleGetQuote = () => {
    const amount = Number(inputValue);
    if (amount > 0) {
      if (tradeType === "BUY") {
        setCostToQuote(amount);
      } else {
        setSharesToQuote(amount);
      }
    }
  };

  const isReadyToFetch = !!connectedAddress && !!targetNetwork?.id;

  // Fetch account shares data on demand when the panel is shown
  const {
    data: accountShares,
    isLoading: isLoadingAccountShares,
    isError: isErrorAccountShares,
  } = useAccountOutcomeBalances(market.marketId, market.market, connectedAddress, targetNetwork.id, isReadyToFetch);

  // Calculate buy/sell data when a quote is requested
  const outcomeIndex = selectedOutcome ? market.outcomes.indexOf(selectedOutcome) + 1 : 0;
  const { data: buyCalculations, isLoading: isLoadingBuy } = useMarketBuyCalculations(
    targetNetwork.id,
    market.marketId,
    market.market,
    outcomeIndex,
    costToQuote ?? 0,
    isReadyToFetch && tradeType === "BUY" && costToQuote !== null && costToQuote > 0 && outcomeIndex > 0,
  );
  const { data: sellCalculations, isLoading: isLoadingSell } = useMarketSellCalculations(
    targetNetwork.id,
    market.marketId,
    outcomeIndex,
    sharesToQuote ?? 0,
    isReadyToFetch && tradeType === "SELL" && sharesToQuote !== null && sharesToQuote > 0 && outcomeIndex > 0,
  );

  const isLoadingCalculations = isLoadingBuy || isLoadingSell;

  const { executeBuy, executeSell, isPending } = useMarketTrade();

  if (!connectedAddress) {
    return (
      <div className="flex justify-center items-center pt-4">
        <p>Please connect wallet to trade.</p>
      </div>
    );
  }

  if (isLoadingAccountShares) {
    return (
      <div className="flex justify-center items-center pt-4">
        <span className="loading loading-spinner loading-md"></span>
      </div>
    );
  }

  if (isErrorAccountShares || !accountShares) {
    return (
      <div className="flex justify-center items-center pt-4 flex-col">
        <p className="text-error">--! ERROR: COULD NOT LOAD YOUR TRADING DATA !--</p>
      </div>
    );
  }

  // Determine what data to show in the quote based on the trade type
  let quoteDisplay = null;
  if (tradeType === "BUY" && buyCalculations && !buyCalculations.hasError && buyCalculations.actualShares > 0) {
    const { actualPrice, actualShares } = buyCalculations;
    quoteDisplay = (
      <>
        <p className="m-0 font-mono">&gt; Trade: BUY {actualShares} shares of {selectedOutcome}</p>
        <p className="m-0 font-mono">
          &gt; Cost: {actualPrice.toFixed(4)} {accountShares.tokenSymbol} (Price per share:{" "}
          {(actualPrice / actualShares).toFixed(4)})
        </p>
      </>
    );
  } else if (tradeType === "SELL" && sellCalculations && !sellCalculations.hasError) {
    const { collateralToReceive, pricePerShare } = sellCalculations;
    quoteDisplay = (
      <>
        <p className="m-0 font-mono">&gt; Trade: SELL {sharesToQuote} shares of {selectedOutcome}</p>
        <p className="m-0 font-mono">
          &gt; Receive: {collateralToReceive.toFixed(4)} {accountShares.tokenSymbol} (Price per share:{" "}
          {pricePerShare.toFixed(4)})
        </p>
      </>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <h4 className="font-bold text-base-content/70 m-0">:: Your Info ::</h4>
      {/* User Info */}
      <div className="p-2 border border-dashed border-base-content/20 rounded-md flex flex-col gap-1">
        <p className="m-0 break-all text-xs">
          <span className="font-bold">Account:</span> {connectedAddress}
        </p>
        <p className="m-0 text-xs">
          <span className="font-bold">Shares:</span> {formatTokenBalances(accountShares.balances, market.outcomes)}
        </p>
        <p className="m-0 text-xs">
          <span className="font-bold">Buys:</span> {String(accountShares.buys)},{" "}
          <span className="font-bold">Sells:</span> {String(accountShares.sells)}
        </p>
      </div>

      {/* Trade in the Market */}
      <div className="p-2 border border-dashed border-base-content/20 rounded-md flex flex-col gap-2">
        <h5 className="font-bold text-base-content/70 m-0 text-sm">Trade in the Market</h5>

        <div className="flex items-center gap-2 flex-wrap">
          {/* BUY/SELL Selector */}
          <select
            className="select select-bordered select-xs"
            value={tradeType}
            onChange={e => {
              setTradeType(e.target.value);
              setInputValue("");
              setCostToQuote(null);
              setSharesToQuote(null);
            }}
          >
            <option>BUY</option>
            <option>SELL</option>
          </select>

          {/* Outcome selector */}
          <select
            className="select select-bordered select-xs"
            value={selectedOutcome}
            onChange={e => {
              setSelectedOutcome(e.target.value);
              setInputValue("");
              setCostToQuote(null);
              setSharesToQuote(null);
            }}
          >
            <option value="" disabled>
              Please select an outcome
            </option>
            {market.outcomes.map(outcome => (
              <option key={outcome}>{outcome}</option>
            ))}
          </select>

          {/* Total Cost input */}
          <input
            type="number"
            min={0}
            placeholder={tradeType === "BUY" ? "Total Cost" : "Shares Amount"}
            className="input input-bordered input-xs w-full max-w-[120px]"
            value={inputValue}
            onChange={e => {
              setInputValue(e.target.value);
              if (costToQuote !== null) setCostToQuote(null);
              if (sharesToQuote !== null) setSharesToQuote(null);
            }}
            onKeyDown={e => {
              if (e.key === "Enter") {
                handleGetQuote();
              }
            }}
          />
          <button
            className="btn btn-xs btn-secondary"
            onClick={handleGetQuote}
            disabled={isLoadingCalculations || !inputValue || Number(inputValue) <= 0 || !selectedOutcome}
          >
            QUOTE
          </button>
        </div>

        {isLoadingCalculations && (
          <div className="flex justify-center items-center py-2">
            <span className="loading loading-spinner loading-xs"></span>
          </div>
        )}

        {quoteDisplay && (
          <div className="text-xs">
            {quoteDisplay}
          </div>
        )}

        {(buyCalculations?.hasError || sellCalculations?.hasError) && (
          <div className="text-xs text-error">
            Error: {buyCalculations?.error || sellCalculations?.error}
          </div>
        )}

        <button
          className="btn btn-primary btn-sm w-32 mt-2"
          disabled={!quoteDisplay || isLoadingCalculations || isPending}
          onClick={async () => {
            if (tradeType === "BUY" && buyCalculations?.actualShares && buyCalculations.actualPrice) {
              try {
                const maxTokenIn = parseEther(buyCalculations.actualPrice.toString());
                await executeBuy(
                  market.marketId,
                  outcomeIndex,
                  buyCalculations.actualShares,
                  market.market,
                  maxTokenIn,
                );
                // Optionally refresh market data here
              } catch (error) {
                console.error("Buy execution failed:", error);
              }
            } else if (tradeType === "SELL" && sellCalculations && !sellCalculations.hasError && sharesToQuote) {
              try {
                await executeSell(
                  market.marketId,
                  outcomeIndex,
                  sharesToQuote,
                );
                // Optionally refresh market data here
              } catch (error) {
                console.error("Sell execution failed:", error);
              }
            }
          }}
        >
          {isPending ? (
            <span className="loading loading-spinner loading-xs"></span>
          ) : (
            tradeType
          )}
        </button>
      </div>
    </div>
  );
};

// Helper Functions

/**
 * Returns a detailed market status string based on timing and result
 */
const getDetailedMarketStatus = (startTimestamp: bigint, endTimestamp: bigint, result: bigint): string => {
  const now = BigInt(Math.floor(Date.now() / 1000));

  if (now < startTimestamp) {
    return "COMING SOON";
  } else if (now >= startTimestamp && now <= endTimestamp) {
    return "OPEN";
  } else if (now > endTimestamp && result === 0n) {
    return "WAITING FOR THE RESULT";
  } else if (result !== 0n) {
    return "CLOSED";
  }

  return "ENDED";
};

/**
 * Formats the shares balances of a market
 * @param sharesArray array of shares balances (index 0 is skipped as it's a 0-index based)
 * @param outcomes The outcomes of the market
 * @returns Comma-separated string of share balances
 */
const formatSharesBalances = (
  sharesArray: readonly bigint[] | undefined,
  outcomes: readonly string[] | undefined,
): string => {
  if (!sharesArray || !outcomes) return "N/A";

  // Skip the first element (0-index based) and convert the rest to numbers
  const balances = Array.from(sharesArray.slice(1)).map(fromInt128toNumber);

  return balances.map((balance, index) => `${balance.toFixed()} (${outcomes[index]})`).join(" | ");
};

/**
 * Formats a market value using a formatter function
 * @param value The bigint value to format
 * @param formatter Optional function to format the value (defaults to String)
 * @returns Formatted string representation of the value
 */
const formatMarketValue = (value: bigint | undefined, formatter: (val: bigint) => string | number = String): string => {
  return value !== undefined ? formatter(value).toString() : "N/A";
};

/**
 * Formats a Unix timestamp into a human-readable date string
 * @param timestamp Unix timestamp in seconds
 * @param includeTime Whether to include hours and minutes
 * @returns Formatted date string in UTC
 */
const formatDate = (timestamp: bigint, includeTime = false) => {
  const date = new Date(Number(timestamp) * 1000);

  const day = String(date.getUTCDate()).padStart(2, "0");
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const year = date.getUTCFullYear();

  let dateString = `${day}/${month}/${year}`;

  if (includeTime) {
    const hours = String(date.getUTCHours()).padStart(2, "0");
    const minutes = String(date.getUTCMinutes()).padStart(2, "0");
    dateString += ` ${hours}:${minutes}`;
  }

  return `${dateString} UTC`;
};

/**
 * Formats token balances from wei to ETH units with outcome labels
 * @param sharesArray array of token balances in wei (index 0 is skipped as it's a 0-index based)
 * @param outcomes The outcomes of the market
 * @returns Comma-separated string of token balances
 */
const formatTokenBalances = (
  sharesArray: readonly bigint[] | undefined,
  outcomes: readonly string[] | undefined,
): string => {
  if (!sharesArray || !outcomes) return "N/A";

  // Skip the first element (0-index based) and convert the rest to ETH units
  const balances = Array.from(sharesArray.slice(1)).map(amount => Number(formatEther(amount)));

  return balances.map((balance, index) => `${balance} (${outcomes[index]})`).join(" | ");
};