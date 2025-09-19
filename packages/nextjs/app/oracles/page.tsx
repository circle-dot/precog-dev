"use client";

import React, { useState } from "react";
import type { NextPage } from "next";
import { usePublicClient, useWalletClient } from "wagmi";
import { parseEther } from "viem";
import { notification } from "~~/utils/scaffold-eth";

// TODO This shouldn't be a constant
const ORACLE_ADDRESS = "0x800f91052149C51a3b3e9F3ed8AF631159d61DBF";
// TODO move this ABI where it belongs
const ORACLE_ABI = [{"inputs":[{"internalType":"address","name":"initialAdmin","type":"address"}],"stateMutability":"nonpayable","type":"constructor"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"bytes32","name":"role","type":"bytes32"},{"indexed":true,"internalType":"bytes32","name":"previousAdminRole","type":"bytes32"},{"indexed":true,"internalType":"bytes32","name":"newAdminRole","type":"bytes32"}],"name":"RoleAdminChanged","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"bytes32","name":"role","type":"bytes32"},{"indexed":true,"internalType":"address","name":"account","type":"address"},{"indexed":true,"internalType":"address","name":"sender","type":"address"}],"name":"RoleGranted","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"bytes32","name":"role","type":"bytes32"},{"indexed":true,"internalType":"address","name":"account","type":"address"},{"indexed":true,"internalType":"address","name":"sender","type":"address"}],"name":"RoleRevoked","type":"event"},{"inputs":[],"name":"ADMIN_ROLE","outputs":[{"internalType":"bytes32","name":"","type":"bytes32"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"DEFAULT_ADMIN_ROLE","outputs":[{"internalType":"bytes32","name":"","type":"bytes32"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"REPORTER_ROLE","outputs":[{"internalType":"bytes32","name":"","type":"bytes32"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"account","type":"address"}],"name":"addAdmin","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"uint256","name":"marketId","type":"uint256"},{"internalType":"address","name":"account","type":"address"}],"name":"addMarketReporter","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"account","type":"address"}],"name":"addReporter","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"uint256","name":"marketId","type":"uint256"},{"internalType":"bytes32","name":"answer","type":"bytes32"},{"internalType":"uint256","name":"maxPrevious","type":"uint256"},{"internalType":"uint256","name":"bond","type":"uint256"}],"name":"answerOpenQuestion","outputs":[],"stateMutability":"payable","type":"function"},{"inputs":[],"name":"arbitrator","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"getRealityBalance","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint256","name":"marketId","type":"uint256"}],"name":"getRealityQuestionInfo","outputs":[{"internalType":"bytes32","name":"questionId","type":"bytes32"},{"internalType":"uint32","name":"openingTS","type":"uint32"},{"internalType":"uint32","name":"timeout","type":"uint32"},{"internalType":"uint256","name":"bounty","type":"uint256"},{"internalType":"uint256","name":"bond","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint256","name":"marketId","type":"uint256"}],"name":"getRealityResultInfo","outputs":[{"internalType":"bytes32","name":"questionId","type":"bytes32"},{"internalType":"bytes32","name":"answer","type":"bytes32"},{"internalType":"uint32","name":"finalizeTS","type":"uint32"},{"internalType":"bytes32","name":"lastHash","type":"bytes32"},{"internalType":"bool","name":"isFinalized","type":"bool"},{"internalType":"bool","name":"isPendingArbitration","type":"bool"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"bytes32","name":"role","type":"bytes32"}],"name":"getRoleAdmin","outputs":[{"internalType":"bytes32","name":"","type":"bytes32"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"bytes32","name":"role","type":"bytes32"},{"internalType":"uint256","name":"index","type":"uint256"}],"name":"getRoleMember","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"bytes32","name":"role","type":"bytes32"}],"name":"getRoleMemberCount","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"bytes32","name":"role","type":"bytes32"},{"internalType":"address","name":"account","type":"address"}],"name":"grantRole","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"bytes32","name":"role","type":"bytes32"},{"internalType":"address","name":"account","type":"address"}],"name":"hasRole","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint256","name":"marketId","type":"uint256"}],"name":"isMarketRegistered","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint256","name":"marketId","type":"uint256"},{"internalType":"address","name":"account","type":"address"}],"name":"isMarketReporter","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint256","name":"marketId","type":"uint256"},{"internalType":"address[]","name":"accounts","type":"address[]"}],"name":"marketRedeemBatch","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"uint256","name":"","type":"uint256"},{"internalType":"address","name":"","type":"address"}],"name":"marketReporters","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint256","name":"","type":"uint256"}],"name":"markets","outputs":[{"internalType":"address","name":"market","type":"address"},{"internalType":"bytes32","name":"questionId","type":"bytes32"},{"internalType":"string","name":"outcomes","type":"string"},{"internalType":"bool","name":"answered","type":"bool"},{"internalType":"uint256","name":"resultIndex","type":"uint256"},{"internalType":"string","name":"resultLabel","type":"string"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"maxAnswerBond","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint256","name":"marketId","type":"uint256"},{"internalType":"uint256","name":"bounty","type":"uint256"},{"internalType":"uint32","name":"templateId","type":"uint32"},{"internalType":"string","name":"question","type":"string"},{"internalType":"string[]","name":"outcomes","type":"string[]"},{"internalType":"string","name":"category","type":"string"},{"internalType":"uint32","name":"timeout","type":"uint32"},{"internalType":"uint32","name":"startTime","type":"uint32"}],"name":"openQuestion","outputs":[{"internalType":"bytes32","name":"questionId","type":"bytes32"}],"stateMutability":"payable","type":"function"},{"inputs":[],"name":"precogMaster","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"reality","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"bytes32","name":"questionId","type":"bytes32"},{"internalType":"bytes32[]","name":"historyHashes","type":"bytes32[]"},{"internalType":"address[]","name":"answerers","type":"address[]"},{"internalType":"uint256[]","name":"bonds","type":"uint256[]"},{"internalType":"bytes32[]","name":"answers","type":"bytes32[]"}],"name":"realityClaimWinnings","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"uint256","name":"bounty","type":"uint256"},{"internalType":"uint32","name":"templateId","type":"uint32"},{"internalType":"string","name":"question","type":"string"},{"internalType":"string[]","name":"outcomes","type":"string[]"},{"internalType":"string","name":"category","type":"string"},{"internalType":"uint32","name":"timeout","type":"uint32"},{"internalType":"uint32","name":"startTime","type":"uint32"},{"internalType":"uint32","name":"nonce","type":"uint32"}],"name":"realityOpenQuestion","outputs":[{"internalType":"bytes32","name":"questionId","type":"bytes32"}],"stateMutability":"payable","type":"function"},{"inputs":[{"internalType":"uint256","name":"bond","type":"uint256"},{"internalType":"bytes32","name":"questionId","type":"bytes32"},{"internalType":"bytes32","name":"answer","type":"bytes32"},{"internalType":"uint256","name":"maxPrevious","type":"uint256"},{"internalType":"address","name":"answerer","type":"address"}],"name":"realitySubmitAnswerFor","outputs":[],"stateMutability":"payable","type":"function"},{"inputs":[],"name":"realityWithdraw","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"uint256","name":"id","type":"uint256"},{"internalType":"address","name":"market","type":"address"},{"internalType":"address[]","name":"initialReporters","type":"address[]"}],"name":"registerMarket","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"account","type":"address"}],"name":"removeAdmin","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"uint256","name":"marketId","type":"uint256"},{"internalType":"address","name":"account","type":"address"}],"name":"removeMarketReporter","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"account","type":"address"}],"name":"removeReporter","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"bytes32","name":"role","type":"bytes32"},{"internalType":"address","name":"account","type":"address"}],"name":"renounceRole","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"uint256","name":"marketId","type":"uint256"}],"name":"reportResult","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"bytes32","name":"role","type":"bytes32"},{"internalType":"address","name":"account","type":"address"}],"name":"revokeRole","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"arbitratorProxy","type":"address"}],"name":"setArbitrator","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"uint256","name":"maxBond","type":"uint256"}],"name":"setMaxAnswerBond","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"master","type":"address"}],"name":"setPrecogMaster","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"realityProxy","type":"address"}],"name":"setReality","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"uint256","name":"marketId","type":"uint256"},{"internalType":"uint32","name":"templateId","type":"uint32"},{"internalType":"string","name":"question","type":"string"},{"internalType":"string[]","name":"outcomes","type":"string[]"},{"internalType":"string","name":"category","type":"string"},{"internalType":"uint32","name":"timeout","type":"uint32"},{"internalType":"uint32","name":"startTime","type":"uint32"},{"internalType":"bytes32","name":"answer","type":"bytes32"},{"internalType":"uint256","name":"bond","type":"uint256"}],"name":"submitResult","outputs":[{"internalType":"bytes32","name":"questionId","type":"bytes32"}],"stateMutability":"payable","type":"function"},{"inputs":[{"internalType":"address","name":"_token","type":"address"}],"name":"withdraw","outputs":[],"stateMutability":"nonpayable","type":"function"},{"stateMutability":"payable","type":"receive"}] as const;

const Oracle: NextPage = () => {
  const publicClient = usePublicClient();
  const { data: walletClient } = useWalletClient();

  // Form states
  const [marketId, setMarketId] = useState("");
  const [marketAddress, setMarketAddress] = useState("");
  const [reporters, setReporters] = useState("");
  const [question, setQuestion] = useState("");
  const [outcomes, setOutcomes] = useState("");
  const [category, setCategory] = useState("");
  const [bounty, setBounty] = useState("");
  const [bond, setBond] = useState("");
  // TODO check if this should be a state or a constant
  const [templateId] = useState("2"); // Binary template by default
  // TODO check if this should be a state or a constant
  const [timeout] = useState("86400"); // 24 hours by default
  const [answer, setAnswer] = useState("");

  // Market info states
  const [questionInfo, setQuestionInfo] = useState<any>(null);
  const [resultInfo, setResultInfo] = useState<any>(null);


  const handleRegisterMarket = async () => {
    if (!walletClient || !publicClient) {
      notification.error("Please connect your wallet");
      return;
    }

    try {
      const reporterArray = reporters.split(",").map(addr => addr.trim() as `0x${string}`);
      const { request } = await publicClient.simulateContract({
        address: ORACLE_ADDRESS,
        abi: ORACLE_ABI,
        functionName: "registerMarket",
        args: [BigInt(marketId), marketAddress as `0x${string}`, reporterArray],
      });
      await walletClient.writeContract(request);
      notification.success("Market registered successfully!");
    } catch (error: any) {
      const errorMessage = error?.shortMessage || error?.message || "Failed to register market";
      notification.error(errorMessage);
      console.error(error);
    }
  };

  const handleOpenQuestion = async () => {
    if (!walletClient || !publicClient) {
      notification.error("Please connect your wallet");
      return;
    }

    try {
      const outcomeArray = outcomes.split(",").map(o => o.trim());
      const { request } = await publicClient.simulateContract({
        address: ORACLE_ADDRESS,
        abi: ORACLE_ABI,
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

  const handleAnswerQuestion = async () => {
    if (!walletClient || !publicClient) {
      notification.error("Please connect your wallet");
      return;
    }

    try {
      const { request } = await publicClient.simulateContract({
        address: ORACLE_ADDRESS,
        abi: ORACLE_ABI,
        functionName: "answerOpenQuestion",
        args: [BigInt(marketId), answer as `0x${string}`, BigInt(0), parseEther(bond)],
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
      const { request } = await publicClient.simulateContract({
        address: ORACLE_ADDRESS,
        abi: ORACLE_ABI,
        functionName: "reportResult",
        args: [BigInt(marketId)],
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
        address: ORACLE_ADDRESS,
        abi: ORACLE_ABI,
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
        address: ORACLE_ADDRESS,
        abi: ORACLE_ABI,
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

  const [activeTab, setActiveTab] = useState("register");

  return (
    <>
      <div className="flex items-center flex-col flex-grow pt-2">
        <div className="w-full px-4 md:px-12 pt-5">
          {/* Oracle Card */}
          <div className="card bg-base-100 shadow-xl">
            <div className="card-body">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="font-mono text-accent text-xl">-- REALITY.ETH ORACLE V1 --</h2>
                  <p className="font-mono text-base-content/70 text-sm mt-2">ORACLE IMPLEMENTATION USING REALITY.ETH FOR MARKET RESOLUTION</p>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <div className="font-mono text-accent text-sm">v1.0.0</div>
                  <div className="font-mono text-xs opacity-70">PRECOG-REALITY</div>
                </div>
              </div>

              {/* Tabs */}
              <div className="flex justify-center mt-8 mb-4">
                <div className="btn-group font-mono">
                  <button 
                    className={`btn btn-sm ${activeTab === "register" ? "btn-accent" : "btn-ghost"}`}
                    onClick={() => setActiveTab("register")}
                  >
                    -- REGISTER --
                  </button>
                  <button 
                    className={`btn btn-sm ${activeTab === "question" ? "btn-accent" : "btn-ghost"}`}
                    onClick={() => setActiveTab("question")}
                  >
                    -- QUESTION --
                  </button>
                  <button 
                    className={`btn btn-sm ${activeTab === "answer" ? "btn-accent" : "btn-ghost"}`}
                    onClick={() => setActiveTab("answer")}
                  >
                    -- ANSWER --
                  </button>
                  <button 
                    className={`btn btn-sm ${activeTab === "result" ? "btn-accent" : "btn-ghost"}`}
                    onClick={() => setActiveTab("result")}
                  >
                    -- RESULT --
                  </button>
                  <button 
                    className={`btn btn-sm ${activeTab === "info" ? "btn-accent" : "btn-ghost"}`}
                    onClick={() => setActiveTab("info")}
                  >
                    -- INFO --
                  </button>
                </div>
              </div>

              {/* Tab Content */}
              <div className="mt-4">
                <div className="max-w-2xl mx-auto">
                  {/* Register Tab */}
                  {activeTab === "register" && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-3 items-center">
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
                      <input
                        type="text"
                        placeholder="REPORTERS (COMMA-SEPARATED)"
                        className="input input-bordered input-sm font-mono text-center md:col-span-2"
                        value={reporters}
                        onChange={e => setReporters(e.target.value)}
                      />
                      <button
                        className="btn btn-accent btn-sm font-mono md:col-span-2"
                        onClick={handleRegisterMarket}
                      >
                        -- REGISTER MARKET --
                      </button>
                    </div>
                  )}

                  {/* Question Tab */}
                  {activeTab === "question" && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-3 items-center">
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
                      <input
                        type="text"
                        placeholder="QUESTION"
                        className="input input-bordered input-sm font-mono text-center md:col-span-2"
                        value={question}
                        onChange={e => setQuestion(e.target.value)}
                      />
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
                      <button
                        className="btn btn-accent btn-sm font-mono md:col-span-2"
                        onClick={handleOpenQuestion}
                      >
                        -- OPEN QUESTION --
                      </button>
                    </div>
                  )}

                  {/* Answer Tab */}
                  {activeTab === "answer" && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-3 items-center">
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
                      <input
                        type="text"
                        placeholder="ANSWER (BYTES32)"
                        className="input input-bordered input-sm font-mono text-center md:col-span-2"
                        value={answer}
                        onChange={e => setAnswer(e.target.value)}
                      />
                      <button
                        className="btn btn-accent btn-sm font-mono md:col-span-2"
                        onClick={handleAnswerQuestion}
                      >
                        -- SUBMIT ANSWER --
                      </button>
                    </div>
                  )}

                  {/* Result Tab */}
                  {activeTab === "result" && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-3 items-center">
                      <input
                        type="text"
                        placeholder="MARKET ID"
                        className="input input-bordered input-sm font-mono text-center"
                        value={marketId}
                        onChange={e => setMarketId(e.target.value)}
                      />
                      <button className="btn btn-accent btn-sm font-mono" onClick={handleReportResult}>
                        -- REPORT RESULT --
                      </button>
                    </div>
                  )}

                  {/* Info Tab */}
                  {activeTab === "info" && (
                    <div className="grid grid-cols-1 gap-y-4">
                      <div className="flex flex-col gap-2">
                        <input
                          type="text"
                          placeholder="MARKET ID"
                          className="input input-bordered input-sm font-mono text-center w-full"
                          value={marketId}
                          onChange={e => setMarketId(e.target.value)}
                        />
                        <div className="flex gap-2">
                          <button
                            className="btn btn-accent btn-sm font-mono flex-1"
                            onClick={fetchQuestionInfo}
                          >
                            -- QUESTION --
                          </button>
                          <button className="btn btn-accent btn-sm font-mono flex-1" onClick={fetchResultInfo}>
                            -- RESULT --
                          </button>
                        </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
                        <div className="space-y-4">
                          {questionInfo && (
                            <div className="font-mono text-sm">
                              <div className="text-accent mb-2 text-center">-- QUESTION INFO --</div>
                              <div className="space-y-1 text-center bg-base-100 p-3 rounded">
                                <p className="break-all">
                                  <span className="text-accent font-semibold">ID:</span> {questionInfo[0]}
                                </p>
                                <p>
                                  <span className="text-accent font-semibold">OPENED:</span>{" "}
                                  {new Date(Number(questionInfo[1]) * 1000).toLocaleString()}
                                </p>
                                <p>
                                  <span className="text-accent font-semibold">TIMEOUT:</span> {questionInfo[2].toString()}s
                                </p>
                                <p>
                                  <span className="text-accent font-semibold">BOUNTY:</span> {questionInfo[3].toString()} WEI
                                </p>
                                <p>
                                  <span className="text-accent font-semibold">BOND:</span> {questionInfo[4].toString()} WEI
                                </p>
                              </div>
                            </div>
                          )}
                        </div>
                        <div className="space-y-4">
                          {resultInfo && (
                            <div className="font-mono text-sm">
                              <div className="text-accent mb-2 text-center">-- RESULT INFO --</div>
                              <div className="space-y-1 text-center bg-base-100 p-3 rounded">
                                <p className="break-all">
                                  <span className="text-accent font-semibold">ID:</span> {resultInfo[0]}
                                </p>
                                <p className="break-all">
                                  <span className="text-accent font-semibold">ANSWER:</span> {resultInfo[1]}
                                </p>
                                <p>
                                  <span className="text-accent font-semibold">FINALIZE:</span>{" "}
                                  {new Date(Number(resultInfo[2]) * 1000).toLocaleString()}
                                </p>
                                <p className="break-all">
                                  <span className="text-accent font-semibold">HASH:</span> {resultInfo[3]}
                                </p>
                                <p>
                                  <span className="text-accent font-semibold">STATUS:</span>{" "}
                                  {resultInfo[4] ? "FINALIZED" : "PENDING"}
                                </p>
                                <p>
                                  <span className="text-accent font-semibold">ARBITRATION:</span>{" "}
                                  {resultInfo[5] ? "YES" : "NO"}
                                </p>
                              </div>
                            </div>
                          )}
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
    </>
  );
};

export default Oracle;