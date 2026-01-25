/**
 * LoadingSkeleton Component
 * 
 * Provides skeleton loading states for better UX
 */

export function LoadingSkeleton({ type = 'card' }: { type?: 'card' | 'list' | 'balance' }) {
  if (type === 'card') {
    return (
      <div className="card animate-pulse">
        <div className="h-6 bg-slate-200 rounded w-1/3 mb-4"></div>
        <div className="h-4 bg-slate-200 rounded w-full mb-2"></div>
        <div className="h-4 bg-slate-200 rounded w-2/3"></div>
      </div>
    )
  }

  if (type === 'list') {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map(i => (
          <div key={i} className="p-4 border border-slate-200 rounded-lg animate-pulse">
            <div className="h-5 bg-slate-200 rounded w-1/2 mb-3"></div>
            <div className="h-4 bg-slate-200 rounded w-full mb-2"></div>
            <div className="h-4 bg-slate-200 rounded w-3/4"></div>
          </div>
        ))}
      </div>
    )
  }

  if (type === 'balance') {
    return (
      <div className="card animate-pulse">
        <div className="h-8 bg-slate-200 rounded w-1/4 mb-6"></div>
        <div className="h-16 bg-slate-200 rounded-lg mb-4"></div>
        <div className="space-y-2">
          <div className="h-4 bg-slate-200 rounded w-full"></div>
          <div className="h-4 bg-slate-200 rounded w-3/4"></div>
        </div>
      </div>
    )
  }

  return null
}
