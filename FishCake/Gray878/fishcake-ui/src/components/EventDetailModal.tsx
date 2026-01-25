/**
 * EventDetailModal Component
 * 
 * Displays event details and allows joining/cancelling events
 */

import { useState, useEffect } from 'react'
import { FishcakeSDK } from 'fishcake-wallet'
import {
  XMarkIcon,
  UserGroupIcon,
  CurrencyDollarIcon,
  CheckCircleIcon,
  XCircleIcon
} from '@heroicons/react/24/outline'
import { useTransaction } from '../hooks/useTransaction'

interface EventItem {
  id: number
  title: string
  description: string
  entryFee: string
  maxParticipants: number
  currentParticipants: number
  creator: string
  isActive: boolean
  chain: string
}

interface EventDetailModalProps {
  event: EventItem
  sdk: FishcakeSDK
  userAddress: string
  onClose: () => void
  onEventUpdated: () => void
}

export function EventDetailModal({
  event,
  sdk,
  userAddress,
  onClose,
  onEventUpdated
}: EventDetailModalProps) {
  const [joining, setJoining] = useState(false)
  const [cancelling, setCancelling] = useState(false)
  const [hasJoined, setHasJoined] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [checkingJoinStatus, setCheckingJoinStatus] = useState(true)
  const { executeTransaction, ToastComponent } = useTransaction()

  // Default chain for events (using Sepolia testnet where contract is deployed)
  const defaultChain = 'sepolia' as const

  useEffect(() => {
    const checkJoinStatus = async () => {
      try {
        const joined = await sdk.hasJoinedEvent(event.id, userAddress, defaultChain)
        setHasJoined(joined)
      } catch (err: any) {
        console.error('Failed to check join status:', err)
      } finally {
        setCheckingJoinStatus(false)
      }
    }
    checkJoinStatus()
  }, [event.id, userAddress])

  const handleJoinEvent = async () => {
    setJoining(true)
    setError(null)

    try {
      await executeTransaction(
        async () => {
          const result = await sdk.joinEvent(event.id, defaultChain)
          return { txHash: result.txHash }
        },
        'Successfully joined event!'
      )
      setHasJoined(true)
      onEventUpdated()
    } catch (err: any) {
      setError(err.message || 'Failed to join event')
    } finally {
      setJoining(false)
    }
  }

  const handleCancelEvent = async () => {
    if (!confirm('Are you sure you want to cancel this event? This action cannot be undone.')) {
      return
    }

    setCancelling(true)
    setError(null)

    try {
      await executeTransaction(
        async () => {
          const result = await sdk.cancelEvent(event.id, defaultChain)
          return { txHash: result.txHash }
        },
        'Event cancelled successfully!'
      )
      setTimeout(() => {
        onEventUpdated()
        onClose()
      }, 2000)
    } catch (err: any) {
      setError(err.message || 'Failed to cancel event')
    } finally {
      setCancelling(false)
    }
  }

  const isCreator = event.creator.toLowerCase() === userAddress.toLowerCase()
  const isFull = event.maxParticipants > 0 && event.currentParticipants >= event.maxParticipants

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-2xl font-semibold text-slate-900">{event.title}</h2>
          <button
            onClick={onClose}
            className="p-2 text-slate-600 hover:text-slate-900 transition-colors"
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Description */}
          <div>
            <h3 className="text-sm font-medium text-slate-700 mb-2">Description</h3>
            <p className="text-slate-600">{event.description}</p>
          </div>

          {/* Event Info */}
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center gap-2 p-3 bg-slate-50 rounded-lg">
              <UserGroupIcon className="w-5 h-5 text-slate-600" />
              <div>
                <p className="text-xs text-slate-500">Participants</p>
                <p className="font-semibold text-slate-900">
                  {event.currentParticipants} / {event.maxParticipants || '∞'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 p-3 bg-slate-50 rounded-lg">
              <CurrencyDollarIcon className="w-5 h-5 text-slate-600" />
              <div>
                <p className="text-xs text-slate-500">Entry Fee</p>
                <p className="font-semibold text-slate-900">
                  {parseFloat(event.entryFee).toFixed(4)} ETH
                </p>
              </div>
            </div>
          </div>

          {/* Status */}
          <div className="flex items-center gap-2">
            {event.isActive ? (
              <>
                <CheckCircleIcon className="w-5 h-5 text-green-600" />
                <span className="text-sm text-green-700">Event is active</span>
              </>
            ) : (
              <>
                <XCircleIcon className="w-5 h-5 text-red-600" />
                <span className="text-sm text-red-700">Event has been cancelled</span>
              </>
            )}
          </div>

          {ToastComponent}

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t border-slate-200">
            {isCreator && event.isActive && (
              <button
                onClick={handleCancelEvent}
                disabled={cancelling}
                className="btn-secondary flex-1"
              >
                {cancelling ? 'Cancelling...' : 'Cancel Event'}
              </button>
            )}

            {!isCreator && event.isActive && (
              <>
                {checkingJoinStatus ? (
                  <div className="flex-1 text-center text-slate-500 text-sm py-3">
                    Checking status...
                  </div>
                ) : hasJoined ? (
                  <div className="flex-1 text-center text-green-700 text-sm py-3 flex items-center justify-center gap-2">
                    <CheckCircleIcon className="w-5 h-5" />
                    You have joined this event
                  </div>
                ) : (
                  <button
                    onClick={handleJoinEvent}
                    disabled={joining || isFull}
                    className="btn-primary flex-1"
                  >
                    {joining ? 'Joining...' : isFull ? 'Event Full' : `Join Event (${parseFloat(event.entryFee).toFixed(4)} ETH)`}
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
