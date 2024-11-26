"use client";

import { usePrivy, useWallets } from "@privy-io/react-auth";
import { Balance } from "../Balance";
import { AddressInfoDropdown } from "./AddressInfoDropdown";
import { AddressQRCodeModal } from "./AddressQRCodeModal";
import { Address } from "viem";
import { useNetworkColor } from "~~/hooks/scaffold-eth";
import { useTargetNetwork } from "~~/hooks/scaffold-eth/useTargetNetwork";
import { getBlockExplorerAddressLink } from "~~/utils/scaffold-eth";

export const PrivyCustomConnectButton = () => {
  const { login, ready, authenticated } = usePrivy();
  const { wallets } = useWallets();
  const activeWallet = wallets[0]; // Get first connected wallet
  const networkColor = useNetworkColor();
  const { targetNetwork } = useTargetNetwork();

  if (!ready) {
    return null;
  }

  if (!authenticated || !activeWallet) {
    return (
      <button className="btn btn-primary btn-sm" onClick={login} type="button">
        Connect Wallet
      </button>
    );
  }

  const blockExplorerAddressLink = activeWallet.address
    ? getBlockExplorerAddressLink(targetNetwork, activeWallet.address as Address)
    : undefined;

  return (
    <>
      <div className="flex flex-col items-center mr-1">
        <Balance address={activeWallet.address as Address} className="min-h-0 h-auto" />
        <span className="text-xs" style={{ color: networkColor }}>
          {targetNetwork.name}
        </span>
      </div>
      <AddressInfoDropdown
        address={activeWallet.address as Address}
        displayName={activeWallet.address}
        blockExplorerAddressLink={blockExplorerAddressLink}
      />
      <AddressQRCodeModal address={activeWallet.address as Address} modalId="qrcode-modal" />
    </>
  );
};