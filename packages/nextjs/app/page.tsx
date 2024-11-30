"use client";

import type {NextPage} from "next";
import {useScaffoldReadContract} from "~~/hooks/scaffold-eth";
import {getLatestContracts} from "~~/utils/scaffold-eth/contractsData";
import {ContractName} from "~~/utils/scaffold-eth/contract";
import {ContractCard} from "~~/app/debug/_components/contract/ContractCard";
import {PrecogMarket} from "~~/components/PrecogMarket";
import React from "react";
import {Header} from "~~/components/Header";
import {Footer} from "~~/components/Footer";

const contractsData = getLatestContracts();
const contractNames = Object.keys(contractsData) as ContractName[];

const Home: NextPage = () => {
    const contractTargetName = "PrecogMasterV7";

    const {data: createdMarkets} = useScaffoldReadContract({
        contractName: contractTargetName, functionName: "createdMarkets"
    });
    const totalMarkets = createdMarkets ? Number(createdMarkets) : 0;
    const marketIds = Array.from({length: totalMarkets}, (_, i) => i).reverse();

    return (
        <>
            <Header />
            <div className="flex items-center flex-col flex-grow pt-2">
                <div className="w-full px-12">
                    <h1 className="text-center mb-3">
                        <span className="block text-2xl font-bold">Prediction Markets</span>
                    </h1>
                    {!totalMarkets &&
                        <div className="flex flex-wrap justify-center py-40">No created markets yet!</div>
                    }
                    <div className="flex flex-wrap justify-center items-start gap-8">
                        {marketIds.map((marketId, index) => (
                            <PrecogMarket key={index} contractName={contractTargetName} id={marketId}/>
                        ))}
                    </div>

                </div>
                <div className="flex-grow bg-base-300 w-full mt-6 px-6 pt-3 pb-6">
                    <div className="text-center mb-3">
                        <span className="block text-xl font-bold">Deployed Contracts</span>
                    </div>
                    <div className="flex justify-center items-center gap-8 flex-col-reverse sm:flex-row-reverse">
                        {contractNames.map((contractName, index) => (
                            <ContractCard key={index} contractName={contractName}/>
                        ))}
                    </div>
                </div>
            </div>
            <Footer />
        </>
    );
};

export default Home;
