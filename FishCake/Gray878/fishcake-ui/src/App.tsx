import { useState, useEffect } from 'react'
import { FishcakeSDK } from 'fishcake-wallet'
import { WalletConnect } from './components/WalletConnect'
import { BalancePanel } from './components/BalancePanel'
import { EventList } from './components/EventList'
import { NetworkIndicator } from './components/NetworkIndicator'
import './index.css'

function App() {
  const [sdk, setSdk] = useState<FishcakeSDK | null>(null)
  const [initialized, setInitialized] = useState(false)
  const [walletAddress, setWalletAddress] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Initialize SDK
  useEffect(() => {
    const initSDK = async () => {
      try {
        console.log('Initializing FishcakeSDK...')
        const newSdk = new FishcakeSDK({ debug: true })
        await newSdk.initialize()
        setSdk(newSdk)
        setInitialized(true)
        console.log('FishcakeSDK initialized successfully')
      } catch (err: any) {
        console.error('Failed to initialize SDK:', err)
        setError(err.message || 'Failed to initialize SDK')
        setInitialized(true) // Set to true so we can show error
      }
    }
    initSDK()
  }, [])

  const handleWalletConnected = (address: string) => {
    setWalletAddress(address)
  }

  if (!initialized) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-500 mx-auto mb-4"></div>
          <p className="text-slate-600">Initializing Fishcake Wallet...</p>
        </div>
      </div>
    )
  }

  if (error || !sdk) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <h2 className="text-xl font-bold text-red-900 mb-2">Initialization Error</h2>
            <p className="text-red-700 mb-4">{error || 'Failed to initialize SDK'}</p>
            <button
              onClick={() => window.location.reload()}
              className="btn-primary"
            >
              Reload Page
            </button>
          </div>
          <div className="mt-4 text-sm text-slate-600">
            <p>Please check the browser console for more details.</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Navigation Bar */}
      <nav className="bg-white border-b border-slate-200 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-br from-teal-500 to-cyan-600 rounded-lg flex items-center justify-center">
                <span className="text-white text-lg font-bold">🐟</span>
              </div>
              <h1 className="text-xl font-bold text-slate-900">Fishcake Wallet</h1>
              <span className="text-xs px-2 py-1 bg-teal-100 text-teal-700 rounded-full font-medium">
                Multi-Chain
              </span>
            </div>
            {walletAddress && (
              <div className="flex items-center gap-3">
                <NetworkIndicator sdk={sdk} />
                <div className="px-3 py-1.5 bg-slate-100 border border-slate-200 rounded-lg">
                  <span className="text-sm text-slate-600 font-mono">
                    {walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {!walletAddress ? (
          <WalletConnect sdk={sdk} onWalletConnected={handleWalletConnected} />
        ) : (
          <div className="space-y-8">
            <BalancePanel sdk={sdk} address={walletAddress} />
            <EventList sdk={sdk} address={walletAddress} />
          </div>
        )}
      </main>
    </div>
  )
}

export default App
