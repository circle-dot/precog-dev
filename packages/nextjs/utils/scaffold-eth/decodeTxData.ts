import {TransactionWithFunction} from "./block";
import {GenericContractsDeclaration} from "./contract";
import {Abi, AbiFunction, decodeFunctionData, getAbiItem} from "viem";
import contractData from "~~/contracts/deployedContracts";
import scaffoldConfig from "~~/scaffold.config";

type ContractsInterfaces = Record<string, Abi>;
type TransactionType = TransactionWithFunction | null;

const targetNetworkId = scaffoldConfig.targetNetworks[0].id;
const deployedContracts = contractData as GenericContractsDeclaration | null;
const chainMetaData = deployedContracts?.[targetNetworkId];
const interfaces = chainMetaData
    ? Object.entries(chainMetaData).reduce((finalInterfacesObj, [contractName, contract]) => {
        finalInterfacesObj[contractName] = contract.abi;
        return finalInterfacesObj;
    }, {} as ContractsInterfaces)
    : {};

export const decodeTransactionData = (tx: TransactionWithFunction) => {
    // Check special conditions to skip parsing
    if (tx.input.length < 10 || tx.input.startsWith("0x60e06040")) {
        console.log(`Parsed Skipped tx: ${tx.hash}`);
        return tx;
    }

    // Only for debug
    // console.log('Interfaces:', interfaces);

    let foundError = null;
    for (const [, contractAbi] of Object.entries(interfaces)) {
        try {
            const {functionName, args} = decodeFunctionData({
                abi: contractAbi,
                data: tx.input,
            });
            tx.functionName = functionName;
            tx.functionArgs = args as any[];
            tx.functionArgNames = getAbiItem<AbiFunction[], string>({
                abi: contractAbi as AbiFunction[],
                name: functionName,
            })?.inputs?.map((input: any) => input.name);
            tx.functionArgTypes = getAbiItem<AbiFunction[], string>({
                abi: contractAbi as AbiFunction[],
                name: functionName,
            })?.inputs.map((input: any) => input.type);
            // console.log(`Parsed tx: ${tx.hash} [${tx.functionName}] (OK)`);
            foundError = null;
            break;
        } catch (e) {
            foundError = e;
        }
    }

    // Show last parsing error (only if tx could not be parsed with any loaded ABI)
    if (foundError) {
        console.log(`Parsing tx: ${tx.hash}, failed: ${foundError}`);
    }

    return tx;
};

export const getFunctionDetails = (transaction: TransactionType) => {
    if (
        transaction &&
        transaction.functionName &&
        transaction.functionArgNames &&
        transaction.functionArgTypes &&
        transaction.functionArgs
    ) {
        const details = transaction.functionArgNames.map(
            (name, i) => `${transaction.functionArgTypes?.[i] || ""} ${name} = ${transaction.functionArgs?.[i] ?? ""}`,
        );
        return `${transaction.functionName}(${details.join(", ")})`;
    }
    return "";
};
