import {ethers, getChainId} from "hardhat";
import {PrecogMasterV4} from "../typechain-types";

function fromInt128toNumber(a: bigint): number {
    return Number(BigInt(a)) / Number((BigInt(2) ** BigInt(64)));
}

function fromNumberToInt128(a: number): bigint {
    return BigInt(a) * (BigInt(2) ** BigInt(64));
}

async function main() {
    console.log(`\n> Checking Precog Market state...\n`);

    // Fixed master contract address and market id (could be a user input in the future)
    const contractAddress: string = '0x1eB088E48341F22385c14E2bD25D7Eccc6BB496B';  // PrecogMasterV4
    const marketId: number = 0;

    // Get master contract instance from recieved parameters
    const master: PrecogMasterV4 = await ethers.getContractAt('PrecogMasterV4', contractAddress);

    // Show precog master contract information
    const chainId = await getChainId();
    console.log(`> PrecogMaster found! (chain: ${chainId})`);
    console.log(`\t  Address: ${await master.getAddress()}`);

    console.log(`\n> Market (id: ${marketId}):`);
    const predictionMarketInfo: any[] = await master.markets(marketId);
    console.log(`\tAddress: ${predictionMarketInfo[5]}`);
    console.log(`\t   Name: ${predictionMarketInfo[0]}`);
    console.log(`\tCreator: ${predictionMarketInfo[6]}`);
    const startDate: Date = new Date(Number(predictionMarketInfo[3]) * 1000);
    const endDate: Date = new Date(Number(predictionMarketInfo[4]) * 1000);
    console.log(`\t  Start: ${startDate.toISOString()} [${predictionMarketInfo[3]}]`);
    console.log(`\t    End: ${endDate.toISOString()} [${predictionMarketInfo[4]}]`);
    const marketAddress = predictionMarketInfo[5]
    console.log(`\t     at: ${marketAddress}`);

    console.log(`\n> Market Shares Info:`);
    const marketInfo: any[] = await master.marketSharesInfo(marketId);
    const totalShares: number = fromInt128toNumber(marketInfo[0]);
    const outcomeOneShares: number = fromInt128toNumber(marketInfo[1]);
    const outcomeTwoShares: number = fromInt128toNumber(marketInfo[2]);
    const liquidity: number = fromInt128toNumber(marketInfo[3]);
    const totalBuys = marketInfo[4];
    const totalSells = marketInfo[5];
    console.log(`\tTotal Shares: ${totalShares} (YES: ${outcomeOneShares} | NO: ${outcomeTwoShares})`);
    console.log(`\tLiquidity: ${liquidity} PRE`);
    console.log(`\tTotal Buys: ${totalBuys}, Total Sells: ${totalSells}`);

    // Calculate current market prediction
    const yesPriceInt128: bigint = await master.marketBuyPrice(marketId, 1, fromNumberToInt128(1));
    const noPriceInt128: bigint = await master.marketBuyPrice(marketId, 2, fromNumberToInt128(1));
    const yesPrediction: number = 100 * fromInt128toNumber(yesPriceInt128);
    const noPrediction: number = 100 * fromInt128toNumber(noPriceInt128);
    if (yesPrediction >= noPrediction) {
        console.log(`\n> Prediction: YES (${yesPrediction.toFixed(1)}%)`);
    } else {
        console.log(`\n> Prediction: NO (${noPrediction.toFixed(1)}%)`);
    }

    // Fixed outcomes and amounts (could be a user input in the future)
    const possibleOutcomes: number[] = [1, 2];
    const sharesAmounts: number[] = [1, 2, 3, 5, 10, 50];

    // Iterate over all outcomes and amounts and show current prices
    console.log(`\n> BUY Market Prices:`);
    const buyPrices: any[] = [null, [], []];  // the first item is added just for simplicity
    for (const outcome of possibleOutcomes) {
        for (const shares of sharesAmounts) {
            const sharesInt128: bigint = fromNumberToInt128(shares);
            const priceInt128: bigint = await master.marketBuyPrice(marketId, outcome, sharesInt128);
            const price: number = fromInt128toNumber(priceInt128);
            const pricePerShare: number = price / shares;
            const response = `${price} [${pricePerShare.toFixed(4)} pre/share]`
            const parameters: string = `outcome=${outcome == 1 ? 'YES' : 'NO'}, amount=${shares}`;
            // let parameters: string = `market=${marketId}, outcome=${outcome}, amount=${shares} [${sharesInt128}]`;
            console.log(`\tmarketPrice(${parameters}) => ${response}`);
            buyPrices[outcome].push(price);
        }
        console.log('\t')
    }

    console.log(`\n> SELL Market Prices:`);
    const sellPrices: any[] = [null, [], []];  // the first item is added just for simplicity
    for (const outcome of possibleOutcomes) {
        for (const shares of sharesAmounts) {
            const sharesInt128: bigint = fromNumberToInt128(shares);
            const priceInt128: bigint = await master.marketSellPrice(marketId, outcome, sharesInt128);
            const price: number = fromInt128toNumber(priceInt128);
            const pricePerShare: number = price / shares;
            const response = `${price} [${pricePerShare.toFixed(4)} pre/share]`
            // const parameters: string = `outcome=${outcome == 1 ? 'YES' : 'NO'}, amount=${shares}`;
            const parameters: string = `market=${marketId}, outcome=${outcome}, amount=${shares} [${sharesInt128}]`;
            console.log(`\tmarketPrice(${parameters}) => ${response}`);
            sellPrices[outcome].push(price);
        }
        console.log('\t')
    }

    const account: string = '0x9475A4C1BF5Fc80aE079303f14B523da19619c16';
    const accountInfo:any[] = await master.marketAccountShares(marketId, account);
    console.log(`\n> Account Shares:`);
    console.log(`\tAddress: ${account}`);
    console.log(`\t   Buys: ${accountInfo[0]}`);
    console.log(`\t  Sells: ${accountInfo[1]}`);
    console.log(`\t  Shares YES: ${ethers.formatEther(accountInfo[2])}`);
    console.log(`\t   Shares NO: ${ethers.formatEther(accountInfo[3])}`);
    console.log(`\t   deposited: ${ethers.formatEther(accountInfo[4])} PRE`);
    console.log(`\t    withdrew: ${ethers.formatEther(accountInfo[5])} PRE`);
    console.log(`\t    redeemed: ${ethers.formatEther(accountInfo[6])} PRE`);

    console.log(`\n\n`);
}

main().catch(error => {
    console.error(error);
    process.exitCode = 1;
});
