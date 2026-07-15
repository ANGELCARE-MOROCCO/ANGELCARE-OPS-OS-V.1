"use client"

import Link from "next/link"
import { useEffect, useMemo, useState } from "react"

type BriefStatus = "draft" | "review" | "approved" | "actioned" | "closed"
type BriefPriority = "critical" | "high" | "medium" | "low"
type BriefType = "risk" | "decision" | "performance" | "opportunity" | "people" | "system"

type ExecutiveBriefItem = {
  id: string
  title: string
  type: BriefType
  owner: string
  priority: BriefPriority
  status: BriefStatus
  valueMad: number
  risk: string
  decisionNeeded: string
  recommendation: string
  nextAction: string
  deadline: string
  executiveNote: string
  createdAt: string
  updatedAt: string
}

type ExecutiveLog = {
  id: string
  itemId: string
  at: string
  action: string
  note: string
}

type ExecutiveStore = {
  items: ExecutiveBriefItem[]
  logs: ExecutiveLog[]
}

const STORE_KEY = "revenue_executive_briefing_v11_store"

const statuses: BriefStatus[] = ["draft", "review", "approved", "actioned", "closed"]
const priorities: BriefPriority[] = ["critical", "high", "medium", "low"]
const types: BriefType[] = ["risk", "decision", "performance", "opportunity", "people", "system"]

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

function seedItems(): ExecutiveBriefItem[] {
  const now = new Date().toISOString()

  return [
    {
      id: "exec-risk-vip-lead",
      title: "Critical VIP lead recovery requires executive owner",
      type: "risk",
      owner: "Revenue Manager",
      priority: "critical",
      status: "review",
      valueMad: 185000,
      risk: "High-value family lead may be lost if callback and decision path are not controlled today.",
      decisionNeeded: "Assign executive owner and approve immediate recovery plan.",
      recommendation: "CEO/Revenue Manager calls decision maker or supervises SDR call today.",
      nextAction: "Open control tower intervention and close loop within 2 hours.",
      deadline: today(0),
      executiveNote: "This is the highest urgency item because value and trust risk are both high.",
      createdAt: now,
      updatedAt: now,
    },
    {
      id: "exec-opportunity-clinic",
      title: "Clinic partnership pipeline can unlock recurring referrals",
      type: "opportunity",
      owner: "BD Officer",
      priority: "high",
      status: "draft",
      valueMad: 320000,
      risk: "Partnership may stall without referral economics and decision-maker presentation.",
      decisionNeeded: "Approve partner offer structure and meeting narrative.",
      recommendation: "Prepare one-page referral economics and schedule leadership meeting.",
      nextAction: "Finalize deck, confirm medical director, and define activation pilot.",
      deadline: today(2),
      executiveNote: "Strategic opportunity with recurring value beyond one transaction.",
      createdAt: now,
      updatedAt: now,
    },
    {
      id: "exec-performance-sdr",
      title: "SDR follow-up discipline needs daily accountability",
      type: "performance",
      owner: "SDR Lead",
      priority: "high",
      status: "review",
      valueMad: 97000,
      risk: "Delayed callbacks create revenue leakage and reduce trust.",
      decisionNeeded: "Confirm daily SLA target and escalation owner.",
      recommendation: "Daily 30-minute recovery block and end-of-day report.",
      nextAction: "Create recurring SDR follow-up discipline routine.",
      deadline: today(1),
      executiveNote: "Operational routine improvement, not just a one-time fix.",
      createdAt: now,
      updatedAt: now,
    },
  ]
}

function defaultStore(): ExecutiveStore {
  return {
    items: seedItems(),
    logs: [{ id: uid(), itemId: "system", at: new Date().toLocaleString(), action: "Executive briefing initialized", note: "Revenue Executive Briefing V11 workspace seeded." }],
  }
}

function readStore(): ExecutiveStore {
  if (typeof window === "undefined") return defaultStore()

  try {
    const raw = localStorage.getItem(STORE_KEY)
    if (!raw) {
      const seeded = defaultStore()
      localStorage.setItem(STORE_KEY, JSON.stringify(seeded))
      return seeded
    }

    const parsed = JSON.parse(raw) as ExecutiveStore
    if (!Array.isArray(parsed.items)) return defaultStore()

    return parsed
  } catch {
    return defaultStore()
  }
}

function writeStore(store: ExecutiveStore) {
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
  return <input {...props} className={`w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-950 outline-none placeholder:text-slate-400 focus:border-slate-800 focus:ring-4 focus:ring-slate-100 ${props.className || ""}`} />
}

function Select(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...props} className={`w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-950 outline-none focus:border-slate-800 focus:ring-4 focus:ring-slate-100 ${props.className || ""}`} />
}

function Textarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} className={`min-h-[100px] w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-950 outline-none placeholder:text-slate-400 focus:border-slate-800 focus:ring-4 focus:ring-slate-100 ${props.className || ""}`} />
}

function Button(props: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "dark" | "primary" | "soft" | "danger" }) {
  const variant = props.variant || "dark"
  const variants = {
    dark: "bg-slate-950 text-white hover:bg-slate-800",
    primary: "bg-slate-900 text-white hover:bg-black",
    soft: "border border-slate-200 bg-white text-slate-800 hover:bg-slate-50",
    danger: "bg-rose-600 text-white hover:bg-rose-700",
  }

  return <button {...props} className={`rounded-2xl px-5 py-3 text-sm font-black shadow-sm transition ${variants[variant]} ${props.className || ""}`} />
}

function priorityTone(priority: BriefPriority) {
  if (priority === "critical") return "rose"
  if (priority === "high") return "amber"
  if (priority === "medium") return "blue"
  return "slate"
}

export default function RevenueExecutiveBriefingV11Workspace({ mode = "briefing" }: { mode?: "briefing" | "strategy" | "control" }) {
  const [store, setStore] = useState<ExecutiveStore>(() => defaultStore())
  const [query, setQuery] = useState("")
  const [priorityFilter, setPriorityFilter] = useState<BriefPriority | "all">("all")
  const [typeFilter, setTypeFilter] = useState<BriefType | "all">("all")
  const [selectedId, setSelectedId] = useState("")
  const [createOpen, setCreateOpen] = useState(false)
  const [draft, setDraft] = useState({
    title: "",
    type: "decision" as BriefType,
    owner: "Revenue Manager",
    priority: "high" as BriefPriority,
    status: "draft" as BriefStatus,
    valueMad: 50000,
    risk: "",
    decisionNeeded: "",
    recommendation: "",
    nextAction: "",
    deadline: today(1),
    executiveNote: "",
  })

  useEffect(() => {
    const loaded = readStore()
    setStore(loaded)
    setSelectedId(loaded.items[0]?.id || "")
  }, [])

  function commit(next: ExecutiveStore, action: string, note: string, itemId?: string) {
    const withLog = {
      ...next,
      logs: [{ id: uid(), itemId: itemId || selectedId || "system", at: new Date().toLocaleString(), action, note }, ...next.logs].slice(0, 100),
    }

    setStore(withLog)
    writeStore(withLog)
  }

  function restoreSeed() {
    const seeded = defaultStore()
    setStore(seeded)
    setSelectedId(seeded.items[0]?.id || "")
    writeStore(seeded)
  }

  const selected = store.items.find((item) => item.id === selectedId) || store.items[0]

  const filtered = useMemo(() => {
    return store.items.filter((item) => {
      const hay = `${item.title} ${item.owner} ${item.risk} ${item.decisionNeeded} ${item.recommendation} ${item.nextAction} ${item.executiveNote}`.toLowerCase()

      return (!query || hay.includes(query.toLowerCase()))
        && (priorityFilter === "all" || item.priority === priorityFilter)
        && (typeFilter === "all" || item.type === typeFilter)
    })
  }, [store.items, query, priorityFilter, typeFilter])

  const stats = useMemo(() => {
    const critical = store.items.filter((item) => item.priority === "critical").length
    const decisions = store.items.filter((item) => item.decisionNeeded.trim()).length
    const value = store.items.reduce((sum, item) => sum + Number(item.valueMad || 0), 0)
    const pending = store.items.filter((item) => !["actioned", "closed"].includes(item.status)).length
    const approved = store.items.filter((item) => item.status === "approved" || item.status === "actioned").length

    return { critical, decisions, value, pending, approved, total: store.items.length }
  }, [store.items])

  function updateItem(id: string, patch: Partial<ExecutiveBriefItem>, action = "Brief updated") {
    const target = store.items.find((item) => item.id === id)
    const items = store.items.map((item) => item.id === id ? { ...item, ...patch, updatedAt: new Date().toISOString() } : item)

    commit({ ...store, items }, action, target?.title || id, id)
  }

  function createItem(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!draft.title.trim()) return

    const now = new Date().toISOString()
    const item: ExecutiveBriefItem = {
      id: uid(),
      title: draft.title,
      type: draft.type,
      owner: draft.owner,
      priority: draft.priority,
      status: draft.status,
      valueMad: Number(draft.valueMad) || 0,
      risk: draft.risk,
      decisionNeeded: draft.decisionNeeded,
      recommendation: draft.recommendation,
      nextAction: draft.nextAction || "Define next leadership action.",
      deadline: draft.deadline,
      executiveNote: draft.executiveNote,
      createdAt: now,
      updatedAt: now,
    }

    commit({ ...store, items: [item, ...store.items] }, "Executive brief created", item.title, item.id)
    setSelectedId(item.id)
    setCreateOpen(false)
    setDraft({
      title: "",
      type: "decision",
      owner: "Revenue Manager",
      priority: "high",
      status: "draft",
      valueMad: 50000,
      risk: "",
      decisionNeeded: "",
      recommendation: "",
      nextAction: "",
      deadline: today(1),
      executiveNote: "",
    })
  }

  function deleteItem(id: string) {
    const target = store.items.find((item) => item.id === id)
    const items = store.items.filter((item) => item.id !== id)
    commit({ ...store, items }, "Executive brief deleted", target?.title || id, id)
    setSelectedId(items[0]?.id || "")
  }

  function approveItem(id: string) {
    updateItem(id, { status: "approved", nextAction: "Approved. Assign execution owner and review closure." }, "Brief approved")
  }

  function actionItem(id: string) {
    updateItem(id, { status: "actioned", nextAction: "Action taken. Monitor outcome and close when stable." }, "Brief actioned")
  }

  function closeItem(id: string) {
    updateItem(id, { status: "closed" }, "Brief closed")
  }

  const weeklySummary = useMemo(() => {
    const critical = store.items.filter((item) => item.priority === "critical")
    const highValue = store.items.filter((item) => item.valueMad >= 100000)
    const decisions = store.items.filter((item) => item.decisionNeeded.trim())

    return {
      headline: critical.length
        ? `${critical.length} critical revenue risk(s) require leadership attention.`
        : "No critical revenue risks currently open.",
      value: highValue.reduce((sum, item) => sum + item.valueMad, 0),
      decisionCount: decisions.length,
      topAction: critical[0]?.nextAction || highValue[0]?.nextAction || "Maintain daily command cadence and owner accountability.",
    }
  }, [store.items])

  return (
    <main className="min-h-screen bg-slate-100 text-slate-950 selection:bg-slate-300 selection:text-slate-950">
      <div className="mx-auto max-w-[1900px] space-y-6 p-4 lg:p-8">
        <section className="overflow-hidden rounded-[2.4rem] bg-gradient-to-br from-slate-950 via-zinc-900 to-black p-7 text-white shadow-2xl lg:p-10">
          <div className="grid gap-8 xl:grid-cols-[1.35fr_.65fr]">
            <div>
              <div className="flex flex-wrap gap-2">
                <Pill tone="slate">Revenue Command</Pill>
                <Pill tone="blue">Executive V11</Pill>
                <Pill tone="amber">{mode === "strategy" ? "Strategy Room" : mode === "control" ? "Control Tower" : "Executive Briefing"}</Pill>
              </div>
              <h1 className="mt-6 max-w-6xl text-4xl font-black leading-tight tracking-tight text-white md:text-6xl">
                Executive revenue briefing — decisions, risks, opportunities and leadership control.
              </h1>
              <p className="mt-5 max-w-5xl text-base font-semibold leading-8 text-slate-100/85 md:text-lg">
                A leadership-grade command layer for CEO and senior managers: weekly summary, high-value risks, decision requests, strategic opportunities, owner accountability and final action control.
              </p>
              <div className="mt-7 flex flex-wrap gap-3">
                <Button type="button" variant="primary" onClick={() => setCreateOpen(true)}>+ Create brief item</Button>
                <Button type="button" onClick={() => selected && approveItem(selected.id)}>Approve selected</Button>
                <Button type="button" variant="soft" onClick={restoreSeed}>Restore seed</Button>
                <Link href="/revenue-command-center" className="rounded-2xl border border-white/20 bg-white/10 px-5 py-3 text-sm font-black text-white">← Revenue HQ</Link>
                <Link href="/revenue-command-center/control-tower" className="rounded-2xl border border-white/20 bg-white/10 px-5 py-3 text-sm font-black text-white">Control Tower</Link>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-3xl bg-white/10 p-5 ring-1 ring-white/15">
                <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-100/70">Pending</p>
                <p className="mt-3 text-4xl font-black text-white">{stats.pending}</p>
                <p className="mt-2 text-sm font-bold text-white/75">Open leadership items</p>
              </div>
              <div className="rounded-3xl bg-white/10 p-5 ring-1 ring-white/15">
                <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-100/70">Critical</p>
                <p className="mt-3 text-4xl font-black text-white">{stats.critical}</p>
                <p className="mt-2 text-sm font-bold text-white/75">Immediate risks</p>
              </div>
              <div className="rounded-3xl bg-white/10 p-5 ring-1 ring-white/15">
                <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-100/70">Value</p>
                <p className="mt-3 text-3xl font-black text-white">{mad(stats.value)}</p>
                <p className="mt-2 text-sm font-bold text-white/75">Revenue exposure</p>
              </div>
              <div className="rounded-3xl bg-white/10 p-5 ring-1 ring-white/15">
                <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-100/70">Decisions</p>
                <p className="mt-3 text-4xl font-black text-white">{stats.decisions}</p>
                <p className="mt-2 text-sm font-bold text-white/75">Need leadership</p>
              </div>
            </div>
          </div>
        </section>

        <Card className="border-slate-300 bg-white">
          <div className="grid gap-4 lg:grid-cols-[1fr_.45fr_.45fr]">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.25em] text-slate-500">Weekly executive summary</p>
              <h2 className="mt-2 text-2xl font-black text-slate-950">{weeklySummary.headline}</h2>
              <p className="mt-2 text-sm font-bold leading-6 text-slate-600">Top action: {weeklySummary.topAction}</p>
            </div>
            <div className="rounded-3xl bg-slate-950 p-5 text-white">
              <p className="text-xs font-black uppercase tracking-[0.2em] text-white/60">High-value exposure</p>
              <p className="mt-2 text-3xl font-black">{mad(weeklySummary.value)}</p>
            </div>
            <div className="rounded-3xl bg-slate-100 p-5">
              <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-500">Decision queue</p>
              <p className="mt-2 text-3xl font-black text-slate-950">{weeklySummary.decisionCount}</p>
            </div>
          </div>
        </Card>

        {createOpen ? (
          <Card>
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.25em] text-slate-700">Create executive brief</p>
                <h2 className="mt-1 text-2xl font-black text-slate-950">Create leadership decision/risk item</h2>
              </div>
              <Button type="button" variant="soft" onClick={() => setCreateOpen(false)}>Close</Button>
            </div>
            <form onSubmit={createItem} className="grid gap-4 xl:grid-cols-4">
              <Input value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} placeholder="Brief title" />
              <Select value={draft.type} onChange={(e) => setDraft({ ...draft, type: e.target.value as BriefType })}>
                {types.map((type) => <option key={type} value={type}>{label(type)}</option>)}
              </Select>
              <Input value={draft.owner} onChange={(e) => setDraft({ ...draft, owner: e.target.value })} placeholder="Owner" />
              <Input type="date" value={draft.deadline} onChange={(e) => setDraft({ ...draft, deadline: e.target.value })} />
              <Select value={draft.priority} onChange={(e) => setDraft({ ...draft, priority: e.target.value as BriefPriority })}>
                {priorities.map((priority) => <option key={priority} value={priority}>{label(priority)}</option>)}
              </Select>
              <Select value={draft.status} onChange={(e) => setDraft({ ...draft, status: e.target.value as BriefStatus })}>
                {statuses.map((status) => <option key={status} value={status}>{label(status)}</option>)}
              </Select>
              <Input type="number" value={draft.valueMad} onChange={(e) => setDraft({ ...draft, valueMad: Number(e.target.value) })} placeholder="Value MAD" />
              <Input value={draft.nextAction} onChange={(e) => setDraft({ ...draft, nextAction: e.target.value })} placeholder="Next action" />
              <Textarea value={draft.risk} onChange={(e) => setDraft({ ...draft, risk: e.target.value })} placeholder="Risk / context" className="xl:col-span-2" />
              <Textarea value={draft.decisionNeeded} onChange={(e) => setDraft({ ...draft, decisionNeeded: e.target.value })} placeholder="Decision needed" className="xl:col-span-2" />
              <Textarea value={draft.recommendation} onChange={(e) => setDraft({ ...draft, recommendation: e.target.value })} placeholder="Recommendation" className="xl:col-span-2" />
              <Textarea value={draft.executiveNote} onChange={(e) => setDraft({ ...draft, executiveNote: e.target.value })} placeholder="Executive note" className="xl:col-span-2" />
              <Button type="submit" variant="primary" className="xl:col-span-4">Create brief item</Button>
            </form>
          </Card>
        ) : null}

        <Card>
          <div className="grid gap-4 lg:grid-cols-[1fr_.45fr_.35fr_.35fr]">
            <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search executive risks, decisions, recommendations..." />
            <Select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value as BriefType | "all")}>
              <option value="all">All types</option>
              {types.map((type) => <option key={type} value={type}>{label(type)}</option>)}
            </Select>
            <Select value={priorityFilter} onChange={(e) => setPriorityFilter(e.target.value as BriefPriority | "all")}>
              <option value="all">All priorities</option>
              {priorities.map((priority) => <option key={priority} value={priority}>{label(priority)}</option>)}
            </Select>
            <Button type="button" onClick={() => setCreateOpen(true)}>New brief</Button>
          </div>
        </Card>

        <div className="grid gap-6 xl:grid-cols-[1.1fr_.9fr]">
          <section className="space-y-4">
            {filtered.map((item) => (
              <Card key={item.id} className={item.id === selected?.id ? "ring-4 ring-slate-300" : ""}>
                <div className="grid gap-5 xl:grid-cols-[1fr_.5fr_.6fr]">
                  <div>
                    <div className="flex flex-wrap gap-2">
                      <Pill tone={priorityTone(item.priority)}>{label(item.priority)}</Pill>
                      <Pill tone={item.status === "approved" || item.status === "actioned" ? "emerald" : "blue"}>{label(item.status)}</Pill>
                      <Pill tone="violet">{label(item.type)}</Pill>
                    </div>
                    <button type="button" onClick={() => setSelectedId(item.id)} className="mt-3 text-left text-2xl font-black text-slate-950 hover:text-slate-700">{item.title}</button>
                    <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">{item.recommendation || item.nextAction}</p>
                    <p className="mt-3 text-sm font-black text-slate-700">{item.owner} • deadline {item.deadline}</p>
                  </div>
                  <div className="rounded-2xl bg-slate-50 p-4">
                    <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-400">Exposure</p>
                    <p className="mt-2 text-2xl font-black text-slate-950">{mad(item.valueMad)}</p>
                    <p className="mt-2 text-xs font-bold text-slate-500">{item.decisionNeeded || "No decision requested"}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <Button type="button" variant="soft" onClick={() => setSelectedId(item.id)}>Select</Button>
                    <Button type="button" variant="soft" onClick={() => approveItem(item.id)}>Approve</Button>
                    <Button type="button" variant="soft" onClick={() => actionItem(item.id)}>Actioned</Button>
                    <Button type="button" variant="soft" onClick={() => closeItem(item.id)}>Close</Button>
                    <Button type="button" variant="danger" onClick={() => deleteItem(item.id)}>Delete</Button>
                  </div>
                </div>
              </Card>
            ))}
          </section>

          <aside className="space-y-6">
            <Card className="bg-slate-950 text-white">
              <p className="text-xs font-black uppercase tracking-[0.25em] text-slate-300">Selected brief</p>
              <h2 className="mt-2 text-3xl font-black text-white">{selected?.title || "No brief selected"}</h2>

              {selected ? (
                <div className="mt-5 space-y-4">
                  <Textarea value={selected.executiveNote} onChange={(e) => updateItem(selected.id, { executiveNote: e.target.value }, "Executive note updated")} />
                  <div className="grid grid-cols-2 gap-3">
                    <Select value={selected.status} onChange={(e) => updateItem(selected.id, { status: e.target.value as BriefStatus }, "Status updated")}>
                      {statuses.map((status) => <option key={status} value={status}>{label(status)}</option>)}
                    </Select>
                    <Select value={selected.priority} onChange={(e) => updateItem(selected.id, { priority: e.target.value as BriefPriority }, "Priority updated")}>
                      {priorities.map((priority) => <option key={priority} value={priority}>{label(priority)}</option>)}
                    </Select>
                    <Input value={selected.owner} onChange={(e) => updateItem(selected.id, { owner: e.target.value }, "Owner updated")} />
                    <Input type="number" value={selected.valueMad} onChange={(e) => updateItem(selected.id, { valueMad: Number(e.target.value) }, "Value updated")} />
                  </div>
                  <Textarea value={selected.risk} onChange={(e) => updateItem(selected.id, { risk: e.target.value }, "Risk updated")} />
                  <Textarea value={selected.decisionNeeded} onChange={(e) => updateItem(selected.id, { decisionNeeded: e.target.value }, "Decision updated")} />
                  <Textarea value={selected.recommendation} onChange={(e) => updateItem(selected.id, { recommendation: e.target.value }, "Recommendation updated")} />
                  <Textarea value={selected.nextAction} onChange={(e) => updateItem(selected.id, { nextAction: e.target.value }, "Next action updated")} />
                  <div className="grid grid-cols-2 gap-2">
                    <Button type="button" variant="soft" onClick={() => approveItem(selected.id)}>Approve</Button>
                    <Button type="button" variant="soft" onClick={() => actionItem(selected.id)}>Actioned</Button>
                    <Button type="button" variant="primary" onClick={() => closeItem(selected.id)}>Close</Button>
                  </div>
                </div>
              ) : null}
            </Card>

            <Card>
              <p className="text-xs font-black uppercase tracking-[0.25em] text-slate-700">Leadership rhythm</p>
              <div className="mt-4 grid gap-3">
                {[
                  "Daily revenue risk review",
                  "High-value opportunity rescue",
                  "Owner accountability checkpoint",
                  "Weekly executive revenue brief",
                  "Strategic partnership decision review",
                  "SDR follow-up discipline report",
                ].map((item) => (
                  <div key={item} className="rounded-2xl bg-slate-50 p-3 text-sm font-black text-slate-800">{item}</div>
                ))}
              </div>
            </Card>

            <Card>
              <p className="text-xs font-black uppercase tracking-[0.25em] text-slate-700">Executive log</p>
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
