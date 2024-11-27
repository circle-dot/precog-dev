import Link from "next/link";
import {ChartBarSquareIcon, InformationCircleIcon} from "@heroicons/react/24/outline";
import {Address} from "~~/components/scaffold-eth";
import {ContractName} from "~~/utils/scaffold-eth/contract";
import {PrecogBalance} from "~~/components/PrecogBalance";
import {MarketBuy} from "~~/components/MarketBuy";
import {MarketSell} from "~~/components/MarketSell";
import {useScaffoldReadContract} from "~~/hooks/scaffold-eth";
import {usePrecogMarketData} from "~~/hooks/usePrecogMarketData";
import scaffoldConfig from "~~/scaffold.config";
import {MarketBalance} from "~~/components/MarketBalance";
import React, {useState} from "react";
import { usePrivy,useWallets } from "@privy-io/react-auth";

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
    const { user } = usePrivy();
    const { wallets } = useWallets();
    
    // Get the correct wallet address
    const walletAddress = (user?.wallet?.address || wallets[0]?.address) as `0x${string}`;

    const {data: accountShares} = useScaffoldReadContract({
        contractName: contractName, functionName: "marketAccountShares", args: [BigInt(id), walletAddress]
    });

    const [showExtraInfo, setShowExtraInfo] = useState<boolean>(false);
    const toggleExtraInfo = () => {
        setShowExtraInfo(!showExtraInfo)
    };

    const tradeOptions = [1, 5, 10, 100];
    const [sharesToTrade, setSharesToTrade] = useState<number>(scaffoldConfig.marketSharesToTrade || 1);
    const updateSharesToTrade = () => {
        const newIndex = tradeOptions.indexOf(sharesToTrade) + 1;
        if (newIndex == tradeOptions.length) {
            setSharesToTrade(tradeOptions[0]);
        } else {
            setSharesToTrade(tradeOptions[newIndex]);
        }
    };

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
    const outcomeBalances = typeof accountShares[5] === "bigint" ? [] : accountShares[5];
    const sharesToTradeText = sharesToTrade == 1 ? `${sharesToTrade} share` : `${sharesToTrade} shares`;

    // @ts-ignore
    return (
        <div className="flex flex-col bg-base-100 px-3 py-5 text-center min-w-96 w-[420px] rounded-xl">
            <div className="flex flex-col gap-2">
                <div className="flex flex-row gap-1 p-1 min-h-24 justify-center items-center">
                    <span className="font-bold text-[1.6em]">{market.name}</span>
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
                <div className="flex flex-row gap-2 pb-2 justify-center">
                    <Link href={"/market?address=" + market.address}>
                        <button className="btn btn-secondary btn-sm rounded-md">
                            <ChartBarSquareIcon className="h-4 w-4"/>
                            Market Details
                        </button>
                    </Link>
                </div>
                <div className="flex flex-col w-full items-center bg-base-300 py-1 rounded-md  overflow-auto">
                    <div className="flex flex-row gap-2 items-center">
                        <span className="text-sm">Prediction:</span>
                        <span className="font-bold text-sm">{marketPrediction}</span>
                    </div>
                </div>
                {!marketResult ?
                    <div
                        className="flex flex-col gap-1 w-full bg-base-300 py-2 rounded-md overflow-auto min-h-[170px]">
                        <div className="flex items-start px-2">
                            <button className="btn btn-xs" onClick={updateSharesToTrade}>{sharesToTradeText}</button>
                        </div>
                        <div className="flex m-auto gap-1 px-2">
                            {marketOutcomes.map((label, index) => (
                                <MarketBuy key={index} marketId={id} marketOutcome={index + 1}
                                           outcomeLabel={label} sharesToTrade={sharesToTrade}/>
                            ))}
                        </div>
                        <div className="flex m-auto gap-2 px-2">
                            {marketOutcomes.map((label, index) => (
                                <MarketSell key={index} marketId={id} marketOutcome={index + 1} outcomeLabel={label}
                                            outcomeBalance={outcomeBalances[index + 1]}
                                            sharesToTrade={sharesToTrade}/>
                            ))}
                        </div>
                    </div>
                    :
                    <div className="flex flex-col w-full bg-base-300 px-1 py-2 rounded-md min-h-[170px]">
                        <div className="flex flex-col m-auto gap-1 pt-2 pb-3 items-center">
                            <span>Result:</span>
                            <span className="font-bold text-4xl">{marketResult}</span>
                            <span className="text-sm">Reported: {marketClosedDate}</span>
                        </div>
                    </div>
                }
                <div className="flex flex-col w-full items-center bg-base-300 py-1 rounded-md  overflow-auto">
                    <div className="flex flex-row gap-2 items-center">
                        <span className="font-bold text-sm">You:</span>
                        <PrecogBalance address={walletAddress as `0x${string}`}/>
                        <span className="text-sm">|</span>
                        <span className="font-bold text-sm">Shares:</span>
                        <MarketBalance id={id} address={walletAddress as `0x${string}`} outcomes={marketOutcomes}/>
                    </div>
                </div>
            </div>
        </div>
    );
};
