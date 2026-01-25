/**
 * BalancePanel Component
 * 
 * Displays aggregated balances across all chains
 * Shows chain distribution by default for transparency
 */

import { useState, useEffect } from 'react'
import { FishcakeSDK } from 'fishcake-wallet'
import { 
  WalletIcon,
  ArrowPathIcon,
  ChartBarIcon,
  BoltIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon
} from '@heroicons/react/24/outline'
import { LoadingSkeleton } from './LoadingSkeleton'
import { hasDeployedContract } from '../utils/contractStatus'

interface BalancePanelProps {
  sdk: FishcakeSDK
  address: string
}

// Chain display configuration with network details
const CHAIN_DISPLAY: Record<string, { 
  icon: string
  color: string
  displayName: string
  isL2: boolean
  gasPrice: string
  speed: string
  chainId: number
}> = {
  ethereum: { 
    icon: '⟠', 
    color: 'from-blue-500 to-blue-600', 
    displayName: 'Ethereum', 
    isL2: false,
    gasPrice: '~$2.50',
    speed: '~12s',
    chainId: 1
  },
  bsc: { 
    icon: '⬡', 
    color: 'from-yellow-500 to-yellow-600', 
    displayName: 'BSC', 
    isL2: false,
    gasPrice: '~$0.10',
    speed: '~3s',
    chainId: 56
  },
  optimism: { 
    icon: '⭘', 
    color: 'from-red-500 to-red-600', 
    displayName: 'Optimism', 
    isL2: true,
    gasPrice: '~$0.01',
    speed: '~2s',
    chainId: 10
  },
  base: { 
    icon: '◆', 
    color: 'from-blue-600 to-blue-700', 
    displayName: 'Base', 
    isL2: true,
    gasPrice: '~$0.01',
    speed: '~2s',
    chainId: 8453
  },
  arbitrum: { 
    icon: '◇', 
    color: 'from-cyan-500 to-cyan-600', 
    displayName: 'Arbitrum', 
    isL2: true,
    gasPrice: '~$0.02',
    speed: '~0.25s',
    chainId: 42161
  },
  sepolia: { 
    icon: '⚡', 
    color: 'from-purple-500 to-purple-600', 
    displayName: 'Sepolia', 
    isL2: false,
    gasPrice: 'Testnet',
    speed: '~12s',
    chainId: 11155111
  },
  bscTestnet: {
    icon: '⬡',
    color: 'from-yellow-500 to-yellow-600',
    displayName: 'BSC Testnet',
    isL2: false,
    gasPrice: 'Testnet',
    speed: '~3s',
    chainId: 97
  },
  optimismSepolia: {
    icon: '⭘',
    color: 'from-red-500 to-red-600',
    displayName: 'OP Sepolia',
    isL2: true,
    gasPrice: 'Testnet',
    speed: '~2s',
    chainId: 11155420
  },
  baseSepolia: {
    icon: '◆',
    color: 'from-blue-600 to-blue-700',
    displayName: 'Base Sepolia',
    isL2: true,
    gasPrice: 'Testnet',
    speed: '~2s',
    chainId: 84532
  },
  arbitrumSepolia: {
    icon: '◇',
    color: 'from-cyan-500 to-cyan-600',
    displayName: 'Arb Sepolia',
    isL2: true,
    gasPrice: 'Testnet',
    speed: '~0.25s',
    chainId: 421614
  }
}

export function BalancePanel({ sdk, address }: BalancePanelProps) {
  const [balances, setBalances] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showAllChains, setShowAllChains] = useState(false)

  const loadBalances = async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await sdk.getAllBalances(address)
      setBalances(data)
    } catch (err: any) {
      setError(err.message || 'Failed to load balances')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (address) {
      loadBalances()
    }
  }, [address])

  if (!address) return null

  const totalBalance = balances?.balances.reduce((sum: number, b: any) => {
    return sum + parseFloat(b.nativeBalance || '0')
  }, 0) || 0

  // Separate chains with balance and without
  const chainsWithBalance = balances?.balances.filter((b: any) => parseFloat(b.nativeBalance || '0') > 0) || []
  const chainsWithoutBalance = balances?.balances.filter((b: any) => parseFloat(b.nativeBalance || '0') === 0) || []

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-semibold text-slate-900 flex items-center gap-2">
          <WalletIcon className="w-6 h-6" />
          Your Assets
        </h2>
        <button
          onClick={loadBalances}
          disabled={loading}
          className="p-2 text-slate-600 hover:text-slate-900 transition-colors rounded-lg hover:bg-slate-100"
          title="Refresh balances"
        >
          <ArrowPathIcon className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {loading && !balances && (
        <LoadingSkeleton type="balance" />
      )}

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm mb-4">
          {error}
        </div>
      )}

      {balances && (
        <div className="space-y-6">
          {/* Total Balance Card */}
          <div className="relative overflow-hidden p-6 bg-gradient-to-br from-teal-500 via-cyan-500 to-emerald-500 rounded-xl text-white shadow-lg">
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm opacity-90">Total Balance</p>
                <ChartBarIcon className="w-5 h-5 opacity-75" />
              </div>
              <p className="text-4xl font-bold mb-1">
                {totalBalance.toFixed(4)} ETH
              </p>
              <p className="text-sm opacity-75">
                Across {chainsWithBalance.length} network{chainsWithBalance.length !== 1 ? 's' : ''}
              </p>
            </div>
            {/* Decorative background */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-5 rounded-full -mr-32 -mt-32"></div>
          </div>

          {/* Chain Distribution - Always Visible */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                <span>Network Distribution</span>
                <span className="text-xs px-2 py-1 bg-teal-100 text-teal-700 rounded-full">
                  {chainsWithBalance.length} active
                </span>
              </h3>
            </div>

            {/* Chains with Balance */}
            {chainsWithBalance.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-4">
                {chainsWithBalance.map((balance: any) => {
                  const amount = parseFloat(balance.nativeBalance || '0')
                  const chainConfig = CHAIN_DISPLAY[balance.chain] || CHAIN_DISPLAY.sepolia
                  const percentage = totalBalance > 0 ? (amount / totalBalance * 100).toFixed(1) : '0'
                  
                  return (
                    <div
                      key={balance.chain}
                      className="group relative p-4 bg-white border-2 border-slate-200 rounded-xl hover:border-teal-300 hover:shadow-md transition-all cursor-pointer"
                    >
                      {/* Chain Header */}
                      <div className="flex items-center gap-2 mb-3">
                        <div className={`w-10 h-10 bg-gradient-to-br ${chainConfig.color} rounded-lg flex items-center justify-center text-white text-xl shadow-sm`}>
                          {chainConfig.icon}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold text-slate-900">
                              {chainConfig.displayName}
                            </span>
                            {chainConfig.isL2 && (
                              <span className="text-xs px-1.5 py-0.5 bg-green-100 text-green-700 rounded">
                                L2
                              </span>
                            )}
                          </div>
                          <span className="text-xs text-slate-500">
                            {percentage}% of total
                          </span>
                        </div>
                      </div>

                      {/* Balance */}
                      <div className="space-y-1 mb-3">
                        <p className="text-xl font-bold text-slate-900">
                          {amount.toFixed(4)}
                        </p>
                        <p className="text-xs text-slate-600">
                          ETH
                        </p>
                      </div>

                      {/* Network Info */}
                      <div className="space-y-1.5 mb-3 pb-3 border-b border-slate-100">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-slate-500 flex items-center gap-1">
                            <BoltIcon className="w-3 h-3" />
                            Gas Fee
                          </span>
                          <span className="font-medium text-slate-700">{chainConfig.gasPrice}</span>
                        </div>
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-slate-500 flex items-center gap-1">
                            <ClockIcon className="w-3 h-3" />
                            Speed
                          </span>
                          <span className="font-medium text-slate-700">{chainConfig.speed}</span>
                        </div>
                      </div>

                      {/* Contract Status */}
                      <div className="flex items-center gap-1.5">
                        {hasDeployedContract(balance.chain) ? (
                          <>
                            <CheckCircleIcon className="w-4 h-4 text-green-600" />
                            <span className="text-xs text-green-700 font-medium">Contract Deployed</span>
                          </>
                        ) : (
                          <>
                            <XCircleIcon className="w-4 h-4 text-slate-400" />
                            <span className="text-xs text-slate-500">No Contract</span>
                          </>
                        )}
                      </div>

                      {/* Progress Bar */}
                      <div className="mt-3 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div 
                          className={`h-full bg-gradient-to-r ${chainConfig.color} transition-all duration-500`}
                          style={{ width: `${percentage}%` }}
                        ></div>
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="text-center py-8 px-4 bg-slate-50 border-2 border-dashed border-slate-200 rounded-xl">
                <WalletIcon className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                <p className="text-slate-600 mb-1">No balance found</p>
                <p className="text-sm text-slate-500">
                  Get some testnet ETH to start using Fishcake
                </p>
              </div>
            )}

            {/* Show All Networks Toggle */}
            {chainsWithoutBalance.length > 0 && (
              <button
                onClick={() => setShowAllChains(!showAllChains)}
                className="w-full mt-3 px-4 py-2 text-sm text-slate-600 hover:text-slate-900 hover:bg-slate-50 rounded-lg transition-colors border border-slate-200"
              >
                {showAllChains ? '− Hide' : '+ Show'} {chainsWithoutBalance.length} more network{chainsWithoutBalance.length !== 1 ? 's' : ''}
              </button>
            )}

            {/* Chains without Balance (Collapsed) */}
            {showAllChains && chainsWithoutBalance.length > 0 && (
              <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
                {chainsWithoutBalance.map((balance: any) => {
                  const chainConfig = CHAIN_DISPLAY[balance.chain] || CHAIN_DISPLAY.sepolia
                  
                  return (
                    <div
                      key={balance.chain}
                      className="p-3 bg-slate-50 border border-slate-200 rounded-lg"
                    >
                      <div className="flex items-center gap-3 mb-2">
                        <div className={`w-8 h-8 bg-gradient-to-br ${chainConfig.color} rounded-lg flex items-center justify-center text-white text-base opacity-50`}>
                          {chainConfig.icon}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-medium text-slate-700">
                              {chainConfig.displayName}
                            </p>
                            {chainConfig.isL2 && (
                              <span className="text-xs px-1.5 py-0.5 bg-green-100 text-green-700 rounded">
                                L2
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-slate-500">0 ETH</p>
                        </div>
                      </div>
                      
                      {/* Network Info */}
                      <div className="space-y-1 mb-2">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-slate-400">Gas Fee</span>
                          <span className="text-slate-600">{chainConfig.gasPrice}</span>
                        </div>
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-slate-400">Speed</span>
                          <span className="text-slate-600">{chainConfig.speed}</span>
                        </div>
                      </div>

                      {/* Contract Status */}
                      <div className="flex items-center gap-1.5">
                        {hasDeployedContract(balance.chain) ? (
                          <>
                            <CheckCircleIcon className="w-3.5 h-3.5 text-green-600" />
                            <span className="text-xs text-green-700 font-medium">Available</span>
                          </>
                        ) : (
                          <>
                            <XCircleIcon className="w-3.5 h-3.5 text-red-500" />
                            <span className="text-xs text-red-600 font-medium">Unavailable</span>
                          </>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Info Banner */}
          <div className="p-4 bg-teal-50 border border-teal-200 rounded-lg">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-teal-100 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-teal-600 text-lg">💡</span>
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-teal-900 mb-1">
                  Multi-Chain Balance
                </p>
                <p className="text-xs text-teal-700">
                  Your assets are distributed across multiple networks. Fishcake automatically selects the optimal network for each transaction based on gas fees and speed.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
