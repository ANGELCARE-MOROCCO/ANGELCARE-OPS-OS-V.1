
"use client"

import { useMemo } from "react"
import { Activity, CalendarDays, CheckCircle2, DatabaseZap, FileText, MessageCircle, Users } from "lucide-react"

export function RevenueEntityControlPanel({ controls, status, lastSyncAt }: { controls: any; status: string; lastSyncAt: Date | null }) {
  const metrics = useMemo(() => {
    return {
      tasks: controls.tasks?.length || 0,
      appointments: controls.appointments?.length || 0,
      comments: controls.comments?.length || 0,
      documents: controls.documents?.length || 0,
      contacts: controls.contacts?.length || 0,
      events: controls.events?.length || 0,
    }
  }, [controls])

  return (
    <section className="grid grid-cols-1 gap-3 md:grid-cols-4 xl:grid-cols-7">
      <Tile icon={<DatabaseZap />} label="Action Engine" value={status === "live" ? "Live" : "Fallback"} />
      <Tile icon={<CheckCircle2 />} label="Tasks" value={String(metrics.tasks)} />
      <Tile icon={<CalendarDays />} label="Appointments" value={String(metrics.appointments)} />
      <Tile icon={<MessageCircle />} label="Comments" value={String(metrics.comments)} />
      <Tile icon={<FileText />} label="Documents" value={String(metrics.documents)} />
      <Tile icon={<Users />} label="Contacts" value={String(metrics.contacts)} />
      <Tile icon={<Activity />} label="Last Sync" value={lastSyncAt ? lastSyncAt.toLocaleTimeString() : "Syncing"} />
    </section>
  )
}

function Tile({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-[#244365] bg-[#07111f]/90 p-4">
      <div className="mb-3 text-emerald-300 [&_svg]:h-5 [&_svg]:w-5">{icon}</div>
      <div className="text-[10px] font-black uppercase tracking-[.14em] text-[#94a3b8]">{label}</div>
      <div className="mt-1 truncate text-lg font-black text-white">{value}</div>
    </div>
  )
}
