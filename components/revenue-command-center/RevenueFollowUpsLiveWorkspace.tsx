"use client"

import { useMemo, useState } from "react"
import { CalendarDays, CheckCircle2, Clock3, MessageCircle, Plus, RefreshCcw, Users, X } from "lucide-react"
import { useLiveFollowUps, useLivePartnerships, useLiveProspects, type RCCFollowUp } from "@/lib/revenue-command-center/live-sync"

type EntityOption = {
  id: string
  entityType: "prospect" | "partnership"
  name: string
  city: string
  owner: string
}

function isPending(status: string) {
  return ["open", "pending", "scheduled"].includes(String(status || "").toLowerCase())
}

function isOverdue(item: RCCFollowUp) {
  return isPending(item.status) && item.scheduledAt && new Date(item.scheduledAt).getTime() < Date.now()
}

export default function RevenueFollowUpsLiveWorkspace() {
  const { followUps, loading, error, refresh } = useLiveFollowUps()
  const { prospects, refresh: refreshProspects } = useLiveProspects()
  const { partnerships, refresh: refreshPartnerships } = useLivePartnerships()
  const [modalOpen, setModalOpen] = useState(false)
  const [actionError, setActionError] = useState("")

  const entities = useMemo<EntityOption[]>(() => [
    ...prospects.map((prospect) => ({ id: prospect.id, entityType: "prospect" as const, name: prospect.name, city: prospect.city, owner: prospect.owner })),
    ...partnerships.map((partner) => ({ id: partner.id, entityType: "partnership" as const, name: partner.name || partner.organization, city: partner.city, owner: partner.owner })),
  ], [prospects, partnerships])

  const pending = followUps.filter((item) => isPending(item.status))
  const overdue = followUps.filter(isOverdue)
  const today = followUps.filter((item) => item.scheduledAt?.slice(0, 10) === new Date().toISOString().slice(0, 10))

  async function refreshAll() {
    await Promise.all([refresh(), refreshProspects(), refreshPartnerships()])
  }

  async function mutate(body: Record<string, any>) {
    setActionError("")
    const response = await fetch("/api/revenue-command-center/follow-ups", {
      method: body.id ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      cache: "no-store",
      body: JSON.stringify(body),
    })
    const payload = await response.json().catch(() => ({}))
    if (!response.ok || payload.ok === false) throw new Error(payload.error || "Unable to save follow-up")
    await refreshAll()
  }

  async function quickAction(item: RCCFollowUp, action: "complete" | "missed") {
    try {
      await mutate({ id: item.id, action })
    } catch (error) {
      setActionError(error instanceof Error ? error.message : "Unable to update follow-up")
    }
  }

  return (
    <main data-followups-live="true" className="min-h-screen bg-[#050b16] p-6 text-white xl:p-8">
      <style dangerouslySetInnerHTML={{ __html: `
        [data-followups-live], [data-followups-live] * { color: #ffffff !important; opacity: 1 !important; }
        [data-followups-live] input, [data-followups-live] textarea, [data-followups-live] select, [data-followups-live] option {
          color: #ffffff !important; -webkit-text-fill-color: #ffffff !important; background: #07111f !important;
        }
      ` }} />
      {modalOpen ? <FollowUpModal entities={entities} onClose={() => setModalOpen(false)} onSave={async (body) => { await mutate(body); setModalOpen(false) }} /> : null}

      <header className="mb-5 flex flex-col gap-4 rounded-[32px] border border-[#244365] bg-[#07111f]/95 p-6 shadow-[0_24px_70px_rgba(0,0,0,.32)] xl:flex-row xl:items-center xl:justify-between">
        <div>
          <div className="text-xs font-black uppercase tracking-[.18em] text-cyan-200">Revenue Command Center / Follow-ups</div>
          <h1 className="mt-1 text-3xl font-black text-white">Follow-ups Command Queue</h1>
          <p className="mt-1 text-sm font-bold text-[#cbd5e1]">Live follow-ups linked to prospects and partners through revenue_follow_ups.</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <button onClick={() => setModalOpen(true)} className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-5 py-3 text-sm font-black text-white"><Plus className="h-4 w-4" /> Create Follow-up</button>
          <button onClick={() => void refreshAll()} className="inline-flex items-center gap-2 rounded-xl border border-[#315474] bg-[#10223a] px-5 py-3 text-sm font-black text-white"><RefreshCcw className="h-4 w-4" /> Refresh</button>
        </div>
      </header>

      {(error || actionError) ? <div className="mb-5 rounded-2xl border border-red-400/30 bg-red-500/10 p-4 text-sm font-black text-red-100">{error || actionError}</div> : null}

      <section className="mb-5 grid gap-4 md:grid-cols-4">
        <Kpi icon={<MessageCircle />} label="Total" value={String(followUps.length)} detail="all saved follow-ups" />
        <Kpi icon={<Clock3 />} label="Pending" value={String(pending.length)} detail="needs action" />
        <Kpi icon={<CalendarDays />} label="Today" value={String(today.length)} detail="scheduled today" />
        <Kpi icon={<CheckCircle2 />} label="Overdue" value={String(overdue.length)} detail="requires recovery" />
      </section>

      <section className="rounded-[32px] border border-[#244365] bg-[#0e1e34] p-5 shadow-[0_24px_70px_rgba(0,0,0,.28)]">
        {loading ? <div className="p-10 text-center text-sm font-bold text-[#cbd5e1]">Loading live follow-ups...</div> : null}
        {!loading && followUps.length ? (
          <div className="space-y-3">
            {followUps.map((item) => (
              <div key={item.id} className="grid gap-4 rounded-2xl border border-[#244365] bg-[#10223a] p-4 xl:grid-cols-[1fr_170px_160px_180px_220px] xl:items-center">
                <div>
                  <div className="text-base font-black text-white">{item.title}</div>
                  <div className="mt-1 text-xs font-semibold text-[#cbd5e1]">{item.entityType}:{item.entityId} · {item.notes || "No notes"}</div>
                </div>
                <Badge value={item.status} />
                <Badge value={item.channel} />
                <div className="text-sm font-bold text-white">{item.scheduledAt ? new Date(item.scheduledAt).toLocaleString() : "Not scheduled"}</div>
                <div className="flex flex-wrap justify-end gap-2">
                  <button disabled={!isPending(item.status)} onClick={() => void quickAction(item, "complete")} className="rounded-xl bg-emerald-500 px-4 py-2 text-xs font-black text-slate-950 disabled:opacity-50">Complete</button>
                  <button disabled={!isPending(item.status)} onClick={() => void quickAction(item, "missed")} className="rounded-xl border border-red-400/30 bg-red-500/10 px-4 py-2 text-xs font-black text-red-100 disabled:opacity-50">Missed</button>
                </div>
              </div>
            ))}
          </div>
        ) : null}
        {!loading && !followUps.length ? <div className="p-10 text-center text-sm font-bold text-[#cbd5e1]">No saved follow-ups yet. Create one and it will persist in revenue_follow_ups.</div> : null}
      </section>
    </main>
  )
}

function Kpi({ icon, label, value, detail }: { icon: React.ReactNode; label: string; value: string; detail: string }) {
  return <div className="rounded-2xl border border-[#244365] bg-[#07111f] p-4"><div className="mb-2 text-cyan-300 [&_svg]:h-5 [&_svg]:w-5">{icon}</div><div className="text-[10px] font-black uppercase tracking-[.14em] text-[#94a3b8]">{label}</div><div className="mt-1 text-2xl font-black text-white">{value}</div><div className="truncate text-xs font-bold text-[#cbd5e1]">{detail}</div></div>
}

function Badge({ value }: { value: string }) {
  return <span className="inline-flex w-fit rounded-xl border border-white/10 bg-white/10 px-3 py-1 text-xs font-black uppercase text-white">{value}</span>
}

function FollowUpModal({ entities, onClose, onSave }: { entities: EntityOption[]; onClose: () => void; onSave: (body: Record<string, any>) => Promise<void> }) {
  const first = entities[0]
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const [form, setForm] = useState({
    entityId: first?.id || "",
    entityType: first?.entityType || "prospect",
    title: "",
    scheduledAt: new Date(Date.now() + 86400000).toISOString().slice(0, 16),
    channel: "whatsapp",
    priority: "medium",
    owner: first?.owner || "BD Officer",
    notes: "",
  })

  const selected = entities.find((entity) => entity.id === form.entityId)

  async function submit() {
    if (!form.title.trim() || !form.entityId || saving) return
    setSaving(true)
    setError("")
    try {
      await onSave({
        ...form,
        entityType: selected?.entityType || form.entityType,
        prospectId: (selected?.entityType || form.entityType) === "prospect" ? form.entityId : undefined,
        partnershipId: (selected?.entityType || form.entityType) === "partnership" ? form.entityId : undefined,
      })
    } catch (error) {
      setError(error instanceof Error ? error.message : "Unable to save follow-up")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[99999] overflow-y-auto bg-black/75 p-4 backdrop-blur-md">
      <div className="mx-auto w-full max-w-4xl rounded-[28px] border border-[#315474] bg-[#071426] p-6 shadow-[0_30px_90px_rgba(0,0,0,.70)]">
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <div className="text-xs font-black uppercase tracking-[.18em] text-cyan-200">Persistent follow-up</div>
            <h2 className="mt-1 text-3xl font-black text-white">Create Follow-up</h2>
          </div>
          <button disabled={saving} onClick={onClose} className="grid h-11 w-11 place-items-center rounded-xl text-white hover:bg-white/10 disabled:opacity-60"><X className="h-5 w-5" /></button>
        </div>
        {error ? <div className="mb-5 rounded-2xl border border-red-400/30 bg-red-500/10 p-4 text-sm font-black text-red-100">{error}</div> : null}
        <div className="grid gap-3 md:grid-cols-2">
          <label className="grid gap-2 md:col-span-2">
            <span className="text-xs font-black uppercase tracking-[.14em] text-cyan-100">Linked prospect or partner</span>
            <select value={form.entityId} onChange={(event) => {
              const entity = entities.find((item) => item.id === event.target.value)
              setForm((current) => ({ ...current, entityId: event.target.value, entityType: entity?.entityType || "prospect", owner: entity?.owner || current.owner }))
            }} className="h-12 rounded-xl border border-[#315474] bg-[#10223a] px-4 text-sm font-bold text-white outline-none">
              {entities.map((entity) => <option key={`${entity.entityType}-${entity.id}`} value={entity.id}>{entity.entityType} · {entity.name} · {entity.city}</option>)}
            </select>
          </label>
          <Input label="Title" value={form.title} onChange={(value) => setForm((current) => ({ ...current, title: value }))} />
          <Input label="Scheduled At" type="datetime-local" value={form.scheduledAt} onChange={(value) => setForm((current) => ({ ...current, scheduledAt: value }))} />
          <Input label="Channel" value={form.channel} onChange={(value) => setForm((current) => ({ ...current, channel: value }))} />
          <Input label="Owner" value={form.owner} onChange={(value) => setForm((current) => ({ ...current, owner: value }))} />
          <label className="grid gap-2 md:col-span-2">
            <span className="text-xs font-black uppercase tracking-[.14em] text-cyan-100">Notes</span>
            <textarea value={form.notes} onChange={(event) => setForm((current) => ({ ...current, notes: event.target.value }))} className="min-h-[120px] rounded-xl border border-[#315474] bg-[#10223a] p-4 text-sm font-bold text-white outline-none" />
          </label>
        </div>
        <div className="mt-5 flex justify-end gap-3">
          <button disabled={saving} onClick={onClose} className="rounded-xl border border-[#315474] bg-[#10223a] px-5 py-3 text-sm font-black text-white disabled:opacity-60">Cancel</button>
          <button disabled={saving || !form.title.trim() || !form.entityId} onClick={() => void submit()} className="rounded-xl bg-violet-600 px-6 py-3 text-sm font-black text-white disabled:opacity-50">{saving ? "Saving..." : "Save Follow-up"}</button>
        </div>
      </div>
    </div>
  )
}

function Input({ label, value, onChange, type = "text" }: { label: string; value: string; onChange: (value: string) => void; type?: string }) {
  return <label className="grid gap-2"><span className="text-xs font-black uppercase tracking-[.14em] text-cyan-100">{label}</span><input type={type} value={value} onChange={(event) => onChange(event.target.value)} className="h-12 rounded-xl border border-[#315474] bg-[#10223a] px-4 text-sm font-bold text-white outline-none" /></label>
}
