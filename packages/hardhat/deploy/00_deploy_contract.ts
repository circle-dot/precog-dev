import {HardhatRuntimeEnvironment} from "hardhat/types";
import {DeployFunction} from "hardhat-deploy/types";
import {PrecogToken, PrecogMasterV7, PrecogMarketV7} from "../typechain-types";
import {DeployResult} from "hardhat-deploy/dist/types";
import {TransactionReceipt} from "ethers";

/**
 * Deploys Precog contracts script
 * @param hre HardhatRuntimeEnvironment object.
 */
const deployContracts: DeployFunction = async function (hre: HardhatRuntimeEnvironment): Promise<void> {
    // Already deployed and Deprecated contracts:
    // - PrecogToken: 0x7779ec685Aa0bf5483B3e0c15dAf246d2d978888 (latest)
    // - PrecogMasterV1: 0x1eB90323aE74E5FBc3241c1D074cFd0b117d7e8E
    // - PrecogMasterV2: 0x0D512A2176737Fdb5C9973DB92fB100A234cD738
    // - ConditionalTokensV2: 0xAac4F52016bc3A97D0d841A90f51fA1d7C2BB52b
    // - PrecogMasterV3: 0x3f408C67cE37eA69e1FEd59ABA78389EdA3d5b9c
    // - ConditionalTokensV3: 0x065d23d57C45459fA5e14DAB84F3501c38728F27
    // - PrecogMasterV4 0x1eB088E48341F22385c14E2bD25D7Eccc6BB496B
    // - PrecogMasterV6 0x16D24dE99e3282F153B72229a3c23959cC20FdA3
    // - PrecogMasterV7 0x5fEa67Ef543615Bf8A6141AD63095e74c94Af1C4 (latest)
    // - PrecogMarketV3: 0x77AeDD00A0F057aEb140319920BcD555D8273A62
    // - PrecogMarketV4: 0xE1781EF8d232b31aADB34E313d129b56c0913015
    // - PrecogMarketV5: 0x95d4E2E5c49a76c35E52932FC668fe2D31D35F9B
    // - PrecogMarketV6: 0x0984Bed9E120774820D717df6A4ee217268A7b65
    // - PrecogMarketV7: 0xCA1Ef8240D50c797Fee174a082dF5B47aFB328AE (latest)

    const {deployer} = await hre.getNamedAccounts();
    const {deploy} = hre.deployments;
    const provider = hre.ethers.provider;

    console.log(`\n\n> Deploying at ${hre.network.name}`);
    console.log(`> Chain Id: ${await hre.getChainId()}`);
    console.log(`> Deployer: ${deployer}`);
    const balance: bigint = await provider.getBalance(deployer);
    const balanceInEth: string = hre.ethers.formatEther(balance);
    const lastNonce: number = await provider.getTransactionCount(deployer,"latest");
    console.log(`   Balance: ${balanceInEth} eth`);
    console.log(`     Nonce: ${lastNonce}`);
    console.log("");
    const initialOwner: string = "0x9475A4C1BF5Fc80aE079303f14B523da19619c16";
    let tx: DeployResult;

    // Get already deployed contract
    const preDeployed = '0x7779ec685Aa0bf5483B3e0c15dAf246d2d978888';
    let preToken: PrecogToken = await hre.ethers.getContractAt("PrecogToken", preDeployed);
    const deployedCode = await preToken.getDeployedCode();
    if (deployedCode == null) {
        tx = await deploy("PrecogToken", {
            from: deployer,
            args: [initialOwner],
            log: true, // Shows info about the deploy (tx hash, contract address and gas use)
            autoMine: true,  // Force node to avoid mining wait time
        });
        preToken = await hre.ethers.getContract("PrecogToken", deployer);
    } else {
        tx = {address: preDeployed, newlyDeployed: false, abi: []};
    }
    const precogTokenAddress: string = await preToken.getAddress();
    console.log(`\n> PrecogToken found! (new deploy: ${tx.newlyDeployed})`);
    console.log("  Contract:", precogTokenAddress);
    console.log("      Name:", await preToken.name());
    console.log("    Symbol:", await preToken.symbol());
    console.log("  Decimals:", await preToken.decimals());
    console.log("     Owner:", await preToken.owner());
    console.log("\n");

    const masterName: string = "PrecogMasterV7";
    tx = await deploy(masterName, {
        from: deployer,
        args: [precogTokenAddress, initialOwner],
        log: true, // Shows info about the deployed contract (tx hash, contract address and gas use)
        autoMine: true,  // Force node to avoid mining wait time
    });
    const precogMaster: PrecogMasterV7 = await hre.ethers.getContract(masterName, deployer);
    console.log(`\n> ${masterName} found! (new deploy: ${tx.newlyDeployed})`);
    console.log("     Contract:", await precogMaster.getAddress());
    console.log("        token:", await precogMaster.token());
    console.log("      markets:", await precogMaster.createdMarkets());
    console.log("\n");

    const marketName: string = "PrecogMarketV7";
    tx = await deploy(marketName, {
        from: deployer,
        args: [],
        log: true, // Shows info about the deployed (tx hash, contract address and gas use)
        autoMine: true,  // Force node to avoid mining wait time
    });
    const precogMarket: PrecogMarketV7 = await hre.ethers.getContract(marketName, deployer);
    if (tx.newlyDeployed) {
        await precogMarket.initialize(precogTokenAddress);
    }
    console.log(`\n> ${marketName} found! (new deploy: ${tx.newlyDeployed})`);
    console.log("     Contract:", await precogMarket.getAddress());
    console.log("        token:", await precogMarket.token());
    console.log("        owner:", await precogMarket.owner());
    console.log("\n");

    // Calculate deploy cost and balances and show summary
    const newBalance: bigint = await provider.getBalance(deployer);
    const newBalanceInEth: string = hre.ethers.formatEther(newBalance);
    const deployCost: bigint = balance - newBalance;
    const deployCostInEth: string = hre.ethers.formatEther(deployCost);
    console.log(`> Deployer: ${deployer}`);
    console.log(`   Balance: ${newBalanceInEth} eth`);
    console.log(`      Cost: ${deployCostInEth} eth`);
    if (tx.transactionHash) {
        const receipt: TransactionReceipt | null = await hre.ethers.provider.getTransactionReceipt(tx.transactionHash);
        const gasPrice: bigint | undefined = receipt?.gasPrice;
        if (gasPrice) {
            console.log(`  GasPrice: ${hre.ethers.formatUnits(gasPrice, 'gwei')} gwei`);
        }
    }
    console.log("\n");

    console.log(`> Deploy ended successfully! :-)`);
    console.log("\n");

};

export default deployContracts;
