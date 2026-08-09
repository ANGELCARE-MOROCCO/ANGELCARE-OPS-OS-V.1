"use client"

import { useEffect, useMemo, useState } from "react"
import { Activity, Bell, CheckCircle2, RefreshCcw, ShieldAlert, Zap } from "lucide-react"
import {
  listRevenueEvents,
  listRevenueNotifications,
  markNotificationRead,
  runRevenueEscalationSweep,
  subscribeRevenueEvents,
  type RevenueEvent,
  type RevenueNotification,
} from "@/lib/revenue-command-center/revenue-event-engine"

export function RevenueEventTimelinePanel() {
  const [events, setEvents] = useState<RevenueEvent[]>([])
  const [notifications, setNotifications] = useState<RevenueNotification[]>([])
  const [loading, setLoading] = useState(true)

  async function refresh() {
    setLoading(true)
    try {
      const [nextEvents, nextNotifications] = await Promise.all([listRevenueEvents(80), listRevenueNotifications()])
      setEvents(nextEvents)
      setNotifications(nextNotifications)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void refresh()
    const unsubscribe = subscribeRevenueEvents(() => void refresh())
    return unsubscribe
  }, [])

  const unread = useMemo(() => notifications.filter((n) => n.status === "unread"), [notifications])

  return (
    <section className="grid grid-cols-1 gap-4 xl:grid-cols-[1fr_420px]">
      <div className="rounded-[32px] border border-[#244365] bg-[#0e1e34] p-5 shadow-[0_24px_70px_rgba(0,0,0,.28)]">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <div className="text-xs font-black uppercase tracking-[.16em] text-emerald-300">Permanent audit trail</div>
            <h2 className="text-xl font-black text-white">Activity / Event Timeline</h2>
          </div>
          <button onClick={() => void refresh()} className="rounded-xl border border-[#244365] bg-[#10223a] px-3 py-2 text-sm font-black text-white">
            <RefreshCcw className="mr-2 inline h-4 w-4" />Refresh
          </button>
        </div>
        {loading ? (
          <div className="p-10 text-center text-sm font-bold text-[#cbd5e1]">Loading timeline...</div>
        ) : events.length ? (
          <div className="space-y-3">
            {events.map((event) => (
              <div key={event.id} className="rounded-2xl border border-[#244365] bg-[#10223a] p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <span className="grid h-10 w-10 place-items-center rounded-xl bg-emerald-500/10 text-emerald-300"><Activity className="h-5 w-5" /></span>
                    <div>
                      <div className="font-black text-white">{event.event_title}</div>
                      <div className="text-xs font-semibold text-[#cbd5e1]">{event.event_type} · {event.entity_type}:{event.entity_id}</div>
                    </div>
                  </div>
                  <div className="text-xs font-black text-[#94a3b8]">{new Date(event.created_at).toLocaleString()}</div>
                </div>
                {event.event_body && <p className="mt-3 text-sm font-semibold text-[#cbd5e1]">{event.event_body}</p>}
              </div>
            ))}
          </div>
        ) : (
          <div className="p-10 text-center text-sm font-bold text-[#cbd5e1]">No events yet. Create a task, update prospect or schedule appointment.</div>
        )}
      </div>

      <aside className="rounded-[32px] border border-[#244365] bg-[#0e1e34] p-5 shadow-[0_24px_70px_rgba(0,0,0,.28)]">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <div className="text-xs font-black uppercase tracking-[.16em] text-amber-300">Escalations</div>
            <h2 className="text-xl font-black text-white">Notifications</h2>
          </div>
          <button onClick={() => runRevenueEscalationSweep().then(() => refresh())} className="rounded-xl bg-amber-500 px-3 py-2 text-sm font-black text-slate-950">
            <Zap className="mr-2 inline h-4 w-4" />Sweep
          </button>
        </div>

        <div className="mb-4 grid grid-cols-2 gap-3">
          <Kpi icon={<Bell />} label="Unread" value={String(unread.length)} />
          <Kpi icon={<ShieldAlert />} label="Total" value={String(notifications.length)} />
        </div>

        <div className="space-y-3">
          {notifications.slice(0, 20).map((n) => (
            <button key={n.id} onClick={() => markNotificationRead(n.id).then(() => refresh())} className="w-full rounded-2xl border border-[#244365] bg-[#10223a] p-4 text-left">
              <div className="flex justify-between gap-3">
                <span className="font-black text-white">{n.title}</span>
                <span className="text-xs font-black uppercase text-amber-300">{n.severity}</span>
              </div>
              <p className="mt-1 text-xs font-semibold text-[#cbd5e1]">{n.body || "No details"}</p>
              <div className="mt-2 text-[10px] font-bold uppercase tracking-[.12em] text-[#94a3b8]">{n.status}</div>
            </button>
          ))}
          {!notifications.length && <div className="p-6 text-center text-sm font-bold text-[#cbd5e1]">No notifications.</div>}
        </div>
      </aside>
    </section>
  )
}

function Kpi({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-[#244365] bg-[#07111f] p-4">
      <div className="mb-2 text-emerald-300 [&_svg]:h-5 [&_svg]:w-5">{icon}</div>
      <div className="text-[10px] font-black uppercase tracking-[.14em] text-[#94a3b8]">{label}</div>
      <div className="text-2xl font-black text-white">{value}</div>
    </div>
  )
}
