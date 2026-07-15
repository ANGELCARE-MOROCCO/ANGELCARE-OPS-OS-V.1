"use client"

import Link from "next/link"
import { useEffect, useMemo, useState } from "react"

type SDRStatus = "new" | "queued" | "contacted" | "no_answer" | "qualified" | "appointment_booked" | "escalated" | "closed"
type SDRPriority = "critical" | "high" | "medium" | "low"
type LeadSource = "campaign" | "prospect" | "referral" | "website" | "whatsapp" | "partner" | "manual"

type SDRLead = {
  id: string
  parentProspect?: string
  name: string
  phone: string
  email: string
  city: string
  source: LeadSource
  owner: string
  status: SDRStatus
  priority: SDRPriority
  score: number
  valueMad: number
  nextCallDate: string
  callAttempts: number
  qualification: string
  objection: string
  script: string
  nextAction: string
  notes: string
  createdAt: string
  updatedAt: string
}

type SDRLog = {
  id: string
  leadId: string
  at: string
  action: string
  note: string
}

type SDRStore = {
  leads: SDRLead[]
  logs: SDRLog[]
}

const STORE_KEY = "revenue_sdr_v11_store"

const statuses: SDRStatus[] = ["new", "queued", "contacted", "no_answer", "qualified", "appointment_booked", "escalated", "closed"]
const priorities: SDRPriority[] = ["critical", "high", "medium", "low"]
const sources: LeadSource[] = ["campaign", "prospect", "referral", "website", "whatsapp", "partner", "manual"]

function uid() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID()
  return Math.random().toString(36).slice(2, 10)
}

function today(offset = 0) {
  const d = new Date()
  d.setDate(d.getDate() + offset)
  return d.toISOString().slice(0, 10)
}

function label(value: string) {
  return value.replaceAll("_", " ").replaceAll("-", " ").replace(/\b\w/g, (x) => x.toUpperCase())
}

function mad(value: number) {
  return new Intl.NumberFormat("fr-MA", {
    style: "currency",
    currency: "MAD",
    maximumFractionDigits: 0,
  }).format(value || 0)
}

function seedLeads(): SDRLead[] {
  const now = new Date().toISOString()

  return [
    {
      id: "sdr-lead-postpartum-01",
      parentProspect: "Postpartum Campaign",
      name: "Family A — postpartum support",
      phone: "+212600000101",
      email: "family-a@example.com",
      city: "Rabat",
      source: "campaign",
      owner: "SDR Lead",
      status: "queued",
      priority: "critical",
      score: 88,
      valueMad: 42000,
      nextCallDate: today(0),
      callAttempts: 1,
      qualification: "Mother needs immediate support after delivery. Decision maker is spouse + grandmother.",
      objection: "Family comparing home care options.",
      script: "Open with reassurance, confirm baby/mother context, explain AngelCare continuity and book consultation.",
      nextAction: "Call today before 18:00 and book consultation.",
      notes: "High urgency, high fit.",
      createdAt: now,
      updatedAt: now,
    },
    {
      id: "sdr-lead-clinic-02",
      parentProspect: "Clinic partner referral",
      name: "Clinic referral — family inquiry",
      phone: "+212600000102",
      email: "clinic-referral@example.com",
      city: "Casablanca",
      source: "partner",
      owner: "SDR Agent",
      status: "contacted",
      priority: "high",
      score: 74,
      valueMad: 28000,
      nextCallDate: today(1),
      callAttempts: 2,
      qualification: "Needs trusted caregiver availability and pricing clarity.",
      objection: "Wants medical credibility and supervision guarantee.",
      script: "Emphasize supervised caregiver process, schedule consultation and send trust proof.",
      nextAction: "Send trust proof then callback tomorrow.",
      notes: "Partner-generated; should not decay.",
      createdAt: now,
      updatedAt: now,
    },
    {
      id: "sdr-lead-web-03",
      parentProspect: "Website form",
      name: "Website lead — elderly care",
      phone: "+212600000103",
      email: "web-lead@example.com",
      city: "Temara",
      source: "website",
      owner: "SDR Agent",
      status: "no_answer",
      priority: "medium",
      score: 61,
      valueMad: 18000,
      nextCallDate: today(0),
      callAttempts: 3,
      qualification: "Needs evaluation; no direct contact yet.",
      objection: "No answer after 3 attempts.",
      script: "Use short WhatsApp message and schedule second window.",
      nextAction: "Send WhatsApp recovery message.",
      notes: "Risk of losing lead due to no-answer.",
      createdAt: now,
      updatedAt: now,
    },
  ]
}

function defaultStore(): SDRStore {
  return {
    leads: seedLeads(),
    logs: [{ id: uid(), leadId: "system", at: new Date().toLocaleString(), action: "SDR initialized", note: "Revenue SDR V11 workspace seeded." }],
  }
}

function readStore(): SDRStore {
  if (typeof window === "undefined") return defaultStore()

  try {
    const raw = localStorage.getItem(STORE_KEY)
    if (!raw) {
      const seeded = defaultStore()
      localStorage.setItem(STORE_KEY, JSON.stringify(seeded))
      return seeded
    }

    const parsed = JSON.parse(raw) as SDRStore
    if (!Array.isArray(parsed.leads)) return defaultStore()

    return parsed
  } catch {
    return defaultStore()
  }
}

function writeStore(store: SDRStore) {
  if (typeof window === "undefined") return
  localStorage.setItem(STORE_KEY, JSON.stringify(store))
}

function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <section className={`rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-sm ${className}`}>{children}</section>
}

function Pill({ children, tone = "slate" }: { children: React.ReactNode; tone?: "slate" | "emerald" | "amber" | "rose" | "blue" | "violet" }) {
  const tones = {
    slate: "border-slate-200 bg-slate-50 text-slate-700",
    emerald: "border-emerald-200 bg-emerald-50 text-emerald-700",
    amber: "border-amber-200 bg-amber-50 text-amber-700",
    rose: "border-rose-200 bg-rose-50 text-rose-700",
    blue: "border-blue-200 bg-blue-50 text-blue-700",
    violet: "border-violet-200 bg-violet-50 text-violet-700",
  }

  return <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-black ${tones[tone]}`}>{children}</span>
}

function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={`w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-950 outline-none placeholder:text-slate-400 focus:border-cyan-700 focus:ring-4 focus:ring-cyan-100 ${props.className || ""}`} />
}

function Select(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...props} className={`w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-950 outline-none focus:border-cyan-700 focus:ring-4 focus:ring-cyan-100 ${props.className || ""}`} />
}

function Textarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} className={`min-h-[100px] w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-950 outline-none placeholder:text-slate-400 focus:border-cyan-700 focus:ring-4 focus:ring-cyan-100 ${props.className || ""}`} />
}

function Button(props: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "dark" | "primary" | "soft" | "danger" }) {
  const variant = props.variant || "dark"
  const variants = {
    dark: "bg-slate-950 text-white hover:bg-slate-800",
    primary: "bg-cyan-700 text-white hover:bg-cyan-800",
    soft: "border border-slate-200 bg-white text-slate-800 hover:bg-slate-50",
    danger: "bg-rose-600 text-white hover:bg-rose-700",
  }

  return <button {...props} className={`rounded-2xl px-5 py-3 text-sm font-black shadow-sm transition ${variants[variant]} ${props.className || ""}`} />
}

function priorityTone(priority: SDRPriority) {
  if (priority === "critical") return "rose"
  if (priority === "high") return "amber"
  if (priority === "medium") return "blue"
  return "slate"
}

function scoreTone(score: number) {
  if (score >= 85) return "rose"
  if (score >= 70) return "amber"
  if (score >= 55) return "blue"
  return "slate"
}

export default function RevenueSDRV11Workspace({ mode = "workspace" }: { mode?: "workspace" | "followups" | "overdue" }) {
  const [store, setStore] = useState<SDRStore>(() => defaultStore())
  const [query, setQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<SDRStatus | "all">(mode === "overdue" ? "no_answer" : "all")
  const [priorityFilter, setPriorityFilter] = useState<SDRPriority | "all">("all")
  const [selectedId, setSelectedId] = useState("")
  const [createOpen, setCreateOpen] = useState(false)
  const [draft, setDraft] = useState({
    name: "",
    phone: "",
    email: "",
    city: "Rabat",
    source: "manual" as LeadSource,
    owner: "SDR Agent",
    status: "new" as SDRStatus,
    priority: "high" as SDRPriority,
    score: 65,
    valueMad: 15000,
    nextCallDate: today(1),
    callAttempts: 0,
    qualification: "",
    objection: "",
    script: "",
    nextAction: "",
    notes: "",
  })

  useEffect(() => {
    const loaded = readStore()
    setStore(loaded)
    setSelectedId(loaded.leads[0]?.id || "")
  }, [])

  function commit(next: SDRStore, action: string, note: string, leadId?: string) {
    const withLog = {
      ...next,
      logs: [{ id: uid(), leadId: leadId || selectedId || "system", at: new Date().toLocaleString(), action, note }, ...next.logs].slice(0, 100),
    }

    setStore(withLog)
    writeStore(withLog)
  }

  function restoreSeed() {
    const seeded = defaultStore()
    setStore(seeded)
    setSelectedId(seeded.leads[0]?.id || "")
    writeStore(seeded)
  }

  const selected = store.leads.find((lead) => lead.id === selectedId) || store.leads[0]

  const filtered = useMemo(() => {
    return store.leads.filter((lead) => {
      const overdueMatch = mode !== "overdue" || (new Date(lead.nextCallDate).getTime() <= Date.now() && !["appointment_booked", "closed"].includes(lead.status))
      const hay = `${lead.name} ${lead.phone} ${lead.city} ${lead.owner} ${lead.source} ${lead.qualification} ${lead.nextAction}`.toLowerCase()

      return overdueMatch
        && (!query || hay.includes(query.toLowerCase()))
        && (statusFilter === "all" || lead.status === statusFilter)
        && (priorityFilter === "all" || lead.priority === priorityFilter)
    })
  }, [store.leads, query, statusFilter, priorityFilter, mode])

  const stats = useMemo(() => {
    const dueToday = store.leads.filter((lead) => new Date(lead.nextCallDate).getTime() <= Date.now() && !["appointment_booked", "closed"].includes(lead.status)).length
    const critical = store.leads.filter((lead) => lead.priority === "critical" || lead.score >= 85).length
    const booked = store.leads.filter((lead) => lead.status === "appointment_booked").length
    const noAnswer = store.leads.filter((lead) => lead.status === "no_answer").length
    const value = store.leads.reduce((sum, lead) => sum + Number(lead.valueMad || 0), 0)
    const avgScore = Math.round(store.leads.reduce((sum, lead) => sum + Number(lead.score || 0), 0) / Math.max(store.leads.length, 1))

    return { dueToday, critical, booked, noAnswer, value, avgScore, total: store.leads.length }
  }, [store.leads])

  function updateLead(id: string, patch: Partial<SDRLead>, action = "Lead updated") {
    const target = store.leads.find((lead) => lead.id === id)
    const leads = store.leads.map((lead) => lead.id === id ? { ...lead, ...patch, updatedAt: new Date().toISOString() } : lead)

    commit({ ...store, leads }, action, target?.name || id, id)
  }

  function createLead(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!draft.name.trim()) return

    const now = new Date().toISOString()
    const lead: SDRLead = {
      id: uid(),
      name: draft.name,
      phone: draft.phone,
      email: draft.email,
      city: draft.city,
      source: draft.source,
      owner: draft.owner,
      status: draft.status,
      priority: draft.priority,
      score: Number(draft.score) || 0,
      valueMad: Number(draft.valueMad) || 0,
      nextCallDate: draft.nextCallDate,
      callAttempts: Number(draft.callAttempts) || 0,
      qualification: draft.qualification,
      objection: draft.objection,
      script: draft.script,
      nextAction: draft.nextAction || "Call and qualify lead.",
      notes: draft.notes,
      createdAt: now,
      updatedAt: now,
    }

    commit({ ...store, leads: [lead, ...store.leads] }, "Lead created", lead.name, lead.id)
    setSelectedId(lead.id)
    setCreateOpen(false)
    setDraft({
      name: "",
      phone: "",
      email: "",
      city: "Rabat",
      source: "manual",
      owner: "SDR Agent",
      status: "new",
      priority: "high",
      score: 65,
      valueMad: 15000,
      nextCallDate: today(1),
      callAttempts: 0,
      qualification: "",
      objection: "",
      script: "",
      nextAction: "",
      notes: "",
    })
  }

  function deleteLead(id: string) {
    const target = store.leads.find((lead) => lead.id === id)
    const leads = store.leads.filter((lead) => lead.id !== id)
    commit({ ...store, leads }, "Lead deleted", target?.name || id, id)
    setSelectedId(leads[0]?.id || "")
  }

  function callLead(id: string) {
    const target = store.leads.find((lead) => lead.id === id)
    if (!target) return

    updateLead(id, {
      status: "contacted",
      callAttempts: target.callAttempts + 1,
      nextCallDate: today(1),
      nextAction: "Capture qualification result and book appointment if fit is confirmed.",
    }, "Call attempt logged")
  }

  function noAnswer(id: string) {
    const target = store.leads.find((lead) => lead.id === id)
    if (!target) return

    updateLead(id, {
      status: "no_answer",
      callAttempts: target.callAttempts + 1,
      nextCallDate: today(1),
      nextAction: "Send WhatsApp recovery message and retry tomorrow.",
    }, "No-answer logged")
  }

  function bookAppointment(id: string) {
    updateLead(id, {
      status: "appointment_booked",
      nextAction: "Prepare consultation context and confirmation message.",
    }, "Appointment booked")
  }

  function qualify(id: string) {
    updateLead(id, {
      status: "qualified",
      score: Math.min(100, (store.leads.find((lead) => lead.id === id)?.score || 65) + 8),
      nextAction: "Move to appointment booking or proposal preparation.",
    }, "Lead qualified")
  }

  const queueGroups = statuses.map((status) => ({
    status,
    leads: filtered.filter((lead) => lead.status === status),
  }))

  return (
    <main className="min-h-screen bg-cyan-50/60 text-slate-950 selection:bg-cyan-200 selection:text-slate-950">
      <div className="mx-auto max-w-[1900px] space-y-6 p-4 lg:p-8">
        <section className="overflow-hidden rounded-[2.4rem] bg-gradient-to-br from-slate-950 via-cyan-950 to-black p-7 text-white shadow-2xl lg:p-10">
          <div className="grid gap-8 xl:grid-cols-[1.35fr_.65fr]">
            <div>
              <div className="flex flex-wrap gap-2">
                <Pill tone="blue">Revenue Command</Pill>
                <Pill tone="emerald">SDR V11</Pill>
                <Pill tone="amber">{mode === "overdue" ? "Overdue Recovery" : mode === "followups" ? "Follow-up Desk" : "Execution Cockpit"}</Pill>
              </div>
              <h1 className="mt-6 max-w-6xl text-4xl font-black leading-tight tracking-tight text-white md:text-6xl">
                SDR execution — call discipline, qualification, follow-up and appointment conversion.
              </h1>
              <p className="mt-5 max-w-5xl text-base font-semibold leading-8 text-cyan-50/85 md:text-lg">
                A focused SDR cockpit for revenue movement: prioritize leads, call today, recover no-answer cases, qualify context, book appointments and protect every high-value opportunity from decay.
              </p>
              <div className="mt-7 flex flex-wrap gap-3">
                <Button type="button" variant="primary" onClick={() => setCreateOpen(true)}>+ Create lead</Button>
                <Button type="button" onClick={() => selected && callLead(selected.id)}>Log call</Button>
                <Button type="button" variant="soft" onClick={restoreSeed}>Restore seed</Button>
                <Link href="/revenue-command-center" className="rounded-2xl border border-white/20 bg-white/10 px-5 py-3 text-sm font-black text-white">← Revenue HQ</Link>
                <Link href="/revenue-command-center/follow-ups" className="rounded-2xl border border-white/20 bg-white/10 px-5 py-3 text-sm font-black text-white">Follow-ups</Link>
                <Link href="/revenue-command-center/follow-ups/overdue" className="rounded-2xl border border-white/20 bg-white/10 px-5 py-3 text-sm font-black text-white">Overdue</Link>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-3xl bg-white/10 p-5 ring-1 ring-white/15">
                <p className="text-xs font-black uppercase tracking-[0.2em] text-cyan-100/70">Leads</p>
                <p className="mt-3 text-4xl font-black text-white">{stats.total}</p>
                <p className="mt-2 text-sm font-bold text-white/75">Active SDR queue</p>
              </div>
              <div className="rounded-3xl bg-white/10 p-5 ring-1 ring-white/15">
                <p className="text-xs font-black uppercase tracking-[0.2em] text-cyan-100/70">Due today</p>
                <p className="mt-3 text-4xl font-black text-white">{stats.dueToday}</p>
                <p className="mt-2 text-sm font-bold text-white/75">Call/recovery pressure</p>
              </div>
              <div className="rounded-3xl bg-white/10 p-5 ring-1 ring-white/15">
                <p className="text-xs font-black uppercase tracking-[0.2em] text-cyan-100/70">Value</p>
                <p className="mt-3 text-3xl font-black text-white">{mad(stats.value)}</p>
                <p className="mt-2 text-sm font-bold text-white/75">Potential exposure</p>
              </div>
              <div className="rounded-3xl bg-white/10 p-5 ring-1 ring-white/15">
                <p className="text-xs font-black uppercase tracking-[0.2em] text-cyan-100/70">Booked</p>
                <p className="mt-3 text-4xl font-black text-white">{stats.booked}</p>
                <p className="mt-2 text-sm font-bold text-white/75">Appointments created</p>
              </div>
            </div>
          </div>
        </section>

        {createOpen ? (
          <Card>
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.25em] text-cyan-700">Create lead</p>
                <h2 className="mt-1 text-2xl font-black text-slate-950">Create SDR lead / follow-up item</h2>
              </div>
              <Button type="button" variant="soft" onClick={() => setCreateOpen(false)}>Close</Button>
            </div>
            <form onSubmit={createLead} className="grid gap-4 xl:grid-cols-4">
              <Input value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} placeholder="Lead / family / contact name" />
              <Input value={draft.phone} onChange={(e) => setDraft({ ...draft, phone: e.target.value })} placeholder="Phone" />
              <Input value={draft.email} onChange={(e) => setDraft({ ...draft, email: e.target.value })} placeholder="Email" />
              <Input value={draft.city} onChange={(e) => setDraft({ ...draft, city: e.target.value })} placeholder="City" />
              <Select value={draft.source} onChange={(e) => setDraft({ ...draft, source: e.target.value as LeadSource })}>
                {sources.map((source) => <option key={source} value={source}>{label(source)}</option>)}
              </Select>
              <Input value={draft.owner} onChange={(e) => setDraft({ ...draft, owner: e.target.value })} placeholder="Owner" />
              <Select value={draft.status} onChange={(e) => setDraft({ ...draft, status: e.target.value as SDRStatus })}>
                {statuses.map((status) => <option key={status} value={status}>{label(status)}</option>)}
              </Select>
              <Select value={draft.priority} onChange={(e) => setDraft({ ...draft, priority: e.target.value as SDRPriority })}>
                {priorities.map((priority) => <option key={priority} value={priority}>{label(priority)}</option>)}
              </Select>
              <Input type="number" value={draft.score} onChange={(e) => setDraft({ ...draft, score: Number(e.target.value) })} placeholder="Score" />
              <Input type="number" value={draft.valueMad} onChange={(e) => setDraft({ ...draft, valueMad: Number(e.target.value) })} placeholder="Value MAD" />
              <Input type="date" value={draft.nextCallDate} onChange={(e) => setDraft({ ...draft, nextCallDate: e.target.value })} />
              <Input type="number" value={draft.callAttempts} onChange={(e) => setDraft({ ...draft, callAttempts: Number(e.target.value) })} placeholder="Attempts" />
              <Textarea value={draft.qualification} onChange={(e) => setDraft({ ...draft, qualification: e.target.value })} placeholder="Qualification context" className="xl:col-span-2" />
              <Textarea value={draft.objection} onChange={(e) => setDraft({ ...draft, objection: e.target.value })} placeholder="Objection / blocker" className="xl:col-span-2" />
              <Textarea value={draft.script} onChange={(e) => setDraft({ ...draft, script: e.target.value })} placeholder="Call script" className="xl:col-span-2" />
              <Textarea value={draft.nextAction} onChange={(e) => setDraft({ ...draft, nextAction: e.target.value })} placeholder="Next action" className="xl:col-span-2" />
              <Button type="submit" variant="primary" className="xl:col-span-4">Create lead</Button>
            </form>
          </Card>
        ) : null}

        <Card>
          <div className="grid gap-4 lg:grid-cols-[1fr_.45fr_.35fr_.35fr]">
            <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search leads, phone, owner, source, qualification..." />
            <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as SDRStatus | "all")}>
              <option value="all">All statuses</option>
              {statuses.map((status) => <option key={status} value={status}>{label(status)}</option>)}
            </Select>
            <Select value={priorityFilter} onChange={(e) => setPriorityFilter(e.target.value as SDRPriority | "all")}>
              <option value="all">All priorities</option>
              {priorities.map((priority) => <option key={priority} value={priority}>{label(priority)}</option>)}
            </Select>
            <Button type="button" onClick={() => setCreateOpen(true)}>New lead</Button>
          </div>
        </Card>

        <div className="grid gap-6 xl:grid-cols-[1.1fr_.9fr]">
          <section className="space-y-4">
            {filtered.map((lead) => (
              <Card key={lead.id} className={lead.id === selected?.id ? "ring-4 ring-cyan-100" : ""}>
                <div className="grid gap-5 xl:grid-cols-[1fr_.5fr_.6fr]">
                  <div>
                    <div className="flex flex-wrap gap-2">
                      <Pill tone={priorityTone(lead.priority)}>{label(lead.priority)}</Pill>
                      <Pill tone={lead.status === "no_answer" || lead.status === "escalated" ? "rose" : lead.status === "appointment_booked" ? "emerald" : "blue"}>{label(lead.status)}</Pill>
                      <Pill tone={scoreTone(lead.score)}>Score {lead.score}</Pill>
                    </div>
                    <button type="button" onClick={() => setSelectedId(lead.id)} className="mt-3 text-left text-2xl font-black text-slate-950 hover:text-cyan-800">{lead.name}</button>
                    <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">{lead.nextAction}</p>
                    <p className="mt-3 text-sm font-black text-slate-700">{lead.phone || "No phone"} • {lead.owner} • next {lead.nextCallDate}</p>
                  </div>
                  <div className="rounded-2xl bg-slate-50 p-4">
                    <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-400">Value / attempts</p>
                    <p className="mt-2 text-2xl font-black text-slate-950">{mad(lead.valueMad)}</p>
                    <p className="mt-2 text-xs font-bold text-slate-500">{lead.callAttempts} attempts • {label(lead.source)}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <Button type="button" variant="soft" onClick={() => setSelectedId(lead.id)}>Select</Button>
                    <Button type="button" variant="soft" onClick={() => callLead(lead.id)}>Call</Button>
                    <Button type="button" variant="soft" onClick={() => noAnswer(lead.id)}>No answer</Button>
                    <Button type="button" variant="soft" onClick={() => qualify(lead.id)}>Qualify</Button>
                    <Button type="button" variant="primary" onClick={() => bookAppointment(lead.id)}>Book</Button>
                    <Button type="button" variant="danger" onClick={() => deleteLead(lead.id)}>Delete</Button>
                  </div>
                </div>
              </Card>
            ))}
          </section>

          <aside className="space-y-6">
            <Card className="bg-slate-950 text-white">
              <p className="text-xs font-black uppercase tracking-[0.25em] text-cyan-300">Selected lead</p>
              <h2 className="mt-2 text-3xl font-black text-white">{selected?.name || "No lead selected"}</h2>

              {selected ? (
                <div className="mt-5 space-y-4">
                  <Textarea value={selected.qualification} onChange={(e) => updateLead(selected.id, { qualification: e.target.value }, "Qualification updated")} />
                  <div className="grid grid-cols-2 gap-3">
                    <Select value={selected.status} onChange={(e) => updateLead(selected.id, { status: e.target.value as SDRStatus }, "Status updated")}>
                      {statuses.map((status) => <option key={status} value={status}>{label(status)}</option>)}
                    </Select>
                    <Select value={selected.priority} onChange={(e) => updateLead(selected.id, { priority: e.target.value as SDRPriority }, "Priority updated")}>
                      {priorities.map((priority) => <option key={priority} value={priority}>{label(priority)}</option>)}
                    </Select>
                    <Input value={selected.owner} onChange={(e) => updateLead(selected.id, { owner: e.target.value }, "Owner updated")} />
                    <Input type="number" value={selected.score} onChange={(e) => updateLead(selected.id, { score: Number(e.target.value) }, "Score updated")} />
                  </div>
                  <Textarea value={selected.script} onChange={(e) => updateLead(selected.id, { script: e.target.value }, "Script updated")} />
                  <Textarea value={selected.objection} onChange={(e) => updateLead(selected.id, { objection: e.target.value }, "Objection updated")} />
                  <Textarea value={selected.nextAction} onChange={(e) => updateLead(selected.id, { nextAction: e.target.value }, "Next action updated")} />
                  <div className="grid grid-cols-2 gap-2">
                    <Button type="button" variant="soft" onClick={() => callLead(selected.id)}>Call</Button>
                    <Button type="button" variant="soft" onClick={() => noAnswer(selected.id)}>No Answer</Button>
                    <Button type="button" variant="soft" onClick={() => qualify(selected.id)}>Qualify</Button>
                    <Button type="button" variant="primary" onClick={() => bookAppointment(selected.id)}>Book Appointment</Button>
                  </div>
                </div>
              ) : null}
            </Card>

            <Card>
              <p className="text-xs font-black uppercase tracking-[0.25em] text-cyan-700">Queue by status</p>
              <div className="mt-4 grid gap-3">
                {queueGroups.map((group) => (
                  <div key={group.status} className="flex items-center justify-between rounded-2xl bg-slate-50 p-3">
                    <span className="text-sm font-black text-slate-900">{label(group.status)}</span>
                    <Pill tone="blue">{group.leads.length}</Pill>
                  </div>
                ))}
              </div>
            </Card>

            <Card>
              <p className="text-xs font-black uppercase tracking-[0.25em] text-cyan-700">SDR activity log</p>
              <div className="mt-4 space-y-2">
                {store.logs.slice(0, 10).map((log) => (
                  <div key={log.id} className="rounded-2xl bg-slate-50 p-3">
                    <p className="text-sm font-black text-slate-950">{log.action}</p>
                    <p className="text-xs font-bold text-slate-500">{log.note} • {log.at}</p>
                  </div>
                ))}
              </div>
            </Card>
          </aside>
        </div>
      </div>
    </main>
  )
}
