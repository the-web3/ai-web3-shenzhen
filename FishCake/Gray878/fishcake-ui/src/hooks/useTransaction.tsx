/**
 * useTransaction Hook
 * 
 * Manages transaction state and provides toast notifications
 */

import { useState, useCallback } from 'react'
import { TransactionToast, ToastType } from '../components/TransactionToast'

interface TransactionState {
  type: ToastType | null
  message: string
  txHash?: string
}

export function useTransaction() {
  const [toast, setToast] = useState<TransactionState | null>(null)

  const showToast = useCallback((type: ToastType, message: string, txHash?: string) => {
    setToast({ type, message, txHash })
  }, [])

  const clearToast = useCallback(() => {
    setToast(null)
  }, [])

  const executeTransaction = useCallback(async (
    transactionFn: () => Promise<{ txHash: string }>,
    successMessage: string
  ) => {
    try {
      showToast('loading', 'Processing transaction...')
      
      const result = await transactionFn()
      
      showToast('success', successMessage, result.txHash)
      return result
    } catch (error: any) {
      showToast('error', error.message || 'Transaction failed')
      throw error
    }
  }, [showToast])

  const ToastComponent = toast ? (
    <TransactionToast
      type={toast.type!}
      message={toast.message}
      txHash={toast.txHash}
      onClose={clearToast}
    />
  ) : null

  return {
    showToast,
    clearToast,
    executeTransaction,
    ToastComponent
  }
}
