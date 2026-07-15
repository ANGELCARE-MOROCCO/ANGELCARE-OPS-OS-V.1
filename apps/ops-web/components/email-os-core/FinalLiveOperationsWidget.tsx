"use client"

import { Activity, RefreshCw } from "lucide-react"
import { useEmailOSLiveRefresh } from "@/hooks/useEmailOSLiveRefresh"

export default function FinalLiveOperationsWidget() {
  const { events, status, refresh } = useEmailOSLiveRefresh(6000)

  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="rounded-2xl bg-emerald-100 p-3 text-emerald-700">
            <Activity className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-lg font-black text-slate-950">Live Operations</h2>
            <p className="text-sm text-slate-500">{status}</p>
          </div>
        </div>
        <button onClick={refresh} className="inline-flex h-10 cursor-pointer items-center gap-2 rounded-xl border border-slate-200 px-3 text-sm font-bold hover:bg-slate-50">
          <RefreshCw className="h-4 w-4" /> Refresh
        </button>
      </div>

      <div className="mt-5 space-y-3">
        {events.length === 0 ? <div className="text-sm font-bold text-slate-500">No live events yet.</div> : null}
        {events.slice(0, 8).map((event) => (
          <div key={event.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <div className="font-black text-slate-950">{event.event_type}</div>
            <div className="text-sm text-slate-500">{event.entity_type || "system"}:{event.entity_id || "global"}</div>
          </div>
        ))}
      </div>
    </section>
  )
}
