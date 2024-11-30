"use client";

import { useSearchParams } from "next/navigation";
import { useScaffoldReadContract } from "~~/hooks/scaffold-eth";
import { usePrecogMarketData } from "~~/hooks/usePrecogMarketData";
import { useEffect, useState, Suspense } from "react";
import PredictionMarketWidget from "~~/components/ui/prediction-market-widget";
import React from "react";
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

function EmbedContent() {
  const [baseUrl, setBaseUrl] = useState("");
  const searchParams = useSearchParams();
  const address = searchParams.get('address');
  const referralCode = searchParams.get('ref');
  
  // Get theme parameters
  const themeParam = searchParams.get('theme');
  const bgColor = searchParams.get('bg');
  const textColor = searchParams.get('text');
  const accentColor = searchParams.get('accent');

  // Determine theme configuration
  const theme = React.useMemo(() => {
    if (bgColor && textColor && accentColor) {
      // Custom theme
      return {
        backgroundColor: decodeURIComponent(bgColor),
        textColor: decodeURIComponent(textColor),
        accentColor: decodeURIComponent(accentColor)
      };
    }

    // Preset themes
    if (themeParam === 'light') {
      return {
        backgroundColor: '#FFFFFF',
        textColor: '#1C2537',
        accentColor: '#ff6b4a'
      };
    }

    // Default dark theme
    return {
      backgroundColor: '#1C2537',
      textColor: '#FFFFFF',
      accentColor: '#ff6b4a'
    };
  }, [themeParam, bgColor, textColor, accentColor]);

  useEffect(() => {
    setBaseUrl(window.location.origin);
  }, []);

  const marketStateData = usePrecogMarketData(address as `0x${string}`) as MarketStateData;
  const marketId = marketStateData?.id;
  
  const { data: marketData } = useScaffoldReadContract<"PrecogMasterV7", "markets">({
    contractName: "PrecogMasterV7",
    functionName: "markets",
    args: [marketId] as const
  });

  // Extract probability percentage and outcome name from prediction string
  const getProbabilityAndOutcome = () => {
    if (!marketStateData?.prediction) return { probability: 0, outcome: '' };
    
    // Example prediction string: "YES (82.8%)"
    const match = marketStateData.prediction.match(/^(.*?)\s*\((\d+\.?\d*)%\)$/);
    if (!match) return { probability: 0, outcome: '' };
    
    return {
      outcome: match[1].trim(),  // The outcome name (e.g., "YES")
      probability: parseFloat(match[2])  // The probability (e.g., 82.8)
    };
  };

  const { probability, outcome } = getProbabilityAndOutcome();

  if (!marketData || !marketStateData) return <div>Loading...</div>;

  return (
    <div className="w-full h-screen flex items-center justify-center">
      <PredictionMarketWidget
        question={marketData[0]}
        chance={probability}
        outcomeName={outcome}
        imageUrl="/precogLogo.png"
        marketUrl={`${baseUrl}/market?address=${address}`}
        referralCode={referralCode || undefined}
        resolution={marketStateData?.result}
        theme={theme}
      />
    </div>
  );
}

export default function EmbedPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <EmbedContent />
    </Suspense>
  );
} 