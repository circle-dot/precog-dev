import {useEffect, useState} from "react";
import {Address, Log} from "viem";
import {usePublicClient} from "wagmi";
import {useTargetNetwork} from "./scaffold-eth/useTargetNetwork";
import {decodeTransactionData, TransactionWithFunction} from "~~/utils/scaffold-eth";

type PrecogLog = Log & {
    blockTimestamp: bigint;
    transaction: TransactionWithFunction;
}

export const usePrecogLogs = (address: Address) => {
    const [logs, setLogs] = useState<PrecogLog[]>([]);
    const {targetNetwork} = useTargetNetwork();
    const client = usePublicClient({chainId: targetNetwork.id});

    useEffect(() => {
        const fetchLogs = async () => {
            if (!client) return console.error("Client not found");
            try {
                const existingLogs = await client.getLogs({
                    address: address,
                    fromBlock: 0n,
                    toBlock: "latest",
                });

                const blockPromises  = existingLogs.map(async (log) => {
                    return await client.getBlock({blockNumber: BigInt(log.blockNumber)});
                });
                const blocks = await Promise.all(blockPromises);
                const transactionPromises  = existingLogs.map(async (log) => {
                    return await client.getTransaction({hash: log.transactionHash});
                });
                const transactions = await Promise.all(transactionPromises);

                const precogLogs = existingLogs as PrecogLog[];
                precogLogs.map((log, index) => {
                    log.blockTimestamp = blocks[index].timestamp;
                    log.transaction = decodeTransactionData(transactions[index]);
                });

                setLogs(precogLogs);
            } catch (error) {
                console.error("Failed to fetch logs:", error);
            }
        };
        fetchLogs();

        return client?.watchBlockNumber({
            onBlockNumber: async (_blockNumber, prevBlockNumber) => {
                const newLogs = await client.getLogs({
                    address: address,
                    fromBlock: prevBlockNumber,
                    toBlock: "latest",
                });

                const blockPromises  = newLogs.map(async (log) => {
                    return await client.getBlock({blockNumber: BigInt(log.blockNumber)});
                });
                const blocks = await Promise.all(blockPromises);
                const transactionPromises  = newLogs.map(async (log) => {
                    return await client.getTransaction({hash: log.transactionHash});
                });
                const transactions = await Promise.all(transactionPromises);

                const newPrecogLogs = newLogs as PrecogLog[];
                newPrecogLogs.map((log, index) => {
                    log.blockTimestamp = blocks[index].timestamp;
                    log.transaction = transactions[index];
                });

                setLogs(prevLogs => [...prevLogs, ...newPrecogLogs]);
            },
        });
    }, [address, client]);

    return logs;
};
