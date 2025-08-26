import { wagmiConnectors } from "./wagmiConnectors";
import { Chain, Transport, createClient, fallback, http } from "viem";
import { hardhat, mainnet } from "viem/chains";
import { createConfig } from "wagmi";
import scaffoldConfig from "~~/scaffold.config";
import { getAlchemyHttpUrl, getQuickNodeHttpUrl } from "~~/utils/scaffold-eth";

const { targetNetworks } = scaffoldConfig;

// We always want to have mainnet enabled (ENS resolution, ETH price, etc). But only once.
export const enabledChains = targetNetworks.find((network: Chain) => network.id === 1)
  ? targetNetworks
  : ([...targetNetworks, mainnet] as const);


const createChainTransports = (chainId: number): Transport[] => {
  const transports = [http()]; // Start with public RPC
  
  // Add QuickNode if available
  const quickNodeUrl = getQuickNodeHttpUrl(chainId);
  if (quickNodeUrl) {
    transports.push(http(quickNodeUrl));
  }
  
  // Add Alchemy if available
  const alchemyUrl = getAlchemyHttpUrl(chainId);
  if (alchemyUrl) {
    transports.push(http(alchemyUrl));
  }
  
  return transports;
};

export const wagmiConfig = createConfig({
  chains: enabledChains,
  connectors: wagmiConnectors,
  ssr: true,
  client({ chain }) {
    return createClient({
      chain,
      transport: fallback(createChainTransports(chain.id)),
      batch: {
        multicall: true,
      },
      ...(chain.id !== (hardhat as Chain).id
        ? {
            pollingInterval: scaffoldConfig.pollingInterval,
          }
        : {}),
    });
  },
});
