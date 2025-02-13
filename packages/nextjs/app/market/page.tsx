"use client";

import type {NextPage} from "next";
import {useState} from "react";
import {useSearchParams} from "next/navigation";
import {AddressInput} from "~~/components/scaffold-eth";
import {MarketGeneralInfo, MarketSharesInfo, MarketPrices} from "~~/app/market/_components";
import {MarketReportResult, MarketRedeemShares, MarketRedeemBatch} from "~~/app/market/_components";
import {MarketHolders} from "~~/app/market/_components/MarketHolders";
import {useAccount} from "wagmi";
import {useScaffoldReadContract} from "~~/hooks/scaffold-eth";

const ADMIN_ROLE = "0xa49807205ce4d355092ef5a8a18f56e8913cf4a201fbe287825b095693c21775";

const MarketDetails: NextPage = () => {
    const {address: connectedAddress} = useAccount();
    const defaultMarket = "0x8a82D617ad02016dB4E80b01Bb54C04b888aC004" as `0x${string}`;  // MarketV7 Id: 0
    const [marketAddress, setMarketAddress] = useState<`0x${string}`>(defaultMarket);
    const [isSelected, setIsSelected] = useState(false);

    const searchParams = useSearchParams();
    const selectedAddress = searchParams.get('address') as `0x${string}`;
    if (selectedAddress && !isSelected) {
        setMarketAddress(selectedAddress);
        setIsSelected(true);
        // Only for debug
        // console.log('Selected market:', selectedAddress)
    }

    const {data: isAdmin} = useScaffoldReadContract({
        contractName: "PrecogMasterV7", functionName: "hasRole", args: [ADMIN_ROLE, connectedAddress]
    });

    return (
        <>
            <div className="container mx-auto mb-10 min-w-[400px] overflow-auto">
                <div className="flex flex-col gap-1 p-4 mt-5 bg-base-100 rounded-2xl">
                    <div className="font-bold">Market:</div>
                    <AddressInput value={marketAddress} onChange={(value) => setMarketAddress(value as `0x${string}`)}/>
                </div>
                <div className="flex flex-col gap-1 p-4 mt-3 bg-base-100 rounded-2xl">
                    <div className="text-lg font-bold">Basic Info</div>
                    <MarketGeneralInfo address={marketAddress}/>

                    <div className="text-lg font-bold pt-5">Market Prices</div>
                    <MarketPrices address={marketAddress}/>
                </div>
                <div className="flex flex-col gap-1 p-4 mt-3 bg-base-100 rounded-2xl">
                    <div className="text-lg font-bold">Shares Info</div>
                    <MarketSharesInfo address={marketAddress}/>

                    { isAdmin && (
                        <>
                            <div className="text-lg font-bold pt-5">Shareholders</div>
                            <MarketHolders address={marketAddress}/>
                        </>
                    )}
                </div>
                {/*TODO Temporally disable market history due to request limits */}
                {/*<div className="flex flex-col gap-1 p-4 pb-8 mt-3 bg-base-100 rounded-2xl">*/}
                {/*    <div className="text-xl font-bold">Event history</div>*/}
                {/*    <MarketHistory address={marketAddress}/>*/}
                {/*</div>*/}
                <div className="flex flex-col gap-1 p-4 pb-8 mt-3 bg-base-100 rounded-2xl">
                    <div className="text-xl font-bold">Actions</div>

                    <MarketReportResult marketAddress={marketAddress} connectedAddress={connectedAddress}/>

                    <MarketRedeemBatch marketAddress={marketAddress} connectedAddress={connectedAddress}/>

                    <MarketRedeemShares marketAddress={marketAddress} connectedAddress={connectedAddress}/>
                </div>
            </div>
        </>
    );
};

export default MarketDetails;
