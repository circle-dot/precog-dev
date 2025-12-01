import {ethers} from "hardhat";

/**
 * Translate int128 (signed 64.64-bit fixed point number) to number
 *
 * @param value - number value (usually retrieved from the chain)
 */
export function fromInt128toNumber(value: bigint): number {
    return Number(BigInt(value)) / Number((BigInt(2) ** BigInt(64)));
}

/**
 * Translate number value to int128 (signed 64.64-bit fixed point number)
 *
 * @param value - number value (usually an integer)
 */
export function fromNumberToInt128(value: number): bigint {
    return BigInt(value) * (BigInt(2) ** BigInt(64));
}

/**
 * Getter to retrieve the current timestamp of the lastest block
 */
export async function getCurrentBlockTimestamp(): Promise<number> {
    const blockNumber: number = await ethers.provider.getBlockNumber();
    const block = await ethers.provider.getBlock(blockNumber);
    return block ? block.timestamp : 0;
}

/**
 * Getter for the Alpha private value of a PrecogMarketV7 contract
 *  Solidity earlier defined number variable get the last bytes when packing
 *  [storage slot 11] = "0x + [alpha(32chars)] + [beta(32chars)]"
 *
 * @param marketAddress - Deployed address of a PrecogMarketV7 contract
 */
export async function getMarketV7Alpha(marketAddress: string): Promise<number>{
    const alphaBetaSlot = 11;
    const rawValue = await ethers.provider.getStorage(marketAddress, alphaBetaSlot);
    const alphaInt128 = BigInt(rawValue.slice(0, 34));
    return fromInt128toNumber(alphaInt128);
}
