"use client";

import React from "react";
import type { NextPage } from "next";
import { ArrowTopRightOnSquareIcon } from "@heroicons/react/24/outline";
import { MarketList } from "~~/components/MarketList";
import { usePrecogMarkets } from "~~/hooks/usePrecogMarketData";
import { useTargetNetwork } from "~~/hooks/scaffold-eth/useTargetNetwork";
import { getLatestContracts } from "~~/utils/scaffold-eth/contractsData";
import { getBlockExplorerAddressLink } from "~~/utils/scaffold-eth";

const contractsData = getLatestContracts();

const Home: NextPage = () => {
  const { data, isLoading, error } = usePrecogMarkets();
  const { targetNetwork } = useTargetNetwork();

  const precogMasterAddress = contractsData.PrecogMasterV7.address;
  const explorerLink = getBlockExplorerAddressLink(targetNetwork, precogMasterAddress);

  return (
    <>
      <div className="flex items-center flex-col flex-grow pt-2">
        <div className="w-full px-4 md:px-12 pt-5">
          {isLoading && (
            <div className="flex flex-wrap justify-center py-40">
              <p className="font-mono text-2xl text-accent animate-pulse">-- LOADING MARKETS --</p>
            </div>
          )}
          {error && (
            <div className="flex flex-wrap justify-center py-40">
              <p className="font-mono text-2xl text-error">--! ERROR: COULD NOT LOAD MARKETS !--</p>
            </div>
          )}
          {data && <MarketList markets={data.markets} />}
        </div>
        <div className="flex-grow bg-base-300 w-full mt-16 px-6 pt-3 pb-6 border-t-2 border-primary/20">
          <div className="flex justify-center items-center">
            <div className="font-mono text-center text-base">
              <span className="text-base-content/70 mr-2">Results fetched from</span>
              <span className="font-bold text-base-content/70 mr-2">:: PrecogMasterV7 ::</span>
              <a
                href={explorerLink}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 hover:underline text-accent"
              >
              [{precogMasterAddress}]
                <ArrowTopRightOnSquareIcon className="w-3 h-3" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Home;
