/**
 * NetworkIndicator Component
 * 
 * Displays current network status with gas price
 * Shows multi-chain support transparently
 */

import { useState, useEffect } from 'react'
import { FishcakeSDK } from 'fishcake-wallet'
import { 
  SignalIcon,
  ChevronDownIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline'

interface NetworkIndicatorProps {
  sdk: FishcakeSDK
}

interface ChainInfo {
  name: string
  displayName: string
  isL2: boolean
  gasPrice: string
  color: string
  icon: string
}

const CHAIN_CONFIGS: Record<string, ChainInfo> = {
  ethereum: {
    name: 'ethereum',
    displayName: 'Ethereum',
    isL2: false,
    gasPrice: '~$2.50',
    color: 'bg-blue-500',
    icon: '⟠'
  },
  bsc: {
    name: 'bsc',
    displayName: 'BSC',
    isL2: false,
    gasPrice: '~$0.10',
    color: 'bg-yellow-500',
    icon: '⬡'
  },
  optimism: {
    name: 'optimism',
    displayName: 'Optimism',
    isL2: true,
    gasPrice: '~$0.01',
    color: 'bg-red-500',
    icon: '⭘'
  },
  base: {
    name: 'base',
    displayName: 'Base',
    isL2: true,
    gasPrice: '~$0.01',
    color: 'bg-blue-600',
    icon: '◆'
  },
  arbitrum: {
    name: 'arbitrum',
    displayName: 'Arbitrum',
    isL2: true,
    gasPrice: '~$0.02',
    color: 'bg-cyan-500',
    icon: '◇'
  },
  sepolia: {
    name: 'sepolia',
    displayName: 'Sepolia',
    isL2: false,
    gasPrice: 'Testnet',
    color: 'bg-purple-500',
    icon: '⚡'
  }
}

export function NetworkIndicator({ sdk: _sdk }: NetworkIndicatorProps) {
  const [currentChain, setCurrentChain] = useState<string>('sepolia')
  const [showDropdown, setShowDropdown] = useState(false)
  const [isConnected, setIsConnected] = useState(false)

  useEffect(() => {
    // Detect current network from MetaMask
    const detectNetwork = async () => {
      if (typeof window !== 'undefined' && window.ethereum) {
        try {
          const chainId = await window.ethereum.request({ method: 'eth_chainId' })
          const chainIdNum = parseInt(chainId, 16)
          
          // Map chainId to chain name
          const chainMap: Record<number, string> = {
            1: 'ethereum',
            56: 'bsc',
            10: 'optimism',
            8453: 'base',
            42161: 'arbitrum',
            11155111: 'sepolia'
          }
          
          const detectedChain = chainMap[chainIdNum] || 'sepolia'
          setCurrentChain(detectedChain)
          setIsConnected(true)
        } catch (error) {
          console.error('Failed to detect network:', error)
        }
      }
    }

    detectNetwork()

    // Listen for network changes
    if (window.ethereum) {
      window.ethereum.on('chainChanged', () => {
        detectNetwork()
      })
    }
  }, [])

  const chainInfo = CHAIN_CONFIGS[currentChain] || CHAIN_CONFIGS.sepolia

  return (
    <div className="relative">
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        className="flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg hover:shadow-md transition-all cursor-pointer"
      >
        {/* Status Indicator */}
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 ${isConnected ? 'bg-green-500' : 'bg-slate-400'} rounded-full ${isConnected ? 'animate-pulse' : ''}`}></div>
          
          {/* Chain Icon */}
          <span className="text-lg">{chainInfo.icon}</span>
          
          {/* Chain Name */}
          <div className="flex flex-col items-start">
            <span className="text-sm font-semibold text-green-900">
              {chainInfo.displayName}
              {chainInfo.isL2 && (
                <span className="ml-1.5 text-xs px-1.5 py-0.5 bg-green-200 text-green-800 rounded">L2</span>
              )}
            </span>
            <span className="text-xs text-green-700">{chainInfo.gasPrice}</span>
          </div>
        </div>
        
        <ChevronDownIcon className={`w-4 h-4 text-green-700 transition-transform ${showDropdown ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown - Supported Networks */}
      {showDropdown && (
        <>
          <div 
            className="fixed inset-0 z-10" 
            onClick={() => setShowDropdown(false)}
          ></div>
          <div className="absolute right-0 mt-2 w-72 bg-white border border-slate-200 rounded-lg shadow-xl z-20 overflow-hidden">
            <div className="p-3 bg-slate-50 border-b border-slate-200">
              <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                <SignalIcon className="w-4 h-4" />
                Supported Networks
              </h3>
              <p className="text-xs text-slate-600 mt-1">
                Fishcake automatically selects the optimal network
              </p>
            </div>
            
            <div className="max-h-80 overflow-y-auto">
              {Object.values(CHAIN_CONFIGS).map((chain) => (
                <div
                  key={chain.name}
                  className={`p-3 hover:bg-slate-50 transition-colors ${
                    currentChain === chain.name ? 'bg-teal-50' : ''
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{chain.icon}</span>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-slate-900">
                            {chain.displayName}
                          </span>
                          {chain.isL2 && (
                            <span className="text-xs px-1.5 py-0.5 bg-green-100 text-green-700 rounded">
                              L2
                            </span>
                          )}
                        </div>
                        <span className="text-xs text-slate-600">
                          Gas: {chain.gasPrice}
                        </span>
                      </div>
                    </div>
                    
                    {currentChain === chain.name && (
                      <CheckCircleIcon className="w-5 h-5 text-teal-600" />
                    )}
                  </div>
                </div>
              ))}
            </div>
            
            <div className="p-3 bg-slate-50 border-t border-slate-200">
              <p className="text-xs text-slate-600">
                💡 <strong>Smart Selection:</strong> System analyzes gas fees, speed, and your balance to choose the best network
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
