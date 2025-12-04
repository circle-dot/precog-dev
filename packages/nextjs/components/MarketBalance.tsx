import {Address, erc20Abi, formatUnits} from "viem";
import {useScaffoldReadContract, useScaffoldContract} from "~~/hooks/scaffold-eth";
import {useReadContract} from "wagmi";
import React from "react";

type MarketBalanceProps = {
    id: number | bigint;
    outcomes: string[];
    address?: Address;
};

/**
 * Display Outcome shares balance of an address for the received market
 */
export const MarketBalance = ({address, id, outcomes}: MarketBalanceProps) => {
    const marketAddress = address;
    const marketId = id ? BigInt(id) : 0n;
    const {data: accountShares, isLoading: isLoading} = useScaffoldReadContract({
        contractName: "PrecogMasterV7", functionName: "marketAccountShares", args: [marketId, marketAddress]
    });

    // Get market contract ABI to call token()
    const {data: marketContract} = useScaffoldContract({contractName: "PrecogMarketV7"});
    const marketABI = marketContract ? marketContract.abi : [];

    // Get token address from market contract
    const {data: tokenAddress} = useReadContract({
        abi: marketABI,
        address: marketAddress,
        functionName: 'token',
        query: { enabled: !!marketAddress }
    });

    // Get token decimals from ERC20 token contract
    const {data: tokenDecimals} = useReadContract({
        abi: erc20Abi,
        address: tokenAddress as Address | undefined,
        functionName: 'decimals',
        query: { enabled: !!tokenAddress }
    });

    if (!marketAddress || isLoading || !accountShares) {
        return (
            <div className="animate-pulse flex space-x-4">
                <div className="flex items-center space-y-6">
                    <div className="h-2 w-12 bg-slate-300 rounded"></div>
                </div>
            </div>
        );
    }

    // Get and parse needed data
    // Use token decimals if available, otherwise default to 18
    const decimals = tokenDecimals ?? 18;
    const redeemedAmount = formatUnits(accountShares[4], decimals);
    const outcomeBalances = accountShares[5];
    // Only for debug
    // console.log("outcomes", outcomes);
    // console.log("outcomeBalances", outcomeBalances);

    // Build account share balances list
    const shares = []
    for (let i = 0; i < outcomes.length; i++) {
        const label = outcomes[i].toString();
        let balance = "0";
        try {
            // @ts-ignore
            balance = formatUnits(outcomeBalances[i + 1], decimals);
        } catch {
            console.log("> Error getting share balance: ", i, label);
        }
        // Check min balance value to show
        if (balance != "0") {
            shares.push({"label": label, "balance": balance});
        }
    }

    // Check if there is no balance to show
    if (shares.length == 0) {
        return (<span className="text-sm">Nothing yet</span>);
    }

    return (
        <>
            {shares.map((outcome, key) => (
                <div key={key} className="w-full flex items-center justify-center">
                    <span className="text-[0.9em]">{outcome.balance}</span>
                    <span className="text-[0.6em] font-bold ml-1">{outcome.label}</span>
                </div>
            ))}
            {redeemedAmount != '0' && (
                <div className="w-full flex items-center justify-center">
                    <span className="text-[0.6em] font-bold">REDEEMED</span>
                </div>
            )}
        </>
    );
};
