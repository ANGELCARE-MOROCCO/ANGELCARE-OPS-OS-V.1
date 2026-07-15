"use client"

import { useEffect, useMemo, useState } from "react"
import { CalendarDays, CheckCircle2, Clock3, DatabaseZap, MapPin, Plus, RefreshCcw, Users } from "lucide-react"
import {
  createProductionAppointment,
  listProductionAppointments,
  subscribeProductionExecution,
  updateProductionAppointmentStatus,
  type ProductionAppointment,
} from "@/lib/revenue-command-center/production-execution-store"

function todayPlus(days: number) {
  const d = new Date()
  d.setDate(d.getDate() + days)
  return d.toISOString().slice(0, 10)
}

export default function RevenueAppointmentsSourceOfTruthWorkspace() {
  const [appointments, setAppointments] = useState<ProductionAppointment[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [lastSync, setLastSync] = useState<Date | null>(null)

  async function refresh() {
    setLoading(true)
    try {
      const data = await listProductionAppointments()
      setAppointments(data)
      setLastSync(new Date())
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void refresh()
    const unsubscribe = subscribeProductionExecution(() => void refresh())
    return unsubscribe
  }, [])

  const metrics = useMemo(() => {
    const scheduled = appointments.filter((a) => a.status === "scheduled")
    const done = appointments.filter((a) => a.status === "completed")
    const today = scheduled.filter((a) => a.appointment_at.slice(0, 10) === new Date().toISOString().slice(0, 10))
    return { total: appointments.length, scheduled: scheduled.length, done: done.length, today: today.length }
  }, [appointments])

  async function createAppointment(payload: { entityId: string; title: string; appointmentAt: string; owner: string; location: string; notes: string }) {
    await createProductionAppointment({
      entityId: payload.entityId || "general",
      title: payload.title,
      appointmentAt: payload.appointmentAt,
      owner: payload.owner,
      location: payload.location,
      notes: payload.notes,
    })
    await refresh()
  }

  async function completeAppointment(item: ProductionAppointment) {
    await updateProductionAppointmentStatus(item.id, item.status === "completed" ? "scheduled" : "completed")
    await refresh()
  }

  return (
    <main className="rcc-shell-main w-full max-w-none min-w-0 flex-1 min-h-screen bg-[#050b16] p-4 text-white">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_30%_0%,rgba(59,130,246,.16),transparent_30%),linear-gradient(180deg,#07111f_0%,#030814_70%,#020611_100%)]" />
      {modalOpen && <AppointmentModal onClose={() => setModalOpen(false)} onSubmit={(payload) => { createAppointment(payload); setModalOpen(false) }} />}
      <section className="relative w-full max-w-none min-w-0 ">
        <header className="mb-4 flex flex-col gap-4 rounded-[32px] border border-[#244365] bg-[#07111f]/90 p-6 shadow-[0_24px_70px_rgba(0,0,0,.32)] xl:flex-row xl:items-center xl:justify-between">
          <div>
            <div className="text-xs font-black uppercase tracking-[.18em] text-blue-300">Supabase source-of-truth</div>
            <h1 className="mt-1 text-3xl font-black">Appointments Command Center</h1>
            <p className="mt-1 text-sm font-semibold text-[#cbd5e1]">All appointments now load from revenue_appointments. Prospect-scheduled meetings appear here automatically.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button onClick={() => setModalOpen(true)} className="inline-flex items-center gap-2 rounded-xl bg-blue-500 px-4 py-3 text-sm font-black text-white"><Plus className="h-4 w-4" />Schedule</button>
            <button onClick={() => void refresh()} className="inline-flex items-center gap-2 rounded-xl border border-[#244365] bg-[#10223a] px-4 py-3 text-sm font-black text-white"><RefreshCcw className="h-4 w-4" />Refresh</button>
          </div>
        </header>

        <section className="mb-4 grid grid-cols-1 gap-3 md:grid-cols-4">
          <Kpi icon={<DatabaseZap />} label="Source" value="revenue_appointments" detail={lastSync ? lastSync.toLocaleTimeString() : "syncing"} />
          <Kpi icon={<CalendarDays />} label="Total" value={String(metrics.total)} detail="all meetings" />
          <Kpi icon={<Clock3 />} label="Scheduled" value={String(metrics.scheduled)} detail="upcoming" />
          <Kpi icon={<CheckCircle2 />} label="Completed" value={String(metrics.done)} detail="closed loop" />
        </section>

        <section className="rounded-[32px] border border-[#244365] bg-[#0e1e34] p-5 shadow-[0_24px_70px_rgba(0,0,0,.28)]">
          {loading ? (
            <div className="p-12 text-center text-sm font-bold text-[#cbd5e1]">Loading production appointments...</div>
          ) : appointments.length ? (
            <div className="space-y-3">
              {appointments.map((item) => (
                <div key={item.id} className="grid gap-4 rounded-2xl border border-[#244365] bg-[#10223a] p-4 xl:grid-cols-[42px_1.3fr_.75fr_.75fr_.55fr_220px] xl:items-center">
                  <button onClick={() => void completeAppointment(item)} className="grid h-10 w-10 place-items-center rounded-xl bg-white/10 text-blue-300">
                    <CheckCircle2 className="h-5 w-5" />
                  </button>
                  <div>
                    <div className="text-base font-black text-white">{item.title}</div>
                    <div className="mt-1 text-xs font-semibold text-[#cbd5e1]">{item.notes || "No notes"} · {item.entity_name || item.entity_id}</div>
                  </div>
                  <div className="text-sm font-bold text-white"><Users className="mr-2 inline h-4 w-4 text-cyan-300" />{item.owner}</div>
                  <div className="text-sm font-bold text-white"><MapPin className="mr-2 inline h-4 w-4 text-emerald-300" />{item.location || "No location"}</div>
                  <Badge value={item.status} />
                  <div className="text-sm font-bold text-[#cbd5e1]"><CalendarDays className="mr-2 inline h-4 w-4 text-blue-300" />{new Date(item.appointment_at).toLocaleString()}</div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-12 text-center">
              <div className="text-xl font-black text-white">No production appointments yet</div>
              <p className="mt-2 text-sm font-semibold text-[#cbd5e1]">Schedule here or from any prospect profile. It will sync through revenue_appointments.</p>
            </div>
          )}
        </section>
      </section>
    </main>
  )
}

function Kpi({ icon, label, value, detail }: { icon: React.ReactNode; label: string; value: string; detail: string }) {
  return <div className="rounded-2xl border border-[#244365] bg-[#07111f]/90 p-4"><div className="mb-3 text-blue-300 [&_svg]:h-5 [&_svg]:w-5">{icon}</div><div className="text-[10px] font-black uppercase tracking-[.14em] text-[#94a3b8]">{label}</div><div className="mt-1 text-2xl font-black text-white">{value}</div><div className="truncate text-xs font-bold text-[#cbd5e1]">{detail}</div></div>
}
function Badge({ value }: { value: string }) {
  return <span className="inline-flex w-fit rounded-xl bg-white/10 px-3 py-1 text-xs font-black uppercase text-white">{value}</span>
}
function AppointmentModal({ onClose, onSubmit }: { onClose: () => void; onSubmit: (payload: { entityId: string; title: string; appointmentAt: string; owner: string; location: string; notes: string }) => void }) {
  const [form, setForm] = useState({ entityId: "general", title: "", appointmentAt: `${todayPlus(1)}T10:00`, owner: "BD Officer", location: "AngelCare / Client meeting", notes: "" })
  return (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/70 p-4 backdrop-blur-md">
      <div className="w-full max-w-2xl rounded-3xl border border-[#315474] bg-[#081525] p-6">
        <div className="mb-5 flex justify-between"><h2 className="text-2xl font-black">Schedule Production Appointment</h2><button onClick={onClose} className="rounded-xl bg-[#10223a] px-4 py-2 font-black">Close</button></div>
        <div className="grid gap-3">
          <Input label="Linked entity/prospect id" value={form.entityId} onChange={(v) => setForm({ ...form, entityId: v })} />
          <Input label="Title" value={form.title} onChange={(v) => setForm({ ...form, title: v })} />
          <div className="grid gap-3 md:grid-cols-2">
            <Input label="Date & time" value={form.appointmentAt} onChange={(v) => setForm({ ...form, appointmentAt: v })} type="datetime-local" />
            <Input label="Owner" value={form.owner} onChange={(v) => setForm({ ...form, owner: v })} />
          </div>
          <Input label="Location" value={form.location} onChange={(v) => setForm({ ...form, location: v })} />
          <Input label="Notes" value={form.notes} onChange={(v) => setForm({ ...form, notes: v })} />
          <button onClick={() => form.title.trim() && onSubmit(form)} className="mt-3 rounded-2xl bg-blue-500 px-5 py-4 font-black text-white">Schedule Appointment</button>
        </div>
      </div>
    </div>
  )
}
function Input({ label, value, onChange, type = "text" }: { label: string; value: string; onChange: (value: string) => void; type?: string }) {
  return <label className="grid gap-2"><span className="text-xs font-black uppercase tracking-[.14em] text-cyan-100">{label}</span><input type={type} value={value} onChange={(e) => onChange(e.target.value)} className="rounded-2xl border border-[#315474] bg-[#10223a] p-3 text-sm font-bold text-white outline-none" /></label>
}
