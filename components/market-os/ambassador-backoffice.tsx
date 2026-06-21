"use client"

import * as React from "react"
import Link from "next/link"
import {
  Ambassador,
  AmbassadorStatus,
  Button,
  DarkPanel,
  Input,
  Metric,
  Meter,
  Panel,
  Select,
  Shell,
  ambassadorName,
  mad,
  missionNext,
  pct,
  programName,
  riskTone,
  statusTone,
  territoryName,
  todayISO,
  uid,
  useAmbassadorStore,
  Badge,
} from "./ambassadors/ambassador-backoffice-system"

type ViewMode = "crm" | "recruitment" | "missions" | "proofs" | "payouts" | "territories" | "leads" | "compliance"
type FocusMode = "all" | "urgent" | "onboarding" | "payout" | "compliance" | "territory"

type Gateway = { label: string; href: string; detail: string; layer: string }

const gateways: Gateway[] = [
  { label: "Create ambassador", href: "/market-os/ambassadors/create", layer: "CRM", detail: "Create profile, territory, program, tier and operating notes." },
  { label: "Recruitment", href: "/market-os/ambassadors/recruitment", layer: "Pipeline", detail: "Move applicants through qualification, interview, approval and onboarding." },
  { label: "Onboarding", href: "/market-os/ambassadors/onboarding", layer: "Activation", detail: "Training, documents, WhatsApp access, first mission and readiness." },
  { label: "Programs", href: "/market-os/ambassadors/programs", layer: "Rules", detail: "Build commission rules, eligibility and tier logic." },
  { label: "Mission command", href: "/market-os/ambassadors/missions", layer: "Execution", detail: "Create, assign and execute ambassador missions." },
  { label: "Proof validation", href: "/market-os/ambassadors/proofs", layer: "Approval", detail: "Approve or reject proof and generate rewards." },
  { label: "Rewards", href: "/market-os/ambassadors/rewards", layer: "Motivation", detail: "Control bonuses, commissions and reward reasons." },
  { label: "Payouts", href: "/market-os/ambassadors/payouts", layer: "Finance", detail: "Approve, block, or mark payouts as paid." },
  { label: "Territories", href: "/market-os/ambassadors/territories", layer: "Coverage", detail: "Control city coverage, capacity and regional managers." },
  { label: "Leads", href: "/market-os/ambassadors/leads", layer: "Revenue", detail: "Track ambassador generated leads and revenue." },
  { label: "Compliance", href: "/market-os/ambassadors/compliance", layer: "Risk", detail: "Warnings, coaching, brand issues and escalation." },
  { label: "Assets", href: "/market-os/ambassadors/assets", layer: "Content", detail: "Scripts, campaign kits, captions and approved resources." },
  { label: "Analytics", href: "/market-os/ambassadors/analytics", layer: "Intelligence", detail: "Performance, revenue, readiness and risk intelligence." },
  { label: "Training", href: "/market-os/ambassadors/training", layer: "Academy", detail: "Education modules, scores and readiness controls." },
  { label: "Communications", href: "/market-os/ambassadors/communications", layer: "Broadcast", detail: "Messages, reminders and program announcements." },
  { label: "Settings", href: "/market-os/ambassadors/settings", layer: "Configuration", detail: "Proof policy, payout cycle and manager defaults." },
]

function average(values: number[]): number {
  return values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : 0
}

function Hero({ total, active, payouts, proofs, reset }: { total: number; active: number; payouts: number; proofs: number; reset: () => void }) {
  return (
    <DarkPanel className="overflow-hidden p-6 lg:p-8">
      <div className="grid gap-6 xl:grid-cols-[1.35fr_.8fr]">
        <div>
          <div className="flex flex-wrap gap-2">
            <Badge tone="emerald">Market-OS</Badge>
            <Badge tone="emerald">Ambassador Unit Agent</Badge>
            <Badge tone="amber">Stable TS Phase 1</Badge>
          </div>
          <h1 className="mt-5 max-w-5xl text-4xl font-black leading-tight tracking-tight text-slate-950 md:text-6xl">
            Ambassador operations command workspace.
          </h1>
          <p className="mt-5 max-w-4xl text-base font-semibold leading-8 text-emerald-50/85 md:text-lg">
            Recruit, onboard, activate, assign missions, validate proof, control rewards, track leads, protect compliance and manage Moroccan territory coverage from one focused ambassador command center.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Button href="/market-os/ambassadors/create" kind="primary">+ New ambassador</Button>
            <Button href="/market-os/ambassadors/recruitment" kind="soft">Recruitment pipeline</Button>
            <Button href="/market-os/ambassadors/missions" kind="soft">Mission command</Button>
            <Button href="/market-os/ambassadors/proofs" kind="soft">Validate proofs</Button>
            <Button href="/market-os/ambassadors/payouts" kind="soft">Payout control</Button>
            <Button onClick={reset} kind="danger">Reset local workspace</Button>
          </div>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-3xl border border-slate-200 bg-white/10 p-5"><p className="text-xs font-black uppercase text-emerald-100/70">Ambassadors</p><p className="mt-2 text-4xl font-black text-slate-950">{total}</p><p className="text-sm font-bold text-emerald-50/70">Profiles controlled</p></div>
          <div className="rounded-3xl border border-slate-200 bg-white/10 p-5"><p className="text-xs font-black uppercase text-emerald-100/70">Active</p><p className="mt-2 text-4xl font-black text-slate-950">{active}</p><p className="text-sm font-bold text-emerald-50/70">Ready to execute</p></div>
          <div className="rounded-3xl border border-slate-200 bg-white/10 p-5"><p className="text-xs font-black uppercase text-emerald-100/70">Proof queue</p><p className="mt-2 text-4xl font-black text-slate-950">{proofs}</p><p className="text-sm font-bold text-emerald-50/70">Needs review</p></div>
          <div className="rounded-3xl border border-slate-200 bg-white/10 p-5"><p className="text-xs font-black uppercase text-emerald-100/70">Payout queue</p><p className="mt-2 text-4xl font-black text-slate-950">{payouts}</p><p className="text-sm font-bold text-emerald-50/70">Finance control</p></div>
        </div>
      </div>
    </DarkPanel>
  )
}

function Gateways() {
  return (
    <Panel className="p-5">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.24em] text-emerald-700">Execution gateways</p>
          <h2 className="mt-2 text-2xl font-black text-slate-950">Ambassador unit workspaces</h2>
          <p className="mt-2 text-sm font-semibold text-slate-600">Every section opens a route where the operator can create, view, edit, approve or control an execution workflow.</p>
        </div>
        <Badge tone="emerald">16 controlled sections</Badge>
      </div>
      <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {gateways.map((gateway) => (
          <Link key={gateway.href} href={gateway.href} className="group rounded-3xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:border-emerald-400 hover:shadow-xl">
            <div className="flex items-start justify-between">
              <span className="rounded-2xl bg-emerald-50 px-3 py-2 text-xs font-black text-emerald-800">{gateway.layer}</span>
              <span className="text-slate-600 group-hover:text-emerald-700">→</span>
            </div>
            <h3 className="mt-4 text-lg font-black text-slate-950">{gateway.label}</h3>
            <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">{gateway.detail}</p>
          </Link>
        ))}
      </div>
    </Panel>
  )
}

function IntelligencePanel() {
  const { store, commit } = useAmbassadorStore()
  const lowReadiness = store.ambassadors.filter((a) => a.readiness < 75)
  const openCompliance = store.compliance.filter((item) => item.status !== "resolved")
  const territoryGaps = store.territories.filter((territory) => store.ambassadors.filter((a) => a.territoryId === territory.id && a.status === "active").length < Math.ceil(territory.capacity / 10))
  const submittedProofs = store.proofs.filter((proof) => proof.status === "submitted")
  const nextActions = [
    { label: "Activate onboarding ambassadors", count: lowReadiness.length, href: "/market-os/ambassadors/onboarding" },
    { label: "Validate submitted proof", count: submittedProofs.length, href: "/market-os/ambassadors/proofs" },
    { label: "Resolve open compliance", count: openCompliance.length, href: "/market-os/ambassadors/compliance" },
    { label: "Review territory gaps", count: territoryGaps.length, href: "/market-os/ambassadors/territories" },
  ]
  return (
    <DarkPanel className="p-5">
      <p className="text-xs font-black uppercase tracking-[0.24em] text-emerald-200">AI-style decision panel</p>
      <h2 className="mt-2 text-2xl font-black text-slate-950">Operator next moves</h2>
      <div className="mt-5 space-y-3">
        {nextActions.map((action) => (
          <Link key={action.label} href={action.href} className="flex items-center justify-between rounded-2xl bg-white/10 p-4 text-sm font-bold text-emerald-50/90 transition hover:bg-slate-100">
            <span>{action.label}</span>
            <span className="rounded-full bg-white px-3 py-1 text-xs font-black text-slate-950">{action.count}</span>
          </Link>
        ))}
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        <Button kind="primary" onClick={() => commit((draft) => {
          draft.missions.unshift({ id: uid("mis"), title: "Weekly ambassador quality check", ambassadorId: draft.ambassadors[0]?.id || "", programId: draft.programs[0]?.id || "", territoryId: draft.territories[0]?.id || "", channel: "WhatsApp", objective: "Confirm scripts, proof rules and active lead pipeline", rewardMAD: 0, dueDate: todayISO(2), status: "assigned", proofRequired: "Manager confirmation", instructions: "Run quick readiness and compliance check with assigned ambassador.", priority: "High" })
        }, "create control mission", "Created weekly ambassador quality check")}>Generate control mission</Button>
      </div>
    </DarkPanel>
  )
}

function AmbassadorCard({ a, onStatus }: { a: Ambassador; onStatus: (id: string, status: AmbassadorStatus) => void }) {
  const { store } = useAmbassadorStore()
  const health = Math.round((a.readiness + a.complianceScore + a.leadScore) / 3)
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <Link href={`/market-os/ambassadors/${a.id}`} className="text-lg font-black text-slate-950 hover:underline">{a.name}</Link>
          <p className="mt-1 text-sm font-bold text-slate-9500">{a.city} • {a.tier} • {a.manager}</p>
        </div>
        <Badge tone={statusTone(a.status) as "slate" | "emerald" | "amber" | "rose" | "blue"}>{a.status}</Badge>
      </div>
      <div className="mt-4 grid gap-3 md:grid-cols-4">
        <div><p className="text-xs font-black uppercase text-slate-500">Health</p><Meter value={health} /><p className="mt-1 text-xs font-black">{pct(health)}</p></div>
        <div><p className="text-xs font-black uppercase text-slate-500">Readiness</p><Meter value={a.readiness} /><p className="mt-1 text-xs font-black">{pct(a.readiness)}</p></div>
        <div><p className="text-xs font-black uppercase text-slate-500">Compliance</p><Meter value={a.complianceScore} /><p className="mt-1 text-xs font-black">{pct(a.complianceScore)}</p></div>
        <div><p className="text-xs font-black uppercase text-slate-500">Lead score</p><Meter value={a.leadScore} /><p className="mt-1 text-xs font-black">{pct(a.leadScore)}</p></div>
      </div>
      <div className="mt-4 grid gap-2 md:grid-cols-3">
        <p className="rounded-2xl bg-slate-50 p-3 text-sm font-bold text-slate-700">Revenue: <b className="text-slate-950">{mad(a.revenueMAD)}</b></p>
        <p className="rounded-2xl bg-slate-50 p-3 text-sm font-bold text-slate-700">Program: <b className="text-slate-950">{programName(store, a.programId)}</b></p>
        <p className="rounded-2xl bg-slate-50 p-3 text-sm font-bold text-slate-700">Territory: <b className="text-slate-950">{territoryName(store, a.territoryId)}</b></p>
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        <Button href={`/market-os/ambassadors/${a.id}`} kind="dark">Open 360</Button>
        <Button href={`/market-os/ambassadors/${a.id}/edit`}>Edit</Button>
        <Button href="/market-os/ambassadors/missions" kind="primary">Assign mission</Button>
        <Button href={`/market-os/ambassadors/${a.id}/delete`} kind="danger">Delete</Button>
        <select value={a.status} onChange={(event) => onStatus(a.id, event.target.value as AmbassadorStatus)} className="rounded-2xl border border-slate-200 px-3 py-2 text-sm font-black">
          <option value="applicant">applicant</option>
          <option value="onboarding">onboarding</option>
          <option value="active">active</option>
          <option value="paused">paused</option>
          <option value="watchlist">watchlist</option>
          <option value="offboarded">offboarded</option>
        </select>
      </div>
    </div>
  )
}

function CommandTables({ view }: { view: ViewMode }) {
  const { store, commit } = useAmbassadorStore()
  if (view === "recruitment") return <Panel className="p-5"><h2 className="text-2xl font-black">Recruitment pipeline</h2><div className="mt-5 grid gap-3">{store.applications.map((app) => <div key={app.id} className="rounded-2xl border p-4"><div className="flex justify-between"><div><p className="font-black">{app.name}</p><p className="text-sm font-bold text-slate-9500">{app.city} • {app.source}</p></div><Badge tone={riskTone(app.priority) as "slate" | "emerald" | "amber" | "rose" | "blue"}>{app.stage}</Badge></div><p className="mt-2 text-sm font-semibold text-slate-600">Next: {app.nextStep}</p><Button href="/market-os/ambassadors/recruitment" kind="primary">Open pipeline</Button></div>)}</div></Panel>
  if (view === "missions") return <Panel className="p-5"><h2 className="text-2xl font-black">Mission command</h2><div className="mt-5 grid gap-3">{store.missions.map((mission) => <div key={mission.id} className="rounded-2xl border p-4"><div className="flex justify-between"><div><p className="font-black">{mission.title}</p><p className="text-sm font-bold text-slate-9500">{ambassadorName(store, mission.ambassadorId)} • {mission.channel} • Due {mission.dueDate}</p></div><Badge tone={statusTone(mission.status) as "slate" | "emerald" | "amber" | "rose" | "blue"}>{mission.status}</Badge></div><p className="mt-2 text-sm font-semibold text-slate-600">{mission.instructions}</p><Button onClick={() => commit((draft) => { draft.missions = draft.missions.map((item) => item.id === mission.id ? { ...item, status: missionNext(item.status) } : item) }, "advance mission", `Moved ${mission.title}`)} kind="primary">Move mission forward</Button></div>)}</div></Panel>
  if (view === "proofs") return <Panel className="p-5"><h2 className="text-2xl font-black">Proof validation</h2><div className="mt-5 grid gap-3">{store.proofs.map((proof) => <div key={proof.id} className="rounded-2xl border p-4"><p className="font-black">{ambassadorName(store, proof.ambassadorId)} proof</p><p className="text-sm font-bold text-slate-9500">{proof.type} • {proof.link}</p><div className="mt-3 flex gap-2"><Button href="/market-os/ambassadors/proofs" kind="success">Open validation</Button></div></div>)}</div></Panel>
  return <Panel className="p-5"><h2 className="text-2xl font-black capitalize">{view} workspace</h2><p className="mt-2 text-sm font-semibold text-slate-600">Open the dedicated route for full form controls and detailed execution tools.</p><Button href={`/market-os/ambassadors/${view}`} kind="primary">Open {view}</Button></Panel>
}

export default function AmbassadorBackoffice() {
  const { store, commit, reset } = useAmbassadorStore()
  const [query, setQuery] = React.useState("")
  const [view, setView] = React.useState<ViewMode>("crm")
  const [focus, setFocus] = React.useState<FocusMode>("all")

  const filtered = store.ambassadors.filter((ambassador) => {
    const haystack = `${ambassador.name} ${ambassador.city} ${ambassador.status} ${ambassador.tier} ${ambassador.manager} ${ambassador.notes}`.toLowerCase()
    const queryMatch = query ? haystack.includes(query.toLowerCase()) : true
    const focusMatch = focus === "all" ? true : focus === "onboarding" ? ambassador.status === "onboarding" : focus === "compliance" ? ambassador.complianceScore < 85 : focus === "territory" ? true : focus === "payout" ? store.payouts.some((payout) => payout.ambassadorId === ambassador.id && payout.status === "pending") : focus === "urgent" ? ambassador.status === "watchlist" || ambassador.complianceScore < 80 : true
    return queryMatch && focusMatch
  })

  const pendingProofs = store.proofs.filter((proof) => proof.status === "submitted").length
  const pendingPayouts = store.payouts.filter((payout) => payout.status === "pending" || payout.status === "approved").length
  const revenue = store.ambassadors.reduce((sum, ambassador) => sum + ambassador.revenueMAD, 0)
  const avgReadiness = average(store.ambassadors.map((ambassador) => ambassador.readiness))
  const avgCompliance = average(store.ambassadors.map((ambassador) => ambassador.complianceScore))

  return (
    <Shell>
      <main data-market-os-root className="mx-auto max-w-[1900px] space-y-6 p-4 lg:p-8">
        <Hero total={store.ambassadors.length} active={store.ambassadors.filter((ambassador) => ambassador.status === "active").length} payouts={pendingPayouts} proofs={pendingProofs} reset={reset} />
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-6">
          <Metric label="Revenue impact" value={mad(revenue)} sub="Ambassador attributed" />
          <Metric label="Readiness" value={pct(avgReadiness)} sub="Network activation" />
          <Metric label="Compliance" value={pct(avgCompliance)} sub="Brand safety average" />
          <Metric label="Missions" value={String(store.missions.length)} sub="Execution units" />
          <Metric label="Territories" value={String(store.territories.length)} sub="Coverage areas" />
          <Metric label="Leads" value={String(store.leads.length)} sub="Generated contacts" />
        </section>
        <Panel className="p-5">
          <div className="grid gap-4 xl:grid-cols-[1.2fr_.6fr_.6fr_.6fr]">
            <Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search ambassador, city, tier, manager, note..." />
            <Select value={view} onChange={(event) => setView(event.target.value as ViewMode)}>
              <option value="crm">CRM command</option><option value="recruitment">Recruitment</option><option value="missions">Missions</option><option value="proofs">Proofs</option><option value="payouts">Payouts</option><option value="territories">Territories</option><option value="leads">Leads</option><option value="compliance">Compliance</option>
            </Select>
            <Select value={focus} onChange={(event) => setFocus(event.target.value as FocusMode)}>
              <option value="all">All focus</option><option value="urgent">Urgent</option><option value="onboarding">Onboarding</option><option value="payout">Payout</option><option value="compliance">Compliance</option><option value="territory">Territory</option>
            </Select>
            <Button href="/market-os/ambassadors/create" kind="primary">+ Create</Button>
          </div>
        </Panel>
        <Gateways />
        {view === "crm" ? (
          <div className="grid gap-5 xl:grid-cols-[1.1fr_.55fr]">
            <Panel className="p-5">
              <div className="flex items-center justify-between gap-3">
                <div><p className="text-xs font-black uppercase tracking-[0.24em] text-emerald-700">CRM cockpit</p><h2 className="mt-2 text-2xl font-black">Ambassador 360 control table</h2></div>
                <Button href="/market-os/ambassadors/create" kind="primary">New ambassador</Button>
              </div>
              <div className="mt-5 grid gap-4">{filtered.map((ambassador) => <AmbassadorCard key={ambassador.id} a={ambassador} onStatus={(id, status) => commit((draft) => { draft.ambassadors = draft.ambassadors.map((item) => item.id === id ? { ...item, status } : item) }, "status update", `Updated ambassador ${id} status`)} />)}</div>
            </Panel>
            <IntelligencePanel />
          </div>
        ) : <CommandTables view={view} />}
        <Panel className="p-5">
          <p className="text-xs font-black uppercase tracking-[0.24em] text-emerald-700">Activity log</p>
          <h2 className="mt-2 text-2xl font-black">Recent execution trail</h2>
          <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">{store.logs.slice(0, 8).map((log) => <div key={log.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4"><p className="text-xs font-black uppercase text-slate-500">{log.action}</p><p className="mt-2 text-sm font-black text-slate-950">{log.entity}</p><p className="mt-1 text-xs font-bold text-slate-9500">{log.detail}</p></div>)}</div>
        </Panel>
      </main>
    </Shell>
  )
}
