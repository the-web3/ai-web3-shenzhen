/**
 * WalletConnect Component
 * 
 * Handles wallet creation, restoration, and MetaMask connection
 * Following Chain-Abstracted UX principles - user doesn't see chain details
 */

import { useState } from 'react'
import { FishcakeSDK } from 'fishcake-wallet'
import { 
  WalletIcon, 
  KeyIcon, 
  ArrowPathIcon,
  DocumentDuplicateIcon,
  CheckIcon
} from '@heroicons/react/24/outline'

interface WalletConnectProps {
  sdk: FishcakeSDK
  onWalletConnected: (address: string) => void
}

export function WalletConnect({ sdk, onWalletConnected }: WalletConnectProps) {
  const [step, setStep] = useState<'select' | 'create' | 'restore' | 'import' | 'success'>('select')
  const [mnemonic, setMnemonic] = useState('')
  const [privateKey, setPrivateKey] = useState('')
  const [walletInfo, setWalletInfo] = useState<any>(null)
  const [copied, setCopied] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleCreateWallet = async () => {
    setLoading(true)
    setError(null)
    try {
      const wallet = await sdk.createWallet()
      setWalletInfo(wallet)
      setMnemonic(wallet.mnemonic)
      setStep('success')
      onWalletConnected(wallet.address)
    } catch (err: any) {
      setError(err.message || 'Failed to create wallet')
    } finally {
      setLoading(false)
    }
  }

  const handleRestoreWallet = async () => {
    if (!mnemonic.trim()) {
      setError('Please enter your mnemonic phrase')
      return
    }
    setLoading(true)
    setError(null)
    try {
      const wallet = await sdk.restoreFromMnemonic(mnemonic.trim())
      setWalletInfo(wallet)
      setStep('success')
      onWalletConnected(wallet.address)
    } catch (err: any) {
      setError(err.message || 'Failed to restore wallet')
    } finally {
      setLoading(false)
    }
  }

  const handleImportWallet = async () => {
    if (!privateKey.trim()) {
      setError('Please enter your private key')
      return
    }
    setLoading(true)
    setError(null)
    try {
      const wallet = await sdk.importFromPrivateKey(privateKey.trim())
      setWalletInfo(wallet)
      setStep('success')
      onWalletConnected(wallet.address)
    } catch (err: any) {
      setError(err.message || 'Failed to import wallet')
    } finally {
      setLoading(false)
    }
  }

  const handleConnectMetaMask = async () => {
    setLoading(true)
    setError(null)
    try {
      const wallet = await sdk.connectMetaMask()
      setWalletInfo(wallet)
      setStep('success')
      onWalletConnected(wallet.address)
    } catch (err: any) {
      setError(err.message || 'Failed to connect MetaMask')
    } finally {
      setLoading(false)
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (step === 'select') {
    return (
      <div className="max-w-md mx-auto">
        <div className="card">
          <h2 className="text-2xl font-semibold text-slate-900 mb-6">
            Connect Your Wallet
          </h2>
          
          <div className="space-y-4">
            <button
              onClick={handleCreateWallet}
              disabled={loading}
              className="btn-primary w-full flex items-center justify-center gap-2"
            >
              <WalletIcon className="w-5 h-5" />
              Create New Wallet
            </button>
            
            <button
              onClick={() => setStep('restore')}
              className="btn-secondary w-full flex items-center justify-center gap-2"
            >
              <ArrowPathIcon className="w-5 h-5" />
              Restore from Mnemonic
            </button>
            
            <button
              onClick={() => setStep('import')}
              className="btn-secondary w-full flex items-center justify-center gap-2"
            >
              <KeyIcon className="w-5 h-5" />
              Import Private Key
            </button>
            
            {typeof window !== 'undefined' && window.ethereum && (
              <button
                onClick={handleConnectMetaMask}
                disabled={loading}
                className="btn-secondary w-full flex items-center justify-center gap-2"
              >
                <WalletIcon className="w-5 h-5" />
                Connect MetaMask
              </button>
            )}
          </div>
          
          {error && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}
        </div>
      </div>
    )
  }

  if (step === 'restore') {
    return (
      <div className="max-w-md mx-auto">
        <div className="card">
          <h2 className="text-2xl font-semibold text-slate-900 mb-4">
            Restore Wallet
          </h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Mnemonic Phrase
              </label>
              <textarea
                value={mnemonic}
                onChange={(e) => setMnemonic(e.target.value)}
                placeholder="Enter your 12 or 24 word mnemonic phrase"
                className="input min-h-[100px]"
                rows={4}
              />
            </div>
            
            <div className="flex gap-3">
              <button
                onClick={handleRestoreWallet}
                disabled={loading}
                className="btn-primary flex-1"
              >
                {loading ? 'Restoring...' : 'Restore Wallet'}
              </button>
              <button
                onClick={() => {
                  setStep('select')
                  setMnemonic('')
                  setError(null)
                }}
                className="btn-secondary"
              >
                Cancel
              </button>
            </div>
          </div>
          
          {error && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}
        </div>
      </div>
    )
  }

  if (step === 'import') {
    return (
      <div className="max-w-md mx-auto">
        <div className="card">
          <h2 className="text-2xl font-semibold text-slate-900 mb-4">
            Import Private Key
          </h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Private Key
              </label>
              <input
                type="password"
                value={privateKey}
                onChange={(e) => setPrivateKey(e.target.value)}
                placeholder="Enter your private key (with or without 0x)"
                className="input"
              />
            </div>
            
            <div className="flex gap-3">
              <button
                onClick={handleImportWallet}
                disabled={loading}
                className="btn-primary flex-1"
              >
                {loading ? 'Importing...' : 'Import Wallet'}
              </button>
              <button
                onClick={() => {
                  setStep('select')
                  setPrivateKey('')
                  setError(null)
                }}
                className="btn-secondary"
              >
                Cancel
              </button>
            </div>
          </div>
          
          {error && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}
        </div>
      </div>
    )
  }

  if (step === 'success' && walletInfo) {
    return (
      <div className="max-w-md mx-auto">
        <div className="card">
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckIcon className="w-8 h-8 text-green-600" />
            </div>
            <h2 className="text-2xl font-semibold text-slate-900 mb-2">
              Wallet Connected!
            </h2>
            <p className="text-slate-600">
              Your Fishcake wallet is ready to use
            </p>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Wallet Address
              </label>
              <div className="flex items-center gap-2">
                <code className="flex-1 input font-mono text-sm bg-slate-50">
                  {walletInfo.address}
                </code>
                <button
                  onClick={() => copyToClipboard(walletInfo.address)}
                  className="p-2 text-slate-600 hover:text-slate-900 transition-colors"
                >
                  {copied ? (
                    <CheckIcon className="w-5 h-5 text-green-600" />
                  ) : (
                    <DocumentDuplicateIcon className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>
            
            {mnemonic && (
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                <p className="text-sm font-medium text-amber-900 mb-2">
                  ⚠️ Save Your Mnemonic Phrase
                </p>
                <p className="text-xs text-amber-700 mb-3">
                  Write down these words in order. Never share them with anyone.
                </p>
                <div className="flex items-center gap-2">
                  <code className="flex-1 text-xs font-mono bg-white p-2 rounded border border-amber-200">
                    {mnemonic}
                  </code>
                  <button
                    onClick={() => copyToClipboard(mnemonic)}
                    className="p-2 text-amber-700 hover:text-amber-900"
                  >
                    {copied ? (
                      <CheckIcon className="w-5 h-5 text-green-600" />
                    ) : (
                      <DocumentDuplicateIcon className="w-5 h-5" />
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  return null
}
