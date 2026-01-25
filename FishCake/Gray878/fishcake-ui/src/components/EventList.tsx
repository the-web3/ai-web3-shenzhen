/**
 * EventList Component
 * 
 * Displays list of events and allows creating new events
 * Chain selection is automatic - user doesn't see it
 */

import { useState, useEffect } from 'react'
import { FishcakeSDK } from 'fishcake-wallet'
import { formatEther } from 'ethers'
import { 
  CalendarIcon,
  PlusIcon,
  UserGroupIcon,
  ArrowPathIcon,
  EyeIcon,
  ClockIcon
} from '@heroicons/react/24/outline'
import { EventDetailModal } from './EventDetailModal'
import { LoadingSkeleton } from './LoadingSkeleton'
import { SmartChainSelector } from './SmartChainSelector'
import { useTransaction } from '../hooks/useTransaction'

// Format timestamp to relative time (e.g., "2 hours ago", "3 days ago")
function formatRelativeTime(timestamp: number): string {
  const now = Math.floor(Date.now() / 1000) // Current time in seconds
  const diff = now - timestamp // Difference in seconds
  
  if (diff < 60) {
    return 'Just now'
  } else if (diff < 3600) {
    const minutes = Math.floor(diff / 60)
    return `${minutes} minute${minutes > 1 ? 's' : ''} ago`
  } else if (diff < 86400) {
    const hours = Math.floor(diff / 3600)
    return `${hours} hour${hours > 1 ? 's' : ''} ago`
  } else if (diff < 604800) {
    const days = Math.floor(diff / 86400)
    return `${days} day${days > 1 ? 's' : ''} ago`
  } else if (diff < 2592000) {
    const weeks = Math.floor(diff / 604800)
    return `${weeks} week${weeks > 1 ? 's' : ''} ago`
  } else {
    const months = Math.floor(diff / 2592000)
    return `${months} month${months > 1 ? 's' : ''} ago`
  }
}

// Format timestamp to readable date (e.g., "Jan 25, 2025 14:30")
function formatDateTime(timestamp: number): string {
  const date = new Date(timestamp * 1000)
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

interface EventListProps {
  sdk: FishcakeSDK
  address: string
}

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
  createdAt: number // Unix timestamp in seconds
}

export function EventList({ sdk, address }: EventListProps) {
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [events, setEvents] = useState<EventItem[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedEvent, setSelectedEvent] = useState<EventItem | null>(null)
  const [creating, setCreating] = useState(false)
  const { executeTransaction, ToastComponent } = useTransaction()

  // Chains where contract is deployed (testnets)
  const deployedChains = ['sepolia', 'optimismSepolia', 'baseSepolia', 'arbitrumSepolia'] as const

  const loadEvents = async () => {
    setLoading(true)
    setError(null)
    try {
      // Query all deployed chains in parallel
      const allEventsPromises = deployedChains.map(async (chain) => {
        try {
          // Get user created events
          const createdIds = await sdk.getUserCreatedEvents(address, chain)
          
          // Get user joined events
          const joinedIds = await sdk.getUserJoinedEvents(address, chain)
          
          // Combine and deduplicate
          const allIds = [...new Set([...createdIds, ...joinedIds])].map(id => Number(id))
          
          // Fetch event details
          const eventResults = await Promise.all(
            allIds.map(async (id) => {
              try {
                const event = await sdk.getEvent(id, chain)
                return { id, event, chain }
              } catch (error) {
                return { id, error, chain }
              }
            })
          )
          
          return eventResults
        } catch (error) {
          console.warn(`Failed to load events from ${chain}:`, error)
          return []
        }
      })
      
      const allResults = (await Promise.all(allEventsPromises)).flat()
      
      const validEvents = allResults
        .filter((result) => 'event' in result)
        .map((result) => (result as { id: number; event: any; chain: string }).event)

      const errorMessages = allResults
        .filter((result) => 'error' in result)
        .map((result) => {
          const error = (result as { id: number; error: unknown; chain: string }).error
          const message = error instanceof Error ? error.message : String(error)
          return `Event ${result.id} on ${(result as any).chain}: ${message}`
        })

      if (errorMessages.length > 0 && validEvents.length === 0) {
        setError(errorMessages.join('\n'))
      }

      setEvents(validEvents.map(e => ({
        id: Number(e.id),
        title: e.title,
        description: e.description,
        entryFee: formatEther(e.entryFee),
        maxParticipants: Number(e.maxParticipants),
        currentParticipants: Number(e.currentParticipants),
        creator: e.creator,
        isActive: e.isActive,
        chain: e.chain,
        createdAt: Number(e.createdAt),
      })).sort((a, b) => b.createdAt - a.createdAt)) // Sort by creation time, newest first
    } catch (err: any) {
      setError(err.message || 'Failed to load events')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (address) {
      loadEvents()
    }
  }, [address])

  const handleCreateEvent = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setCreating(true)
    setError(null)

    const formData = new FormData(e.currentTarget)
    const title = formData.get('title') as string
    const description = formData.get('description') as string
    const entryFee = formData.get('entryFee') as string
    const maxParticipants = parseInt(formData.get('maxParticipants') as string)

    try {
      await executeTransaction(
        async () => {
          const result = await sdk.createEvent({
            title,
            description,
            entryFee,
            maxParticipants,
          })
          return { txHash: result.txHash }
        },
        'Event created successfully!'
      )
      
      setShowCreateForm(false)
      
      // Refresh event list after a short delay
      setTimeout(() => {
        loadEvents()
      }, 2000)
    } catch (err: any) {
      setError(err.message || 'Failed to create event')
    } finally {
      setCreating(false)
    }
  }

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-semibold text-slate-900 flex items-center gap-2">
          <CalendarIcon className="w-6 h-6" />
          Events
        </h2>
        <div className="flex items-center gap-3">
          <button
            onClick={loadEvents}
            disabled={loading}
            className="p-2 text-slate-600 hover:text-slate-900 transition-colors"
            title="Refresh events"
          >
            <ArrowPathIcon className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={() => setShowCreateForm(true)}
            className="btn-primary flex items-center gap-2"
          >
            <PlusIcon className="w-5 h-5" />
            Create Event
          </button>
        </div>
      </div>

      {ToastComponent}

      {showCreateForm && (
        <div className="mb-6 p-6 bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl border-2 border-slate-200 shadow-sm">
          <h3 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
            <CalendarIcon className="w-6 h-6 text-teal-600" />
            Create New Event
          </h3>
          
          {/* Smart Chain Selector - Show before form */}
          <div className="mb-6">
            <SmartChainSelector />
          </div>
          
          <form onSubmit={handleCreateEvent} className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Event Title
              </label>
              <input
                type="text"
                name="title"
                required
                className="input"
                placeholder="e.g., Web3 Developer Meetup"
              />
            </div>
            
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Description
              </label>
              <textarea
                name="description"
                required
                rows={3}
                className="input"
                placeholder="Describe your event..."
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Entry Fee (ETH)
                </label>
                <input
                  type="number"
                  name="entryFee"
                  required
                  step="0.001"
                  min="0"
                  className="input"
                  placeholder="0.01"
                />
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Max Participants
                </label>
                <input
                  type="number"
                  name="maxParticipants"
                  required
                  min="0"
                  className="input"
                  placeholder="100"
                />
              </div>
            </div>
            
            <div className="flex gap-3 pt-2">
              <button
                type="submit"
                disabled={creating}
                className="btn-primary flex-1 flex items-center justify-center gap-2"
              >
                {creating ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    Creating...
                  </>
                ) : (
                  <>
                    <PlusIcon className="w-5 h-5" />
                    Create Event
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowCreateForm(false)
                  setError(null)
                }}
                className="btn-secondary px-8"
              >
                Cancel
              </button>
            </div>
          </form>
          
          {error && (
            <div className="mt-4 p-4 bg-red-50 border-2 border-red-200 rounded-lg text-red-700 text-sm whitespace-pre-wrap">
              <strong>Error:</strong> {error}
            </div>
          )}
        </div>
      )}

      {loading && events.length === 0 && (
        <LoadingSkeleton type="list" />
      )}

      {!loading && events.length === 0 && (
        <div className="text-center py-12 text-slate-500">
          <UserGroupIcon className="w-12 h-12 mx-auto mb-4 text-slate-300" />
          <p>No events yet. Create your first event!</p>
        </div>
      )}

      {!loading && events.length > 0 && (
        <div className="space-y-4">
          {events.map((event) => {
            // Chain display config
            const chainIcons: Record<string, string> = {
              ethereum: '⟠',
              bsc: '⬡',
              optimism: '⭘',
              base: '◆',
              arbitrum: '◇',
              sepolia: '⚡'
            }
            const chainColors: Record<string, string> = {
              ethereum: 'bg-blue-500',
              bsc: 'bg-yellow-500',
              optimism: 'bg-red-500',
              base: 'bg-blue-600',
              arbitrum: 'bg-cyan-500',
              sepolia: 'bg-purple-500'
            }
            
            return (
              <div
                key={event.id}
                className="group p-5 border-2 border-slate-200 rounded-xl hover:border-teal-300 hover:shadow-lg transition-all cursor-pointer bg-white"
                onClick={() => setSelectedEvent(event)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    {/* Event Header with Chain Badge */}
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-bold text-slate-900 group-hover:text-teal-600 transition-colors">
                        {event.title}
                      </h3>
                      {/* Chain Badge */}
                      <div className="flex items-center gap-1.5 px-2 py-1 bg-slate-100 border border-slate-200 rounded-lg">
                        <span className={`w-6 h-6 ${chainColors[event.chain] || 'bg-slate-500'} rounded flex items-center justify-center text-white text-sm`}>
                          {chainIcons[event.chain] || '⚡'}
                        </span>
                        <span className="text-xs font-medium text-slate-700 capitalize">
                          {event.chain}
                        </span>
                      </div>
                    </div>
                    
                    <p className="text-sm text-slate-600 mb-4 line-clamp-2">
                      {event.description}
                    </p>
                    
                    {/* Event Stats */}
                    <div className="flex items-center gap-5 text-sm flex-wrap">
                      <div className="flex items-center gap-1.5 text-slate-600">
                        <UserGroupIcon className="w-4 h-4" />
                        <span className="font-medium">
                          {event.currentParticipants} / {event.maxParticipants || '∞'}
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-1.5 text-slate-600">
                        <span className="font-semibold">Entry:</span>
                        <span>{parseFloat(event.entryFee).toFixed(4)} ETH</span>
                      </div>
                      
                      <div className="flex items-center gap-1.5 text-slate-500" title={formatDateTime(event.createdAt)}>
                        <ClockIcon className="w-4 h-4" />
                        <span className="text-xs">
                          {formatRelativeTime(event.createdAt)}
                        </span>
                      </div>
                      
                      {!event.isActive && (
                        <span className="px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs font-semibold">
                          Cancelled
                        </span>
                      )}
                    </div>
                  </div>
                  
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      setSelectedEvent(event)
                    }}
                    className="p-2.5 text-slate-400 hover:text-teal-600 hover:bg-teal-50 rounded-lg transition-all"
                  >
                    <EyeIcon className="w-5 h-5" />
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {error && !loading && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm whitespace-pre-wrap">
          {error}
        </div>
      )}

      {selectedEvent && (
        <EventDetailModal
          event={selectedEvent}
          sdk={sdk}
          userAddress={address}
          onClose={() => setSelectedEvent(null)}
          onEventUpdated={loadEvents}
        />
      )}
    </div>
  )
}
