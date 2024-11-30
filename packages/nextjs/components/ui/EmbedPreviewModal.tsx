import { useState } from 'react';
import PredictionMarketWidget from '~~/components/ui/prediction-market-widget';

interface EmbedPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  marketName: string;
  marketAddress: string;
  prediction?: string;
  baseUrl: string;
}

export const EmbedPreviewModal = ({ 
  isOpen, 
  onClose, 
  marketName,
  marketAddress,
  prediction,
  baseUrl
}: EmbedPreviewModalProps) => {
  const [theme, setTheme] = useState<'light' | 'dark' | 'custom'>('dark');
  const [referralCode, setReferralCode] = useState('');
  const [customTheme, setCustomTheme] = useState({
    backgroundColor: '#1C2537',
    textColor: '#FFFFFF',
    accentColor: '#ff6b4a'
  });

  // Extract probability and outcome from prediction string
  const getProbabilityAndOutcome = () => {
    if (!prediction) return { probability: 0, outcome: '' };
    const match = prediction.match(/^(.*?)\s*\((\d+\.?\d*)%\)$/);
    if (!match) return { probability: 0, outcome: '' };
    return {
      outcome: match[1].trim(),
      probability: parseFloat(match[2])
    };
  };

  const { probability, outcome } = getProbabilityAndOutcome();

  // Create URL parameters string
  const getUrlParams = () => {
    const params = new URLSearchParams();
    params.append('address', marketAddress);
    
    if (theme === 'custom') {
      params.append('bg', customTheme.backgroundColor);
      params.append('text', customTheme.textColor);
      params.append('accent', customTheme.accentColor);
    } else {
      params.append('theme', theme);
    }
    
    if (referralCode) {
      params.append('ref', referralCode);
    }
    
    return params.toString();
  };

  const iframeCode = `<iframe 
    src="${baseUrl}/embed?${getUrlParams()}"
    width="400"
    height="140"
    frameborder="0"
></iframe>`;

  const themeConfig = {
    light: {
      backgroundColor: '#FFFFFF',
      textColor: '#1C2537',
      accentColor: '#ff6b4a'
    },
    dark: {
      backgroundColor: '#1C2537',
      textColor: '#FFFFFF',
      accentColor: '#ff6b4a'
    }
  };

  const handleThemeChange = (newTheme: 'light' | 'dark') => {
    setTheme(newTheme);
    setCustomTheme(themeConfig[newTheme]);
  };

  const handleCustomThemeChange = (property: keyof typeof customTheme, value: string) => {
    setCustomTheme(prev => ({
      ...prev,
      [property]: value
    }));
    setTheme('custom');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
      <div className="bg-base-200 rounded-xl p-6 max-w-2xl w-full mx-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Embed</h2>
          <button onClick={onClose} className="btn btn-ghost btn-sm">✕</button>
        </div>

        {/* Theme Selection */}
        <div className="flex flex-col gap-4 mb-4">
          <div className="flex gap-4">
            <button 
              className={`btn btn-sm ${theme === 'light' ? 'btn-primary' : 'btn-ghost'}`}
              onClick={() => handleThemeChange('light')}
            >
              Light
            </button>
            <button 
              className={`btn btn-sm ${theme === 'dark' ? 'btn-primary' : 'btn-ghost'}`}
              onClick={() => handleThemeChange('dark')}
            >
              Dark
            </button>
          </div>

          {/* Custom Theme Controls */}
          <div className="grid grid-cols-3 gap-4">
            <div className="flex flex-col gap-2">
              <label className="text-sm">Background Color</label>
              <div className="flex gap-2">
                <input
                  type="color"
                  value={customTheme.backgroundColor}
                  onChange={(e) => handleCustomThemeChange('backgroundColor', e.target.value)}
                  className="w-10 h-10 rounded cursor-pointer"
                />
                <input
                  type="text"
                  value={customTheme.backgroundColor}
                  onChange={(e) => handleCustomThemeChange('backgroundColor', e.target.value)}
                  className="input input-sm input-bordered flex-1"
                />
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-sm">Text Color</label>
              <div className="flex gap-2">
                <input
                  type="color"
                  value={customTheme.textColor}
                  onChange={(e) => handleCustomThemeChange('textColor', e.target.value)}
                  className="w-10 h-10 rounded cursor-pointer"
                />
                <input
                  type="text"
                  value={customTheme.textColor}
                  onChange={(e) => handleCustomThemeChange('textColor', e.target.value)}
                  className="input input-sm input-bordered flex-1"
                />
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-sm">Accent Color</label>
              <div className="flex gap-2">
                <input
                  type="color"
                  value={customTheme.accentColor}
                  onChange={(e) => handleCustomThemeChange('accentColor', e.target.value)}
                  className="w-10 h-10 rounded cursor-pointer"
                />
                <input
                  type="text"
                  value={customTheme.accentColor}
                  onChange={(e) => handleCustomThemeChange('accentColor', e.target.value)}
                  className="input input-sm input-bordered flex-1"
                />
              </div>
            </div>
          </div>

          {/* Referral Code Input */}
          <div className="flex flex-col gap-2">
            <label className="text-sm">Referral Code</label>
            <input
              type="text"
              value={referralCode}
              onChange={(e) => setReferralCode(e.target.value)}
              placeholder="Enter referral code"
              className="input input-sm input-bordered"
            />
          </div>
        </div>

        {/* Preview */}
        <div className="mb-6">
          <h3 className="text-sm font-semibold mb-2">Preview</h3>
          <div className="flex justify-center bg-base-300 p-4 rounded-xl">
            <PredictionMarketWidget
              question={marketName}
              chance={probability}
              outcomeName={outcome}
              imageUrl="/precogLogo.png"
              marketUrl={`${baseUrl}/market?address=${marketAddress}`}
              referralCode={referralCode}
              theme={theme === 'custom' ? customTheme : themeConfig[theme]}
            />
          </div>
        </div>

        {/* Code */}
        <div>
          <h3 className="text-sm font-semibold mb-2">Code</h3>
          <div className="bg-base-300 p-4 rounded-xl">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm">iframe</span>
              <button 
                className="btn btn-xs"
                onClick={() => navigator.clipboard.writeText(iframeCode)}
              >
                Copy
              </button>
            </div>
            <pre className="text-sm overflow-x-auto">
              <code>{iframeCode}</code>
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
};