'use client'

import Image from 'next/image'
import { ArrowRight } from 'lucide-react'

interface PredictionMarketWidgetProps {
  question: string
  chance: number
  imageUrl: string
  marketUrl: string
  referralCode?: string
  resolution?: string
  outcomeName?: string
  theme?: {
    backgroundColor?: string
    textColor?: string
    accentColor?: string
  }
}

export default function PredictionMarketWidget({
  question,
  chance,
  imageUrl,
  marketUrl,
  referralCode,
  resolution,
  outcomeName,
  theme = {
    backgroundColor: '#1C2537',
    textColor: '#FFFFFF',
    accentColor: '#10B981'
  }
}: PredictionMarketWidgetProps) {
  const finalUrl = referralCode ? `${marketUrl}?ref=${referralCode}` : marketUrl
  const normalizedChance = Math.min(Math.max(chance, 0), 100)
  console.log(outcomeName)
  return (
    <div 
      className=" p-4 w-[400px] h-[140px] relative flex flex-col justify-between"
      style={{ backgroundColor: theme.backgroundColor }}
    >
      {/* Top section with image and question */}
      <div>
        <div className="flex items-start gap-3">
          <div className="relative w-12 h-12 rounded-full overflow-hidden flex-shrink-0">
            <Image
              src={imageUrl}
              alt=""
              fill
              className="object-cover"
            />
          </div>
          <div className="flex-1">
            <h2 
              className="text-lg font-semibold leading-tight"
              style={{ color: theme.textColor }}
            >
              {question}
            </h2>
          </div>
        </div>

        {/* Probability indicator below title */}
        {!resolution && (
          <div className="mt-4 flex flex-row items-center justify-center gap-2">
            <span 
              className="text-sm opacity-80"
              style={{ color: theme.textColor }}
            >
              {outcomeName}
            </span>
            <div className="relative flex items-center gap-2">
              <div className="h-1 w-12 rounded-full overflow-hidden bg-white/10">
                <div 
                  className="h-full rounded-full transition-all duration-300"
                  style={{ 
                    width: `${normalizedChance}%`,
                    backgroundColor: theme.accentColor 
                  }}
                />
              </div>
              <span 
                className="text-lg font-bold leading-none"
                style={{ color: theme.textColor }}
              >
                {normalizedChance}%
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Bottom section with logo and link */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span 
            className="text-sm font-medium opacity-70"
            style={{ color: theme.textColor }}
          >
            Precog
          </span>
        </div>
        <a
          href={finalUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1 hover:opacity-90 transition-opacity"
          style={{ color: theme.textColor }}
        >
          <span className="text-sm font-medium">View market</span>
          <ArrowRight className="w-4 h-4" />
        </a>
      </div>
    </div>
  )
}

