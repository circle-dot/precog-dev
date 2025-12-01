"use client";

import React, { useState } from "react";
import type { NextPage } from "next";
import { usePublicClient, useWalletClient } from "wagmi";
import { parseEther } from "viem";
import { getBlockExplorerAddressLink, notification } from "~~/utils/scaffold-eth";
import { getContractsByNetwork } from "~~/utils/scaffold-eth/contractsData";
import { ArrowTopRightOnSquareIcon } from "@heroicons/react/24/outline";
import { useTargetNetwork } from "~~/hooks/scaffold-eth/useTargetNetwork";
import { toDateString } from "~~/utils/dates";

const Oracle: NextPage = () => {
  const publicClient = usePublicClient();
  const { data: walletClient } = useWalletClient();
  const { targetNetwork } = useTargetNetwork();

  // Get oracle info for current network
  const contractsData = getContractsByNetwork(targetNetwork.id);
  const oracle_address = contractsData.PrecogRealityOracleV2?.address;
  const oracle_abi = contractsData.PrecogRealityOracleV2?.abi;

  // Form states
  const [marketId, setMarketId] = useState("");
  const [marketAddress, setMarketAddress] = useState("");
  const [reporters, setReporters] = useState("");
  const [question, setQuestion] = useState("");
  const [outcomes, setOutcomes] = useState("");
  const [category, setCategory] = useState("");
  const [bounty, setBounty] = useState("");
  const [bond, setBond] = useState("");
  const [templateId] = useState("2");
  const [timeout] = useState("86400");
  const [answer, setAnswer] = useState("");

  // Market info states
  const [questionInfo, setQuestionInfo] = useState<any>(null);
  const [resultInfo, setResultInfo] = useState<any>(null);

  // Contract addresses states
  const [precogMasterAddress, setPrecogMasterAddress] = useState<string>("");
  const [realityAddress, setRealityAddress] = useState<string>("");
  const [arbitratorAddress, setArbitratorAddress] = useState<string>("");

  const handleRegisterMarket = async () => {
    if (!walletClient || !publicClient) {
      notification.error("Please connect your wallet");
      return;
    }

    try {
      const reporterArray = reporters.trim() === ""
        ? []
        : reporters.split(",").map(addr => addr.trim() as `0x${string}`);

      console.log("Registering market with args:", {
        marketId: BigInt(marketId),
        marketAddress,
        reporterArray
      });

      const { request } = await publicClient.simulateContract({
        address: oracle_address,
        abi: oracle_abi,
        functionName: "registerMarket",
        args: [BigInt(marketId), marketAddress as `0x${string}`, reporterArray],
        account: walletClient.account,
      });
      await walletClient.writeContract(request);
      notification.success("Market registered successfully!");
    } catch (error: any) {
      console.error("Full error object:", error);
      const errorMessage = error?.shortMessage || error?.message || "Failed to register market";
      notification.error(errorMessage);
    }
  };

  // TODO improve the UI to support a better UX, and add some "default" values for the form that now we are assuming
  const handleOpenQuestion = async () => {
    if (!walletClient || !publicClient) {
      notification.error("Please connect your wallet");
      return;
    }

    try {
      const outcomeArray = outcomes.split(",").map(o => o.trim());

      console.log("Opening question with args:", {
        marketId: BigInt(marketId),
        bounty: parseEther(bounty),
        templateId: Number(templateId),
        question,
        outcomeArray,
        category,
        timeout: Number(timeout),
        startTime: Math.floor(Date.now() / 1000)
      });

      const { request } = await publicClient.simulateContract({
        address: oracle_address,
        abi: oracle_abi,
        functionName: "openQuestion",
        args: [
          BigInt(marketId),
          parseEther(bounty),
          Number(templateId),
          question,
          outcomeArray,
          category,
          Number(timeout),
          Math.floor(Date.now() / 1000)
        ],
        account: walletClient.account,
        value: parseEther(bounty),
      });
      await walletClient.writeContract(request);
      notification.success("Question opened successfully!");
    } catch (error: any) {
      const errorMessage = error?.shortMessage || error?.message || "Failed to open question";
      notification.error(errorMessage);
      console.error(error);
    }
  };

  // TODO improve the UI to support a better UX, and add some "default" values for the form that now we are assuming
  const handleAnswerQuestion = async () => {
    if (!walletClient || !publicClient) {
      notification.error("Please connect your wallet");
      return;
    }

    try {
      console.log("Answering question with args:", {
        marketId: BigInt(marketId),
        answer: answer as `0x${string}`,
        maxPrevious: BigInt(0),
        bond: parseEther(bond)
      });

      const { request } = await publicClient.simulateContract({
        address: oracle_address,
        abi: oracle_abi,
        functionName: "answerOpenQuestion",
        args: [BigInt(marketId), answer as `0x${string}`, BigInt(0), parseEther(bond)],
        account: walletClient.account,
        value: parseEther(bond),
      });
      await walletClient.writeContract(request);
      notification.success("Answer submitted successfully!");
    } catch (error: any) {
      const errorMessage = error?.shortMessage || error?.message || "Failed to submit answer";
      notification.error(errorMessage);
      console.error(error);
    }
  };

  const handleReportResult = async () => {
    if (!walletClient || !publicClient) {
      notification.error("Please connect your wallet");
      return;
    }

    try {
      console.log("Reporting result with args:", {
        marketId: BigInt(marketId)
      });

      const { request } = await publicClient.simulateContract({
        address: oracle_address,
        abi: oracle_abi,
        functionName: "reportResult",
        args: [BigInt(marketId)],
        account: walletClient.account
      });
      await walletClient.writeContract(request);
      notification.success("Result reported successfully!");
    } catch (error: any) {
      const errorMessage = error?.shortMessage || error?.message || "Failed to report result";
      notification.error(errorMessage);
      console.error(error);
    }
  };

  const fetchQuestionInfo = async () => {
    if (!publicClient) {
      notification.error("Please connect your wallet");
      return;
    }

    try {
      const data = await publicClient.readContract({
        address: oracle_address,
        abi: oracle_abi,
        functionName: "getRealityQuestionInfo",
        args: [BigInt(marketId)],
      });
      setQuestionInfo(data);
    } catch (error: any) {
      const errorMessage = error?.shortMessage || error?.message || "Failed to fetch question info";
      notification.error(errorMessage);
      console.error("Failed to fetch question info:", error);
    }
  };

  const fetchResultInfo = async () => {
    if (!publicClient) {
      notification.error("Please connect your wallet");
      return;
    }

    try {
      const data = await publicClient.readContract({
        address: oracle_address,
        abi: oracle_abi,
        functionName: "getRealityResultInfo",
        args: [BigInt(marketId)],
      });
      setResultInfo(data);
    } catch (error: any) {
      const errorMessage = error?.shortMessage || error?.message || "Failed to fetch result info";
      notification.error(errorMessage);
      console.error("Failed to fetch result info:", error);
    }
  };

  const fetchPrecogMaster = async () => {
    if (!publicClient) {
      notification.error("Please connect your wallet");
      return;
    }

    try {
      const data = await publicClient.readContract({
        address: oracle_address,
        abi: oracle_abi,
        functionName: "precogMaster",
        args: [],
      });
      setPrecogMasterAddress(data as string);
      notification.success("Precog Master address fetched!");
    } catch (error: any) {
      const errorMessage = error?.shortMessage || error?.message || "Failed to fetch Precog Master";
      notification.error(errorMessage);
      console.error("Failed to fetch Precog Master:", error);
    }
  };

  const fetchReality = async () => {
    if (!publicClient) {
      notification.error("Please connect your wallet");
      return;
    }

    try {
      const data = await publicClient.readContract({
        address: oracle_address,
        abi: oracle_abi,
        functionName: "reality",
        args: [],
      });
      setRealityAddress(data as string);
      notification.success("Reality address fetched!");
    } catch (error: any) {
      const errorMessage = error?.shortMessage || error?.message || "Failed to fetch Reality";
      notification.error(errorMessage);
      console.error("Failed to fetch Reality:", error);
    }
  };

  const fetchArbitrator = async () => {
    if (!publicClient) {
      notification.error("Please connect your wallet");
      return;
    }

    try {
      const data = await publicClient.readContract({
        address: oracle_address,
        abi: oracle_abi,
        functionName: "arbitrator",
        args: [],
      });
      setArbitratorAddress(data as string);
      notification.success("Arbitrator address fetched!");
    } catch (error: any) {
      const errorMessage = error?.shortMessage || error?.message || "Failed to fetch Arbitrator";
      notification.error(errorMessage);
      console.error("Failed to fetch Arbitrator:", error);
    }
  };

  const [activeTab, setActiveTab] = useState("register");

  return (
    <>
      <div className="flex items-center flex-col flex-grow pt-2">
        <div className="w-full px-4 md:px-12 pt-5">
          {/* Oracle Card - Following MarketList styling */}
          <div className="w-full flex flex-col gap-4 font-mono">
            <div className="flex justify-between items-center mb-4 flex-col sm:flex-row">
              <h2 className="text-2xl font-bold m-0">Precog Oracles</h2>
            </div>

            {/* Oracle Info Card */}
            <div className="collapse collapse-arrow bg-base-100 transition-colors duration-300 rounded-lg shadow-lg shadow-primary/10">
              <input type="checkbox" className="peer" defaultChecked />
              <div className="collapse-title peer-checked:bg-base-200/10 text-xs">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                    <h3 className="text-lg font-bold text-base-content/70 break-words m-0">
                      <span className="text-base-content/70 mr-2">{'>'}</span>
                      PRECOG REALITY ORACLE V2
                    </h3>
                    <div className="text-sm">
                      <span className="text-base-content/70">
                        (using reality.eth for market resolution)
                      </span>
                    </div>
                  </div>
                  <div className="font-bold z-10">
                    {oracle_address ? (
                      <a
                        href={getBlockExplorerAddressLink(targetNetwork, oracle_address)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 hover:underline text-accent break-all"
                      >
                        {oracle_address}
                        <ArrowTopRightOnSquareIcon className="w-3 h-3 flex-shrink-0" />
                      </a>
                    ) : (
                      <span className="text-base-content/70">[Not deployed]</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Oracle Content */}
              <div className="collapse-content bg-base-300/20 text-sm">
                <div className="pt-4 flex flex-col gap-4">
                  {/* Tab Navigation */}
                  <div className="flex justify-start">
                    <div className="flex gap-2 font-mono flex-wrap">
                      {[
                        { id: "register", label: "REGISTER" },
                        { id: "question", label: "QUESTION" },
                        { id: "answer", label: "ANSWER" },
                        { id: "result", label: "RESULT" },
                        { id: "info", label: "INFO" },
                        { id: "contracts", label: "CONTRACTS" }
                      ].map(tab => (
                        <button
                          key={tab.id}
                          className={`btn btn-sm ${activeTab === tab.id ? "btn-accent" : "btn-ghost"}`}
                          onClick={() => setActiveTab(tab.id)}
                        >
                          {tab.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Tab Content */}
                  <div className="mt-4">
                    <div className="max-w-3xl">
                      {/* Register Tab */}
                      {activeTab === "register" && (
                        <div className="gap-2 flex flex-col">
                          <h4 className="font-bold text-base-content/70 m-0">:: Register Market ::</h4>
                          <div className="p-4 border border-dashed border-base-content/20 rounded-md flex flex-col gap-3">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                              <input
                                type="text"
                                placeholder="MARKET ID"
                                className="input input-bordered input-sm font-mono text-center"
                                value={marketId}
                                onChange={e => setMarketId(e.target.value)}
                              />
                              <input
                                type="text"
                                placeholder="MARKET ADDRESS"
                                className="input input-bordered input-sm font-mono text-center"
                                value={marketAddress}
                                onChange={e => setMarketAddress(e.target.value)}
                              />
                            </div>
                            <input
                              type="text"
                              placeholder="REPORTERS (COMMA-SEPARATED)"
                              className="input input-bordered input-sm font-mono text-center"
                              value={reporters}
                              onChange={e => setReporters(e.target.value)}
                            />
                            <button
                              className="btn btn-accent btn-sm font-mono"
                              onClick={handleRegisterMarket}
                            >
                              REGISTER MARKET
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Question Tab */}
                      {activeTab === "question" && (
                        <div className="gap-2 flex flex-col">
                          <h4 className="font-bold text-base-content/70 m-0">:: Open Question ::</h4>
                          <div className="p-4 border border-dashed border-base-content/20 rounded-md flex flex-col gap-3">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                              <input
                                type="text"
                                placeholder="MARKET ID"
                                className="input input-bordered input-sm font-mono text-center"
                                value={marketId}
                                onChange={e => setMarketId(e.target.value)}
                              />
                              <input
                                type="text"
                                placeholder="BOUNTY (ETH)"
                                className="input input-bordered input-sm font-mono text-center"
                                value={bounty}
                                onChange={e => setBounty(e.target.value)}
                              />
                            </div>
                            <input
                              type="text"
                              placeholder="QUESTION"
                              className="input input-bordered input-sm font-mono text-center"
                              value={question}
                              onChange={e => setQuestion(e.target.value)}
                            />
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                              <input
                                type="text"
                                placeholder="OUTCOMES (COMMA-SEPARATED)"
                                className="input input-bordered input-sm font-mono text-center"
                                value={outcomes}
                                onChange={e => setOutcomes(e.target.value)}
                              />
                              <input
                                type="text"
                                placeholder="CATEGORY"
                                className="input input-bordered input-sm font-mono text-center"
                                value={category}
                                onChange={e => setCategory(e.target.value)}
                              />
                            </div>
                            <button
                              className="btn btn-accent btn-sm font-mono"
                              onClick={handleOpenQuestion}
                            >
                              OPEN QUESTION
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Answer Tab */}
                      {activeTab === "answer" && (
                        <div className="gap-2 flex flex-col">
                          <h4 className="font-bold text-base-content/70 m-0">:: Submit Answer ::</h4>
                          <div className="p-4 border border-dashed border-base-content/20 rounded-md flex flex-col gap-3">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                              <input
                                type="text"
                                placeholder="MARKET ID"
                                className="input input-bordered input-sm font-mono text-center"
                                value={marketId}
                                onChange={e => setMarketId(e.target.value)}
                              />
                              <input
                                type="text"
                                placeholder="BOND (ETH)"
                                className="input input-bordered input-sm font-mono text-center"
                                value={bond}
                                onChange={e => setBond(e.target.value)}
                              />
                            </div>
                            <input
                              type="text"
                              placeholder="ANSWER (BYTES32)"
                              className="input input-bordered input-sm font-mono text-center"
                              value={answer}
                              onChange={e => setAnswer(e.target.value)}
                            />
                            <button
                              className="btn btn-accent btn-sm font-mono"
                              onClick={handleAnswerQuestion}
                            >
                              SUBMIT ANSWER
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Result Tab */}
                      {activeTab === "result" && (
                        <div className="gap-2 flex flex-col">
                          <h4 className="font-bold text-base-content/70 m-0">:: Report Result ::</h4>
                          <div className="p-4 border border-dashed border-base-content/20 rounded-md flex flex-col gap-3">
                            <input
                              type="text"
                              placeholder="MARKET ID"
                              className="input input-bordered input-sm font-mono text-center"
                              value={marketId}
                              onChange={e => setMarketId(e.target.value)}
                            />
                            <button
                              className="btn btn-accent btn-sm font-mono"
                              onClick={handleReportResult}
                            >
                              REPORT RESULT
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Info Tab */}
                      {activeTab === "info" && (
                        <div className="gap-2 flex flex-col">
                          <h4 className="font-bold text-base-content/70 m-0">:: Market Information ::</h4>
                          <div className="p-4 border border-dashed border-base-content/20 rounded-md flex flex-col gap-3">
                            <input
                              type="text"
                              placeholder="MARKET ID"
                              className="input input-bordered input-sm font-mono text-center"
                              value={marketId}
                              onChange={e => setMarketId(e.target.value)}
                            />
                            <div className="flex gap-2">
                              <button
                                className="btn btn-accent btn-sm font-mono flex-1"
                                onClick={fetchQuestionInfo}
                              >
                                FETCH QUESTION
                              </button>
                              <button
                                className="btn btn-accent btn-sm font-mono flex-1"
                                onClick={fetchResultInfo}
                              >
                                FETCH RESULT
                              </button>
                            </div>

                            {/* Question Info Display */}
                            {questionInfo && (
                              <div className="mt-4">
                                <h5 className="font-bold text-base-content/70 mb-2">Question Info</h5>
                                <div className="bg-base-200 p-3 rounded text-xs space-y-1">
                                  <p className="break-all">
                                    <span className="font-bold text-accent">ID:</span> {questionInfo[0]}
                                  </p>
                                  <p>
                                    <span className="font-bold text-accent">OPENED:</span>{" "}
                                    {Number(questionInfo[1]) <= 0 ? '-' : toDateString(Number(questionInfo[1]))}
                                  </p>
                                  <p>
                                    <span className="font-bold text-accent">TIMEOUT:</span> {questionInfo[2].toString()}s
                                  </p>
                                  <p>
                                    <span className="font-bold text-accent">BOUNTY:</span> {questionInfo[3].toString()} WEI
                                  </p>
                                  <p>
                                    <span className="font-bold text-accent">BOND:</span> {questionInfo[4].toString()} WEI
                                  </p>
                                </div>
                              </div>
                            )}

                            {/* Result Info Display */}
                            {resultInfo && (
                              <div className="mt-4">
                                <h5 className="font-bold text-base-content/70 mb-2">Result Info</h5>
                                <div className="bg-base-200 p-3 rounded text-xs space-y-1">
                                  <p className="break-all">
                                    <span className="font-bold text-accent">ID:</span> {resultInfo[0]}
                                  </p>
                                  <p className="break-all">
                                    <span className="font-bold text-accent">ANSWER:</span> {resultInfo[1]}
                                  </p>
                                  <p>
                                    <span className="font-bold text-accent">FINALIZE:</span>{" "}
                                    {Number(resultInfo[2]) <= 0 ? '-' : toDateString(Number(resultInfo[2]))}
                                  </p>
                                  <p className="break-all">
                                    <span className="font-bold text-accent">HASH:</span> {resultInfo[3]}
                                  </p>
                                  <p>
                                    <span className="font-bold text-accent">STATUS:</span>{" "}
                                    {resultInfo[4] ? "FINALIZED" : "PENDING"}
                                  </p>
                                  <p>
                                    <span className="font-bold text-accent">ARBITRATION:</span>{" "}
                                    {resultInfo[5] ? "YES" : "NO"}
                                  </p>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Contracts Tab */}
                      {activeTab === "contracts" && (
                        <div className="gap-2 flex flex-col">
                          <h4 className="font-bold text-base-content/70 m-0">:: Contract Addresses ::</h4>
                          <div className="p-4 border border-dashed border-base-content/20 rounded-md flex flex-col gap-3">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              {/* Precog Master */}
                              <div className="bg-base-200 p-3 rounded">
                                <h5 className="font-bold text-accent mb-2 text-center">PRECOG MASTER</h5>
                                <div className="space-y-2">
                                  <p className="break-all text-xs">
                                    {precogMasterAddress ? (
                                      <a
                                        href={getBlockExplorerAddressLink(targetNetwork, precogMasterAddress)}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-1 hover:underline break-all"
                                      >
                                        {precogMasterAddress}
                                        <ArrowTopRightOnSquareIcon className="w-3 h-3 flex-shrink-0" />
                                      </a>
                                    ) : (
                                      "Not fetched"
                                    )}
                                  </p>
                                  <button
                                    className="btn btn-accent btn-sm font-mono w-full"
                                    onClick={fetchPrecogMaster}
                                  >
                                    FETCH
                                  </button>
                                </div>
                              </div>

                              {/* Reality.ETH */}
                              <div className="bg-base-200 p-3 rounded">
                                <h5 className="font-bold text-accent mb-2 text-center">REALITY.ETH</h5>
                                <div className="space-y-2">
                                  <p className="break-all text-xs">
                                    {realityAddress ? (
                                      <a
                                        href={getBlockExplorerAddressLink(targetNetwork, realityAddress)}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-1 hover:underline break-all"
                                      >
                                        {realityAddress}
                                        <ArrowTopRightOnSquareIcon className="w-3 h-3 flex-shrink-0" />
                                      </a>
                                    ) : (
                                      "Not fetched"
                                    )}
                                  </p>
                                  <button
                                    className="btn btn-accent btn-sm font-mono w-full"
                                    onClick={fetchReality}
                                  >
                                    FETCH
                                  </button>
                                </div>
                              </div>

                              {/* Arbitrator */}
                              <div className="bg-base-200 p-3 rounded md:col-span-2">
                                <h5 className="font-bold text-accent mb-2 text-center">ARBITRATOR</h5>
                                <div className="space-y-2">
                                  <p className="break-all text-xs">
                                    {arbitratorAddress ? (
                                      <a
                                        href={getBlockExplorerAddressLink(targetNetwork, arbitratorAddress)}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-1 hover:underline break-all"
                                      >
                                        {arbitratorAddress}
                                        <ArrowTopRightOnSquareIcon className="w-3 h-3 flex-shrink-0" />
                                      </a>
                                    ) : (
                                      "Not fetched"
                                    )}
                                  </p>
                                  <button
                                    className="btn btn-accent btn-sm font-mono w-full"
                                    onClick={fetchArbitrator}
                                  >
                                    FETCH
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Oracle;