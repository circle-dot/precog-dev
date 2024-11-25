"use client";

// @refresh reset
import {useDeployedContractInfo, useNetworkColor} from "~~/hooks/scaffold-eth";
import {useTargetNetwork} from "~~/hooks/scaffold-eth/useTargetNetwork";
import {ContractName} from "~~/utils/scaffold-eth/contract";
import {Address} from "~~/components/scaffold-eth";
import {PrecogBalance} from "~~/components/PrecogBalance";

type ContractCardProps = {
    contractName: ContractName;
};

/**
 * UI component to show deployed contracts.
 **/
export const ContractCard = ({contractName}: ContractCardProps) => {
    const {targetNetwork} = useTargetNetwork();
    const {data: deployedContractData, isLoading: deployedContractLoading} = useDeployedContractInfo(contractName);
    const networkColor = useNetworkColor();

    if (deployedContractLoading) {
        return (
            <div className="mt-14">
                <span className="loading loading-spinner loading-lg"></span>
            </div>
        );
    }

    if (!deployedContractData) {
        return (
            <p className="text-2xl mt-14">
                {`No contract found by the name of "${contractName}" on chain "${targetNetwork.name}"!`}
            </p>
        );
    }

    return (
        <div className="flex flex-col bg-base-100 px-5 py-5 text-center items-center max-w-xs rounded-2xl">
            <div className="col-span-2 flex flex-col items-start">
                <div className="flex">
                    <div className="flex flex-col gap-1 items-start">
                        <span className="font-bold">{contractName}</span>
                        <Address address={deployedContractData.address}/>
                        <div className="flex gap-1 items-center">
                            <span className="font-bold text-sm">Token:</span>
                            <PrecogBalance address={deployedContractData.address}/>
                        </div>
                        {targetNetwork && (
                            <div className="flex gap-1 items-center">
                                <span className="font-bold text-sm">Network</span>:{" "}
                                <span className="text-sm" style={{color: networkColor}}>{targetNetwork.name}</span>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
