# Precog Dev
This repository contains all smart contracts for the Precog forecasting protocol ([**Precog Markets**](https://precog.market/)).
<hr/>

#### Prediction Markets and LMSR theory:
- [Cultivate Labs: Types of Prediction Markets](https://www.cultivatelabs.com/crowdsourced-forecasting-guide/what-are-the-different-types-of-prediction-markets)
- [Precog: Interactive LS-LMSR Simulator](https://core.precog.market/simulator)
- [Research Corner: Gates Building Prediction Market](https://www.cs.utexas.edu/news/2012/research-corner-gates-building-prediction-market)
- [Augur: LMSR and LS-LMSR](https://augur.mystrikingly.com/blog/augur-s-automated-market-maker-the-ls-lmsr)

## Repository Structure
- [Contracts Implementations](/packages/hardhat/contracts)
- [Test Implementations](/packages/hardhat/test)
- [Deploy and Helpers](/packages/hardhat/scripts)
> Precog Dev site: [**Precog Dev**](https://dev.precog.market/) (here the deployed version of this repo)
<hr/>

## Mainnet Latest Deployments (Base)
- **PrecogMaster**: [0x1eB90323aE74E5FBc3241c1D074cFd0b117d7e8E](https://basescan.org/address/0x1eB90323aE74E5FBc3241c1D074cFd0b117d7e8E)
- **PrecogMarket**: [0xAac4F52016bc3A97D0d841A90f51fA1d7C2BB52b](https://basescan.org/address/0xAac4F52016bc3A97D0d841A90f51fA1d7C2BB52b) (Recipe for all markets)
- **PrecogRealityOracle**: [0xd7bE03206daFa4552ab58CD3CFC191426404C77D](https://basescan.org/address/0xd7bE03206daFa4552ab58CD3CFC191426404C77D) 
> Precog app site: [**Precog Core**](https://core.precog.market/)
<hr/>

## Testnet Latest Deployments (Base Sepolia)
- **PrecogMasterV7**: [0x5fEa67Ef543615Bf8A6141AD63095e74c94Af1C4](https://sepolia.basescan.org/address/0x5fEa67Ef543615Bf8A6141AD63095e74c94Af1C4)
- **PrecogMarketV7**: [0xCA1Ef8240D50c797Fee174a082dF5B47aFB328AE](https://sepolia.basescan.org/address/0xCA1Ef8240D50c797Fee174a082dF5B47aFB328AE) (Recipe for all markets)
- **PrecogRealityOracleV2**: [0xbd8B7cb4924aAdf579b6Dbd77CA6cF6e56029f37](https://sepolia.basescan.org/address/0xbd8B7cb4924aAdf579b6Dbd77CA6cF6e56029f37)
> Precog app site: [**Precog Core Staging**](https://staging-core.precog.market/) 
<hr/>

## Utility commands
`yarn test`: Run all tests on latest contract implementations (useful to check all requirements and dependencies).

`yarn test-details`: Run tests on latest implementations with verbose details (useful on developing new features).

`yarn test-gas`: Run all tests with the gas profiler enabled to check/optimize gas costs.

`yarn chain`: Starts a local hardhat chain with configured accounts (useful to test initial deploys).

`yarn fork`: Starts a local hardhat fork chain with configured accounts (useful to test new version deploys).

`yarn deploy`: Runs deploy script. It's recommended to test it over a fork network before live chain run.

`yarn start`: Runs GUI server (useful to test new releases or features).

`yarn lint`: Runs Hardhat and NextJs linters to ensure best practices.

> Note: all available commands could be found on the `package.json` file
<hr/>

## Develop/Contribute
#### Requirements
- [Node (>= v18.17)](https://nodejs.org/en/download/)
- Yarn ([v1](https://classic.yarnpkg.com/en/docs/install/) or [v2+](https://yarnpkg.com/getting-started/install))
- [Git](https://git-scm.com/downloads)

#### Installing dependencies
`yarn install`: 
<hr/>

## Base project Documentation
This project used the Scaffold-ETH-2 project as template. 
Visit the [Docs](https://docs.scaffoldeth.io) to find useful scripts and guides:
- ️ Built using NextJS, RainbowKit, Hardhat, Wagmi and Viem.
