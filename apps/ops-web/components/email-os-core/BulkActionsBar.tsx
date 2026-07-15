"use client"

import { Archive, CheckCircle2, ShieldAlert, UserPlus } from "lucide-react"

async function post(action: string, threadIds: string[]) {
  const res = await fetch("/api/email-os/bulk/thread-action", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action, threadIds })
  })

  return res.json()
}

export default function BulkActionsBar({
  selectedIds,
  onDone
}: {
  selectedIds: string[]
  onDone?: (message: string) => void
}) {
  async function run(action: string) {
    const result = await post(action, selectedIds)
    onDone?.(result.ok ? `Bulk ${action} completed` : result.error || "Bulk action failed")
  }

  if (selectedIds.length === 0) return null

  return (
    <div className="fixed bottom-24 left-1/2 z-[60] flex -translate-x-1/2 items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-2xl">
      <span className="mr-2 text-sm font-black text-slate-700">{selectedIds.length} selected</span>

      <button onClick={() => run("assign")} className="inline-flex h-9 cursor-pointer items-center gap-2 rounded-xl border border-slate-200 px-3 text-sm font-bold hover:bg-slate-50">
        <UserPlus className="h-4 w-4" /> Assign
      </button>

      <button onClick={() => run("archive")} className="inline-flex h-9 cursor-pointer items-center gap-2 rounded-xl border border-slate-200 px-3 text-sm font-bold hover:bg-slate-50">
        <Archive className="h-4 w-4" /> Archive
      </button>

      <button onClick={() => run("resolve")} className="inline-flex h-9 cursor-pointer items-center gap-2 rounded-xl border border-slate-200 px-3 text-sm font-bold hover:bg-slate-50">
        <CheckCircle2 className="h-4 w-4" /> Resolve
      </button>

      <button onClick={() => run("escalate")} className="inline-flex h-9 cursor-pointer items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-3 text-sm font-bold text-rose-700 hover:bg-rose-100">
        <ShieldAlert className="h-4 w-4" /> Escalate
      </button>
    </div>
  )
}
