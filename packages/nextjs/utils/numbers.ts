// Useful functions to unify number formats and conversions in this app

/**
 *  Converts an int128 (signed 64.64 bit fixed point number) to a number
 *  @param value number to be converted (usually from PrecogMarket or PrecogMaster contracts)
 */
export const fromInt128toNumber = (value: bigint): number => {
    return Number(BigInt(value)) / Number((BigInt(2) ** BigInt(64)));
}

/**
 *  Converts a number to int128 (signed 64.64 bit fixed point number)
 *  @param value number to be converted (usually to use at PrecogMarket or PrecogMaster contracts)
 */
export const fromNumberToInt128 = (value: number): bigint => {
    return BigInt(value) * (BigInt(2) ** BigInt(64));
}
