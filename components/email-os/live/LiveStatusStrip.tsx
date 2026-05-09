"use client"

export default function LiveStatusStrip({
  loading,
  error,
  lastLoadedAt,
  onReload
}: {
  loading?: boolean
  error?: string | null
  lastLoadedAt?: string | null
  onReload?: () => void
}) {
  return (
    <div className="flex items-center justify-between border-b border-slate-200 bg-white px-4 py-2 text-xs">
      <div className="flex items-center gap-2">
        <span className={`h-2 w-2 rounded-full ${error ? "bg-amber-500" : "bg-emerald-500"}`} />
        <span className="font-medium text-slate-700">
          {loading ? "Loading live Email-OS..." : error ? "Fallback mode" : "Live connected"}
        </span>
        {lastLoadedAt ? (
          <span className="text-slate-400">Last sync: {new Date(lastLoadedAt).toLocaleTimeString()}</span>
        ) : null}
      </div>

      <button
        onClick={onReload}
        className="rounded-lg border border-slate-200 bg-white px-2 py-1 font-medium text-slate-600 hover:bg-slate-50"
      >
        Refresh live data
      </button>
    </div>
  )
}
