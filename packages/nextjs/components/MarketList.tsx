import { useState } from "react";
import { formatEther } from "viem";
import { useAccount } from "wagmi";
import { Address } from "~~/components/scaffold-eth";
import { MarketInfo, usePrecogMarketDetails } from "~~/hooks/usePrecogMarketData";

const fromFixed64x64 = (value: bigint | undefined): string => {
  if (typeof value === "undefined" || value === null) return "N/A";
  const ONE = 1n << 64n;
  const integerPart = value / ONE;
  const fractionalPart = value % ONE;
  const fractionalString = ((fractionalPart * 10n ** 6n) / ONE).toString().padStart(6, "0");
  return `${integerPart}.${fractionalString}`;
};

const MarketDetails = ({ market, isVisible }: { market: MarketInfo; isVisible: boolean }) => {
  const { address: userAddress } = useAccount();
  const { collateralTokenAddress, outcomeData, isLoading, isError, errors } = usePrecogMarketDetails(
    market.market,
    market.outcomes,
    isVisible,
  );

  if (!isVisible) return null;

  if (isLoading) {
    return (
      <div className="flex justify-center items-center pt-4">
        <span className="loading loading-spinner loading-md"></span>
      </div>
    );
  }

  if (isError) {
    console.error("Error loading market details:", {
      marketAddress: market.market,
      userAddress,
      errors,
    });
    return (
      <div className="flex justify-center items-center pt-4 flex-col">
        <p className="text-error">--! ERROR: COULD NOT LOAD MARKET DETAILS !--</p>
        <p className="text-error text-xs font-mono">Check console for more details</p>
      </div>
    );
  }

  return (
    <div className="mt-4 border-t border-base-content/20 pt-4 flex flex-col gap-4">
      <div className="flex items-center gap-2 text-xs">
        <span className="font-bold text-base-content/70">COLLATERAL_TOKEN:</span>
        {collateralTokenAddress && <Address address={collateralTokenAddress} size="xs" />}
      </div>

      <div className="overflow-x-auto">
        <table className="table table-sm w-full">
          <thead>
            <tr>
              <th>Outcome</th>
              <th className="text-right">Buy Price</th>
              <th className="text-right">Sell Price</th>
              {userAddress && <th className="text-right">Your Balance</th>}
            </tr>
          </thead>
          <tbody>
            {outcomeData.slice(1).map((outcome, i) => (
              <tr key={i}>
                <td className="font-semibold">{outcome.name}</td>
                <td className="text-right font-mono">{fromFixed64x64(outcome.buyPrice)}</td>
                <td className="text-right font-mono">{fromFixed64x64(outcome.sellPrice)}</td>
                {userAddress && (
                  <td className="text-right font-mono">
                    {outcome.balance !== undefined ? formatEther(outcome.balance) : "N/A"}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

type MarketListProps = {
  markets: MarketInfo[];
};

export const MarketList = ({ markets }: MarketListProps) => {
  const [openMarketId, setOpenMarketId] = useState<number | null>(null);

  if (markets.length === 0) {
    return (
      <div className="flex flex-wrap justify-center py-40">
        <p className="font-mono text-2xl text-accent">-- NO MARKETS DETECTED --</p>
      </div>
    );
  }

  const formatTimestamp = (timestamp: bigint) => {
    const date = new Date(Number(timestamp) * 1000);
    const YYYY = date.getFullYear();
    const MM = String(date.getMonth() + 1).padStart(2, "0");
    const DD = String(date.getDate()).padStart(2, "0");
    const hh = String(date.getHours()).padStart(2, "0");
    const mm = String(date.getMinutes()).padStart(2, "0");
    return `${YYYY}-${MM}-${DD} ${hh}:${mm}`;
  };

  return (
    <div className="w-full flex flex-col gap-4 font-mono">
      {markets.map(market => (
        <div
          key={market.market}
          className="collapse collapse-arrow bg-base-100 border-2 border-dashed border-primary/20 hover:border-primary/60 transition-colors duration-300 rounded-lg shadow-lg shadow-primary/10"
        >
          <input
            type="checkbox"
            className="peer"
            checked={openMarketId === market.marketId}
            onChange={e => {
              setOpenMarketId(e.target.checked ? market.marketId : null);
            }}
          />
          <div className="collapse-title peer-checked:bg-base-200/10 text-xs">
            <div className="flex justify-between items-center mb-2">
              <div className="flex-grow min-w-0">
                <h3 className="text-lg font-bold text-base-content/70 truncate" title={market.name}>
                  <span className="text-base-content/70 mr-2">[MKT_ID:{market.marketId}]</span>
                  {market.name}
                </h3>
                <p className="text-xs uppercase text-base-content/70 tracking-widest pl-2 m-0" title={market.category}>
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
                    <span key={i} className="truncate text-base-content">
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
              <div className="p-4 border border-dashed border-base-content/20 rounded-md">
                <p className="text-base-content">
                  <span className="font-bold text-base-content/70">[MARKET_DESCRIPTION]:</span>
                  {market.description}
                </p>
              </div>
              <div className="flex justify-between items-center text-xs pt-2">
                <div className="flex items-center gap-2">
                  <span className="text-base-content/70">CREATOR:</span>
                  <Address address={market.creator} size="xs" />
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-base-content/70">CONTRACT:</span>
                  <Address address={market.market} size="xs" />
                </div>
              </div>
              <MarketDetails market={market} isVisible={openMarketId === market.marketId} />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};