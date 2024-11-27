import { baseSepolia } from "viem/chains";
import { type PrivyClientConfig } from "@privy-io/react-auth";
import scaffoldConfig from "~~/scaffold.config";

export const PRIVY_APP_ID = scaffoldConfig.privyAppId;

export const getPrivyConfig = (isDarkMode: boolean): PrivyClientConfig => ({
  appearance: {
    theme: isDarkMode ? 'dark' as const : 'light' as const,
    accentColor: '#676FFF',
    logo: '/precogLogo.png',
  },
  loginMethods: ['email', 'wallet'],
  embeddedWallets: {
    createOnLogin: 'users-without-wallets',
  },
  defaultChain: baseSepolia,
  supportedChains: [baseSepolia],
});