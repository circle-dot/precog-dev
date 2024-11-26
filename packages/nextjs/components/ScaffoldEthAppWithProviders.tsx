"use client"
import { useEffect, useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useTheme } from "next-themes";
import { Toaster } from "react-hot-toast";
import { WagmiProvider } from "wagmi";
import { Footer } from "~~/components/Footer";
import { Header } from "~~/components/Header";
import { ProgressBar } from "~~/components/scaffold-eth/ProgressBar";
import { useNativeCurrencyPrice } from "~~/hooks/scaffold-eth";
import { useGlobalState } from "~~/services/store/store";
import { wagmiConfig } from "~~/services/web3/wagmiConfig";
import { PrivyProvider } from '@privy-io/react-auth';
import scaffoldConfig from "~~/scaffold.config";
import { baseSepolia } from "viem/chains";
const ScaffoldEthApp = ({ children }: { children: React.ReactNode }) => {
  const price = useNativeCurrencyPrice();
  const setNativeCurrencyPrice = useGlobalState(state => state.setNativeCurrencyPrice);

  useEffect(() => {
    if (price > 0) {
      setNativeCurrencyPrice(price);
    }
  }, [setNativeCurrencyPrice, price]);

  return (
    <>
      <div className="flex flex-col min-h-screen">
        <Header />
        <main className="relative flex flex-col flex-1">{children}</main>
        <Footer />
      </div>
      <Toaster />
    </>
  );
};

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
    },
  },
});

export const ScaffoldEthAppWithProviders = ({ children }: { children: React.ReactNode }) => {
  const { resolvedTheme } = useTheme();
  const isDarkMode = resolvedTheme === "dark";
  const defaultChain = baseSepolia;
  const supportedChains =  [baseSepolia];
  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <ProgressBar />
        <PrivyProvider
          appId={scaffoldConfig.privyAppId}
          config={{
            appearance: {
              theme: isDarkMode ? 'dark' : 'light',
              accentColor: '#676FFF',
              logo: '/precogLogo.png',
            },
            loginMethods: ['email', 'wallet'],
            embeddedWallets: {
              createOnLogin: 'users-without-wallets',
            },
            defaultChain,
            supportedChains,
          }}
        >
          <ScaffoldEthApp>{children}</ScaffoldEthApp>
        </PrivyProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
};