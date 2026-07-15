"use client"

type Props = {
  syncedCount: number
  syncing: boolean
}

export function SyncStatusPanel({
  syncedCount,
  syncing
}: Props) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5">
      <div className="text-lg font-black text-slate-900">
        Synchronisation IMAP
      </div>

      <div className="mt-3 text-sm text-slate-500">
        Emails synchronisés : {syncedCount}
      </div>

      <div className="mt-4">
        {syncing ? (
          <div className="text-sm font-semibold text-blue-500">
            Synchronisation en cours...
          </div>
        ) : (
          <div className="text-sm font-semibold text-emerald-500">
            Synchronisation terminée
          </div>
        )}
      </div>
    </div>
  )
}
