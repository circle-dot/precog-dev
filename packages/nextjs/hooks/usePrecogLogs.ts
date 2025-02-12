import {useEffect, useState} from "react";
import {Address, Log} from "viem";
import {usePublicClient} from "wagmi";
import {useTargetNetwork} from "./scaffold-eth/useTargetNetwork";
import {decodeTransactionData, TransactionWithFunction} from "~~/utils/scaffold-eth";

type PrecogLog = Log & {
    blockTimestamp: bigint;
    transaction: TransactionWithFunction;
}

const txCache = new Map();
const blockCache = new Map();

// function sleep(ms: number) {
//     return new Promise((resolve) => setTimeout(resolve, ms));
// }

async function fetchTransaction(client: any, hash: string): Promise<any> {
    if (txCache.has(hash)) {
        console.log(`Tx found on cache (${hash})`);
        return txCache.get(hash);
    }

    // await sleep(100); // Add delay before fetching
    console.log(`Fetching tx on chain (${hash})`);
    const tx = await client.getTransaction({hash});
    const decodedTx = decodeTransactionData(tx);
    txCache.set(hash, decodedTx); // Cache the result
    return decodedTx;
}

async function fetchBlock(client: any, blockNumber: number): Promise<any> {
    if (blockCache.has(blockNumber)) {
        console.log(`Block found on cache (${blockNumber})`);
        return blockCache.get(blockNumber);
    }

    // await sleep(100); // Add delay before fetching
    console.log(`Fetching block on chain (${blockNumber})`);
    const block = await client.getBlock({blockNumber: BigInt(blockNumber)});
    blockCache.set(blockNumber, block);
    return block;
}

let alreadyCalled = false;
export const usePrecogLogs = (address: Address) => {
    const [logs, setLogs] = useState<PrecogLog[] | undefined>(undefined);
    const {targetNetwork} = useTargetNetwork();
    const client = usePublicClient({chainId: targetNetwork.id});

    useEffect(() => {
        if (!client) return console.error("Client not found");
        if (!address) return console.error("Address not found");

        const fetchLogs = async () => {
            if (alreadyCalled) {
                console.log("Fetching logs skipped!");
                return;
            }
            alreadyCalled = true;
            console.log('Fetching logs...');

            // const startBlock = 13935354n;  // PrecogMaster deploy block (Base Sepolia)
            const startBlock = 25593661;  // PrecogMaster deploy block (Base Mainnet)
            const endBlock = Number(await client.getBlockNumber());
            // const startBlock = 25803661;  // Just for testing
            // const endBlock =   25903660;  // Just for testing
            const chunkSize = 10000;
            let allLogs: PrecogLog[] = [];

            try {
                for (let fromBlock = startBlock; fromBlock <= endBlock; fromBlock += chunkSize) {
                    const toBlock = Math.min(fromBlock + chunkSize - 1, endBlock);

                    console.log(`Fetching logs from block ${fromBlock} to ${toBlock}...`);
                    const chunkLogs = await client.getLogs({
                        address: address,
                        fromBlock: BigInt(fromBlock),
                        toBlock: BigInt(toBlock)
                    });
                    // Only for debug
                    // console.log(`Logs found in chunk: ${chunkLogs.length}`);
                    allLogs = allLogs.concat(chunkLogs as PrecogLog[]);
                }

                console.log('Existing Logs found:', allLogs.length);
                const precogLogs = allLogs;

                const updatedLogs = await Promise.all(
                    precogLogs.map(async (log, index) => {
                        try {
                            const logBlock = await fetchBlock(client, Number(log.blockNumber));
                            log.blockTimestamp = logBlock.timestamp;
                        } catch (error) {
                            console.error("Failed to fetch block:", log.blockNumber, `- Log: ${index}`);
                        }
                        try {
                            const logTx = await fetchTransaction(client, log.transactionHash ?? '');
                            log.transaction = logTx;
                        } catch (error) {
                            console.error("Failed to fetch transaction:", log.transactionHash, `- Log: ${index}`);
                        }

                        return log;
                    })
                )

                setLogs(updatedLogs);
            } catch (error) {
                console.error("Failed to fetch logs:", error);
            }
        };

        fetchLogs();

    }, [address, client]);

    return logs;
};
