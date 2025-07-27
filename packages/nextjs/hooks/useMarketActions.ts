// TODO Using 2 block confirmations for now, need to change to 1. With 2 we assure that the refetch works.

import { useState } from "react";
import { usePublicClient, useAccount, useWriteContract } from "wagmi";
import { erc20Abi, parseEther, formatEther } from "viem";
import { useScaffoldContract } from "./scaffold-eth";
import { useTransactor } from "./scaffold-eth/useTransactor";
import { fromNumberToInt128, fromInt128toNumber } from "~~/utils/numbers";
import { notification } from "~~/utils/scaffold-eth";

export function useMarketActions() {
  const [isPending, setIsPending] = useState(false);
  const { address: connectedAddress } = useAccount();
  const publicClient = usePublicClient();
  const writeTx = useTransactor();
  const { writeContractAsync } = useWriteContract();

  const { data: marketContract } = useScaffoldContract({
    contractName: "PrecogMarketV7",
  });

  const { data: masterContract } = useScaffoldContract({
    contractName: "PrecogMasterV7",
  });


  /**
   * Executes a buy transaction for market shares
   * @param marketId - ID of the market to buy shares in
   * @param marketOutcome - Outcome ID to buy
   * @param sharesToTrade - Number of shares to buy
   * @param marketAddress - Address of the market contract
   * @param maxTokenIn - Maximum amount of tokens to spend
   */
  const executeBuy = async (
    marketId: number,
    marketOutcome: number,
    sharesToTrade: number,
    marketAddress: string,
    maxTokenIn: bigint,
  ) => {
    if (!connectedAddress || !masterContract || !marketContract || !publicClient) {
      notification.error("Missing dependencies for trade execution");
      return;
    }

    setIsPending(true);

    try {
      // Get the collateral token address from the market
      const collateral = await publicClient.readContract({
        address: marketAddress as `0x${string}`,
        abi: marketContract.abi,
        functionName: "token",
      }) as `0x${string}`;

      // Check user's token balance
      const balance = await publicClient.readContract({
        address: collateral,
        abi: erc20Abi,
        functionName: "balanceOf",
        args: [connectedAddress],
      }) as bigint;

      if (balance < maxTokenIn) {
        notification.error("Insufficient token balance");
        return;
      }

      // Get master contract's token for approval check
      const masterToken = await publicClient.readContract({
        address: masterContract.address,
        abi: masterContract.abi,
        functionName: "token",
      }) as `0x${string}`;

      // Check if approval is needed
      if (collateral.toLowerCase() !== masterToken.toLowerCase()) {
        const allowance = await publicClient.readContract({
          address: collateral,
          abi: erc20Abi,
          functionName: "allowance",
          args: [connectedAddress, masterContract.address],
        }) as bigint;

        if (allowance < maxTokenIn) {
          // Approve tokens
          const writeApproveAsync = () =>
            writeContractAsync({
              address: collateral,
              abi: erc20Abi,
              functionName: "approve",
              args: [masterContract.address, maxTokenIn],
            });

          await writeTx(writeApproveAsync, { blockConfirmations: 2 });
        }
      }

      // Execute buy transaction
      const writeBuyAsync = () =>
        writeContractAsync({
          address: masterContract.address,
          abi: masterContract.abi,
          functionName: "marketBuy",
          args: [BigInt(marketId), BigInt(marketOutcome), fromNumberToInt128(sharesToTrade), maxTokenIn],
        });

      const txHash = await writeTx(writeBuyAsync, { blockConfirmations: 2 });
      return txHash;
    } catch (error) {
      console.error("Trade execution failed:", error);
      notification.error("Trade execution failed");
    } finally {
      setIsPending(false);
    }
  };

  /**
   * Executes a sell transaction for market shares
   * @param marketId - ID of the market to sell shares from
   * @param marketOutcome - Outcome ID to sell
   * @param sharesToTrade - Number of shares to sell
   */
  const executeSell = async (
    marketId: number,
    marketOutcome: number,
    sharesToTrade: number,
  ) => {
    if (!connectedAddress || !masterContract || !publicClient) {
      notification.error("Missing dependencies for trade execution");
      return;
    }

    setIsPending(true);

    try {
      // Check user's shares balance
      const accountShares = await publicClient.readContract({
        address: masterContract.address,
        abi: masterContract.abi,
        functionName: "marketAccountShares",
        args: [BigInt(marketId), connectedAddress],
      }) as [bigint, bigint, bigint, bigint, bigint, readonly bigint[]];

      const outcomeBalances = accountShares[5];
      const maxSellAmount = Number(formatEther(outcomeBalances[marketOutcome]));
      const actualSellAmount = Math.min(sharesToTrade, maxSellAmount);

      if (actualSellAmount <= 0) {
        notification.error("Insufficient shares balance");
        return;
      }

      // Get the sell price and calculate minimum tokens to receive
      const priceResult = await publicClient.readContract({
        address: masterContract.address,
        abi: masterContract.abi,
        functionName: "marketSellPrice",
        args: [BigInt(marketId), BigInt(marketOutcome), fromNumberToInt128(actualSellAmount)],
      }) as bigint;

      const price = fromInt128toNumber(priceResult);
      const minTokenOut = price * 0.999; // Add 0.1% slippage
      const minOut = parseEther(minTokenOut.toString());

      // Execute sell transaction
      const writeSellAsync = () =>
        writeContractAsync({
          address: masterContract.address,
          abi: masterContract.abi,
          functionName: "marketSell",
          args: [BigInt(marketId), BigInt(marketOutcome), fromNumberToInt128(actualSellAmount), minOut],
        });

      const txHash = await writeTx(writeSellAsync, { blockConfirmations: 2 });
      return txHash;
    } catch (error) {
      console.error("Sell execution failed:", error);
      notification.error("Sell execution failed");
    } finally {
      setIsPending(false);
    }
  };

    /**
   * Executes a report transaction to set the market outcome
   * @param marketId - The unique identifier of the market
   * @param outcomeId - The outcome to report
   * @param marketAddress - The address of the market contract
   */
    const executeReport = async (marketId: number, outcomeId: number, marketAddress: string) => {
      if (!connectedAddress || !marketContract) {
        notification.error("Missing dependencies for report execution");
        return;
      }
  
      setIsPending(true);
  
      try {
        const writeReportAsync = () =>
          writeContractAsync({
            address: marketAddress as `0x${string}`,
            abi: marketContract.abi,
            functionName: "reportResult",
            args: [BigInt(marketId), BigInt(outcomeId)],
          });
  
        const txHash = await writeTx(writeReportAsync, { blockConfirmations: 2 });
        return txHash;
      } catch (error) {
        console.error("Report execution failed:", error);
        notification.error("Report execution failed");
      } finally {
        setIsPending(false);
      }
    };


  /**
   * Executes a redeem transaction for market shares
   * @param marketId - ID of the market to redeem shares from
   */
  const executeRedeem = async (marketId: number) => {
    if (!connectedAddress || !masterContract || !publicClient) {
      notification.error("Missing dependencies for redeem execution");
      return;
    }

    setIsPending(true);

    try {
      // Execute redeem transaction
      const writeRedeemAsync = () =>
        writeContractAsync({
          address: masterContract.address,
          abi: masterContract.abi,
          functionName: "marketRedeemShares",
          args: [BigInt(marketId)],
        });

      const txHash = await writeTx(writeRedeemAsync, { blockConfirmations: 2 });
      return txHash;
    } catch (error) {
      console.error("Redeem execution failed:", error);
      throw error; // Let useTransactor handle the error notification
    } finally {
      setIsPending(false);
    }
  };

  return {
    executeBuy,
    executeSell,
    executeReport,
    executeRedeem,
    isPending,
    isLoading: !marketContract || !masterContract,
  };
}