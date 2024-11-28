"use client";

import type { NextPage } from "next";
import { useSearchParams } from "next/navigation";
import { useScaffoldReadContract } from "~~/hooks/scaffold-eth";
import { usePrecogMarketData } from "~~/hooks/usePrecogMarketData";
import { useEffect, useState } from "react";

// Add type definition
type MarketStateData = {
  id: bigint;
  owner: string;
  token: string;
  startDate: string;
  endDate: string;
  oracle: string;
  prediction: string;
  result?: string;
  closedDate?: string;
}

const MarketEmbed: NextPage = () => {
  const [baseUrl, setBaseUrl] = useState("");
  const searchParams = useSearchParams();
  const address = searchParams.get('address');

  // Set the base URL after component mounts (client-side)
  useEffect(() => {
    setBaseUrl(window.location.origin);
  }, []);

  const marketStateData = usePrecogMarketData(address as `0x${string}`) as MarketStateData;
  const marketId = marketStateData?.id;
  
  const { data: marketData } = useScaffoldReadContract({
    contractName: "PrecogMasterV7",
    functionName: "markets",
    args: [marketId]
  });

  const marketPrediction = marketStateData?.prediction;
  const isFinished = !!marketStateData?.result;
  const result = marketStateData?.result;

  // Calculate days remaining
  const getDaysRemaining = () => {
    if (!marketStateData?.endDate) return 0;
    const endDate = new Date(marketStateData.endDate);
    const now = new Date();
    const diffTime = endDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 0;
  };

  // Extract probability percentage and outcome from prediction string
  const getPredictionInfo = () => {
    // Example prediction: "MegaMafia (29.0%)"
    const match = marketPrediction?.match(/(.*?)\s*\((\d+\.?\d*)%\)/);
    return {
      outcome: match ? match[1] : "",
      probability: match ? match[2] : "0"
    };
  };

  if (!marketData || !marketStateData) return <div>Loading...</div>;

  const { outcome, probability } = getPredictionInfo();

  return (
    <div className="flex flex-col text-white p-6  w-full h-full min-h-[160px] shadow-lg">
      <div className="flex flex-col gap-4">
        {/* Title and Probability */}
        <div className="flex justify-between items-start gap-4">
          <h2 className="text-xl font-semibold leading-tight flex-grow pr-4">
            {marketData[0]}
          </h2>
          <div className="relative w-16 h-16 flex-shrink-0">
            <svg className="w-16 h-16 transform -rotate-90">
              <circle
                cx="32"
                cy="32"
                r="26"
                stroke="currentColor"
                strokeWidth="6"
                fill="none"
                className="text-gray-700/30"
              />
              <circle
                cx="32"
                cy="32"
                r="26"
                stroke="#ff6b4a"
                strokeWidth="6"
                fill="none"
                strokeDasharray={`${Number(probability) * 1.63} 163`}
                className="drop-shadow-[0_2px_4px_rgba(255,107,74,0.4)]"
              />
            </svg>
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
              <div className="text-lg font-bold">{probability}%</div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-between items-center pt-2">
          <div className="flex items-center gap-2">
            <span className="text-gray-400 font-medium">{getDaysRemaining()}d left</span>
            <a 
              href={`${baseUrl}/market?address=${address}`}
              target="_blank"
              rel="noopener noreferrer" 
              className="px-4 py-1.5 bg-[#2d3348] hover:bg-[#363c56] rounded-lg text-sm font-medium transition-all duration-200 ease-in-out hover:shadow-lg"
            >
              View market →
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MarketEmbed; 