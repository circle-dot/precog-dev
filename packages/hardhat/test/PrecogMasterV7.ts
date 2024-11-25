import {expect} from "chai";
import {ethers} from "hardhat";
import {PrecogToken, PrecogMasterV7, PrecogMarketV7, FakeDai} from "../typechain-types";
import {HardhatEthersSigner} from "@nomicfoundation/hardhat-ethers/signers";

describe("Precog Master V7", function () {
    const detailsEnabled: boolean = process.env.TEST_DETAILS === 'true';
    let pre: PrecogToken;
    let market: PrecogMarketV7;
    let master: PrecogMasterV7;
    let owner: HardhatEthersSigner;
    let user: HardhatEthersSigner;
    let caller: HardhatEthersSigner;
    let marketCreator: HardhatEthersSigner;
    let dai: FakeDai;

    beforeEach(async function () {
        [owner, user, caller, marketCreator] = await ethers.getSigners();
    })

    describe("Deployment & setup", function () {
        it("Deploy PrecogToken contract", async function () {
            const PRE = await ethers.getContractFactory("PrecogToken");
            const precogOwner = owner.address;
            pre = await PRE.deploy(precogOwner);
        })

        it("Mint PRE tokens for user, caller & creator accounts", async function () {
            await pre.mint(owner.address, ethers.parseEther('2000'));
            await pre.mint(marketCreator.address, ethers.parseEther('2000'));
            await pre.mint(caller.address, ethers.parseEther('1'));

            expect(await pre.balanceOf(owner.address)).to.equal(ethers.parseEther('2000'));
            expect(await pre.balanceOf(marketCreator.address)).to.equal(ethers.parseEther('2000'));
            expect(await pre.balanceOf(caller.address)).to.equal(ethers.parseEther('1'));
        })

        it("Deploy PrecogMaster contract", async function () {
            const PrecogMaster = await ethers.getContractFactory("PrecogMasterV7");
            master = await PrecogMaster.deploy(await pre.getAddress(), owner.address);
        })

        it("Deploy Base PrecogMarket contract", async function () {
            const PrecogMarket = await ethers.getContractFactory("PrecogMarketV7");
            market = await PrecogMarket.deploy();
            await market.initialize(await pre.getAddress());
        })

        it("Set base market & oracle references on PrecogMaster", async function () {
            await master.setBaseOracle(owner.address);
            await master.setBaseMarket(await market.getAddress());
        })

        it("Add 'ADMIN' account to PrecogMaster access list", async function () {
            await master.addAdmin(owner.address);
        })

        it("Add 'CALLER' account to PrecogMaster access list", async function () {
            await master.addCaller(caller.address);
        })

        it("Add 'MARKET_CREATOR' account to PrecogMaster access list", async function () {
            await master.addMarketCreator(marketCreator.address);
        })

        it("Transfer ownership of PrecogToken to PrecogMaster", async function () {
            await pre.transferOwnership(await master.getAddress());
        })

        it("Deploy Fake DAI contract & send tokens to creator & user", async function () {
            const DAI = await ethers.getContractFactory("FakeDai");
            dai = await DAI.deploy(owner.address);
            await dai.mint(marketCreator.address, ethers.parseEther('2000'));
            await dai.mint(user.address, ethers.parseEther('100'));

            expect(await dai.balanceOf(marketCreator.address)).to.equal(ethers.parseEther('2000'));
            expect(await dai.balanceOf(user.address)).to.equal(ethers.parseEther('100'));
        })
    })

    describe("Access functions", function () {
        it("| Random accounts can't use 'onlyAdmin' functions", async function () {
            if (detailsEnabled) {
                console.log("");
                console.log(`\t| User: ${user.address}`);
            }
            const call = master.connect(user).addAdmin(user);
            await expect(call).to.be.revertedWith("Only Admin");
        })

        it("| Random accounts can't use 'onlyCaller' functions", async function () {
            if (detailsEnabled) {
                console.log("");
                console.log(`\t| User: ${user.address}`);
            }
            const call = master.connect(user).claimToken(owner.address, 1, 1);
            await expect(call).to.be.revertedWith("Only Caller");
        })

        it("| Random accounts can't use 'onlyMarketCreator' functions", async function () {
            if (detailsEnabled) {
                console.log("");
                console.log(`\t| User: ${user.address}`);
            }
            const emptyAddress: string = '0x0000000000000000000000000000000000000000';
            const call: Promise<any> = master.connect(user).createCustomMarket(
                '', '', '', [], 0, 0, emptyAddress,  // Market Info
                0, 0, emptyAddress, emptyAddress, emptyAddress  // Market config
            );
            await expect(call).to.be.revertedWith("Only Market Creator");
        })

        it("| Caller accounts can't use 'onlyAdmin' functions", async function () {
            if (detailsEnabled) {
                console.log("");
                console.log(`\t| User: ${user.address}`);
            }
            const call = master.connect(caller).addAdmin(user);
            await expect(call).to.be.revertedWith("Only Admin");
        })

        it("| Caller accounts can't use 'onlyMarketCreator' functions", async function () {
            if (detailsEnabled) {
                console.log("");
                console.log(`\t| Caller: ${caller.address}`);
            }
            const emptyAddress: string = '0x0000000000000000000000000000000000000000';
            const call: Promise<any> = master.connect(user).createCustomMarket(
                '', '', '', [], 0, 0, emptyAddress,  // Market Info
                0, 0, emptyAddress, emptyAddress, emptyAddress  // Market config
            );
            await expect(call).to.be.revertedWith("Only Market Creator");
        })

        it("| Market creator accounts can't use 'onlyAdmin' functions", async function () {
            // Note: currently the caller account also have `MARKET_CREATOR_ROLE`
            const marketCreator: HardhatEthersSigner = caller;
            if (detailsEnabled) {
                console.log("");
                console.log(`\t| User: ${user.address}`);
                console.log(`\t| marketCreator: ${marketCreator.address}`);
            }
            const call = master.connect(marketCreator).addAdmin(user);
            await expect(call).to.be.revertedWith("Only Admin");
        })

        it("| Market creator accounts can't use 'onlyCaller' functions", async function () {
            if (detailsEnabled) {
                console.log("");
                console.log(`\t| marketCreator: ${marketCreator.address}`);
            }
            const call: Promise<any> = master.connect(marketCreator).claimToken(owner.address, 1, 1);
            await expect(call).to.be.revertedWith("Only Caller");
        })

        it("| Admin accounts can't use 'onlyCaller' functions", async function () {
            if (detailsEnabled) {
                console.log("");
                console.log(`\t| Admin: ${owner.address}`);
            }
            const call = master.connect(owner).claimToken(owner.address, 1, 1);
            await expect(call).to.be.revertedWith("Only Caller");
        })

        it("| Admin accounts can't use 'onlyMarketCreator' functions", async function () {
            if (detailsEnabled) {
                console.log("");
                console.log(`\t| Admin: ${owner.address}`);
            }
            const emptyAddress: string = '0x0000000000000000000000000000000000000000';
            const call: Promise<any> = master.connect(user).createCustomMarket(
                '', '', '', [], 0, 0, emptyAddress,  // Market Info
                0, 0, emptyAddress, emptyAddress, emptyAddress  // Market config
            );
            await expect(call).to.be.revertedWith("Only Market Creator");
        })
    })

    describe("Token Claim & Seasons functions", function () {
        it("| Admin accounts can set a new mining season", async function () {
            if (detailsEnabled) console.log("");
            const seasonIndex: number = 0;
            const startTimestamp: number = 1712707200;
            const endTimestamp: number = 2533161600;
            const maxUserClaim: bigint = ethers.parseEther('1000');
            const maxTotalClaim: bigint = ethers.parseEther('2000');
            const maxTotalMint: bigint = ethers.parseEther('5000');
            await master.connect(owner).setMiningSeason(
                seasonIndex,
                startTimestamp,
                endTimestamp,
                maxUserClaim,
                maxTotalClaim,
                maxTotalMint,
                0,  // "claimedAmount" status variable
                0  // "mintedAmount" status variable
            );

            const miningSeason: any[] = await master.miningSeasons(seasonIndex);
            if (detailsEnabled) {
                console.log(`\t| maxTotalMint: ${miningSeason[4]}`);
            }
            expect(miningSeason[4]).to.equal(maxTotalMint);
        })

        it("| Caller account can claim PRE tokens for a user in season", async function () {
            if (detailsEnabled) console.log("");
            const account: string = user.address;
            const userId: number = 1;
            const amount: bigint = ethers.parseEther('100');
            await master.connect(caller).claimToken(account, userId, amount);

            const claim: any[] = await master.accountTokenClaims(account);
            const claimedAmount = claim[2];
            const claimedTimestamp = claim[3];
            if (detailsEnabled) {
                console.log(`\t| Account: ${account}, UserId: ${userId}, Amount: ${amount}`);
                console.log(`\t| Claimed: ${claimedAmount}, Timestamp: ${claimedTimestamp}`);
            }
            expect(claimedAmount).to.equal(amount);
            expect(claimedTimestamp).to.be.greaterThan(0);
        })

        it("| Should revert claiming with already claimed account", async function () {
            if (detailsEnabled) console.log("");
            const account: string = user.address;
            const userId: number = 999;
            const amount: bigint = ethers.parseEther('100');
            const claimSameAccount: Promise<any> = master.connect(caller).claimToken(account, userId, amount);
            await expect(claimSameAccount).revertedWith("Account already claimed")
        })

        it("| Should revert claiming with already claimed user id", async function () {
            if (detailsEnabled) console.log("");
            const account: string = '0x0000000000000000000000000000000000000000';
            const userId: number = 1;
            const amount: bigint = ethers.parseEther('100');
            const claimSameAccount: Promise<any> = master.connect(caller).claimToken(account, userId, amount);
            await expect(claimSameAccount).revertedWith("User already claimed")
        })

        it("| Should revert claiming a token amount over the season limit", async function () {
            if (detailsEnabled) console.log("");
            const account: string = '0x0000000000000000000000000000000000000001';
            const userId: number = 999;
            const amount: bigint = ethers.parseEther('1001');
            const claimSameAccount: Promise<any> = master.connect(caller).claimToken(account, userId, amount);
            await expect(claimSameAccount).revertedWith("Invalid user claim amount")
        })
    })

    describe("Market functions", function () {
        it("| Caller accounts can create a new prediction market", async function () {
            if (detailsEnabled) console.log("");
            const name: string = 'Initial market';
            const description: string = 'Initial description';
            const category: string = 'CRYPTO';
            const outcomes: string[] = ['YES', 'NO'];
            const startTimestamp: number = await getCurrentBlockTimestamp();
            const endTimestamp: number = startTimestamp + 300;  // 5 min market
            const funding = ethers.parseEther('1000');
            const overround: number = 200;  // 200 bps (aka market maker margin)
            const creator: string = owner.address;
            await master.connect(caller).createMarket(
                name, description, category, outcomes, startTimestamp, endTimestamp, creator, funding, overround
            );
            const createdMarkets: bigint = await master.createdMarkets();
            const createdMarket: any[] = await master.markets(0);
            const marketName = createdMarket[0];
            const marketDescription = createdMarket[1];
            const marketCategory = createdMarket[2];
            const marketOutcomes = createdMarket[3];
            const marketStart = createdMarket[4];
            const marketEnd = createdMarket[5];
            const marketCreatorAddress = createdMarket[6];
            const marketAddress = createdMarket[7];
            if (detailsEnabled) {
                console.log(`\t| Market -> name: ${marketName}, creator: ${marketCreatorAddress}`);
                console.log(`\t| Market Address: ${marketAddress}`);
            }

            expect(createdMarkets).to.equal(1);
            expect(marketName).to.equal(name);
            expect(marketDescription).to.equal(description);
            expect(marketCategory).to.equal(category);
            expect(marketOutcomes).to.equal(outcomes.toString());
            expect(marketStart).to.equal(startTimestamp);
            expect(marketEnd).to.equal(endTimestamp);
            expect(marketCreatorAddress).to.equal(creator);
        })

        it("| Admin accounts can update a created prediction market", async function () {
            if (detailsEnabled) console.log("");
            const nowTimestamp = await getCurrentBlockTimestamp();
            const marketId: number = 0;
            const name: string = 'Market 1';
            const description: string = 'Description 1';
            const category: string = 'CRYPTO';
            const outcomes: string[] = ['YES', 'NO'];
            const startTimestamp: number = nowTimestamp;
            const endTimestamp: number = nowTimestamp + 300;
            const emptyCreator: string = '0x0000000000000000000000000000000000000000';
            const emptyOracle: string = '0x0000000000000000000000000000000000000000';
            await master.connect(owner).updateMarket(
                marketId,
                name,
                description,
                category,
                outcomes,
                startTimestamp,
                endTimestamp,
                emptyCreator,
                emptyOracle
            );
            const market: any[] = await master.markets(marketId);
            const marketName = market[0];
            const marketCreator = market[6];
            const marketAddress = market[7];
            if (detailsEnabled) {
                console.log(`\t| Market -> name: ${marketName}, address: ${marketAddress}, creator: ${marketCreator}`);
            }

            const oldCreator: string = owner.address;
            expect(marketName).to.equal(name);
            expect(marketCreator).to.equal(oldCreator);
        })

        it("| Accounts can BUY 10 YES shares [outcome=1] on a market", async function () {
            if (detailsEnabled) console.log("");
            const shares: number = 10
            const marketId: number = 0;
            const outcome: number = 1;
            const sharesAmount: bigint = fromNumberToInt128(shares);

            // Get current market price and calculate max token in
            const buyPriceInt128: bigint = await master.marketBuyPrice(marketId, outcome, sharesAmount);
            const buyCost: number = fromInt128toNumber(buyPriceInt128);
            const maxTokenIn: number = buyCost * 1.001  // Add 0.1% of slippage
            const maxAmountIn: bigint = ethers.parseEther(maxTokenIn.toString());

            // Calculate expected costs (to be compared after)
            const buyCostPerShare: number = buyCost / shares;
            const balanceBefore: bigint = await pre.balanceOf(user.address);
            if (detailsEnabled) {
                console.log(`\t| Buying: outcome=${outcome}, amount=${shares}, maxIn=${maxTokenIn} PRE`);
                console.log(`\t| Expected -> buyPrice: ${buyCostPerShare}, buyCost: ${buyCost} PRE`);
            }

            // Send BUY call as random user
            await master.connect(user).marketBuy(marketId, outcome, sharesAmount, maxAmountIn);

            const marketSharesInfo: any[] = await master.marketSharesInfo(marketId);
            const totalShares: number = fromInt128toNumber(marketSharesInfo[0]);
            const totalBuys: number = marketSharesInfo[3];
            const totalSells: number = marketSharesInfo[4];
            const balanceAfter: bigint = await pre.balanceOf(user.address);
            const preTokenCost: bigint = balanceBefore - balanceAfter;
            const costPerShare: string = ethers.formatEther(preTokenCost / BigInt(shares));
            const tokenCost: string = ethers.formatEther(preTokenCost);
            if (detailsEnabled) {
                console.log(`\t|   Traded -> buyPrice: ${costPerShare}, buyCost: ${tokenCost} PRE`);
                console.log(`\t| Market -> TotalShares: ${totalShares}, Sells: ${totalSells}, Buys: ${totalBuys}`);
            }

            expect(totalBuys).be.equal(1);
            expect(totalShares).be.equal(2010);
        })

        it("| Accounts can BUY 10 NO shares [outcome=2] on a market", async function () {
            if (detailsEnabled) console.log("");
            const shares: number = 10
            const marketId: number = 0;
            const outcome: number = 2;
            const sharesAmount: bigint = fromNumberToInt128(shares);

            // Get current market price and calculate max token in
            const buyPriceInt128: bigint = await master.marketBuyPrice(marketId, outcome, sharesAmount);
            const buyCost: number = fromInt128toNumber(buyPriceInt128);
            const maxTokenIn: number = buyCost * 1.001  // Add 0.1% of slippage
            const maxAmountIn: bigint = ethers.parseEther(maxTokenIn.toString());

            // Calculate expected costs (to be compared after)
            const buyCostPerShare: number = buyCost / shares;
            const balanceBefore: bigint = await pre.balanceOf(user.address);
            if (detailsEnabled) {
                console.log(`\t| Buying: outcome=${outcome}, amount=${shares}, maxIn=${maxTokenIn} PRE`);
                console.log(`\t| Expected -> buyPrice: ${buyCostPerShare}, buyCost: ${buyCost} PRE`);
            }

            // Send BUY call as random user
            await master.connect(user).marketBuy(marketId, outcome, sharesAmount, maxAmountIn);

            const marketSharesInfo: any[] = await master.marketSharesInfo(marketId);
            const totalShares: number = fromInt128toNumber(marketSharesInfo[0]);
            const totalBuys: number = marketSharesInfo[3];
            const totalSells: number = marketSharesInfo[4];
            const balanceAfter: bigint = await pre.balanceOf(user.address);
            const preTokenCost: bigint = balanceBefore - balanceAfter;
            const costPerShare = ethers.formatEther(preTokenCost / BigInt(shares));
            const tokenCost: string = ethers.formatEther(preTokenCost);
            if (detailsEnabled) {
                console.log(`\t|   Traded -> buyPrice: ${costPerShare}, buyCost: ${tokenCost} PRE`);
                console.log(`\t| Market -> TotalShares: ${totalShares}, Sells: ${totalSells}, Buys: ${totalBuys}`);
            }

            expect(totalBuys).be.equal(2);
            expect(totalShares).be.equal(2020);
        })

        it("| Accounts can SELL 5 YES shares [outcome=1] on a market", async function () {
            if (detailsEnabled) console.log("");
            const shares: number = 5
            const marketId: number = 0;
            const outcome: number = 1;
            const sharesAmount: bigint = fromNumberToInt128(shares);

            // Get current market price and calculate min token return
            const sellPriceInt128: bigint = await master.marketSellPrice(marketId, outcome, sharesAmount);
            const sellReturn: number = fromInt128toNumber(sellPriceInt128);
            const minTokenOut: number = sellReturn * 0.999  // Add 0.1% of slippage
            const minAmountOut: bigint = ethers.parseEther(minTokenOut.toString());

            // Calculate expected returns (to be compared after)
            const returnPerShare: number = sellReturn / shares;
            const balanceBefore: bigint = await pre.balanceOf(user.address);
            if (detailsEnabled) {
                console.log(`\t| Selling: outcome=${outcome}, amount=${shares}, minOut=${minTokenOut} PRE`);
                console.log(`\t| Expected -> sellPrice: ${returnPerShare}, sellReturn: ${sellReturn} PRE`);
            }

            // Send SELL call as random user
            await master.connect(user).marketSell(marketId, outcome, sharesAmount, minAmountOut);

            const marketSharesInfo: any[] = await master.marketSharesInfo(marketId);
            const totalShares: number = fromInt128toNumber(marketSharesInfo[0]);
            const totalBuys: number = marketSharesInfo[3];
            const totalSells: number = marketSharesInfo[4];
            const balanceAfter: bigint = await pre.balanceOf(user.address);
            const preTokenReturn: bigint = balanceAfter - balanceBefore;
            const costPerShare: string = ethers.formatEther(preTokenReturn / BigInt(shares));
            const tokenReturn: string = ethers.formatEther(preTokenReturn);
            if (detailsEnabled) {
                console.log(`\t|   Traded -> sellPrice: ${costPerShare}, sellReturn: ${tokenReturn} PRE`);
                console.log(`\t| Market -> TotalShares: ${totalShares}, Sells: ${totalSells}, Buys: ${totalBuys}`);
            }

            expect(totalSells).be.equal(1);
            expect(totalShares).be.equal(2015);
        })

        it("| Accounts can SELL 10 NO shares [outcome=2] on a market", async function () {
            if (detailsEnabled) console.log("");
            const shares: number = 10
            const marketId: number = 0;
            const outcome: number = 2;
            const sharesAmount: bigint = fromNumberToInt128(shares);

            // Get current market price/token cost
            const sellPriceInt128: bigint = await master.marketSellPrice(marketId, outcome, sharesAmount);
            const sellReturn: number = fromInt128toNumber(sellPriceInt128);
            const minTokenOut: number = sellReturn * 0.999  // Add 0.1% of slippage
            const minAmountOut: bigint = ethers.parseEther(minTokenOut.toString());

            const buyCostPerShare: number = sellReturn / shares;
            const balanceBefore: bigint = await pre.balanceOf(user.address);
            if (detailsEnabled) {
                console.log(`\t| Selling: outcome=${outcome}, amount=${shares}, minOut=${minTokenOut} PRE`);
                console.log(`\t| Expected -> sellPrice: ${buyCostPerShare}, sellReturn: ${sellReturn} PRE`);
            }

            await master.connect(user).marketSell(marketId, outcome, sharesAmount, minAmountOut);

            const marketSharesInfo: any[] = await master.marketSharesInfo(marketId);
            const totalShares: number = fromInt128toNumber(marketSharesInfo[0]);
            const totalBuys: number = marketSharesInfo[3];
            const totalSells: number = marketSharesInfo[4];
            const balanceAfter: bigint = await pre.balanceOf(user.address);
            const preTokenReturn: bigint = balanceAfter - balanceBefore;
            const costPerShare: string = ethers.formatEther(preTokenReturn / BigInt(shares));
            const tokenReturn: string = ethers.formatEther(preTokenReturn);
            if (detailsEnabled) {
                console.log(`\t|   Traded -> sellPrice: ${costPerShare}, sellReturn: ${tokenReturn} PRE`);
                console.log(`\t| Market -> TotalShares: ${totalShares}, Sells: ${totalSells}, Buys: ${totalBuys}`);
            }

            expect(totalSells).be.equal(2);
            expect(totalShares).be.equal(2005);
        })

        it("| Caller accounts can BUY YES shares [outcome=1] on a market", async function () {
            if (detailsEnabled) console.log("");
            const shares: number = 1
            const marketId: number = 0;
            const outcome: number = 1;
            const sharesAmount: bigint = fromNumberToInt128(shares);

            // Get current market price/token cost
            const buyPriceInt128: bigint = await master.marketBuyPrice(marketId, outcome, sharesAmount);
            const buyCost: number = fromInt128toNumber(buyPriceInt128);
            const maxTokenIn: number = buyCost * 1.001  // Add 0.1% of slippage
            const maxAmountIn: bigint = ethers.parseEther(maxTokenIn.toString());

            const buyCostPerShare: number = buyCost / shares;
            const balanceBefore: bigint = await pre.balanceOf(user.address);
            if (detailsEnabled) {
                console.log(`\t| Buying: outcome=${outcome}, amount=${shares}, maxIn=${maxTokenIn} PRE`);
                console.log(`\t| Expected -> buyPrice: ${buyCostPerShare}, buyCost: ${buyCost} PRE`);
            }

            await master.connect(caller).marketBuy(marketId, outcome, sharesAmount, maxAmountIn);

            const marketSharesInfo: any[] = await master.marketSharesInfo(marketId);
            const totalShares: number = fromInt128toNumber(marketSharesInfo[0]);
            const totalBuys: number = marketSharesInfo[3];
            const totalSells: number = marketSharesInfo[4];
            const balanceAfter: bigint = await pre.balanceOf(caller.address);
            const preTokenCost: bigint = balanceBefore - balanceAfter;
            const costPerShare = ethers.formatEther(preTokenCost / BigInt(shares));
            const tokenCost: string = ethers.formatEther(preTokenCost);
            if (detailsEnabled) {
                console.log(`\t|   Traded -> buyPrice: ${costPerShare}, buyCost: ${tokenCost} PRE`);
                console.log(`\t| Market -> TotalShares: ${totalShares}, Sells: ${totalSells}, Buys: ${totalBuys}`);
            }

            expect(totalBuys).be.equal(3);
        })

        it("| Accounts can't redeem shares before results are reported", async function () {
            if (detailsEnabled) console.log("");
            const marketId: number = 0;
            const tx: Promise<any> = master.connect(user).marketRedeemShares(marketId);

            await expect(tx).revertedWith("Market not closed");
        })

        it("| Random accounts can't report results on a market", async function () {
            if (detailsEnabled) console.log("");
            const marketId: number = 0;
            const resultOutcome: number = 1;
            const marketInfo: any[] = await master.markets(marketId);
            const createdMarket: PrecogMarketV7 = await ethers.getContractAt('PrecogMarketV7', marketInfo[7]);
            const tx: Promise<any> = createdMarket.connect(user).reportResult(marketId, resultOutcome);

            await expect(tx).revertedWith("Only oracle");
        })

        it("| Oracle account can report result YES[outcome=1] on a market", async function () {
            if (detailsEnabled) console.log("");
            const marketId: number = 0;
            const resultOutcome: number = 1;

            const marketInfo: any[] = await master.markets(marketId);
            const createdMarket: PrecogMarketV7 = await ethers.getContractAt('PrecogMarketV7', marketInfo[7]);
            const oracle: string = await createdMarket.oracle();
            const startTimestamp: bigint = await createdMarket.startTimestamp();
            const endTimestamp: bigint = await createdMarket.endTimestamp();
            const initialCloseTimestamp: bigint = await createdMarket.closeTimestamp();
            const initialResult: bigint = await createdMarket.result();

            if (detailsEnabled) {
                console.log(`\t| Created Market: ${await createdMarket.getAddress()}`);
                console.log(`\t| MarketId: ${marketId}, Oracle: ${oracle}`);
                console.log(`\t| StartTimestamp: ${startTimestamp}, EndTimestamp=${endTimestamp}`);
                console.log(`\t| Initial -> CloseTimestamp: ${initialCloseTimestamp}, Result=${initialResult}`);
            }

            // Move local chain next block timestamp to be higher than endTimestamp of the market
            await ethers.provider.send("evm_setNextBlockTimestamp", [Number(endTimestamp) + 1]);

            await createdMarket.connect(owner).reportResult(marketId, resultOutcome);

            const finalCloseTimestamp: bigint = await createdMarket.closeTimestamp();
            const finalResult: bigint = await createdMarket.result();
            const resultInfo: any[] = await master.marketResultInfo(marketId);  // results helper (only v7)

            if (detailsEnabled) {
                console.log(`\t|   Final -> CloseTimestamp: ${finalCloseTimestamp}, Result=${finalResult}`);
                console.log(`\t| Summary -> Result: ${resultInfo[0]}, Closed=${resultInfo[1]}, By: ${resultInfo[2]}`);
            }
            expect(initialResult).be.equal(0);
            expect(initialCloseTimestamp).be.equal(0);
            expect(finalResult).be.equal(resultOutcome);
            expect(finalCloseTimestamp).be.greaterThan(0);
        })

        it("| Accounts can redeem shares after results are reported", async function () {
            if (detailsEnabled) console.log("");
            const marketId: number = 0;
            const balanceBefore: bigint = await pre.balanceOf(user.address);
            const userSharesBefore: any[] = await master.marketAccountShares(marketId, user.address);
            const sharesToRedeem = userSharesBefore[5][1];  // balance of YES[outcome=1] shares
            if (detailsEnabled) {
                console.log(`\t| MarketId: ${marketId}, Account: ${user.address}`);
                console.log(`\t| SharesToRedeem: ${ethers.formatEther(sharesToRedeem)} YES [outcome=1]`);
            }

            await master.connect(user).marketRedeemShares(marketId);
            const hasRedeemed: boolean = await master.hasRedeemedShares(marketId, user.address);

            const balanceAfter: bigint = await pre.balanceOf(user.address);
            const balanceRedeemed: bigint = balanceAfter - balanceBefore;
            if (detailsEnabled) {
                console.log(`\t| BalanceRedeemed: ${ethers.formatEther(balanceRedeemed)} PRE`);
            }

            expect(sharesToRedeem).be.equal(balanceRedeemed);
            expect(hasRedeemed).be.equal(true);
        })

        it("| Oracle account can redeemShares for a list of accounts", async function () {
            if (detailsEnabled) console.log("");
            const marketId: number = 0;
            const marketInfo: any[] = await master.markets(marketId);
            const createdMarket: PrecogMarketV7 = await ethers.getContractAt('PrecogMarketV7', marketInfo[7]);
            const oracle: string = await createdMarket.oracle();
            const userSharesBefore: any[] = await master.marketAccountShares(marketId, caller.address);
            const sharesToRedeem = userSharesBefore[5][1];  // balance of YES[outcome=1] shares

            if (detailsEnabled) {
                console.log(`\t| MarketId: ${marketId}, Oracle: ${oracle}`);
                console.log(`\t| Caller SharesToRedeem: ${ethers.formatEther(sharesToRedeem)} YES [outcome=1]`);
            }

            // Note: do not matter if the 'user' already redeemed. This should work with NO revert
            const accounts: string[] = [user.address, caller.address];
            await createdMarket.connect(owner).redeemBatch(accounts);

            const userHasRedeemed: boolean = await master.hasRedeemedShares(marketId, user.address);
            const callerHasRedeemed: boolean = await master.hasRedeemedShares(marketId, caller.address);
            if (detailsEnabled) {
                console.log(`\t| userHasRedeemed: ${userHasRedeemed}`);
                console.log(`\t| callerHasRedeemed: ${callerHasRedeemed}`);
            }

            expect(userHasRedeemed).be.equal(true);
            expect(callerHasRedeemed).be.equal(true);
        })
    })

    describe("Custom Market functions", function () {
        it("| Market Creator accounts can create a custom market (with DAI)", async function () {
            // Approve PrecogMaster to use MarketCreator DAIs
            await dai.connect(marketCreator).approve(
                await master.getAddress(),
                await dai.balanceOf(marketCreator.address)
            );

            if (detailsEnabled) console.log("");
            const name: string = 'Initial custom market';
            const description: string = 'Initial custom description';
            const category: string = 'CRYPTO';
            const outcomes: string[] = ['YES', 'NO', 'UNFINISHED'];
            const startTimestamp: number = await getCurrentBlockTimestamp();
            const endTimestamp: number = startTimestamp + 300;  // 5 min market
            const funding: bigint = ethers.parseEther('1000');
            const overround: number = 300;  // 300 bps (aka market market margin)
            const creator: string = owner.address;
            const collateralToken: string = await dai.getAddress();
            const collateralFunder: string = marketCreator.address;
            const marketOracle: string = owner.address;
            await master.connect(marketCreator).createCustomMarket(
                name, description, category, outcomes, startTimestamp, endTimestamp, creator,
                funding, overround, collateralToken, collateralFunder, marketOracle
            );
            const createdMarkets: bigint = await master.createdMarkets();
            const createdMarket: any[] = await master.markets(1);
            const marketName = createdMarket[0];
            const marketStart = createdMarket[4];
            const marketEnd = createdMarket[5];
            const marketCreatorAddress = createdMarket[6];
            const marketAddress = createdMarket[7];
            if (detailsEnabled) {
                console.log(`\t| Market -> name: ${marketName}, creator: ${marketCreatorAddress}`);
                console.log(`\t| Market Address: ${marketAddress}`);
                console.log(`\t| Start: ${marketStart}, End: ${marketEnd}`);
            }

            expect(createdMarkets).to.equal(2);
            expect(marketName).to.equal(name);
            expect(marketStart).to.equal(startTimestamp);
            expect(marketEnd).to.equal(endTimestamp);
            expect(marketCreatorAddress).to.equal(creator);
        })

        it("| Accounts can BUY shares with DAI on a custom market", async function () {
            if (detailsEnabled) console.log("");
            const shares: number = 1
            const marketId: number = 1;
            const outcome: number = 1;
            const sharesAmount: bigint = fromNumberToInt128(shares);
            const masterAddress: string = await master.getAddress();

            // Get fast buy prices
            const prices: bigint[][] = await master.marketPrices(marketId);  // prices helper (only v7)
            const buyPrices = prices[0].map(value => Number(ethers.formatEther(value)));

            // Get current market price and calculate max token in
            const buyPriceInt128: bigint = await master.marketBuyPrice(marketId, outcome, sharesAmount);
            const buyCost: number = fromInt128toNumber(buyPriceInt128);
            const maxTokenIn: number = buyCost * 1.001  // Add 0.1% of slippage
            const maxAmountIn: bigint = ethers.parseEther(maxTokenIn.toString());

            // Give allowance of DAI to PrecogMaster
            await dai.connect(user).approve(masterAddress, maxAmountIn);

            // Calculate expected costs (to be compared after)
            const buyCostPerShare: number = buyCost / shares;
            const balanceBefore: bigint = await dai.balanceOf(user.address);
            const allowanceBefore: bigint = await dai.allowance(user.address, masterAddress);
            if (detailsEnabled) {
                console.log(`\t| Buying: outcome=${outcome}, amount=${shares}, maxIn=${maxTokenIn} DAI`);
                console.log(`\t| Allowance to Master (before): ${ethers.formatEther(allowanceBefore)} DAI`);
                console.log(`\t| Expected -> buyPrice: ${buyCostPerShare}, buyCost: ${buyCost} DAI`);
            }

            // Send BUY call as random user
            await master.connect(user).marketBuy(marketId, outcome, sharesAmount, maxAmountIn);

            const marketSharesInfo: any[] = await master.marketSharesInfo(marketId);
            const totalShares: number = fromInt128toNumber(marketSharesInfo[0]);
            const totalBuys: number = marketSharesInfo[3];
            const totalSells: number = marketSharesInfo[4];
            const balanceAfter: bigint = await dai.balanceOf(user.address);
            const allowanceAfter: bigint = await dai.allowance(user.address, masterAddress);
            const preTokenCost: bigint = balanceBefore - balanceAfter;
            const costPerShare: string = ethers.formatEther(preTokenCost / BigInt(shares));
            const tokenCost: string = ethers.formatEther(preTokenCost);
            if (detailsEnabled) {
                console.log(`\t|   Traded -> buyPrice: ${costPerShare}, buyCost: ${tokenCost} DAI`);
                console.log(`\t| Fast Buy Price: ${buyPrices[outcome]} DAI`);
                console.log(`\t| Allowance to Master (after): ${ethers.formatEther(allowanceAfter)} DAI`);
                console.log(`\t| Market -> TotalShares: ${totalShares}, Sells: ${totalSells}, Buys: ${totalBuys}`);
            }

            expect(Number(tokenCost)).be.lessThanOrEqual(buyCost);
            expect(totalBuys).be.equal(1);
            expect(totalShares).be.equal(3001);
            expect(allowanceAfter).be.equal(0);
        })

        it("| Accounts can SELL shares on a custom market (with DAI)", async function () {
            if (detailsEnabled) console.log("");
            const shares: number = 1
            const marketId: number = 1;
            const outcome: number = 1;
            const sharesAmount: bigint = fromNumberToInt128(shares);

            // Get fast sell prices
            const prices: bigint[][] = await master.marketPrices(marketId);  // prices helper (only v7)
            const sellPrices = prices[1].map(value => Number(ethers.formatEther(value)));

            // Get current market price and calculate min token return
            const sellPriceInt128: bigint = await master.marketSellPrice(marketId, outcome, sharesAmount);
            const sellReturn: number = fromInt128toNumber(sellPriceInt128);
            const minTokenOut: number = sellReturn * 0.999  // Add 0.1% of slippage
            const minAmountOut: bigint = ethers.parseEther(minTokenOut.toString());

            // Calculate expected returns (to be compared after)
            const returnPerShare: number = sellReturn / shares;
            const balanceBefore: bigint = await dai.balanceOf(user.address);
            if (detailsEnabled) {
                console.log(`\t| Selling: outcome=${outcome}, amount=${shares}, minOut=${minTokenOut} DAI`);
                console.log(`\t| Expected -> sellPrice: ${returnPerShare}, sellReturn: ${sellReturn} DAI`);
            }

            // Send SELL call as random user
            await master.connect(user).marketSell(marketId, outcome, sharesAmount, minAmountOut);

            const marketSharesInfo: any[] = await master.marketSharesInfo(marketId);
            const totalShares: number = fromInt128toNumber(marketSharesInfo[0]);
            const totalBuys: number = marketSharesInfo[3];
            const totalSells: number = marketSharesInfo[4];
            const balanceAfter: bigint = await dai.balanceOf(user.address);
            const preTokenReturn: bigint = balanceAfter - balanceBefore;
            const costPerShare: string = ethers.formatEther(preTokenReturn / BigInt(shares));
            const tokenReturn: string = ethers.formatEther(preTokenReturn);
            if (detailsEnabled) {
                console.log(`\t|   Traded -> sellPrice: ${costPerShare}, sellReturn: ${tokenReturn} DAI`);
                console.log(`\t| Fast Sell Price: ${sellPrices[outcome]} DAI`);
                console.log(`\t| Market -> TotalShares: ${totalShares}, Sells: ${totalSells}, Buys: ${totalBuys}`);
            }

            expect(Number(tokenReturn)).be.greaterThanOrEqual(sellReturn);
            expect(totalSells).be.equal(1);
            expect(totalShares).be.equal(3000);
        })
    })
})

function fromInt128toNumber(a: bigint): number {
    return Number(BigInt(a)) / Number((BigInt(2) ** BigInt(64)));
}

function fromNumberToInt128(a: number): bigint {
    return BigInt(a) * (BigInt(2) ** BigInt(64));
}

async function getCurrentBlockTimestamp(): Promise<number> {
    const blockNumber: number = await ethers.provider.getBlockNumber();
    const block = await ethers.provider.getBlock(blockNumber);
    return block ? block.timestamp : 0;
}
