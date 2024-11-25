"use client";

import type {NextPage} from "next";
import {useState} from "react";
import {useSearchParams} from "next/navigation";
import {AddressInput} from "~~/components/scaffold-eth";
import {MarketGeneralInfo, MarketSharesInfo, MarketPrices, MarketHistory} from "~~/app/market/_components";
import {MarketReportResult, MarketRedeemShares, MarketRedeemBatch} from "~~/app/market/_components";
import {MarketHolders} from "~~/app/market/_components/MarketHolders";
import {useAccount} from "wagmi";

const MarketDetails: NextPage = () => {
    const {address: connectedAddress} = useAccount();
    const defaultMarket = "0xeAC0A79718b127733427bcAe73cdd0ABe2e7005a"  // MarketV7 Id: 0
    const [marketAddress, setMarketAddress] = useState(defaultMarket);
    const [isSelected, setIsSelected] = useState(false);

    const searchParams = useSearchParams();
    const selectedAddress = searchParams.get('address');
    if (selectedAddress && !isSelected) {
        setMarketAddress(selectedAddress);
        setIsSelected(true);
        console.log('Selected market:', selectedAddress)
    }

    return (
        <>
            <div className="container mx-auto mb-10 min-w-[400px] overflow-auto">
                <div className="flex flex-col gap-1 p-4 mt-5 bg-base-100 rounded-2xl">
                    <div className="font-bold">Market:</div>
                    <AddressInput value={marketAddress} onChange={setMarketAddress}/>
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

                    <div className="text-lg font-bold pt-5">Shareholders</div>
                    <MarketHolders address={marketAddress}/>
                </div>
                <div className="flex flex-col gap-1 p-4 pb-8 mt-3 bg-base-100 rounded-2xl">
                    <div className="text-xl font-bold">Event history</div>
                    <MarketHistory address={marketAddress}/>
                </div>
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
