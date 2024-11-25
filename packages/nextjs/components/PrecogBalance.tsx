import {Address, formatEther} from "viem";
import {useScaffoldReadContract} from "~~/hooks/scaffold-eth";

type BalanceProps = {
    address?: Address;
};

/**
 * Display (PRE) balance of an ETH address.
 */
export const PrecogBalance = ({address}: BalanceProps) => {
    const {data: balance, isLoading: isLoading} = useScaffoldReadContract({
        contractName: "PrecogToken", functionName: "balanceOf", args: [address]
    });

    if (!address || isLoading || balance === null) {
        return (
            <div className="animate-pulse flex space-x-4">
                <div className="flex items-center space-y-6">
                    <div className="h-2 w-12 bg-slate-300 rounded"></div>
                </div>
            </div>
        );
    }

    const formattedBalance = balance ? Number(formatEther(balance)) : 0;
    return (
        <div className="w-full flex items-center">
            <span className="text-[0.9em]">{formattedBalance.toFixed(1)}</span>
            <span className="text-[0.6em] font-bold ml-1">PRE</span>
        </div>
    );
};
