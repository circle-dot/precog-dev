# Precog core

EVM contracts for a Prediction Market platform deployed in Farcaster.
- [Contracts Implementations](/packages/hardhat/contracts)
- [Test Implementations](/packages/hardhat/test)
- [Deploy and Helpers](/packages/hardhat/scripts)
> Farcaster channel: [/precog](https://warpcast.com/~/channel/precog/default)
<hr/>

### Contracts deployed (latest)
-  `PrecogMasterV7`: [0x5fEa67Ef543615Bf8A6141AD63095e74c94Af1C4](https://sepolia.basescan.org/address/0x5fEa67Ef543615Bf8A6141AD63095e74c94Af1C4)
-  `PrecogToken`: [0x7779ec685Aa0bf5483B3e0c15dAf246d2d978888](https://sepolia.basescan.org/address/0x7779ec685aa0bf5483b3e0c15daf246d2d978888)
-  `PrecogMarketV7`: [0xCA1Ef8240D50c797Fee174a082dF5B47aFB328AE](https://sepolia.basescan.org/address/0xCA1Ef8240D50c797Fee174a082dF5B47aFB328AE) (recipe for all markets)
> Generalized backend site: [Precog Core](https://core.precog.market/)
<hr/>

### Prediction Markets and LMSR theory:
- [Research Corner: Gates Building Prediction Market](https://www.cs.utexas.edu/news/2012/research-corner-gates-building-prediction-market)
- [Augur: LMSR and LS-LMSR](https://augur.mystrikingly.com/blog/augur-s-automated-market-maker-the-ls-lmsr)
- [Precog: Interactive LMSR pricing](https://www.desmos.com/calculator/jvy0ci53lm)
<hr/>

## Utility commands
`yarn test`: Run all tests on latest contract implementations (useful to check all requirements and dependencies).

`yarn test-details`: Run tests on latest implementations with verbose details (useful on developing new features).

`yarn test-gas`: Run all test with the gas profiler enabled to check/optimize gas costs (used in GitHub Action in every `main` branch push).

`yarn chain`: Starts a local harhat chain with configured accounts (useful to test initial deploys).

`yarn fork`: Starts a local harhat fork chain with configured accounts (useful to test new version deploys).

`yarn deploy`: Runs deploy script. It's recommended to test it over a fork network before live chain run.

`yarn start`: Runs GUI server at localhost:3000 (useful to test new version and/or features).

`yarn lint`: Runs hardhat and nextjs linters to ensure best practices.

> Note: all available commands could be found on the `package.json` file
<hr/>

## Develop/Contribute
#### Requirements
- [Node (>= v18.17)](https://nodejs.org/en/download/)
- Yarn ([v1](https://classic.yarnpkg.com/en/docs/install/) or [v2+](https://yarnpkg.com/getting-started/install))
- [Git](https://git-scm.com/downloads)

#### Installing dependencies
`yarn install`: This should install all needed dependencies for hardhat & nextjs packages
> Note: after install command ended successfully you can verify all running: `yarn test`  
<hr/>

## Base project Documentation
This project used the Scaffold-ETH-2 as Template. 
Visit the [Docs](https://docs.scaffoldeth.io) to find useful scripts and guides:
- ️ Built using NextJS, RainbowKit, Hardhat, Wagmi and Viem.
