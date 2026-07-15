"use client"

import Link from "next/link"
import { useEffect, useMemo, useState } from "react"

type SignalType = "prospect" | "campaign" | "task" | "appointment" | "follow_up" | "partnership" | "market"
type SignalStatus = "new" | "scored" | "recommended" | "assigned" | "actioned" | "monitoring" | "closed"
type SignalRisk = "critical" | "high" | "medium" | "low"
type RecommendationType = "call_now" | "escalate" | "book_appointment" | "recover_follow_up" | "pause_campaign" | "assign_owner" | "prepare_offer"

type PredictiveSignal = {
  id: string
  title: string
  type: SignalType
  owner: string
  status: SignalStatus
  risk: SignalRisk
  score: number
  confidence: number
  valueMad: number
  trigger: string
  evidence: string
  recommendation: RecommendationType
  nextAction: string
  scenario: string
  dueDate: string
  createdAt: string
  updatedAt: string
}

type PredictiveLog = {
  id: string
  signalId: string
  at: string
  action: string
  note: string
}

type PredictiveStore = {
  signals: PredictiveSignal[]
  logs: PredictiveLog[]
}

const STORE_KEY = "revenue_predictive_v11_store"

const signalTypes: SignalType[] = ["prospect", "campaign", "task", "appointment", "follow_up", "partnership", "market"]
const statuses: SignalStatus[] = ["new", "scored", "recommended", "assigned", "actioned", "monitoring", "closed"]
const risks: SignalRisk[] = ["critical", "high", "medium", "low"]
const recommendations: RecommendationType[] = ["call_now", "escalate", "book_appointment", "recover_follow_up", "pause_campaign", "assign_owner", "prepare_offer"]

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

function seedSignals(): PredictiveSignal[] {
  const now = new Date().toISOString()

  return [
    {
      id: "pred-vip-stale-lead",
      title: "VIP lead likely to decay without immediate callback",
      type: "prospect",
      owner: "Revenue Manager",
      status: "recommended",
      risk: "critical",
      score: 94,
      confidence: 88,
      valueMad: 185000,
      trigger: "High value + overdue follow-up + no owner confirmation.",
      evidence: "Lead age > 24h, value above threshold, call attempts incomplete.",
      recommendation: "call_now",
      nextAction: "Call within 2 hours and assign executive owner.",
      scenario: "High-value opportunity rescue.",
      dueDate: today(0),
      createdAt: now,
      updatedAt: now,
    },
    {
      id: "pred-campaign-roi-risk",
      title: "Campaign lead flow outpacing SDR capacity",
      type: "campaign",
      owner: "Growth Lead",
      status: "scored",
      risk: "high",
      score: 82,
      confidence: 76,
      valueMad: 240000,
      trigger: "Campaign leads increasing while follow-up delay rises.",
      evidence: "Lead volume + delayed callback queue + no handoff confirmation.",
      recommendation: "assign_owner",
      nextAction: "Create SDR coverage block and lead handoff SLA.",
      scenario: "Campaign conversion protection.",
      dueDate: today(1),
      createdAt: now,
      updatedAt: now,
    },
    {
      id: "pred-partner-high-potential",
      title: "Clinic partnership has high strategic upside",
      type: "partnership",
      owner: "BD Officer",
      status: "new",
      risk: "medium",
      score: 79,
      confidence: 72,
      valueMad: 320000,
      trigger: "Referral value potential + decision-maker access.",
      evidence: "Clinic profile, referral demand, maternity positioning.",
      recommendation: "prepare_offer",
      nextAction: "Prepare referral economics and meeting deck.",
      scenario: "Partnership expansion.",
      dueDate: today(2),
      createdAt: now,
      updatedAt: now,
    },
  ]
}

function defaultStore(): PredictiveStore {
  return {
    signals: seedSignals(),
    logs: [{ id: uid(), signalId: "system", at: new Date().toLocaleString(), action: "Predictive initialized", note: "Revenue Predictive V11 workspace seeded." }],
  }
}

function readStore(): PredictiveStore {
  if (typeof window === "undefined") return defaultStore()

  try {
    const raw = localStorage.getItem(STORE_KEY)
    if (!raw) {
      const seeded = defaultStore()
      localStorage.setItem(STORE_KEY, JSON.stringify(seeded))
      return seeded
    }

    const parsed = JSON.parse(raw) as PredictiveStore
    if (!Array.isArray(parsed.signals)) return defaultStore()

    return parsed
  } catch {
    return defaultStore()
  }
}

function writeStore(store: PredictiveStore) {
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
  return <input {...props} className={`w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-950 outline-none placeholder:text-slate-400 focus:border-indigo-700 focus:ring-4 focus:ring-indigo-100 ${props.className || ""}`} />
}

function Select(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...props} className={`w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-950 outline-none focus:border-indigo-700 focus:ring-4 focus:ring-indigo-100 ${props.className || ""}`} />
}

function Textarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} className={`min-h-[100px] w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-950 outline-none placeholder:text-slate-400 focus:border-indigo-700 focus:ring-4 focus:ring-indigo-100 ${props.className || ""}`} />
}

function Button(props: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "dark" | "primary" | "soft" | "danger" }) {
  const variant = props.variant || "dark"
  const variants = {
    dark: "bg-slate-950 text-white hover:bg-slate-800",
    primary: "bg-indigo-700 text-white hover:bg-indigo-800",
    soft: "border border-slate-200 bg-white text-slate-800 hover:bg-slate-50",
    danger: "bg-rose-600 text-white hover:bg-rose-700",
  }

  return <button {...props} className={`rounded-2xl px-5 py-3 text-sm font-black shadow-sm transition ${variants[variant]} ${props.className || ""}`} />
}

function riskTone(risk: SignalRisk) {
  if (risk === "critical") return "rose"
  if (risk === "high") return "amber"
  if (risk === "medium") return "blue"
  return "emerald"
}

function scoreTone(score: number) {
  if (score >= 90) return "rose"
  if (score >= 75) return "amber"
  if (score >= 60) return "blue"
  return "slate"
}

function computeRisk(score: number): SignalRisk {
  if (score >= 88) return "critical"
  if (score >= 75) return "high"
  if (score >= 55) return "medium"
  return "low"
}

export default function RevenuePredictiveV11Workspace({ mode = "predictive" }: { mode?: "predictive" | "ai" | "meta" }) {
  const [store, setStore] = useState<PredictiveStore>(() => defaultStore())
  const [query, setQuery] = useState("")
  const [riskFilter, setRiskFilter] = useState<SignalRisk | "all">("all")
  const [typeFilter, setTypeFilter] = useState<SignalType | "all">("all")
  const [selectedId, setSelectedId] = useState("")
  const [createOpen, setCreateOpen] = useState(false)
  const [draft, setDraft] = useState({
    title: "",
    type: "prospect" as SignalType,
    owner: "Revenue Manager",
    status: "new" as SignalStatus,
    risk: "medium" as SignalRisk,
    score: 70,
    confidence: 70,
    valueMad: 50000,
    trigger: "",
    evidence: "",
    recommendation: "call_now" as RecommendationType,
    nextAction: "",
    scenario: "",
    dueDate: today(1),
  })

  useEffect(() => {
    const loaded = readStore()
    setStore(loaded)
    setSelectedId(loaded.signals[0]?.id || "")
  }, [])

  function commit(next: PredictiveStore, action: string, note: string, signalId?: string) {
    const withLog = {
      ...next,
      logs: [{ id: uid(), signalId: signalId || selectedId || "system", at: new Date().toLocaleString(), action, note }, ...next.logs].slice(0, 100),
    }

    setStore(withLog)
    writeStore(withLog)
  }

  function restoreSeed() {
    const seeded = defaultStore()
    setStore(seeded)
    setSelectedId(seeded.signals[0]?.id || "")
    writeStore(seeded)
  }

  const selected = store.signals.find((signal) => signal.id === selectedId) || store.signals[0]

  const filtered = useMemo(() => {
    return store.signals.filter((signal) => {
      const hay = `${signal.title} ${signal.type} ${signal.owner} ${signal.trigger} ${signal.evidence} ${signal.nextAction} ${signal.scenario}`.toLowerCase()

      return (!query || hay.includes(query.toLowerCase()))
        && (riskFilter === "all" || signal.risk === riskFilter)
        && (typeFilter === "all" || signal.type === typeFilter)
    })
  }, [store.signals, query, riskFilter, typeFilter])

  const stats = useMemo(() => {
    const critical = store.signals.filter((signal) => signal.risk === "critical").length
    const recommended = store.signals.filter((signal) => signal.status === "recommended").length
    const value = store.signals.reduce((sum, signal) => sum + Number(signal.valueMad || 0), 0)
    const avgScore = Math.round(store.signals.reduce((sum, signal) => sum + Number(signal.score || 0), 0) / Math.max(store.signals.length, 1))
    const avgConfidence = Math.round(store.signals.reduce((sum, signal) => sum + Number(signal.confidence || 0), 0) / Math.max(store.signals.length, 1))

    return { critical, recommended, value, avgScore, avgConfidence, total: store.signals.length }
  }, [store.signals])

  function updateSignal(id: string, patch: Partial<PredictiveSignal>, action = "Signal updated") {
    const target = store.signals.find((signal) => signal.id === id)
    const signals = store.signals.map((signal) => signal.id === id ? { ...signal, ...patch, updatedAt: new Date().toISOString() } : signal)

    commit({ ...store, signals }, action, target?.title || id, id)
  }

  function createSignal(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!draft.title.trim()) return

    const now = new Date().toISOString()
    const signal: PredictiveSignal = {
      id: uid(),
      title: draft.title,
      type: draft.type,
      owner: draft.owner,
      status: draft.status,
      risk: draft.risk,
      score: Number(draft.score) || 0,
      confidence: Number(draft.confidence) || 0,
      valueMad: Number(draft.valueMad) || 0,
      trigger: draft.trigger,
      evidence: draft.evidence,
      recommendation: draft.recommendation,
      nextAction: draft.nextAction || "Review signal and assign next action.",
      scenario: draft.scenario,
      dueDate: draft.dueDate,
      createdAt: now,
      updatedAt: now,
    }

    commit({ ...store, signals: [signal, ...store.signals] }, "Predictive signal created", signal.title, signal.id)
    setSelectedId(signal.id)
    setCreateOpen(false)
    setDraft({
      title: "",
      type: "prospect",
      owner: "Revenue Manager",
      status: "new",
      risk: "medium",
      score: 70,
      confidence: 70,
      valueMad: 50000,
      trigger: "",
      evidence: "",
      recommendation: "call_now",
      nextAction: "",
      scenario: "",
      dueDate: today(1),
    })
  }

  function deleteSignal(id: string) {
    const target = store.signals.find((signal) => signal.id === id)
    const signals = store.signals.filter((signal) => signal.id !== id)
    commit({ ...store, signals }, "Predictive signal deleted", target?.title || id, id)
    setSelectedId(signals[0]?.id || "")
  }

  function rescoreSignal(id: string) {
    const target = store.signals.find((signal) => signal.id === id)
    if (!target) return

    let nextScore = Math.round((target.score + target.confidence) / 2)
    if (target.valueMad >= 200000) nextScore += 8
    if (target.trigger.toLowerCase().includes("overdue")) nextScore += 7
    if (target.evidence.trim()) nextScore += 4

    nextScore = Math.max(0, Math.min(100, nextScore))

    updateSignal(id, {
      score: nextScore,
      risk: computeRisk(nextScore),
      status: "scored",
    }, "Signal re-scored")
  }

  function recommendSignal(id: string) {
    const target = store.signals.find((signal) => signal.id === id)
    if (!target) return

    let recommendation: RecommendationType = "assign_owner"
    if (target.type === "prospect" || target.type === "follow_up") recommendation = "call_now"
    if (target.type === "appointment") recommendation = "book_appointment"
    if (target.type === "campaign") recommendation = target.risk === "critical" ? "pause_campaign" : "assign_owner"
    if (target.type === "partnership") recommendation = "prepare_offer"

    updateSignal(id, {
      recommendation,
      status: "recommended",
      nextAction: `Execute recommendation: ${label(recommendation)}.`,
    }, "Recommendation generated")
  }

  function assignSignal(id: string) {
    updateSignal(id, { status: "assigned", nextAction: "Owner assigned. Execute and log outcome." }, "Signal assigned")
  }

  function actionSignal(id: string) {
    updateSignal(id, { status: "actioned", nextAction: "Action completed. Monitor result and close if stable." }, "Signal actioned")
  }

  return (
    <main className="min-h-screen bg-indigo-50/60 text-slate-950 selection:bg-indigo-200 selection:text-slate-950">
      <div className="mx-auto max-w-[1900px] space-y-6 p-4 lg:p-8">
        <section className="overflow-hidden rounded-[2.4rem] bg-gradient-to-br from-slate-950 via-indigo-950 to-black p-7 text-white shadow-2xl lg:p-10">
          <div className="grid gap-8 xl:grid-cols-[1.35fr_.65fr]">
            <div>
              <div className="flex flex-wrap gap-2">
                <Pill tone="violet">Revenue Command</Pill>
                <Pill tone="blue">Predictive V11</Pill>
                <Pill tone="amber">{mode === "ai" ? "AI Scoring" : mode === "meta" ? "Meta Readiness" : "Predictive Intelligence"}</Pill>
              </div>
              <h1 className="mt-6 max-w-6xl text-4xl font-black leading-tight tracking-tight text-white md:text-6xl">
                Predictive revenue intelligence — score risk, prioritize action and protect revenue.
              </h1>
              <p className="mt-5 max-w-5xl text-base font-semibold leading-8 text-indigo-50/85 md:text-lg">
                A senior revenue control layer for identifying high-risk signals, scoring commercial priority, generating next-best-action and pushing managers toward the highest-impact interventions.
              </p>
              <div className="mt-7 flex flex-wrap gap-3">
                <Button type="button" variant="primary" onClick={() => setCreateOpen(true)}>+ Create signal</Button>
                <Button type="button" onClick={() => selected && recommendSignal(selected.id)}>Recommend selected</Button>
                <Button type="button" variant="soft" onClick={restoreSeed}>Restore seed</Button>
                <Link href="/revenue-command-center" className="rounded-2xl border border-white/20 bg-white/10 px-5 py-3 text-sm font-black text-white">← Revenue HQ</Link>
                <Link href="/revenue-command-center/ai-scoring" className="rounded-2xl border border-white/20 bg-white/10 px-5 py-3 text-sm font-black text-white">AI Scoring</Link>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-3xl bg-white/10 p-5 ring-1 ring-white/15">
                <p className="text-xs font-black uppercase tracking-[0.2em] text-indigo-100/70">Signals</p>
                <p className="mt-3 text-4xl font-black text-white">{stats.total}</p>
                <p className="mt-2 text-sm font-bold text-white/75">Active intelligence items</p>
              </div>
              <div className="rounded-3xl bg-white/10 p-5 ring-1 ring-white/15">
                <p className="text-xs font-black uppercase tracking-[0.2em] text-indigo-100/70">Critical</p>
                <p className="mt-3 text-4xl font-black text-white">{stats.critical}</p>
                <p className="mt-2 text-sm font-bold text-white/75">High intervention priority</p>
              </div>
              <div className="rounded-3xl bg-white/10 p-5 ring-1 ring-white/15">
                <p className="text-xs font-black uppercase tracking-[0.2em] text-indigo-100/70">Value</p>
                <p className="mt-3 text-3xl font-black text-white">{mad(stats.value)}</p>
                <p className="mt-2 text-sm font-bold text-white/75">Revenue exposure</p>
              </div>
              <div className="rounded-3xl bg-white/10 p-5 ring-1 ring-white/15">
                <p className="text-xs font-black uppercase tracking-[0.2em] text-indigo-100/70">Avg score</p>
                <p className="mt-3 text-4xl font-black text-white">{stats.avgScore}</p>
                <p className="mt-2 text-sm font-bold text-white/75">Priority index</p>
              </div>
            </div>
          </div>
        </section>

        {createOpen ? (
          <Card>
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.25em] text-indigo-700">Create signal</p>
                <h2 className="mt-1 text-2xl font-black text-slate-950">Create predictive revenue signal</h2>
              </div>
              <Button type="button" variant="soft" onClick={() => setCreateOpen(false)}>Close</Button>
            </div>
            <form onSubmit={createSignal} className="grid gap-4 xl:grid-cols-4">
              <Input value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} placeholder="Signal title" />
              <Select value={draft.type} onChange={(e) => setDraft({ ...draft, type: e.target.value as SignalType })}>
                {signalTypes.map((type) => <option key={type} value={type}>{label(type)}</option>)}
              </Select>
              <Input value={draft.owner} onChange={(e) => setDraft({ ...draft, owner: e.target.value })} placeholder="Owner" />
              <Input type="date" value={draft.dueDate} onChange={(e) => setDraft({ ...draft, dueDate: e.target.value })} />
              <Select value={draft.status} onChange={(e) => setDraft({ ...draft, status: e.target.value as SignalStatus })}>
                {statuses.map((status) => <option key={status} value={status}>{label(status)}</option>)}
              </Select>
              <Select value={draft.risk} onChange={(e) => setDraft({ ...draft, risk: e.target.value as SignalRisk })}>
                {risks.map((risk) => <option key={risk} value={risk}>{label(risk)}</option>)}
              </Select>
              <Input type="number" value={draft.score} onChange={(e) => setDraft({ ...draft, score: Number(e.target.value) })} placeholder="Score" />
              <Input type="number" value={draft.confidence} onChange={(e) => setDraft({ ...draft, confidence: Number(e.target.value) })} placeholder="Confidence" />
              <Input type="number" value={draft.valueMad} onChange={(e) => setDraft({ ...draft, valueMad: Number(e.target.value) })} placeholder="Value MAD" />
              <Select value={draft.recommendation} onChange={(e) => setDraft({ ...draft, recommendation: e.target.value as RecommendationType })}>
                {recommendations.map((recommendation) => <option key={recommendation} value={recommendation}>{label(recommendation)}</option>)}
              </Select>
              <Input value={draft.scenario} onChange={(e) => setDraft({ ...draft, scenario: e.target.value })} placeholder="Scenario" />
              <Input value={draft.nextAction} onChange={(e) => setDraft({ ...draft, nextAction: e.target.value })} placeholder="Next action" />
              <Textarea value={draft.trigger} onChange={(e) => setDraft({ ...draft, trigger: e.target.value })} placeholder="Trigger" className="xl:col-span-2" />
              <Textarea value={draft.evidence} onChange={(e) => setDraft({ ...draft, evidence: e.target.value })} placeholder="Evidence" className="xl:col-span-2" />
              <Button type="submit" variant="primary" className="xl:col-span-4">Create signal</Button>
            </form>
          </Card>
        ) : null}

        <Card>
          <div className="grid gap-4 lg:grid-cols-[1fr_.45fr_.35fr_.35fr]">
            <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search signals, evidence, trigger, owner..." />
            <Select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value as SignalType | "all")}>
              <option value="all">All types</option>
              {signalTypes.map((type) => <option key={type} value={type}>{label(type)}</option>)}
            </Select>
            <Select value={riskFilter} onChange={(e) => setRiskFilter(e.target.value as SignalRisk | "all")}>
              <option value="all">All risks</option>
              {risks.map((risk) => <option key={risk} value={risk}>{label(risk)}</option>)}
            </Select>
            <Button type="button" onClick={() => setCreateOpen(true)}>New signal</Button>
          </div>
        </Card>

        <div className="grid gap-6 xl:grid-cols-[1.1fr_.9fr]">
          <section className="space-y-4">
            {filtered.map((signal) => (
              <Card key={signal.id} className={signal.id === selected?.id ? "ring-4 ring-indigo-100" : ""}>
                <div className="grid gap-5 xl:grid-cols-[1fr_.5fr_.6fr]">
                  <div>
                    <div className="flex flex-wrap gap-2">
                      <Pill tone={riskTone(signal.risk)}>{label(signal.risk)}</Pill>
                      <Pill tone={scoreTone(signal.score)}>Score {signal.score}</Pill>
                      <Pill tone="violet">{label(signal.type)}</Pill>
                    </div>
                    <button type="button" onClick={() => setSelectedId(signal.id)} className="mt-3 text-left text-2xl font-black text-slate-950 hover:text-indigo-800">{signal.title}</button>
                    <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">{signal.nextAction}</p>
                    <p className="mt-3 text-sm font-black text-slate-700">{signal.owner} • {label(signal.status)} • due {signal.dueDate}</p>
                  </div>
                  <div className="rounded-2xl bg-slate-50 p-4">
                    <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-400">Confidence / value</p>
                    <p className="mt-2 text-4xl font-black text-slate-950">{signal.confidence}%</p>
                    <p className="mt-2 text-xs font-bold text-slate-500">{mad(signal.valueMad)} • {label(signal.recommendation)}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <Button type="button" variant="soft" onClick={() => setSelectedId(signal.id)}>Select</Button>
                    <Button type="button" variant="soft" onClick={() => rescoreSignal(signal.id)}>Re-score</Button>
                    <Button type="button" variant="soft" onClick={() => recommendSignal(signal.id)}>Recommend</Button>
                    <Button type="button" variant="soft" onClick={() => assignSignal(signal.id)}>Assign</Button>
                    <Button type="button" variant="primary" onClick={() => actionSignal(signal.id)}>Actioned</Button>
                    <Button type="button" variant="danger" onClick={() => deleteSignal(signal.id)}>Delete</Button>
                  </div>
                </div>
              </Card>
            ))}
          </section>

          <aside className="space-y-6">
            <Card className="bg-slate-950 text-white">
              <p className="text-xs font-black uppercase tracking-[0.25em] text-indigo-300">Selected signal</p>
              <h2 className="mt-2 text-3xl font-black text-white">{selected?.title || "No signal selected"}</h2>

              {selected ? (
                <div className="mt-5 space-y-4">
                  <Textarea value={selected.evidence} onChange={(e) => updateSignal(selected.id, { evidence: e.target.value }, "Evidence updated")} />
                  <div className="grid grid-cols-2 gap-3">
                    <Select value={selected.status} onChange={(e) => updateSignal(selected.id, { status: e.target.value as SignalStatus }, "Status updated")}>
                      {statuses.map((status) => <option key={status} value={status}>{label(status)}</option>)}
                    </Select>
                    <Select value={selected.risk} onChange={(e) => updateSignal(selected.id, { risk: e.target.value as SignalRisk }, "Risk updated")}>
                      {risks.map((risk) => <option key={risk} value={risk}>{label(risk)}</option>)}
                    </Select>
                    <Input type="number" value={selected.score} onChange={(e) => updateSignal(selected.id, { score: Number(e.target.value), risk: computeRisk(Number(e.target.value)) }, "Score updated")} />
                    <Input type="number" value={selected.confidence} onChange={(e) => updateSignal(selected.id, { confidence: Number(e.target.value) }, "Confidence updated")} />
                    <Input value={selected.owner} onChange={(e) => updateSignal(selected.id, { owner: e.target.value }, "Owner updated")} />
                    <Input type="number" value={selected.valueMad} onChange={(e) => updateSignal(selected.id, { valueMad: Number(e.target.value) }, "Value updated")} />
                  </div>
                  <Textarea value={selected.trigger} onChange={(e) => updateSignal(selected.id, { trigger: e.target.value }, "Trigger updated")} />
                  <Textarea value={selected.nextAction} onChange={(e) => updateSignal(selected.id, { nextAction: e.target.value }, "Next action updated")} />
                  <div className="grid grid-cols-2 gap-2">
                    <Button type="button" variant="soft" onClick={() => rescoreSignal(selected.id)}>Re-score</Button>
                    <Button type="button" variant="soft" onClick={() => recommendSignal(selected.id)}>Recommend</Button>
                    <Button type="button" variant="soft" onClick={() => assignSignal(selected.id)}>Assign</Button>
                    <Button type="button" variant="primary" onClick={() => actionSignal(selected.id)}>Actioned</Button>
                  </div>
                </div>
              ) : null}
            </Card>

            <Card>
              <p className="text-xs font-black uppercase tracking-[0.25em] text-indigo-700">Predictive playbooks</p>
              <div className="mt-4 grid gap-3">
                {[
                  "High-value stale lead rescue",
                  "Campaign ROI risk intervention",
                  "Ownerless opportunity detection",
                  "Appointment no-show probability",
                  "Partnership upside prioritization",
                  "Follow-up decay prevention",
                ].map((item) => (
                  <div key={item} className="rounded-2xl bg-slate-50 p-3 text-sm font-black text-slate-800">{item}</div>
                ))}
              </div>
            </Card>

            <Card>
              <p className="text-xs font-black uppercase tracking-[0.25em] text-indigo-700">Predictive log</p>
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
