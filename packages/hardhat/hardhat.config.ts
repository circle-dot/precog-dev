import * as dotenv from "dotenv";
dotenv.config();
import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-ethers";
import "@nomicfoundation/hardhat-chai-matchers";
import "@typechain/hardhat";
import "hardhat-gas-reporter";
import "solidity-coverage";
import "@nomicfoundation/hardhat-verify";
import "hardhat-deploy";
import "hardhat-deploy-ethers";

// Key used for Scafold-eth faucet key [Hardhat account 0: 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266]
const faucetPrivateKey: string = "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";
// Key used for 'deployer/admin' in tests [Hardhat account 1: 0x70997970C51812dc3A010C7d01b50e0d17dc79C8]
const ciPrivateKey: string = "0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d";
// Key used for 'caller' in tests [Hardhat account 2: 0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC]
const auxPrivateKey: string = "0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a";
// Key used for 'market_creator' in tests [Hardhat account 3: 0x90F79bf6EB2c4f870365E785982E1f101E93b906]
const aux2PrivateKey: string = "0x7c852118294e51e653712a81e05800f419141751be58f605c371e15141b007a6";

// If not set, it uses the hardhat account private key.
const deployerPrivateKey = process.env.DEPLOYER_PRIVATE_KEY ?? ciPrivateKey;
// If not set, it uses a Scafold-eth public api key
const providerApiKey = process.env.ALCHEMY_API_KEY || "oKxs-03sij-U_N0iOlrSsZFr29-IqbuF";
const etherscanApiKey = process.env.ETHERSCAN_API_KEY || "DNXJA8RX2Q3VZ4URQIWP7Z68CJXQZSC6AW";
const basescanApiKey = process.env.BASESCAN_API_KEY || "DNXJA8RX2Q3VZ4URQIWP7Z68CJXQZSC6AW";


const config: HardhatUserConfig = {
  solidity: {
    compilers : [
      {
        version: "0.7.6",
        settings: {
          optimizer: {
            enabled: true,
            runs: 1000,
          },
        },
      },
    ],
  },
  defaultNetwork: "localhost",
  namedAccounts: {
    deployer: {
      default: 0, // By default, it will take the first Hardhat account as the deployer
    },
  },
  networks: {
    // View the networks that are pre-configured.
    // If the network you are looking for is not here you can add new network settings
    hardhat: {
      // allowUnlimitedContractSize: true,
      forking: {
        // url: `https://eth-mainnet.alchemyapi.io/v2/${providerApiKey}`,
        // url: `https://base-mainnet.g.alchemy.com/v2/${providerApiKey}`,  // Base Mainnet
        // url: `https://base-sepolia.g.alchemy.com/v2/${providerApiKey}`,  // Base Sepolia
        url: `https://worldchain-mainnet.g.alchemy.com/v2/${providerApiKey}`,  // World Mainnet
        // url: `https://worldchain-sepolia.g.alchemy.com/v2/${providerApiKey}`,  // World Sepolia
        enabled: process.env.MAINNET_FORKING_ENABLED === "true",
      },
      accounts: [
        {privateKey: deployerPrivateKey, balance: "200000000000000000"},  // 0.2 eth
        {privateKey: faucetPrivateKey, balance: "1000000000000000000000"},  // 1 eth
        {privateKey: auxPrivateKey, balance: "1000000000000000000000"},  // 1 eth
        {privateKey: aux2PrivateKey, balance: "1000000000000000000000"}  // 1 eth
      ],
    },
    mainnet: {
      url: `https://eth-mainnet.alchemyapi.io/v2/${providerApiKey}`,
      accounts: [deployerPrivateKey],
    },
    sepolia: {
      url: `https://eth-sepolia.g.alchemy.com/v2/${providerApiKey}`,
      accounts: [deployerPrivateKey],
    },
    arbitrum: {
      url: `https://arb-mainnet.g.alchemy.com/v2/${providerApiKey}`,
      accounts: [deployerPrivateKey],
    },
    arbitrumSepolia: {
      url: `https://arb-sepolia.g.alchemy.com/v2/${providerApiKey}`,
      accounts: [deployerPrivateKey],
    },
    optimism: {
      url: `https://opt-mainnet.g.alchemy.com/v2/${providerApiKey}`,
      accounts: [deployerPrivateKey],
    },
    optimismSepolia: {
      url: `https://opt-sepolia.g.alchemy.com/v2/${providerApiKey}`,
      accounts: [deployerPrivateKey],
    },
    polygon: {
      url: `https://polygon-mainnet.g.alchemy.com/v2/${providerApiKey}`,
      accounts: [deployerPrivateKey],
    },
    polygonMumbai: {
      url: `https://polygon-mumbai.g.alchemy.com/v2/${providerApiKey}`,
      accounts: [deployerPrivateKey],
    },
    polygonZkEvm: {
      url: `https://polygonzkevm-mainnet.g.alchemy.com/v2/${providerApiKey}`,
      accounts: [deployerPrivateKey],
    },
    polygonZkEvmTestnet: {
      url: `https://polygonzkevm-testnet.g.alchemy.com/v2/${providerApiKey}`,
      accounts: [deployerPrivateKey],
    },
    gnosis: {
      url: "https://rpc.gnosischain.com",
      accounts: [deployerPrivateKey],
    },
    chiado: {
      url: "https://rpc.chiadochain.net",
      accounts: [deployerPrivateKey],
    },
    base: {
      url: `https://base-mainnet.g.alchemy.com/v2/${providerApiKey}`,
      accounts: [deployerPrivateKey],
    },
    world: {
      url: `https://worldchain-mainnet.g.alchemy.com/v2/${providerApiKey}`,
      accounts: [deployerPrivateKey],
    },
    worldSepolia: {
      url: `https://worldchain-sepolia.g.alchemy.com/v2/${providerApiKey}`,
      accounts: [deployerPrivateKey],
    },
    baseSepolia: {
      url: `https://base-sepolia.g.alchemy.com/v2/${providerApiKey}`,
      accounts: [deployerPrivateKey],
    },
    scrollSepolia: {
      url: "https://sepolia-rpc.scroll.io",
      accounts: [deployerPrivateKey],
    },
    scroll: {
      url: "https://rpc.scroll.io",
      accounts: [deployerPrivateKey],
    },
    pgn: {
      url: "https://rpc.publicgoods.network",
      accounts: [deployerPrivateKey],
    },
    pgnTestnet: {
      url: "https://sepolia.publicgoods.network",
      accounts: [deployerPrivateKey],
    },
    filecoin: {
      url: "https://rpc.ankr.com/filecoin",
      accounts: [deployerPrivateKey],
    },
    filecoinTestnet: {
      url: "https://rpc.ankr.com/filecoin_testnet",
      accounts: [deployerPrivateKey],
    },
  },
  // configuration for harhdat-verify plugin
  etherscan: {
    apiKey: {
      mainnet: etherscanApiKey,
      base: basescanApiKey,
      baseSepolia: basescanApiKey,
    },
    customChains: [
      {
        network: "baseSepolia",
        chainId: 84532,
        urls: {
          apiURL: "https://api-sepolia.basescan.org/api",
          browserURL: "https://sepolia.basescan.org/"
        }
      },
      {
        network: "optimismSepolia",
        chainId: 11155420,
        urls: {
          apiURL: "https://api-sepolia-optimistic.etherscan.io/api",
          browserURL: "https://sepolia-optimism.etherscan.io/"
        }
      }
    ]
  },
  // configuration for etherscan-verify from hardhat-deploy plugin
  verify: {
    etherscan: {
      apiKey: `${etherscanApiKey}`,

    },
  },
  sourcify: {
    enabled: false,
  },
  gasReporter: {
    enabled: process.env.REPORT_GAS === "true",
    currency: 'USD',
    gasPrice: 0.01,
    tokenPrice: "3000.00"
  },
  mocha: {
    timeout: "60000"
  }
};

export default config;
