import { MarketInfo } from "~~/hooks/usePrecogMarketData";
import { Address } from "~~/components/scaffold-eth";

// A compact date formatter for the cypherpunk aesthetic
const formatTimestamp = (timestamp: bigint) => {
  const date = new Date(Number(timestamp) * 1000);
  const YYYY = date.getFullYear();
  const MM = String(date.getMonth() + 1).padStart(2, "0");
  const DD = String(date.getDate()).padStart(2, "0");
  const hh = String(date.getHours()).padStart(2, "0");
  const mm = String(date.getMinutes()).padStart(2, "0");
  return `${YYYY}-${MM}-${DD} ${hh}:${mm}`;
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
        <div
          key={market.market}
          className="collapse collapse-arrow bg-base-200 border-2 border-dashed border-primary/20 hover:border-primary/60 transition-colors duration-300 rounded-lg shadow-lg shadow-primary/10"
        >
          <input type="checkbox" className="peer" />
          <div className="collapse-title peer-checked:bg-primary/10 text-xs">
            <div className="flex justify-between items-center mb-2">
              <div className="flex-grow min-w-0">
                <h3 className="text-lg font-bold text-base-content/70 truncate" title={market.name}>
                  <span className="text-base-content/70 mr-2">[MKT_ID:{market.marketId}]</span>
                  {market.name}
                </h3>
                <p className="text-xs uppercase text-accent tracking-widest pl-2 m-0" title={market.category}>
                  &gt;&gt; {market.category}
                </p>
              </div>
              <div className="flex-shrink-0 ml-4 font-bold">
                {new Date() > new Date(Number(market.endTimestamp) * 1000) ? (
                  <span className="text-neutral-content/50">[CLOSED]</span>
                ) : (
                  <span className="text-success animate-pulse">[ACTIVE]</span>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-2">
              <div className="flex flex-col border border-base-content/20 p-2 rounded-md">
                <div
                  className="flex items-center gap-2"
                  title={`Start Date: ${new Date(Number(market.startTimestamp) * 1000).toUTCString()}`}
                >
                  <span className="text-base-content/70">STARTS:</span>
                  <span className="font-semibold text-success">{formatTimestamp(market.startTimestamp)}</span>
                </div>
                <div
                  className="flex items-center gap-2"
                  title={`End Date: ${new Date(Number(market.endTimestamp) * 1000).toUTCString()}`}
                >
                  <span className="text-base-content/70">ENDS:</span>
                  <span className="font-semibold text-error">{formatTimestamp(market.endTimestamp)}</span>
                </div>
              </div>

              <div className="border border-base-content/20 p-2 rounded-md">
                <p className="text-base-content/70 m-0">POSSIBLE_OUTCOMES [{market.outcomes.length}]:</p>
                <div
                  className="flex flex-wrap gap-x-4 gap-y-1 items-center font-semibold"
                  title={market.outcomes.join(", ")}
                >
                  {market.outcomes.slice(0, 3).map((outcome, i) => (
                    <span key={i} className="truncate text-info">
                      &gt; {outcome}
                    </span>
                  ))}
                  {market.outcomes.length > 3 && (
                    <span className="text-base-content/70 text-xs font-normal">
                      [+{market.outcomes.length - 3} MORE]
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
          <div className="collapse-content bg-base-300/20 text-sm">
            <div className="pt-4 flex flex-col gap-2">
              <div className="p-4 border border-dashed border-secondary/20 rounded-md">
                <p className="text-neutral-content">
                  <span className="font-bold text-secondary">[MARKET_DESCRIPTION]:</span> This is a placeholder for the market
                  description. It should provide details about the market's purpose, what is being predicted, and how
                  the outcome will be determined. Ensure clarity for all participants.
                </p>
              </div>
              <div className="flex justify-between items-center text-xs pt-2">
                <div className="flex items-center gap-2">
                  <span className="text-neutral-content/60">CREATOR:</span>
                  <Address address={market.creator} size="xs" />
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-neutral-content/60">CONTRACT:</span>
                  <Address address={market.market} size="xs" />
                </div>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};