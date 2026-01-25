/**
 * TransactionToast Component
 * 
 * Displays transaction status notifications
 */

import { useEffect, useState } from 'react'
import {
  CheckCircleIcon,
  XCircleIcon,
  InformationCircleIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline'

export type ToastType = 'success' | 'error' | 'info' | 'loading'

interface TransactionToastProps {
  type: ToastType
  message: string
  txHash?: string
  onClose?: () => void
  duration?: number
}

export function TransactionToast({
  type,
  message,
  txHash,
  onClose,
  duration = 5000
}: TransactionToastProps) {
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    if (type !== 'loading' && duration > 0) {
      const timer = setTimeout(() => {
        setVisible(false)
        setTimeout(() => onClose?.(), 300) // Wait for fade out animation
      }, duration)
      return () => clearTimeout(timer)
    }
  }, [type, duration, onClose])

  if (!visible) return null

  const icons = {
    success: <CheckCircleIcon className="w-5 h-5 text-green-600" />,
    error: <XCircleIcon className="w-5 h-5 text-red-600" />,
    info: <InformationCircleIcon className="w-5 h-5 text-blue-600" />,
    loading: <ArrowPathIcon className="w-5 h-5 text-teal-600 animate-spin" />
  }

  const bgColors = {
    success: 'bg-green-50 border-green-200 text-green-800',
    error: 'bg-red-50 border-red-200 text-red-800',
    info: 'bg-blue-50 border-blue-200 text-blue-800',
    loading: 'bg-teal-50 border-teal-200 text-teal-800'
  }

  return (
    <div
      className={`fixed top-20 right-4 z-50 p-4 rounded-lg border shadow-lg transition-all duration-300 ${
        visible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-full'
      } ${bgColors[type]}`}
    >
      <div className="flex items-start gap-3">
        {icons[type]}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium">{message}</p>
          {txHash && (
            <a
              href={`https://etherscan.io/tx/${txHash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs mt-1 underline hover:no-underline"
            >
              View on Explorer: {txHash.slice(0, 10)}...
            </a>
          )}
        </div>
        {type !== 'loading' && onClose && (
          <button
            onClick={() => {
              setVisible(false)
              setTimeout(() => onClose?.(), 300)
            }}
            className="ml-2 text-current opacity-70 hover:opacity-100"
          >
            <XCircleIcon className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  )
}
