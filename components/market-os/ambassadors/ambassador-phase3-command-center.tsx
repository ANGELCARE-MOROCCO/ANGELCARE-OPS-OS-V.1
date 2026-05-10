"use client"

import * as React from "react"
import Link from "next/link"
import {
  Button,
  Panel,
  DarkPanel,
  Badge,
  Metric,
  Field,
  Input,
  TextArea,
  Select,
  Shell,
  Meter,
  mad,
  pct,
  todayISO,
  uid,
  useAmbassadorStore,
  ambassadorName,
  programName,
  territoryName,
  statusTone,
  riskTone,
} from "./ambassador-backoffice-system"
import type { Communication } from "./ambassador-backoffice-system"
import { buildPhase3ActionId, formatMadShort, scoreAmbassador } from "@/lib/market-os/ambassadors/phase3-intelligence"
import type { Phase3Tone } from "@/lib/market-os/ambassadors/phase3-intelligence"

type Phase3Mode = "command-center" | "execution-center" | "intelligence" | "automations"
type Tone = "slate" | "emerald" | "amber" | "rose" | "blue"
type ActionStatus = "queued" | "in_progress" | "done" | "blocked"
type AutomationTrigger = "daily" | "proof_submitted" | "lead_converted" | "risk_opened" | "payout_ready" | "training_due"

type CommandAction = {
  id: string
  title: string
  owner: string
  area: string
  priority: "Low" | "Medium" | "High" | "Critical"
  dueDate: string
  status: ActionStatus
  detail: string
}

type AutomationRule = {
  id: string
  title: string
  trigger: AutomationTrigger
  channel: string
  audience: string
  enabled: boolean
  message: string
}

const actionKey = "angelcare.marketos.ambassador.phase3.command.actions"
const automationKey = "angelcare.marketos.ambassador.phase3.automation.rules"

const seedActions: CommandAction[] = [
  { id: "act-proof-queue", title: "Clear pending proof validation queue", owner: "Ambassador Director", area: "Proofs", priority: "High", dueDate: todayISO(1), status: "queued", detail: "Review submitted proof, approve safe executions, reject weak proofs with reason, then generate rewards only for approved items." },
  { id: "act-rabat-coverage", title: "Strengthen Rabat territory coverage", owner: "Regional Manager", area: "Territories", priority: "Medium", dueDate: todayISO(3), status: "in_progress", detail: "Assign two active ambassadors to Rabat leads and open recruitment for missing neighborhoods." },
  { id: "act-payout-control", title: "Finance payout readiness review", owner: "Finance Controller", area: "Payouts", priority: "High", dueDate: todayISO(2), status: "queued", detail: "Approve clean payouts, block payout records attached to unresolved compliance issues, and mark paid only after finance confirmation." },
]

const seedAutomations: AutomationRule[] = [
  { id: "auto-proof", title: "Proof submitted review reminder", trigger: "proof_submitted", channel: "Internal", audience: "Ambassador Director", enabled: true, message: "A new ambassador proof requires review. Check quality, compliance and conversion evidence before reward generation." },
  { id: "auto-risk", title: "Compliance escalation alert", trigger: "risk_opened", channel: "WhatsApp", audience: "Regional Manager", enabled: true, message: "A brand safety issue is open. Pause sensitive missions and apply coaching or escalation immediately." },
  { id: "auto-training", title: "Training due reminder", trigger: "training_due", channel: "Email", audience: "Ambassador", enabled: false, message: "Your AngelCare training module is due soon. Complete it before receiving new high-trust missions." },
]

function safeJson<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback
  try {
    const raw = window.localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : fallback
  } catch {
    return fallback
  }
}

function writeJson<T>(key: string, value: T): void {
  if (typeof window === "undefined") return
  window.localStorage.setItem(key, JSON.stringify(value))
}

function useLocalList<T>(key: string, fallback: T[]) {
  const [items, setItems] = React.useState<T[]>(fallback)
  React.useEffect(() => setItems(safeJson<T[]>(key, fallback)), [key, fallback])
  const commit = React.useCallback((mutator: (draft: T[]) => void) => {
    setItems(prev => {
      const draft = JSON.parse(JSON.stringify(prev)) as T[]
      mutator(draft)
      writeJson(key, draft)
      return draft
    })
  }, [key])
  return { items, commit }
}

function modeTitle(mode: Phase3Mode): { title: string; desc: string; badge: string } {
  if (mode === "execution-center") return { title: "Ambassador Execution Center", desc: "Control daily missions, proof queues, payout readiness, lead conversion and territory coverage from one operational cockpit.", badge: "Execution" }
  if (mode === "intelligence") return { title: "Ambassador Intelligence", desc: "Score ambassador health, detect risk, identify territory gaps and prioritize the profiles that can scale AngelCare faster.", badge: "Intelligence" }
  if (mode === "automations") return { title: "Ambassador Automation Rules", desc: "Prepare operational triggers for proof review, risk escalation, payout readiness, training reminders and campaign broadcasts.", badge: "Automations" }
  return { title: "Ambassador Command Center", desc: "A deeper enterprise command layer for the AngelCare marketing ambassador unit: decisions, priorities, performance, risk and execution control.", badge: "Phase 3" }
}

function Header({ mode }: { mode: Phase3Mode }) {
  const m = modeTitle(mode)
  return (
    <DarkPanel className="overflow-hidden p-6 lg:p-8">
      <div className="grid gap-6 xl:grid-cols-[1.25fr_.75fr] xl:items-end">
        <div>
          <div className="flex flex-wrap gap-2"><Badge tone="emerald">AngelCare</Badge><Badge tone="blue">Ambassador Unit</Badge><Badge tone="amber">{m.badge}</Badge></div>
          <h1 className="mt-4 text-4xl font-black tracking-tight text-white md:text-5xl">{m.title}</h1>
          <p className="mt-4 max-w-5xl text-sm font-semibold leading-7 text-emerald-50/80 md:text-base">{m.desc}</p>
        </div>
        <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
          <p className="text-xs font-black uppercase tracking-[0.24em] text-emerald-200">Navigation</p>
          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            <Button href="/market-os/ambassadors" kind="soft">Cockpit</Button>
            <Button href="/market-os/ambassadors/command-center" kind="primary">Command</Button>
            <Button href="/market-os/ambassadors/execution-center" kind="soft">Execution</Button>
            <Button href="/market-os/ambassadors/intelligence" kind="soft">Intelligence</Button>
            <Button href="/market-os/ambassadors/automations" kind="soft">Automations</Button>
            <Button href="/market-os/ambassadors/analytics" kind="soft">Analytics</Button>
          </div>
        </div>
      </div>
    </DarkPanel>
  )
}

function NavTabs({ mode }: { mode: Phase3Mode }) {
  const tabs: Array<{ href: string; label: string; mode: Phase3Mode }> = [
    { href: "/market-os/ambassadors/command-center", label: "Command", mode: "command-center" },
    { href: "/market-os/ambassadors/execution-center", label: "Execution", mode: "execution-center" },
    { href: "/market-os/ambassadors/intelligence", label: "Intelligence", mode: "intelligence" },
    { href: "/market-os/ambassadors/automations", label: "Automations", mode: "automations" },
  ]
  return <Panel className="p-3"><div className="flex gap-2 overflow-x-auto">{tabs.map(tab => <Link key={tab.href} href={tab.href} className={`whitespace-nowrap rounded-2xl px-4 py-3 text-xs font-black uppercase tracking-wide transition ${tab.mode === mode ? "bg-slate-950 text-white" : "bg-slate-50 text-slate-700 hover:bg-slate-100"}`}>{tab.label}</Link>)}</div></Panel>
}

function Section({ eyebrow, title, description, children }: { eyebrow: string; title: string; description: string; children: React.ReactNode }) {
  return <Panel className="p-5"><p className="text-xs font-black uppercase tracking-[0.24em] text-emerald-700">{eyebrow}</p><h2 className="mt-2 text-2xl font-black text-slate-950">{title}</h2><p className="mt-2 max-w-5xl text-sm font-semibold leading-6 text-slate-600">{description}</p><div className="mt-5">{children}</div></Panel>
}

function proofEvidenceText(proof: unknown): string {
  const candidate = proof as {
    evidence?: string
    url?: string
    fileUrl?: string
    link?: string
    notes?: string
    description?: string
    reason?: string
  }

  return (
    candidate.evidence ??
    candidate.url ??
    candidate.fileUrl ??
    candidate.link ??
    candidate.notes ??
    candidate.description ??
    candidate.reason ??
    "Evidence submitted. Open the proof record for full validation details."
  )
}

function payoutDueText(payout: unknown): string {
  const candidate = payout as {
    dueDate?: string
    due_at?: string
    dueAt?: string
    createdAt?: string
    created_at?: string
  }

  return (
    candidate.dueDate ??
    candidate.due_at ??
    candidate.dueAt ??
    candidate.createdAt ??
    candidate.created_at ??
    todayISO()
  )
}

function payoutNotesText(payout: unknown): string {
  const candidate = payout as {
    notes?: string
    note?: string
    description?: string
    approvalNotes?: string
    approval_notes?: string
  }

  return (
    candidate.notes ??
    candidate.note ??
    candidate.description ??
    candidate.approvalNotes ??
    candidate.approval_notes ??
    "Finance review required"
  )
}

function leadTerritoryId(lead: unknown): string | undefined {
  const candidate = lead as {
    territoryId?: string
    territory_id?: string
    city?: string
    territory?: string
  }

  return candidate.territoryId ?? candidate.territory_id ?? candidate.territory ?? candidate.city
}

function SummaryMetrics() {
  const { store } = useAmbassadorStore()
  const approvedMissions = store.missions.filter(m => ["approved", "paid"].includes(m.status)).length
  const pendingProofs = store.proofs.filter(p => p.status === "submitted").length
  const openPayouts = store.payouts.filter(p => ["pending", "approved"].includes(p.status)).length
  const risks = store.compliance.filter(c => c.status !== "resolved").length
  const revenue = store.ambassadors.reduce((s, a) => s + a.revenueMAD, 0) + store.leads.reduce((s, l) => s + l.revenueMAD, 0)
  return <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5"><Metric label="Revenue influence" value={mad(revenue)} sub="Ambassador plus attributed leads" /><Metric label="Mission velocity" value={pct((approvedMissions / Math.max(1, store.missions.length)) * 100)} sub="Approved or paid missions" /><Metric label="Proof queue" value={String(pendingProofs)} sub="Waiting validation" /><Metric label="Payout queue" value={String(openPayouts)} sub="Needs finance control" /><Metric label="Open risks" value={String(risks)} sub="Brand safety items" /></section>
}

function CommandActions() {
  const { items, commit } = useLocalList<CommandAction>(actionKey, seedActions)
  const [form, setForm] = React.useState<CommandAction>({ id: "", title: "", owner: "Ambassador Director", area: "Missions", priority: "High", dueDate: todayISO(1), status: "queued", detail: "" })
  return (
    <div className="grid gap-5 xl:grid-cols-[.8fr_1.2fr]">
      <Section eyebrow="decision intake" title="Create command action" description="Convert ambassador operational observations into a concrete owner, due date, status and priority.">
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Title"><Input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="Example: Activate Casablanca elite ambassadors" /></Field>
          <Field label="Owner"><Input value={form.owner} onChange={e => setForm({ ...form, owner: e.target.value })} /></Field>
          <Field label="Area"><Select value={form.area} onChange={e => setForm({ ...form, area: e.target.value })}><option>Missions</option><option>Proofs</option><option>Rewards</option><option>Payouts</option><option>Territories</option><option>Leads</option><option>Training</option><option>Compliance</option></Select></Field>
          <Field label="Priority"><Select value={form.priority} onChange={e => setForm({ ...form, priority: e.target.value as CommandAction["priority"] })}><option>Low</option><option>Medium</option><option>High</option><option>Critical</option></Select></Field>
          <Field label="Due date"><Input type="date" value={form.dueDate} onChange={e => setForm({ ...form, dueDate: e.target.value })} /></Field>
          <Field label="Status"><Select value={form.status} onChange={e => setForm({ ...form, status: e.target.value as ActionStatus })}><option value="queued">Queued</option><option value="in_progress">In progress</option><option value="done">Done</option><option value="blocked">Blocked</option></Select></Field>
          <div className="md:col-span-2"><Field label="Execution detail"><TextArea value={form.detail} onChange={e => setForm({ ...form, detail: e.target.value })} /></Field></div>
        </div>
        <div className="mt-4"><Button kind="primary" onClick={() => commit(d => d.unshift({ ...form, id: buildPhase3ActionId("cmd") }))}>Create command action</Button></div>
      </Section>
      <Section eyebrow="control board" title="Priority action board" description="Move actions from queued to in progress, done or blocked without touching the Market-OS parent page.">
        <div className="grid gap-3">
          {items.map(item => <div key={item.id} className="rounded-2xl border border-slate-200 p-4"><div className="flex flex-wrap justify-between gap-3"><div><p className="font-black text-slate-950">{item.title}</p><p className="text-sm font-bold text-slate-500">{item.area} • {item.owner} • due {item.dueDate}</p><p className="mt-2 text-sm font-semibold leading-6 text-slate-600">{item.detail}</p></div><div className="flex gap-2"><Badge tone={riskTone(item.priority) as Tone}>{item.priority}</Badge><Badge tone={statusTone(item.status) as Tone}>{item.status}</Badge></div></div><div className="mt-4 flex flex-wrap gap-2"><Button onClick={() => commit(d => { const x = d.find(a => a.id === item.id); if (x) x.status = "in_progress" })} kind="primary">Start</Button><Button onClick={() => commit(d => { const x = d.find(a => a.id === item.id); if (x) x.status = "done" })} kind="success">Done</Button><Button onClick={() => commit(d => { const x = d.find(a => a.id === item.id); if (x) x.status = "blocked" })} kind="danger">Blocked</Button></div></div>)}
        </div>
      </Section>
    </div>
  )
}

function MissionExecutionBoard() {
  const { store, commit } = useAmbassadorStore()
  const live = store.missions.filter(m => ["assigned", "in_progress", "proof_submitted"].includes(m.status))
  const proofReady = store.proofs.filter(p => p.status === "submitted")
  return (
    <div className="grid gap-5 xl:grid-cols-2">
      <Section eyebrow="mission flow" title="Live mission execution" description="Advance active missions and force operational movement instead of leaving static cards.">
        <div className="grid gap-3">
          {live.length === 0 ? <p className="text-sm font-bold text-slate-500">No active mission blockage detected.</p> : live.map(m => <div key={m.id} className="rounded-2xl border p-4"><div className="flex flex-wrap justify-between gap-3"><div><p className="font-black">{m.title}</p><p className="text-sm font-bold text-slate-500">{ambassadorName(store, m.ambassadorId)} • {m.channel} • {m.dueDate}</p></div><Badge tone={statusTone(m.status) as Tone}>{m.status}</Badge></div><div className="mt-3 flex flex-wrap gap-2"><Button onClick={() => commit(d => { d.missions = d.missions.map(item => item.id === m.id ? { ...item, status: "in_progress" } : item) }, "phase3 mission started", `Started ${m.title}`)} kind="primary">Start</Button><Button onClick={() => commit(d => { d.missions = d.missions.map(item => item.id === m.id ? { ...item, status: "proof_submitted" } : item) }, "phase3 proof requested", `Proof requested for ${m.title}`)}>Proof submitted</Button><Button href="/market-os/ambassadors/proofs" kind="soft">Open proofs</Button></div></div>)}
        </div>
      </Section>
      <Section eyebrow="quality gate" title="Proof queue control" description="Approve safe proof or reject with governance before reward and payout movement.">
        <div className="grid gap-3">
          {proofReady.length === 0 ? <p className="text-sm font-bold text-slate-500">Proof queue is clean.</p> : proofReady.map(p => <div key={p.id} className="rounded-2xl border p-4"><div className="flex flex-wrap justify-between gap-3"><div><p className="font-black">{p.type}</p><p className="text-sm font-bold text-slate-500">Mission {p.missionId} • submitted {p.submittedAt}</p></div><Badge tone={statusTone(p.status) as Tone}>{p.status}</Badge></div><p className="mt-2 text-sm font-semibold text-slate-600">{proofEvidenceText(p)}</p><div className="mt-3 flex flex-wrap gap-2"><Button onClick={() => commit(d => { d.proofs = d.proofs.map(item => item.id === p.id ? { ...item, status: "approved", reviewedBy: "Phase 3 Command", reviewedAt: todayISO() } : item) }, "phase3 proof approved", `Approved proof ${p.id}`)} kind="success">Approve</Button><Button onClick={() => commit(d => { d.proofs = d.proofs.map(item => item.id === p.id ? { ...item, status: "rejected", reviewedBy: "Phase 3 Command", reviewedAt: todayISO(), reason: "Needs stronger evidence or compliance review" } : item) }, "phase3 proof rejected", `Rejected proof ${p.id}`)} kind="danger">Reject</Button></div></div>)}
        </div>
      </Section>
    </div>
  )
}

function FinanceAndLeadBoard() {
  const { store, commit } = useAmbassadorStore()
  const payouts = store.payouts.filter(p => ["pending", "approved", "blocked"].includes(p.status))
  const leads = store.leads.filter(l => ["new", "qualified", "converted"].includes(l.status))
  return (
    <div className="grid gap-5 xl:grid-cols-2">
      <Section eyebrow="finance control" title="Payout governance" description="Approve, block or mark as paid with finance-grade traceability.">
        <div className="grid gap-3">{payouts.map(p => <div key={p.id} className="rounded-2xl border p-4"><div className="flex flex-wrap justify-between gap-3"><div><p className="font-black">{ambassadorName(store, p.ambassadorId)}</p><p className="text-sm font-bold text-slate-500">{mad(p.amountMAD)} • {payoutDueText(p)} • {payoutNotesText(p)}</p></div><Badge tone={statusTone(p.status) as Tone}>{p.status}</Badge></div><div className="mt-3 flex flex-wrap gap-2"><Button onClick={() => commit(d => { d.payouts = d.payouts.map(item => item.id === p.id ? { ...item, status: "approved" } : item) }, "phase3 payout approved", `Approved payout ${p.id}`)} kind="primary">Approve</Button><Button onClick={() => commit(d => { d.payouts = d.payouts.map(item => item.id === p.id ? { ...item, status: "paid" } : item) }, "phase3 payout paid", `Paid payout ${p.id}`)} kind="success">Paid</Button><Button onClick={() => commit(d => { d.payouts = d.payouts.map(item => item.id === p.id ? { ...item, status: "blocked" } : item) }, "phase3 payout blocked", `Blocked payout ${p.id}`)} kind="danger">Block</Button></div></div>)}</div>
      </Section>
      <Section eyebrow="commercial output" title="Lead conversion board" description="Push ambassador influence into qualified opportunities and real revenue attribution.">
        <div className="grid gap-3">{leads.map(l => <div key={l.id} className="rounded-2xl border p-4"><div className="flex flex-wrap justify-between gap-3"><div><p className="font-black">{l.parentName}</p><p className="text-sm font-bold text-slate-500">{ambassadorName(store, l.ambassadorId)} • {l.service} • {mad(l.revenueMAD)}</p></div><Badge tone={statusTone(l.status) as Tone}>{l.status}</Badge></div><div className="mt-3 flex flex-wrap gap-2"><Button onClick={() => commit(d => { d.leads = d.leads.map(item => item.id === l.id ? { ...item, status: "qualified" } : item) }, "phase3 lead qualified", `Qualified ${l.parentName}`)} kind="primary">Qualify</Button><Button onClick={() => commit(d => { d.leads = d.leads.map(item => item.id === l.id ? { ...item, status: "converted", revenueMAD: Math.max(item.revenueMAD, 2500) } : item) }, "phase3 lead converted", `Converted ${l.parentName}`)} kind="success">Convert</Button><Button href="/market-os/ambassadors/leads" kind="soft">Open leads</Button></div></div>)}</div>
      </Section>
    </div>
  )
}

function IntelligenceBoard() {
  const { store } = useAmbassadorStore()
  const scored = store.ambassadors.map(a => {
    const missions = store.missions.filter(m => m.ambassadorId === a.id)
    const approved = missions.filter(m => ["approved", "paid"].includes(m.status)).length
    const risks = store.compliance.filter(c => c.ambassadorId === a.id && c.status !== "resolved").length
    return { ambassador: a, score: scoreAmbassador({ readiness: a.readiness, complianceScore: a.complianceScore, leadScore: a.leadScore, revenueMAD: a.revenueMAD, missionsApproved: approved, missionsTotal: missions.length, openRisks: risks }) }
  }).sort((a, b) => b.score.health - a.score.health)
  const territories = store.territories.map(t => ({ territory: t, ambassadors: store.ambassadors.filter(a => a.territoryId === t.id).length, leads: store.leads.filter(l => leadTerritoryId(l) === t.id || leadTerritoryId(l) === t.city).length }))
  return (
    <div className="space-y-5">
      <Section eyebrow="profile scoring" title="Ambassador health ranking" description="A simple but useful health model combining readiness, compliance, lead score, mission execution, revenue and unresolved risks.">
        <div className="grid gap-3">{scored.map(({ ambassador, score }) => <div key={ambassador.id} className="rounded-2xl border p-4"><div className="flex flex-wrap justify-between gap-3"><div><p className="font-black">{ambassador.name}</p><p className="text-sm font-bold text-slate-500">{ambassador.city} • {programName(store, ambassador.programId)} • {territoryName(store, ambassador.territoryId)} • {formatMadShort(ambassador.revenueMAD)}</p></div><div className="flex gap-2"><Badge tone={score.tone as Phase3Tone}>{score.risk}</Badge><Badge tone={score.health >= 80 ? "emerald" : score.health >= 60 ? "blue" : "rose"}>Health {pct(score.health)}</Badge></div></div><div className="mt-3"><Meter value={score.health} /></div><p className="mt-3 text-sm font-semibold text-slate-600">{score.recommendation}</p></div>)}</div>
      </Section>
      <Section eyebrow="territory intelligence" title="Coverage and demand gaps" description="Read each zone by ambassador capacity, lead pressure and operational opportunity.">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">{territories.map(x => <div key={x.territory.id} className="rounded-2xl border p-4"><div className="flex justify-between gap-3"><div><p className="font-black">{x.territory.city}</p><p className="text-sm font-bold text-slate-500">Manager: {x.territory.manager}</p></div><Badge tone={x.ambassadors >= x.territory.capacity ? "emerald" : "amber"}>{x.ambassadors}/{x.territory.capacity}</Badge></div><div className="mt-4 grid grid-cols-2 gap-3"><div className="rounded-2xl bg-slate-50 p-3"><p className="text-xs font-black uppercase text-slate-400">Leads</p><p className="text-2xl font-black">{x.leads}</p></div><div className="rounded-2xl bg-slate-50 p-3"><p className="text-xs font-black uppercase text-slate-400">Gap</p><p className="text-2xl font-black">{Math.max(0, x.territory.capacity - x.ambassadors)}</p></div></div></div>)}</div>
      </Section>
    </div>
  )
}

function AutomationBoard() {
  const { items, commit } = useLocalList<AutomationRule>(automationKey, seedAutomations)
  const { store, commit: commitStore } = useAmbassadorStore()
  const [form, setForm] = React.useState<AutomationRule>({ id: "", title: "", trigger: "daily", channel: "WhatsApp", audience: "All active ambassadors", enabled: true, message: "" })
  return (
    <div className="grid gap-5 xl:grid-cols-[.8fr_1.2fr]">
      <Section eyebrow="rule builder" title="Create automation rule" description="This phase prepares reliable local automation rules. Later these rules can be connected to API/webhook delivery.">
        <div className="grid gap-4 md:grid-cols-2"><Field label="Title"><Input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} /></Field><Field label="Trigger"><Select value={form.trigger} onChange={e => setForm({ ...form, trigger: e.target.value as AutomationTrigger })}><option value="daily">Daily</option><option value="proof_submitted">Proof submitted</option><option value="lead_converted">Lead converted</option><option value="risk_opened">Risk opened</option><option value="payout_ready">Payout ready</option><option value="training_due">Training due</option></Select></Field><Field label="Channel"><Select value={form.channel} onChange={e => setForm({ ...form, channel: e.target.value })}><option>WhatsApp</option><option>Email</option><option>SMS</option><option>Internal</option></Select></Field><Field label="Audience"><Input value={form.audience} onChange={e => setForm({ ...form, audience: e.target.value })} /></Field><div className="md:col-span-2"><Field label="Message"><TextArea value={form.message} onChange={e => setForm({ ...form, message: e.target.value })} /></Field></div></div>
        <div className="mt-4"><Button kind="primary" onClick={() => commit(d => d.unshift({ ...form, id: buildPhase3ActionId("auto") }))}>Create automation rule</Button></div>
      </Section>
      <Section eyebrow="automation control" title="Rules and test actions" description="Enable/disable rules and generate a communication draft to validate the operational message.">
        <div className="grid gap-3">{items.map(r => <div key={r.id} className="rounded-2xl border p-4"><div className="flex flex-wrap justify-between gap-3"><div><p className="font-black">{r.title}</p><p className="text-sm font-bold text-slate-500">{r.trigger} • {r.channel} • {r.audience}</p><p className="mt-2 text-sm font-semibold text-slate-600">{r.message}</p></div><Badge tone={r.enabled ? "emerald" : "slate"}>{r.enabled ? "enabled" : "disabled"}</Badge></div><div className="mt-3 flex flex-wrap gap-2"><Button onClick={() => commit(d => { const x = d.find(item => item.id === r.id); if (x) x.enabled = !x.enabled })}>{r.enabled ? "Disable" : "Enable"}</Button><Button kind="primary" onClick={() => commitStore(d => { const communication: Communication = { id: uid("com"), audience: r.audience, title: `Automation test: ${r.title}`, channel: r.channel, message: r.message, status: "draft", sendDate: todayISO() }; d.communications.unshift(communication) }, "phase3 automation draft", `Created automation draft ${r.title}`)}>Create comm draft</Button></div></div>)}</div>
      </Section>
    </div>
  )
}

function OperationalShortcuts() {
  const shortcuts = [
    { href: "/market-os/ambassadors/missions", title: "Missions", text: "Create, assign and progress ambassador execution." },
    { href: "/market-os/ambassadors/proofs", title: "Proofs", text: "Review evidence and validate work quality." },
    { href: "/market-os/ambassadors/rewards", title: "Rewards", text: "Generate bonuses and challenge rewards." },
    { href: "/market-os/ambassadors/payouts", title: "Payouts", text: "Approve, block and pay clean records." },
    { href: "/market-os/ambassadors/territories", title: "Territories", text: "Control city capacity and regional coverage." },
    { href: "/market-os/ambassadors/communications", title: "Comms", text: "Send operational broadcasts and updates." },
  ]
  return <Section eyebrow="execution shortcuts" title="Deep operation routes" description="Quick access to the Ambassador submodule only. Market-OS main page remains untouched."><div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">{shortcuts.map(s => <Link key={s.href} href={s.href} className="rounded-2xl border border-slate-200 p-4 transition hover:border-emerald-300 hover:bg-emerald-50"><p className="font-black text-slate-950">{s.title}</p><p className="mt-1 text-sm font-semibold text-slate-600">{s.text}</p></Link>)}</div></Section>
}

export default function AmbassadorPhase3CommandCenter({ mode = "command-center" }: { mode?: Phase3Mode }) {
  return (
    <Shell>
      <Header mode={mode} />
      <NavTabs mode={mode} />
      <SummaryMetrics />
      {mode === "command-center" ? <><CommandActions /><OperationalShortcuts /></> : null}
      {mode === "execution-center" ? <><MissionExecutionBoard /><FinanceAndLeadBoard /></> : null}
      {mode === "intelligence" ? <IntelligenceBoard /> : null}
      {mode === "automations" ? <AutomationBoard /> : null}
    </Shell>
  )
}