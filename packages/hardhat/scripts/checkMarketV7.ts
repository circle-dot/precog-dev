import {ethers, getChainId} from "hardhat";
import {PrecogMasterV7, PrecogToken} from "../typechain-types";

function fromInt128toNumber(a: bigint): number {
    return Number(BigInt(a)) / Number((BigInt(2) ** BigInt(64)));
}

function fromNumberToInt128(a: number): bigint {
    return BigInt(a) * (BigInt(2) ** BigInt(64));
}

async function main() {
    console.log(`\n> Checking Precog Market state...\n`);

    // Fixed master contract address and market id (could be a user input in the future)
    const contractAddress: string = '0x5fEa67Ef543615Bf8A6141AD63095e74c94Af1C4';  // PrecogMasterV7
    const marketId: number = 0;
    const account: string = '0x9475A4C1BF5Fc80aE079303f14B523da19619c16';

    // Get master contract instance from recieved parameters
    const master: PrecogMasterV7 = await ethers.getContractAt("PrecogMasterV7", contractAddress);
    const precogAddress = '0x7779ec685Aa0bf5483B3e0c15dAf246d2d978888';
    const pre: PrecogToken = await ethers.getContractAt('PrecogToken', precogAddress);

    // Show precog master contract information
    const chainId: string = await getChainId();
    console.log(`> PrecogMaster found! (chain: ${chainId})`);
    console.log(`\t  Address: ${await master.getAddress()} [PrecogMasterV6]`);

    console.log(`\n> Market (id: ${marketId}):`);
    const createdMarket: any[] = await master.markets(marketId);
    const marketName = createdMarket[0];
    const marketDescription = createdMarket[1];
    const marketCategory = createdMarket[2];
    const marketOutcomes = createdMarket[3];
    const marketStart = createdMarket[4];
    const marketEnd = createdMarket[5];
    const marketCreatorAddress = createdMarket[6];
    const marketAddress = createdMarket[7];
    console.log(`\t     Name: ${marketName}`);
    console.log(`\t     Desc: ${marketDescription}`);
    console.log(`\t Category: ${marketCategory}`);
    console.log(`\t Outcomes: ${marketOutcomes}`);
    const startDate: Date = new Date(Number(marketStart) * 1000);
    const endDate: Date = new Date(Number(marketEnd) * 1000);
    console.log(`\t    Start: ${startDate.toISOString()} [${marketStart}]`);
    console.log(`\t      End: ${endDate.toISOString()} [${marketEnd}]`);
    console.log(`\t  Creator: ${marketCreatorAddress}`);
    console.log(`\t       At: ${marketAddress} [PrecogMarketV7]`);

    console.log(`\n> Market Shares Info:`);
    const marketSharesInfo: any[] = await master.marketSharesInfo(marketId);
    const totalShares: number = fromInt128toNumber(marketSharesInfo[0]);
    const sharesBalances: bigint[] = marketSharesInfo[1];
    const liquidity: number = marketSharesInfo[2];
    const totalBuys: number = marketSharesInfo[3];
    const totalSells: number = marketSharesInfo[4];
    console.log(`\t  Total Shares: ${totalShares}`);
    if (sharesBalances.length === 3) {
        console.log(`\t     Total YES: ${fromInt128toNumber(sharesBalances[1])}`);
        console.log(`\t      Total NO: ${fromInt128toNumber(sharesBalances[2])}`);
    } else {
        for (let outcome = 1; outcome < sharesBalances.length; outcome++) {
            console.log(`\t         Total: [outcome=${outcome}] -> ${fromInt128toNumber(sharesBalances[outcome])}`);
        }
    }
    console.log(`\t     Liquidity: ${ethers.formatEther(liquidity)} PRE`);
    console.log(`\t    Total Buys: ${totalBuys}, Total Sells: ${totalSells}`);

    // Calculate current market prediction
    const oneShare: bigint = fromNumberToInt128(1);
    const yesPriceInt128: bigint = await master.marketBuyPrice(marketId, 1, oneShare);
    const noPriceInt128: bigint = await master.marketBuyPrice(marketId, 2, oneShare);
    const yesPrediction: number = 100 * fromInt128toNumber(yesPriceInt128);
    const noPrediction: number = 100 * fromInt128toNumber(noPriceInt128);
    if (yesPrediction >= noPrediction) {
        console.log(`\n> Prediction: YES (${yesPrediction.toFixed(1)}%)`);
    } else {
        console.log(`\n> Prediction: NO (${noPrediction.toFixed(1)}%)`);
    }

    // Fixed outcomes and amounts (could be a user input in the future)
    const possibleOutcomes: number[] = [1, 2];
    const sharesAmounts: number[] = [1, 5, 10, 50];
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
            const parameters: string = `Buy ${shares} ${outcome == 1 ? 'YES' : 'NO'} Shares`;
            // let parameters: string = `market=${marketId}, outcome=${outcome}, amount=${shares} [${sharesInt128}]`;
            console.log(`\t${parameters} => ${response}`);
            buyPrices[outcome].push(price);
        }
        console.log('')
    }
    console.log(`> SELL Market Prices:`);
    const sellPrices: any[] = [null, [], []];  // the first item is added just for simplicity
    for (const outcome of possibleOutcomes) {
        for (const shares of sharesAmounts) {
            const sharesInt128: bigint = fromNumberToInt128(shares);
            const priceInt128: bigint = await master.marketSellPrice(marketId, outcome, sharesInt128);
            const price: number = fromInt128toNumber(priceInt128);
            const pricePerShare: number = price / shares;
            const response = `${price} [${pricePerShare.toFixed(4)} pre/share]`
            const parameters: string = `Sell ${shares} ${outcome == 1 ? 'YES' : 'NO'} Shares`;
            // const parameters: string = `market=${marketId}, outcome=${outcome}, amount=${shares} [${sharesInt128}]`;
            console.log(`\t${parameters} => ${response}`);
            sellPrices[outcome].push(price);
        }
        console.log('')
    }

    // Get account information about trades and current shares balances
    const accountInfo: any[] = await master.marketAccountShares(marketId, account);
    const buys: number = accountInfo[0];
    const sells: number = accountInfo[1];
    const deposited: number = accountInfo[2];
    const withdrew: number = accountInfo[3];
    const redeemed: number = accountInfo[4];
    const balances: number[] = accountInfo[5];
    console.log(`\n> Account Shares Info:`);
    console.log(`\t    Address: ${account}`);
    console.log(`\t Total Buys: ${buys}, Total Sells: ${sells}`);
    console.log(`\t  Deposited: ${ethers.formatEther(deposited)} PRE`);
    console.log(`\t   Withdrew: ${ethers.formatEther(withdrew)} PRE`);
    console.log(`\t   Redeemed: ${ethers.formatEther(redeemed)} PRE`);
    if (balances.length === 3) {
        console.log(`\t Shares YES: ${ethers.formatEther(balances[1])}`);
        console.log(`\t  Shares NO: ${ethers.formatEther(balances[2])}`);
    } else {
        for (let outcome = 1; outcome < balances.length; outcome++) {
            console.log(`\t     Shares: [outcome=${outcome}] -> ${ethers.formatEther(balances[outcome])}`);
        }
    }

    // Show max amount of shares to but (based on current PRE balance)
    const preBalance = await pre.balanceOf(account);
    console.log(`\n> Max shares to buy:`);
    console.log(`\t    Address: ${account}`);
    console.log(`\t    Balance: ${ethers.formatEther(preBalance)} PRE`);
    const maxBuyYesShares = await getMaxBuyShares(master, marketId, 1, preBalance);
    console.log(`\t    Max YES: ${maxBuyYesShares} shares`);
    const maxBuyNoShares = await getMaxBuyShares(master, marketId, 2, preBalance);
    console.log(`\t     Max NO: ${maxBuyNoShares} shares`);

    console.log(`\n\n`);
}

async function getMaxBuyShares(master: PrecogMasterV7, marketId: number, marketOutcome: number, balance: bigint) {
    const accountBalance = Number(ethers.formatEther(balance));  // PRE balance
    const maxIterations = 5;  // Max shares 100 (5 iteration of 20 multiplier)
    let maxShares = 1;
    for (let i = 1; i <= maxIterations; i++) {
        const shares: number = 20 * i;
        const sharesInt128: bigint = fromNumberToInt128(shares);
        const costInt128: bigint = await master.marketBuyPrice(marketId, marketOutcome, sharesInt128);
        const totalCost: number = fromInt128toNumber(costInt128);
        if (totalCost > Number(accountBalance)) break;  // Check stop condition
        maxShares = shares;  // Save max shares and continue iterating
    }
    return maxShares
}


main().catch(error => {
    console.error(error);
    process.exitCode = 1;
});
