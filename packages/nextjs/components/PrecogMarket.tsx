import Link from "next/link";
import {ChartBarSquareIcon, InformationCircleIcon, LinkIcon} from "@heroicons/react/24/outline";
import {Address} from "~~/components/scaffold-eth";
import {ContractName} from "~~/utils/scaffold-eth/contract";
import {PrecogBalance} from "~~/components/PrecogBalance";
// import scaffoldConfig from "~~/scaffold.config";  // Deprecated (due to performance issues)
// import {MarketBuy} from "~~/components/MarketBuy";  // Deprecated (due to performance issues)
// import {MarketSell} from "~~/components/MarketSell";  // Deprecated (due to performance issues)
import {useScaffoldReadContract} from "~~/hooks/scaffold-eth";
import {usePrecogMarketData} from "~~/hooks/usePrecogMarketData";
import {MarketBalance} from "~~/components/MarketBalance";
import {useAccount} from "wagmi";
import React, {useState} from "react";

type MarketProps = {
    contractName: ContractName;
    id: number;
};

/**
 * Display PrecogMarket.
 */
export const PrecogMarket = ({contractName, id}: MarketProps) => {
    const {data: marketData, isLoading: isLoading} = useScaffoldReadContract({
        contractName: contractName, functionName: "markets", args: [BigInt(id)]
    });
    const marketStateData = usePrecogMarketData(marketData?.[7]);
    // @ts-ignore
    const marketResult = marketStateData?.result;
    // @ts-ignore
    const marketPrediction = marketStateData?.prediction;
    // @ts-ignore
    const marketClosedDate = marketStateData?.closedDate
    const {address: connectedAddress} = useAccount();

    const {data: accountShares} = useScaffoldReadContract({
        contractName: contractName, functionName: "marketAccountShares", args: [BigInt(id), connectedAddress]
    });

    const [showExtraInfo, setShowExtraInfo] = useState<boolean>(false);
    const toggleExtraInfo = () => {
        setShowExtraInfo(!showExtraInfo)
    };

    // Deprecated (due to performance issues)
    // const tradeOptions = [1, 10, 100];
    // const [sharesToTrade, setSharesToTrade] = useState<number>(scaffoldConfig.marketSharesToTrade || 1);
    // const updateSharesToTrade = () => {
    //     const newIndex = tradeOptions.indexOf(sharesToTrade) + 1;
    //     if (newIndex == tradeOptions.length) {
    //         setSharesToTrade(tradeOptions[0]);
    //     } else {
    //         setSharesToTrade(tradeOptions[newIndex]);
    //     }
    // };

    if (!marketData || !accountShares || isLoading) {
        return (
            <div className="animate-pulse flex space-x-4">
                <div className="flex items-center space-y-6">
                    <div className="h-2 w-12 bg-slate-300 rounded"></div>
                </div>
            </div>
        );
    }

    const market = {
        name: marketData[0],
        description: marketData[1],
        category: marketData[2],
        outcomes: marketData[3],
        startDate: new Date(Number(marketData[4]) * 1000).toUTCString(),
        endDate: new Date(Number(marketData[5]) * 1000).toUTCString(),
        creator: marketData[6],
        address: marketData[7],
    };

    // const marketOutcomes = ["50+ Cut", "25 Cut", "Other"]; // Code just for testing
    const marketOutcomes = marketData[3].toString().split(",");

    // Deprecated (due to performance issues)
    // const outcomeBalances = typeof accountShares[5] === "bigint" ? [] : accountShares[5];
    // const sharesToTradeText = sharesToTrade == 1 ? `${sharesToTrade} share` : `${sharesToTrade} shares`;

    // @ts-ignore
    return (
        <div className="flex flex-col bg-base-100 px-3 py-5 text-center min-w-96 w-[420px] rounded-xl">
            <div className="flex flex-col gap-2">
                <div className="flex flex-row gap-1 p-1 min-h-[115px] justify-center items-center">
                    <span className="font-bold text-[1.5em]">{market.name}</span>
                    <span className="cursor-pointer" title="Show market metadata">
                        <InformationCircleIcon onClick={toggleExtraInfo} className="h-6 w-6"/>
                    </span>
                </div>
                {showExtraInfo && (
                    <div className="flex flex-col gap-1">
                        <div className="flex gap-1 items-start min-h-16 max-h-16 overflow-auto">
                            <span className="font-bold text-sm">Description:</span>
                            <span className="text-left text-sm">{market.description}</span>
                        </div>
                        <div className="flex gap-1 items-center">
                            <span className="font-bold text-sm">Category:</span>
                            <span className="text-sm">{market.category}</span>
                        </div>
                        <div className="flex gap-1 items-start">
                            <span className="font-bold text-sm">Outcomes:</span>
                            <span className="text-sm">{market.outcomes}</span>
                        </div>
                        <div className="flex gap-1 items-center">
                            <span className="font-bold text-sm">Starts:</span>
                            <span className="text-sm">{market.startDate}</span>
                        </div>
                        <div className="flex gap-1 items-center">
                            <span className="font-bold text-sm">Ends:</span>
                            <span className="text-sm">{market.endDate}</span>
                        </div>
                        <div className="flex gap-1 items-center">
                            <span className="font-bold text-sm">Creator:</span>
                            <Address address={market.creator}/>
                        </div>
                        <div className="flex gap-1 items-center">
                            <span className="font-bold text-sm">Address:</span>
                            <Address address={market.address}/>
                        </div>
                        <div className="flex gap-1 items-center">
                            <span className="font-bold text-sm">Balance:</span>
                            <PrecogBalance address={market.address}/>
                        </div>
                        <div className="flex gap-1 items-center">
                            <span className="font-bold text-sm">Market Id:</span>
                            <span className="text-sm">{id}</span>
                        </div>
                    </div>
                )}
                <div className="flex flex-col w-full items-center bg-base-300 py-2 rounded-md  overflow-auto">
                    <div className="flex flex-row gap-2 items-center">
                        <span className="text-sm">Prediction:</span>
                        <span className="font-bold text-base">{marketPrediction}</span>
                    </div>
                </div>
                {!marketResult ?
                    <div
                        className="flex flex-col gap-1 w-full bg-base-300 py-2 rounded-md overflow-auto min-h-[140px]">
                        <p>Buys & Sells enabled!</p>
                        <Link target="_blank" href="https://core.precog.market/" className="cursor-pointer">
                            <button className="btn btn-sm font-normal gap-1 w-60 mx-auto">
                                <LinkIcon className="h-4 w-4"/>
                                Trade on Precog Core
                            </button>
                        </Link>
                    </div>
                    :
                    <div className="flex flex-col w-full bg-base-300 px-1 py-2 rounded-md min-h-[140px]">
                        <div className="flex flex-col gap-1 pt-2 pb-3 items-center">
                            <span>Result:</span>
                            <span className="font-bold text-4xl">{marketResult}</span>
                            <span className="text-sm">Reported: {marketClosedDate}</span>
                        </div>
                    </div>
                }
                <div className="flex flex-col w-full items-center bg-base-300 py-1 rounded-md  overflow-auto">
                    <div className="flex flex-row gap-2 items-center min-h-[30px]">
                        <span className="font-bold text-sm min-w-[90px]">Your Shares:</span>
                        <MarketBalance id={id} address={connectedAddress} outcomes={marketOutcomes}/>
                    </div>
                </div>
                <div className="flex flex-row gap-2 w-full">
                    <Link href={"/market?address=" + market.address} className="w-full">
                        <button className="btn btn-accent btn-sm rounded-md py-1 w-full">
                            <ChartBarSquareIcon className="h-4 w-4"/>
                            Market Details
                        </button>
                    </Link>
                </div>
            </div>
        </div>
    );
};
