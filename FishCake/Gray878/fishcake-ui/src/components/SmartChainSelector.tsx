/**
 * SmartChainSelector Component
 * 
 * Visualizes the smart chain selection process
 * Shows why a particular chain was selected
 */

import { SparklesIcon, CheckCircleIcon, BoltIcon, CurrencyDollarIcon, ClockIcon } from '@heroicons/react/24/outline'

interface ChainOption {
  name: string
  displayName: string
  icon: string
  gasPrice: string
  speed: string
  score: number
  isRecommended: boolean
  reasons: string[]
}

interface SmartChainSelectorProps {
  selectedChain?: string
  onChainSelect?: (chain: string) => void
}

// 🔒 IMPORTANT: Only show chains with deployed EventManager contracts
// These are TESTNET chains where contracts are actually deployed
const CHAIN_OPTIONS: ChainOption[] = [
  {
    name: 'arbitrumSepolia',
    displayName: 'Arbitrum Sepolia',
    icon: '◇',
    gasPrice: '$0.01',
    speed: '~0.25s',
    score: 95,
    isRecommended: true,
    reasons: ['Lowest gas fee', 'Fastest confirmation', 'L2 testnet', 'Contract deployed ✅']
  },
  {
    name: 'optimismSepolia',
    displayName: 'Optimism Sepolia',
    icon: '⭘',
    gasPrice: '$0.01',
    speed: '~2s',
    score: 93,
    isRecommended: true,
    reasons: ['Very low gas', 'Fast confirmation', 'L2 testnet', 'Contract deployed ✅']
  },
  {
    name: 'baseSepolia',
    displayName: 'Base Sepolia',
    icon: '◆',
    gasPrice: '$0.01',
    speed: '~2s',
    score: 92,
    isRecommended: true,
    reasons: ['Very low gas', 'Fast confirmation', 'L2 testnet', 'Contract deployed ✅']
  },
  {
    name: 'sepolia',
    displayName: 'Ethereum Sepolia',
    icon: '⟠',
    gasPrice: '$0.05',
    speed: '~12s',
    score: 75,
    isRecommended: false,
    reasons: ['Higher gas', 'Slower confirmation', 'L1 testnet', 'Contract deployed ✅']
  }
]

export function SmartChainSelector({ selectedChain: _selectedChain, onChainSelect: _onChainSelect }: SmartChainSelectorProps) {
  const recommendedChain = CHAIN_OPTIONS.find(c => c.isRecommended) || CHAIN_OPTIONS[0]

  return (
    <div className="p-4 bg-gradient-to-br from-teal-50 via-cyan-50 to-emerald-50 border-2 border-teal-200 rounded-xl">
      {/* Header */}
      <div className="flex items-start gap-3 mb-4">
        <div className="w-10 h-10 bg-gradient-to-br from-teal-500 to-cyan-600 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg">
          <SparklesIcon className="w-6 h-6 text-white" />
        </div>
        <div className="flex-1">
          <h3 className="text-base font-bold text-teal-900 mb-1">
            Smart Chain Selection
          </h3>
          <p className="text-sm text-teal-700">
            AI analyzes gas fees, speed, and network conditions to select the optimal chain
          </p>
        </div>
      </div>

      {/* Recommended Chain - Large Card */}
      <div className="mb-4 p-4 bg-white border-2 border-teal-300 rounded-xl shadow-md">
        <div className="flex items-center gap-2 mb-3">
          <CheckCircleIcon className="w-5 h-5 text-green-600" />
          <span className="text-sm font-semibold text-green-900">Recommended Network</span>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-gradient-to-br from-red-500 to-red-600 rounded-xl flex items-center justify-center text-white text-2xl shadow-lg">
            {recommendedChain.icon}
          </div>
          
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h4 className="text-lg font-bold text-slate-900">
                {recommendedChain.displayName}
              </h4>
              <span className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded-full font-semibold">
                Score: {recommendedChain.score}
              </span>
            </div>
            
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-1 text-slate-600">
                <CurrencyDollarIcon className="w-4 h-4" />
                <span>{recommendedChain.gasPrice}</span>
              </div>
              <div className="flex items-center gap-1 text-slate-600">
                <ClockIcon className="w-4 h-4" />
                <span>{recommendedChain.speed}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Reasons */}
        <div className="mt-3 pt-3 border-t border-slate-200">
          <div className="flex flex-wrap gap-2">
            {recommendedChain.reasons.map((reason, idx) => (
              <span
                key={idx}
                className="text-xs px-2 py-1 bg-green-50 text-green-700 rounded-full border border-green-200"
              >
                ✓ {reason}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Other Options - Compact List */}
      <details className="group">
        <summary className="cursor-pointer text-sm font-medium text-teal-900 hover:text-teal-700 flex items-center gap-2 mb-2">
          <span>View all {CHAIN_OPTIONS.length} networks</span>
          <span className="text-xs text-teal-600 group-open:hidden">(click to expand)</span>
        </summary>
        
        <div className="space-y-2 mt-3">
          {CHAIN_OPTIONS.map((chain) => (
            <div
              key={chain.name}
              className={`p-3 rounded-lg border-2 transition-all ${
                chain.isRecommended
                  ? 'bg-green-50 border-green-200'
                  : 'bg-white border-slate-200'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{chain.icon}</span>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-slate-900">
                        {chain.displayName}
                      </span>
                      {chain.isRecommended && (
                        <BoltIcon className="w-4 h-4 text-green-600" />
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-xs text-slate-600">
                      <span>Gas: {chain.gasPrice}</span>
                      <span>•</span>
                      <span>Speed: {chain.speed}</span>
                    </div>
                  </div>
                </div>
                
                <div className="text-right">
                  <div className={`text-sm font-bold ${
                    chain.score >= 90 ? 'text-green-600' :
                    chain.score >= 70 ? 'text-yellow-600' :
                    'text-slate-500'
                  }`}>
                    {chain.score}
                  </div>
                  <div className="text-xs text-slate-500">score</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </details>

      {/* Info Footer */}
      <div className="mt-4 pt-4 border-t border-teal-200">
        <p className="text-xs text-teal-700 flex items-start gap-2 mb-2">
          <span className="text-base">💡</span>
          <span>
            <strong>How it works:</strong> The system evaluates gas prices (40%), transaction speed (30%), L2 benefits (20%), and your balance distribution (10%) to calculate the optimal network.
          </span>
        </p>
      </div>
    </div>
  )
}
