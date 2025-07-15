"use client";

import type { NextPage } from "next";
import { getLatestContracts } from "~~/utils/scaffold-eth/contractsData";
import { ContractName } from "~~/utils/scaffold-eth/contract";
import { ContractCard } from "~~/app/debug/_components/contract/ContractCard";
import React from "react";
import { usePrecogMarkets } from "~~/hooks/usePrecogMarketData";
import { MarketList } from "~~/components/MarketList";

const contractsData = getLatestContracts();
const contractNames = Object.keys(contractsData) as ContractName[];

const Home: NextPage = () => {
  const { data, isLoading, error } = usePrecogMarkets();

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
          <div className="text-center mb-3">
            <span className="block text-xl font-bold font-mono text-secondary">[ DEPLOYED CONTRACTS ]</span>
          </div>
          <div className="flex justify-center items-center gap-8 flex-col-reverse sm:flex-row-reverse">
            {contractNames.map(contractName => (
              <ContractCard key={contractName} contractName={contractName} />
            ))}
          </div>
        </div>
      </div>
    </>
  );
};

export default Home;
