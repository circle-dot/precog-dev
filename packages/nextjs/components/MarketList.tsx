import { useState } from "react";
import { formatEther } from "viem";
import { ArrowTopRightOnSquareIcon } from "@heroicons/react/24/outline";
import { useTargetNetwork } from "~~/hooks/scaffold-eth/useTargetNetwork";
import { MarketDetails, MarketInfo, usePrecogMarketDetails, usePrecogMarketPrices } from "~~/hooks/usePrecogMarketData";
import { fromInt128toNumber } from "~~/utils/numbers";
import { getBlockExplorerAddressLink } from "~~/utils/scaffold-eth/networks";

const MarketExtraDetails = ({ market, details }: { market: MarketInfo; details: MarketDetails }) => {
  const { marketInfo, token, tokenSymbol, marketResultInfo } = details;
  const status = getDetailedMarketStatus(market.startTimestamp, market.endTimestamp, marketResultInfo[0]);
  const { targetNetwork } = useTargetNetwork();

  return (
    <div className="flex flex-col gap-2">
      <h4 className="font-bold text-base-content/70 m-0">:: Market Resolution Info ::</h4>
      <div className="p-2 border border-dashed border-base-content/20 rounded-md flex flex-col gap-1">
      <p className="m-0">
          <span className="font-bold text-base-content/70">Market Status:</span> {status}
        </p>
        <p className="m-0">
          <span className="font-bold text-base-content/70">Reported Outcome:</span>{" "}
          {marketResultInfo[0] === 0n ? "[PENDING_RESOLUTION]" : market.outcomes[Number(marketResultInfo[0]) - 1]}
        </p>
        <p className="m-0">
          <span className="font-bold text-base-content/70">Resolution Time:</span>{" "}
          {marketResultInfo[0] === 0n ? "[PENDING_RESOLUTION]" : formatDate(marketResultInfo[1], true)}
        </p>
        <p className="m-0">
          <span className="font-bold text-base-content/70">Reporter:</span>{" "}
          {marketResultInfo[0] === 0n ? (
            "[PENDING_RESOLUTION]"
          ) : (
            <a
              href={getBlockExplorerAddressLink(targetNetwork, marketResultInfo[2])}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 hover:underline"
            >
              {marketResultInfo[2]}
              <ArrowTopRightOnSquareIcon className="w-3 h-3" />
            </a>
          )}
        </p>
      </div>
      <h4 className="font-bold text-base-content/70 m-0">:: Market Trading Info ::</h4>
      <div className="p-2 border border-dashed border-base-content/20 rounded-md flex flex-col gap-1">
        <p className="m-0">
          <span className="font-bold text-base-content/70">Trading Starts:</span> {formatDate(market.startTimestamp, true)}
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
          <span className="font-bold text-base-content/70">Total Shares:</span>{" "}
          {formatMarketValue(marketInfo[0], fromInt128toNumber)}
        </p>
        <p className="m-0">
          <span className="font-bold text-base-content/70">Shares Balances:</span>{" "}
          {formatSharesBalances(marketInfo[1])}
        </p>
        <p className="m-0">
          <span className="font-bold text-base-content/70">Locked Collateral:</span>{" "}
          {formatMarketValue(marketInfo[2], v => fromInt128toNumber(v).toFixed(4))}
        </p>
        <p className="m-0">
          <span className="font-bold text-base-content/70">Total Buys:</span> {formatMarketValue(marketInfo[3])}
        </p>
        <p className="m-0">
          <span className="font-bold text-base-content/70">Total Sells:</span> {formatMarketValue(marketInfo[4])}
        </p>
      </div>
    </div>
  );
};

const MarketPrices = ({
  market,
  details,
  isVisible,
}: {
  market: MarketInfo;
  details: MarketDetails;
  isVisible: boolean;
}) => {
  const { outcomeData, isLoading, isError } = usePrecogMarketPrices(market.market, market.outcomes, isVisible);

  if (!isVisible) return null;

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

  const outcomesWithPrices = outcomeData.filter(o => typeof o.buyPrice !== "undefined");

  const winningOutcome =
    outcomesWithPrices.length > 0
      ? outcomesWithPrices.reduce((prev, current) =>
          (prev.buyPrice || 0n) > (current.buyPrice || 0n) ? prev : current,
        )
      : null;

  const calculateProbability = (buyPrice?: bigint): number => {
    if (!buyPrice) {
      return 0;
    }
    return Number(formatEther(buyPrice)) * 100;
  };

  const winningProbability = calculateProbability(winningOutcome?.buyPrice);

  return (
    <div className="flex flex-col gap-2">
      <h4 className="font-bold text-base-content/70 m-0">:: Outcome Prices ::</h4>
      {winningOutcome && (
        <div className="text-xs">
          &gt; PREDICTION: {winningOutcome.name} ({winningProbability.toFixed(2)}%)
        </div>
      )}
      <div className="p-2 border border-dashed border-base-content/20 rounded-md flex flex-col gap-2 font-mono text-xs">
        {outcomeData.map((outcome, i) => (
          <div key={i}>
            <div className="font-semibold text-base-content/80">{`> ${outcome.name}`}</div>
            <div className="pl-4">
              <span>BUY: {outcome.buyPrice ? Number(formatEther(outcome.buyPrice)).toFixed(4) : "N/A"}</span>
              <span className="px-2">|</span>
              <span>SELL: {outcome.sellPrice ? Number(formatEther(outcome.sellPrice)).toFixed(4) : "N/A"}</span>
              <span className="px-2">|</span>
              <span>SHARES: {details.marketInfo ? fromInt128toNumber(details.marketInfo[1][i + 1]) : "N/A"}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const MarketItem = ({ market }: { market: MarketInfo }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [showPrices, setShowPrices] = useState(false);

  const { data: details, isLoading } = usePrecogMarketDetails(market.marketId, market.market, showDetails || showPrices);

  const { status, className } = getMarketStatus(market.startTimestamp, market.endTimestamp);

  const { targetNetwork } = useTargetNetwork();

  return (
    <div className="collapse collapse-arrow bg-base-100 transition-colors duration-300 rounded-lg shadow-lg shadow-primary/10">
      <input type="checkbox" className="peer" checked={isOpen} onChange={e => setIsOpen(e.target.checked)} />
      <div className="collapse-title peer-checked:bg-base-200/10 text-xs">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-4">
            <h3 className="text-lg font-bold text-base-content/70 truncate m-0" title={market.name}>
              <span className="text-base-content/70 mr-2">[{market.marketId}]</span>
              {market.name}
            </h3>
            <div className="flex gap-2 text-sm">
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
      <div className="collapse-content bg-base-300/20 text-sm">
        <div className="pt-4 flex flex-col gap-4">
       <div className="gap-2 flex flex-col">
       <h4 className="font-bold text-base-content/70 m-0">:: Market Basic Info ::</h4>
          <div className="p-4 border border-dashed border-base-content/20 rounded-md flex flex-col gap-2">
            <div>
              <span className="font-bold text-base-content/70">[MARKET_DESCRIPTION]: </span>
              {market.description}
            </div>
            <div>
              <span className="font-bold text-base-content/70">[CATEGORY]: </span>
              {market.category}
            </div>
            <div>
              <span className="font-bold text-base-content/70">[OUTCOMES]: </span>
              {market.outcomes.join(", ")}
            </div>
            <div>
              <span className="font-bold text-base-content/70">[CREATOR]: </span>
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
            <div>
              <span className="font-bold text-base-content/70">[MARKET_CONTRACT]: </span>
              <a
                href={getBlockExplorerAddressLink(targetNetwork, market.market)}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 hover:underline"
              >
                {market.market}
                <ArrowTopRightOnSquareIcon className="w-3 h-3" />
              </a>
            </div>
          </div>
       </div>

          <div className="flex gap-4 pt-4">
            <button className="btn btn-sm btn-primary" onClick={() => setShowDetails(!showDetails)}>
              {showDetails ? "Hide" : "Show"} Market Trading Info
            </button>
            <button className="btn btn-sm btn-primary" onClick={() => setShowPrices(!showPrices)}>
              {showPrices ? "Hide" : "Show"} Prices
            </button>
          </div>

          {isLoading && (showDetails || showPrices) && (
            <div className="flex justify-center items-center pt-4">
              <span className="loading loading-spinner loading-md"></span>
            </div>
          )}
          {details && (
            <>
              {showDetails && <MarketExtraDetails market={market} details={details} />}
              {showPrices && <MarketPrices market={market} details={details} isVisible={showPrices} />}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

type MarketListProps = {
  markets: MarketInfo[];
};

export const MarketList = ({ markets }: MarketListProps) => {
  if (markets.length === 0) {
    return (
      <div className="flex flex-wrap justify-center py-40">
        <p className="font-mono text-2xl text-accent">-- NO MARKETS DETECTED --</p>
      </div>
    );
  }

  return (
    <div className="w-full flex flex-col gap-4 font-mono">
      {markets.map(market => (
        <MarketItem key={market.market} market={market} />
      ))}
    </div>
  );
};


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
 *  Formats the shares balances of a market
 *  @param sharesArray array of shares balances
 */
const formatSharesBalances = (sharesArray: readonly bigint[] | undefined): string => {
  if (!sharesArray) return "N/A";
  
  // Skip the first element and convert the rest to numbers
  const balances = Array.from(sharesArray.slice(1)).map(fromInt128toNumber);
    
  return balances.join(", ");
};

/**
 *  Type guard to check if the market info is valid
 *  @param market market info
 */
const isValidMarketInfo = (
  market: MarketInfo,
  details?: MarketDetails,
): details is MarketDetails => {
  return Boolean(details?.marketInfo && details?.token && details?.tokenSymbol);
};

/**
 *  Formats a market value using a formatter function as a parameter
 *  @param value value to be formatted
 *  @param formatter formatter function
 */
const formatMarketValue = (value: bigint | undefined, formatter: (val: bigint) => string | number = String): string => {
  return value !== undefined ? formatter(value).toString() : "N/A";
};

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