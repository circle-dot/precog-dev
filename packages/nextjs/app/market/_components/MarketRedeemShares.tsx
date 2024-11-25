import {Address as AddressType} from "viem";
import {useReadContract, useWriteContract} from "wagmi";
import {useScaffoldContract, useTransactor} from "~~/hooks/scaffold-eth";
import {Address} from "~~/components/scaffold-eth";

export const MarketRedeemShares = ({marketAddress, connectedAddress}: {
    marketAddress: AddressType,
    connectedAddress?: AddressType
}) => {
    const {data: marketContract} = useScaffoldContract({contractName: "PrecogMarketV7"});
    const ABI = marketContract ? marketContract.abi : [];
    const {data: marketId} = useReadContract({abi: ABI, address: marketAddress, functionName: 'id'});

    const {writeContractAsync, isPending} = useWriteContract();
    const writeTx = useTransactor();

    if (marketId == undefined || connectedAddress == undefined) {
        return (
            <span>Fetching data...</span>
        )
    }

    const writeContractAsyncWithParams = () =>
        writeContractAsync({
            address: marketAddress,
            abi: ABI,
            functionName: "redeemShares",
            args: [],
        });

    const handleWriteAction = async () => {
        try {
            await writeTx(writeContractAsyncWithParams, {blockConfirmations: 1});
        } catch (e) {
            console.log("Unexpected error in writeTx", e);
        }
    };

    return (
        <>
            <div className="flex flex-col items-start gap-0.5 py-2 w-1/3 min-w-[380px]">
                <span className="text-sm">Redeem my winning shares</span>
                <div className="flex flex-row gap-2 w-full">
                    <div className="input border border-primary rounded-xl w-full p-3 items-center">
                        <Address address={connectedAddress} disableAddressLink={true}/>
                    </div>
                    <button className="btn btn-primary rounded-xl" onClick={handleWriteAction} disabled={isPending}>
                        {isPending ? <span className="loading loading-spinner loading-sm"></span> : "Redeem Shares"}
                    </button>
                </div>
            </div>
        </>
    );
};

