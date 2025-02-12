import {useState} from "react";
import {Address} from "viem";
import {useReadContract, useWriteContract} from "wagmi";
import {useScaffoldContract, useTransactor} from "~~/hooks/scaffold-eth";

export const MarketRedeemBatch = ({marketAddress, connectedAddress}: {
    marketAddress: Address,
    connectedAddress?: Address
}) => {
    const {data: marketContract} = useScaffoldContract({contractName: "PrecogMarketV7"});
    const ABI = marketContract ? marketContract.abi : [];
    const {data: oracle} = useReadContract({abi: ABI, address: marketAddress, functionName: 'oracle'});

    const [accounts, setAccounts] = useState<string>("");
    const {writeContractAsync, isPending} = useWriteContract();
    const writeTx = useTransactor();

    if (connectedAddress == undefined || oracle == undefined) {
        return (
            <span>Fetching data...</span>
        )
    }

    // Front end validation to only show component to market oracle (is also validated in the contract)
    if (connectedAddress != oracle) {
        return;
    }

    const writeContractAsyncWithParams = () => {
        const accountBatch = accounts.trim().replace(/\s+/g, "").split(",")
        return writeContractAsync({
            address: marketAddress,
            abi: ABI,
            functionName: "redeemBatch",
            args: [accountBatch as `0x${string}`[]],
        });
    }

    const handleSetGreeting = async () => {
        try {
            await writeTx(writeContractAsyncWithParams, {blockConfirmations: 1});
        } catch (e) {
            console.log("Unexpected error in writeTx", e);
        }
    };

    return (
        <>
            <div className="flex flex-col items-start gap-0.5 py-2 w-1/3 min-w-[380px]">
                <span className="text-sm">Redeem batch</span>
                <div className="flex flex-row gap-2 w-full">
                    <input id="batchAccounts" type="text" placeholder="Comma separated addresses"
                           className="input border border-primary rounded-xl w-full"
                           onChange={e => setAccounts(e.target.value)}
                    />
                    <button className="btn btn-primary rounded-xl" onClick={handleSetGreeting} disabled={isPending}>
                        {isPending ? <span className="loading loading-spinner loading-sm"></span> : "Redeem All"}
                    </button>
                </div>
            </div>
        </>
    );
};

