import { useState } from "react";
import { formatEther } from "viem";
import { MarketInfo, usePrecogMarketPrices } from "~~/hooks/usePrecogMarketData";


const MarketExtraDetails = ({ market }: { market: MarketInfo }) => {
  if (!market.marketInfo || !market.token) {
    return (
      <div className="flex justify-center items-center pt-4 flex-col">
        <p className="text-error">--! ERROR: COULD NOT LOAD MARKET INFO !--</p>
      </div>
    );
  }

  return (
    <div className="mt-4 border-t border-base-content/20 pt-4 flex flex-col gap-4 text-xs">
      {market.marketInfo && (
        <div className="p-2 border border-dashed border-base-content/20 rounded-md flex flex-col gap-1">
          <p className="m-0">
            <span className="font-bold text-base-content/70">Collateral Token:</span> {market.token}
          </p>
          <p className="m-0">
            <span className="font-bold text-base-content/70">Total Shares:</span> {market.marketInfo[0]?.toString()}
          </p>
          <p className="m-0">
            <span className="font-bold text-base-content/70">Shares Balances:</span>{" "}
            {market.marketInfo[1]?.join(", ")}
          </p>
          <p className="m-0">
            <span className="font-bold text-base-content/70">Locked Collateral:</span>{" "}
            {market.marketInfo[2]?.toString()}
          </p>
          <p className="m-0">
            <span className="font-bold text-base-content/70">Total Buys:</span> {market.marketInfo[3]?.toString()}
          </p>
          <p className="m-0">
            <span className="font-bold text-base-content/70">Total Sells:</span> {market.marketInfo[4]?.toString()}
          </p>
        </div>
      )}
    </div>
  );
};

const MarketPrices = ({ market, isVisible }: { market: MarketInfo; isVisible: boolean }) => {
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

  return (
    <div className="mt-4 border-t border-base-content/20 pt-4 flex flex-col gap-4">
      <div className="overflow-x-auto p-2 border border-dashed border-base-content/20 rounded-md">
        <table className="table table-sm w-full">
          <thead>
            <tr>
              <th>Outcome</th>
              <th className="text-right">Buy Price</th>
              <th className="text-right">Sell Price</th>
              <th className="text-right">Total Shares</th>
            </tr>
          </thead>
          <tbody>
            {outcomeData.map((outcome, i) => (
              <tr key={i}>
                <td className="font-semibold">{outcome.name}</td>
                <td className="text-right font-mono">{outcome.buyPrice ? formatEther(outcome.buyPrice) : "N/A"}</td>
                <td className="text-right font-mono">{outcome.sellPrice ? formatEther(outcome.sellPrice) : "N/A"}</td>
                <td className="text-right font-mono">
                  {market.marketInfo ? formatEther(market.marketInfo[1][i + 1]) : "N/A"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const MarketItem = ({ market }: { market: MarketInfo }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [showPrices, setShowPrices] = useState(false);
  const { status, className } = getMarketStatus(market.startTimestamp, market.endTimestamp);

  const formatDate = (timestamp: bigint) => {
    return new Date(Number(timestamp) * 1000).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className="collapse collapse-arrow bg-base-100 border-2 border-dashed border-primary/20 hover:border-primary/60 transition-colors duration-300 rounded-lg shadow-lg shadow-primary/10">
      <input type="checkbox" className="peer" checked={isOpen} onChange={e => setIsOpen(e.target.checked)} />
      <div className="collapse-title peer-checked:bg-base-200/10 text-xs">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-4">
            <h3 className="text-lg font-bold text-base-content/70 truncate" title={market.name}>
              <span className="text-base-content/70 mr-2">[{market.marketId}]</span>
              {market.name}
            </h3>
            <div className="flex gap-2 text-sm">
              <span>
                <span className="text-success">{formatDate(market.startTimestamp)}</span> → <span className="text-error">{formatDate(market.endTimestamp)}</span>
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
              {market.creator}
            </div>
            <div>
              <span className="font-bold text-base-content/70">[MARKET_CONTRACT]: </span>
              {market.market}
            </div>
          </div>

          <div className="flex gap-4 pt-4">
            <button className="btn btn-sm btn-primary" onClick={() => setShowDetails(!showDetails)}>
              {showDetails ? "Hide" : "Show"} Market Info
            </button>
            <button className="btn btn-sm btn-primary" onClick={() => setShowPrices(!showPrices)}>
              {showPrices ? "Hide" : "Show"} Prices
            </button>
          </div>

          {showDetails && <MarketExtraDetails market={market} />}
          {showPrices && <MarketPrices market={market} isVisible={showPrices} />}
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
    return { status: "CREATED", className: "text-info" };
  } else if (now >= startTimestamp && now < endTimestamp) {
    return { status: "OPEN", className: "text-success animate-pulse" };
  } else {
    return { status: "CLOSED", className: "text-error" };
  }
};

/**
 *  Converts an int128 (signed 64.64 bit fixed point number) to a number
 *  @param value number to be converted (usually from PrecogMarket or PrecogMaster contracts)
 */
export const fromInt128toNumber = (value: bigint): number => {
  return Number(BigInt(value)) / Number((BigInt(2) ** BigInt(64)));
}

/**
 *  Converts a number to int128 (signed 64.64 bit fixed point number)
 *  @param value number to be converted (usually to use at PrecogMarket or PrecogMaster contracts)
 */
export const fromNumberToInt128 = (value: number): bigint => {
  return BigInt(value) * (BigInt(2) ** BigInt(64));
}