
"use client"

import Link from "next/link"
import { useMemo, useState } from "react"
import { ambassadorPrograms, ambassadorOperatingModes, formatMad, getAmbassadorDecision, getAmbassadorReadiness, type AmbassadorProgramRecord } from "@/lib/market-os/ambassador-program-execution-model"

type ViewMode = "command" | "pipeline" | "missions" | "territories" | "rewards" | "compliance" | "analytics"
type DensityMode = "executive" | "expanded" | "compact"

const workspaceLinks = [
  { label: "Create ambassador", href: "/market-os/ambassadors/create", description: "Recruit, classify, contract, and prepare a new ambassador." },
  { label: "Recruitment", href: "/market-os/ambassadors/recruitment", description: "Candidate pipeline, sources, interviews, qualification, conversion." },
  { label: "Onboarding", href: "/market-os/ambassadors/onboarding", description: "Training, certification, account activation, compliance readiness." },
  { label: "Mission control", href: "/market-os/ambassadors/missions", description: "Assign, monitor, validate, reject, and pay missions." },
  { label: "Program builder", href: "/market-os/ambassadors/programs", description: "Design affiliate, community, clinic, creator, campus programs." },
  { label: "Rewards", href: "/market-os/ambassadors/rewards", description: "Commission rules, bonus tiers, payout readiness, disputes." },
  { label: "Territories", href: "/market-os/ambassadors/territories", description: "City coverage, segments, saturation, gaps, territory owners." },
  { label: "Approvals", href: "/market-os/ambassadors/approvals", description: "Proof validation, brand safety, compliance review, payout approval." },
  { label: "Compliance", href: "/market-os/ambassadors/compliance", description: "Claims, scripts, data privacy, visuals, behavior controls." },
  { label: "Analytics", href: "/market-os/ambassadors/analytics", description: "Lead quality, conversion, revenue, retention, ambassador ROI." },
  { label: "Assets", href: "/market-os/ambassadors/assets", description: "Briefs, scripts, visuals, landing links, approved content packs." },
  { label: "Communications", href: "/market-os/ambassadors/communications", description: "Announcements, nudges, escalations, coaching, community updates." },
]

const missionTypes = [
  "Clinic referral activation", "Mother community workshop", "WhatsApp lead capture", "Academy trainee referral",
  "Testimonial proof capture", "Neighborhood awareness day", "Creator reels distribution", "Partner event follow-up",
]

const controlPanels = [
  { name: "Recruitment quality", metric: "68 candidates", signal: "13 ready for contract", action: "Review high-intent candidates" },
  { name: "Mission execution", metric: "142 live missions", signal: "31 proofs pending", action: "Open approvals desk" },
  { name: "Revenue influence", metric: "466K MAD", signal: "+18% vs last cycle", action: "Scale elite programs" },
  { name: "Payout trust", metric: "27K MAD pending", signal: "6 payouts blocked", action: "Resolve commission disputes" },
  { name: "Brand safety", metric: "91% compliant", signal: "2 high-risk creators", action: "Audit claims and content" },
]

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ")
}

function Progress({ value }: { value: number }) {
  return <div className="h-2 rounded-full bg-slate-200"><div className="h-2 rounded-full bg-white" style={{ width: `${Math.max(0, Math.min(100, value))}%` }} /></div>
}

function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <section className={cx("rounded-3xl border border-slate-200 bg-white/90 p-5 shadow-sm", className)}>{children}</section>
}

function Pill({ children, tone = "slate" }: { children: React.ReactNode; tone?: "slate" | "green" | "amber" | "red" | "blue" | "purple" }) {
  const tones = {
    slate: "border-slate-200 bg-slate-50 text-slate-700",
    green: "border-emerald-200 bg-emerald-50 text-emerald-700",
    amber: "border-amber-200 bg-amber-50 text-amber-700",
    red: "border-rose-200 bg-rose-50 text-rose-700",
    blue: "border-blue-200 bg-blue-50 text-blue-700",
    purple: "border-purple-200 bg-purple-50 text-purple-700",
  }
  return <span className={cx("inline-flex rounded-full border px-3 py-1 text-xs font-semibold", tones[tone])}>{children}</span>
}

export default function AmbassadorProgramExecutiveCommandCenter() {
  const [view, setView] = useState<ViewMode>("command")
  const [density, setDensity] = useState<DensityMode>("executive")
  const [query, setQuery] = useState("")
  const [selectedStatus, setSelectedStatus] = useState("all")
  const [selectedProgram, setSelectedProgram] = useState("all")
  const [selectedAmbassadors, setSelectedAmbassadors] = useState<string[]>([])
  const [showFocusPanel, setShowFocusPanel] = useState(true)
  const [showRiskPanel, setShowRiskPanel] = useState(true)
  const [showRevenuePanel, setShowRevenuePanel] = useState(true)
  const [showAIAssistant, setShowAIAssistant] = useState(true)
  const [operationLog, setOperationLog] = useState<string[]>([
    "Executive board opened ambassador operating center.",
    "Compliance gate loaded: claims, payout, proof and brand safety checks active.",
  ])

  const filtered = useMemo(() => ambassadorPrograms.filter((item) => {
    const matchesQuery = `${item.name} ${item.city} ${item.territory} ${item.owner}`.toLowerCase().includes(query.toLowerCase())
    const matchesStatus = selectedStatus === "all" || item.status === selectedStatus
    const matchesProgram = selectedProgram === "all" || item.program === selectedProgram
    return matchesQuery && matchesStatus && matchesProgram
  }), [query, selectedStatus, selectedProgram])

  const totals = useMemo(() => {
    const base = filtered.reduce<{
      leads: number
      qualified: number
      conversions: number
      revenue: number
      payouts: number
      compliance: number
    }>((acc, item) => {
      acc.leads += item.leads
      acc.qualified += item.qualifiedLeads
      acc.conversions += item.conversions
      acc.revenue += item.revenueMad
      acc.payouts += item.pendingPayoutMad
      acc.compliance += item.complianceScore
      return acc
    }, { leads: 0, qualified: 0, conversions: 0, revenue: 0, payouts: 0, compliance: 0 })
    return { ...base, avgCompliance: filtered.length ? Math.round(base.compliance / filtered.length) : 0 }
  }, [filtered])

  const pushLog = (message: string) => setOperationLog((logs) => [`${new Date().toLocaleTimeString()} · ${message}`, ...logs].slice(0, 8))
  const toggleSelected = (id: string) => setSelectedAmbassadors((items) => items.includes(id) ? items.filter((item) => item !== id) : [...items, id])
  const runBulkAction = (action: string) => pushLog(`${action} applied to ${selectedAmbassadors.length || filtered.length} ambassador records.`)

  return (
    <main data-market-os-root className="min-h-screen bg-slate-50 text-slate-950">
      <div className="mx-auto flex w-full max-w-[1800px] flex-col gap-6 px-5 py-6 lg:px-8">
        <section className="relative overflow-hidden rounded-[2rem] border border-slate-200 bg-white p-6 text-slate-950 shadow-xl">
          <div className="absolute inset-0 opacity-30" style={{ background: "radial-gradient(circle at 20% 20%, rgba(16,185,129,.45), transparent 32%), radial-gradient(circle at 80% 0%, rgba(59,130,246,.35), transparent 30%), radial-gradient(circle at 70% 90%, rgba(168,85,247,.28), transparent 35%)" }} />
          <div className="relative grid gap-6 xl:grid-cols-[1.4fr_.6fr]">
            <div>
              <div className="mb-4 flex flex-wrap items-center gap-2">
                <Pill tone="green">Affiliate Ambassador Program OS</Pill>
                <Pill tone="blue">Executive workspace</Pill>
                <Pill tone="purple">AngelCare growth network</Pill>
              </div>
              <h1 className="max-w-5xl text-4xl font-black tracking-tight md:text-6xl">Ambassador Program Executive Command Center</h1>
              <p className="mt-4 max-w-4xl text-lg text-slate-700">Recruit, activate, control, reward and protect a high-performance ambassador network across cities, clinics, communities, creators and academy referral channels.</p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Link href="/market-os/ambassadors/create" className="rounded-2xl bg-white px-5 py-3 text-sm font-black text-slate-950 shadow-lg">Create ambassador</Link>
                <Link href="/market-os/ambassadors/missions" className="rounded-2xl border border-white/30 px-5 py-3 text-sm font-black text-slate-950 hover:bg-slate-50">Open mission control</Link>
                <Link href="/market-os/ambassadors/approvals" className="rounded-2xl border border-white/30 px-5 py-3 text-sm font-black text-slate-950 hover:bg-slate-50">Review proofs</Link>
                <Link href="/market-os/ambassadors/rewards" className="rounded-2xl border border-white/30 px-5 py-3 text-sm font-black text-slate-950 hover:bg-slate-50">Manage payouts</Link>
              </div>
            </div>
            <div className="rounded-3xl border border-slate-200 bg-white/10 p-5 backdrop-blur">
              <h2 className="text-lg font-black">Today’s executive focus</h2>
              <div className="mt-4 space-y-3 text-sm text-slate-900">
                <p>1. Clear proof approvals before payout delay damages trust.</p>
                <p>2. Scale elite community programs only where compliance score stays above 90%.</p>
                <p>3. Move onboarding candidates into certified mission-ready status.</p>
                <p>4. Audit creator content language before releasing public packs.</p>
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          <Card><p className="text-xs font-bold uppercase text-slate-9500">Total leads</p><p className="mt-2 text-3xl font-black">{totals.leads}</p><p className="text-sm text-slate-9500">Ambassador-sourced demand</p></Card>
          <Card><p className="text-xs font-bold uppercase text-slate-9500">Qualified leads</p><p className="mt-2 text-3xl font-black">{totals.qualified}</p><p className="text-sm text-slate-9500">Validated by intake</p></Card>
          <Card><p className="text-xs font-bold uppercase text-slate-9500">Conversions</p><p className="mt-2 text-3xl font-black">{totals.conversions}</p><p className="text-sm text-slate-9500">Revenue-producing outcomes</p></Card>
          <Card><p className="text-xs font-bold uppercase text-slate-9500">Revenue</p><p className="mt-2 text-3xl font-black">{formatMad(totals.revenue)}</p><p className="text-sm text-slate-9500">Program influence</p></Card>
          <Card><p className="text-xs font-bold uppercase text-slate-9500">Compliance</p><p className="mt-2 text-3xl font-black">{totals.avgCompliance}%</p><p className="text-sm text-slate-9500">Brand safety average</p></Card>
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="grid gap-3 lg:grid-cols-[1fr_auto_auto_auto]">
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search ambassador, city, territory, owner..." className="rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-slate-950" />
            <select value={selectedStatus} onChange={(event) => setSelectedStatus(event.target.value)} className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-bold"><option value="all">All statuses</option><option value="candidate">Candidate</option><option value="onboarding">Onboarding</option><option value="active">Active</option><option value="watchlist">Watchlist</option><option value="paused">Paused</option></select>
            <select value={selectedProgram} onChange={(event) => setSelectedProgram(event.target.value)} className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-bold"><option value="all">All programs</option><option value="referral">Referral</option><option value="community">Community</option><option value="clinic">Clinic</option><option value="campus">Campus</option><option value="creator">Creator</option><option value="affiliate">Affiliate</option></select>
            <select value={density} onChange={(event) => setDensity(event.target.value as DensityMode)} className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-bold"><option value="executive">Executive density</option><option value="expanded">Expanded controls</option><option value="compact">Compact board</option></select>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            {(["command", "pipeline", "missions", "territories", "rewards", "compliance", "analytics"] as ViewMode[]).map((mode) => <button key={mode} onClick={() => setView(mode)} className={cx("rounded-2xl px-4 py-2 text-sm font-black capitalize", view === mode ? "bg-white text-slate-950" : "bg-slate-100 text-slate-700 hover:bg-slate-200")}>{mode}</button>)}
            <button onClick={() => setShowFocusPanel(!showFocusPanel)} className="rounded-2xl bg-emerald-50 px-4 py-2 text-sm font-black text-emerald-700">Focus panel</button>
            <button onClick={() => setShowRiskPanel(!showRiskPanel)} className="rounded-2xl bg-rose-50 px-4 py-2 text-sm font-black text-rose-700">Risk panel</button>
            <button onClick={() => setShowRevenuePanel(!showRevenuePanel)} className="rounded-2xl bg-blue-50 px-4 py-2 text-sm font-black text-blue-700">Revenue panel</button>
            <button onClick={() => setShowAIAssistant(!showAIAssistant)} className="rounded-2xl bg-purple-50 px-4 py-2 text-sm font-black text-purple-700">AI assistant</button>
          </div>
        </section>

        <section className="grid gap-5 xl:grid-cols-[1.2fr_.8fr]">
          <Card>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div><h2 className="text-2xl font-black">Ambassador operating board</h2><p className="text-sm text-slate-9500">Select records, open profiles, assign missions, resolve risks and control program movement.</p></div>
              <div className="flex flex-wrap gap-2">
                <button onClick={() => runBulkAction("Mission assignment")} className="rounded-xl bg-white px-4 py-2 text-sm font-black text-slate-950">Assign mission</button>
                <button onClick={() => runBulkAction("Compliance review")} className="rounded-xl bg-slate-100 px-4 py-2 text-sm font-black">Compliance review</button>
                <button onClick={() => runBulkAction("Payout approval")} className="rounded-xl bg-slate-100 px-4 py-2 text-sm font-black">Approve payout</button>
              </div>
            </div>
            <div className="mt-5 overflow-hidden rounded-2xl border border-slate-200">
              <div className="grid grid-cols-[40px_1.2fr_.7fr_.8fr_.6fr_.6fr_.6fr_.8fr] bg-slate-100 px-4 py-3 text-xs font-black uppercase text-slate-9500">
                <span></span><span>Ambassador</span><span>Program</span><span>Territory</span><span>Score</span><span>Leads</span><span>Payout</span><span>Actions</span>
              </div>
              {filtered.map((item) => <div key={item.id} className="grid grid-cols-[40px_1.2fr_.7fr_.8fr_.6fr_.6fr_.6fr_.8fr] items-center border-t border-slate-100 px-4 py-4 text-sm">
                <input type="checkbox" checked={selectedAmbassadors.includes(item.id)} onChange={() => toggleSelected(item.id)} />
                <div><p className="font-black">{item.name}</p><p className="text-xs text-slate-9500">{item.owner} · {item.city}</p></div>
                <div><Pill tone={item.program === "clinic" ? "blue" : item.program === "creator" ? "purple" : "green"}>{item.program}</Pill></div>
                <div className="font-semibold text-slate-700">{item.territory}</div>
                <div><p className="font-black">{item.score}%</p><Progress value={item.score} /></div>
                <div className="font-black">{item.leads}</div>
                <div className="font-black">{formatMad(item.pendingPayoutMad)}</div>
                <div className="flex flex-wrap gap-2"><Link className="rounded-lg bg-white px-3 py-2 text-xs font-black text-slate-950" href={`/market-os/ambassadors/${item.id}`}>Open</Link><Link className="rounded-lg bg-slate-100 px-3 py-2 text-xs font-black" href={`/market-os/ambassadors/${item.id}/edit`}>Edit</Link></div>
              </div>)}
            </div>
          </Card>

          <div className="grid gap-5">
            {showAIAssistant && <Card className="border-purple-200 bg-purple-50/50"><h2 className="text-2xl font-black">AI Ambassador Program Assistant</h2><p className="mt-2 text-sm text-slate-600">Recommends next moves using mission completion, lead quality, payout delay, territory saturation and compliance risk.</p><div className="mt-4 space-y-3">{filtered.slice(0, 4).map((item) => <div key={item.id} className="rounded-2xl bg-white p-4"><p className="font-black">{item.name}</p><p className="text-sm text-slate-600">{getAmbassadorDecision(item)}</p></div>)}</div></Card>}
            {showFocusPanel && <Card><h2 className="text-xl font-black">Executive focus panels</h2><div className="mt-4 grid gap-3">{controlPanels.map((panel) => <div key={panel.name} className="rounded-2xl border border-slate-100 p-4"><div className="flex justify-between gap-3"><p className="font-black">{panel.name}</p><p className="font-black">{panel.metric}</p></div><p className="text-sm text-slate-9500">{panel.signal}</p><button onClick={() => pushLog(panel.action)} className="mt-3 rounded-xl bg-white px-3 py-2 text-xs font-black text-slate-950">{panel.action}</button></div>)}</div></Card>}
          </div>
        </section>

        <section className="grid gap-5 xl:grid-cols-3">
          {showRiskPanel && <Card><h2 className="text-xl font-black">Risk & compliance command</h2><div className="mt-4 space-y-3">{filtered.map((item) => <div key={item.id} className="rounded-2xl border border-slate-100 p-4"><div className="flex justify-between"><p className="font-black">{item.name}</p><Pill tone={item.risk === "high" ? "red" : item.risk === "medium" ? "amber" : "green"}>{item.risk}</Pill></div><p className="mt-2 text-sm text-slate-9500">Compliance score {item.complianceScore}% · content score {item.contentScore}%</p><Progress value={item.complianceScore} /></div>)}</div></Card>}
          {showRevenuePanel && <Card><h2 className="text-xl font-black">Rewards and revenue integrity</h2><div className="mt-4 space-y-3">{filtered.map((item) => <div key={item.id} className="rounded-2xl bg-slate-50 p-4"><div className="flex justify-between"><p className="font-black">{item.name}</p><p className="font-black">{formatMad(item.revenueMad)}</p></div><p className="text-sm text-slate-9500">Pending payout {formatMad(item.pendingPayoutMad)} · conversions {item.conversions}</p></div>)}</div></Card>}
          <Card><h2 className="text-xl font-black">Live operation log</h2><div className="mt-4 space-y-2">{operationLog.map((log, index) => <p key={index} className="rounded-xl bg-slate-50 p-3 text-sm font-semibold text-slate-700">{log}</p>)}</div></Card>
        </section>

        <section className="grid gap-5 xl:grid-cols-4">
          {workspaceLinks.map((link) => <Link key={link.href} href={link.href} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-lg"><p className="text-lg font-black">{link.label}</p><p className="mt-2 text-sm text-slate-9500">{link.description}</p><span className="mt-4 inline-flex rounded-xl bg-white px-3 py-2 text-xs font-black text-slate-950">Open workspace</span></Link>)}
        </section>

        <section className="grid gap-5 lg:grid-cols-2 xl:grid-cols-4">
          {missionTypes.map((mission, index) => <Card key={mission}><div className="flex items-center justify-between"><p className="font-black">{mission}</p><Pill tone={index % 3 === 0 ? "green" : index % 3 === 1 ? "blue" : "amber"}>Ready</Pill></div><p className="mt-3 text-sm text-slate-9500">Mission template includes briefing, script, proof requirement, payout rule, territory fit and quality checklist.</p><button onClick={() => pushLog(`Mission template prepared: ${mission}`)} className="mt-4 rounded-xl bg-white px-4 py-2 text-sm font-black text-slate-950">Prepare mission</button></Card>)}
        </section>

        <Card>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-wide text-slate-9500">Operational control layer 001</p>
              <h3 className="mt-1 text-xl font-black">Ambassador execution checkpoint 001</h3>
              <p className="mt-2 text-sm text-slate-600">This checkpoint reinforces affiliate program production discipline: recruitment quality, mission clarity, proof validation, payout trust, territory focus and brand safety.</p>
            </div>
            <Pill tone="slate">Control 001</Pill>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase text-slate-9500">Decision input</p>
              <p className="mt-2 font-black">Segment, status, lead quality, risk and payout context.</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase text-slate-9500">Operator action</p>
              <p className="mt-2 font-black">Assign, approve, coach, pause, escalate or scale.</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase text-slate-9500">Expected output</p>
              <p className="mt-2 font-black">Better conversion, safer content and stronger ambassador trust.</p>
            </div>
          </div>
        </Card>


        <Card>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-wide text-slate-9500">Operational control layer 002</p>
              <h3 className="mt-1 text-xl font-black">Ambassador execution checkpoint 002</h3>
              <p className="mt-2 text-sm text-slate-600">This checkpoint reinforces affiliate program production discipline: recruitment quality, mission clarity, proof validation, payout trust, territory focus and brand safety.</p>
            </div>
            <Pill tone="slate">Control 002</Pill>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase text-slate-9500">Decision input</p>
              <p className="mt-2 font-black">Segment, status, lead quality, risk and payout context.</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase text-slate-9500">Operator action</p>
              <p className="mt-2 font-black">Assign, approve, coach, pause, escalate or scale.</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase text-slate-9500">Expected output</p>
              <p className="mt-2 font-black">Better conversion, safer content and stronger ambassador trust.</p>
            </div>
          </div>
        </Card>


        <Card>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-wide text-slate-9500">Operational control layer 003</p>
              <h3 className="mt-1 text-xl font-black">Ambassador execution checkpoint 003</h3>
              <p className="mt-2 text-sm text-slate-600">This checkpoint reinforces affiliate program production discipline: recruitment quality, mission clarity, proof validation, payout trust, territory focus and brand safety.</p>
            </div>
            <Pill tone="slate">Control 003</Pill>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase text-slate-9500">Decision input</p>
              <p className="mt-2 font-black">Segment, status, lead quality, risk and payout context.</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase text-slate-9500">Operator action</p>
              <p className="mt-2 font-black">Assign, approve, coach, pause, escalate or scale.</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase text-slate-9500">Expected output</p>
              <p className="mt-2 font-black">Better conversion, safer content and stronger ambassador trust.</p>
            </div>
          </div>
        </Card>


        <Card>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-wide text-slate-9500">Operational control layer 004</p>
              <h3 className="mt-1 text-xl font-black">Ambassador execution checkpoint 004</h3>
              <p className="mt-2 text-sm text-slate-600">This checkpoint reinforces affiliate program production discipline: recruitment quality, mission clarity, proof validation, payout trust, territory focus and brand safety.</p>
            </div>
            <Pill tone="slate">Control 004</Pill>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase text-slate-9500">Decision input</p>
              <p className="mt-2 font-black">Segment, status, lead quality, risk and payout context.</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase text-slate-9500">Operator action</p>
              <p className="mt-2 font-black">Assign, approve, coach, pause, escalate or scale.</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase text-slate-9500">Expected output</p>
              <p className="mt-2 font-black">Better conversion, safer content and stronger ambassador trust.</p>
            </div>
          </div>
        </Card>


        <Card>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-wide text-slate-9500">Operational control layer 005</p>
              <h3 className="mt-1 text-xl font-black">Ambassador execution checkpoint 005</h3>
              <p className="mt-2 text-sm text-slate-600">This checkpoint reinforces affiliate program production discipline: recruitment quality, mission clarity, proof validation, payout trust, territory focus and brand safety.</p>
            </div>
            <Pill tone="slate">Control 005</Pill>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase text-slate-9500">Decision input</p>
              <p className="mt-2 font-black">Segment, status, lead quality, risk and payout context.</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase text-slate-9500">Operator action</p>
              <p className="mt-2 font-black">Assign, approve, coach, pause, escalate or scale.</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase text-slate-9500">Expected output</p>
              <p className="mt-2 font-black">Better conversion, safer content and stronger ambassador trust.</p>
            </div>
          </div>
        </Card>


        <Card>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-wide text-slate-9500">Operational control layer 006</p>
              <h3 className="mt-1 text-xl font-black">Ambassador execution checkpoint 006</h3>
              <p className="mt-2 text-sm text-slate-600">This checkpoint reinforces affiliate program production discipline: recruitment quality, mission clarity, proof validation, payout trust, territory focus and brand safety.</p>
            </div>
            <Pill tone="slate">Control 006</Pill>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase text-slate-9500">Decision input</p>
              <p className="mt-2 font-black">Segment, status, lead quality, risk and payout context.</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase text-slate-9500">Operator action</p>
              <p className="mt-2 font-black">Assign, approve, coach, pause, escalate or scale.</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase text-slate-9500">Expected output</p>
              <p className="mt-2 font-black">Better conversion, safer content and stronger ambassador trust.</p>
            </div>
          </div>
        </Card>


        <Card>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-wide text-slate-9500">Operational control layer 007</p>
              <h3 className="mt-1 text-xl font-black">Ambassador execution checkpoint 007</h3>
              <p className="mt-2 text-sm text-slate-600">This checkpoint reinforces affiliate program production discipline: recruitment quality, mission clarity, proof validation, payout trust, territory focus and brand safety.</p>
            </div>
            <Pill tone="slate">Control 007</Pill>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase text-slate-9500">Decision input</p>
              <p className="mt-2 font-black">Segment, status, lead quality, risk and payout context.</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase text-slate-9500">Operator action</p>
              <p className="mt-2 font-black">Assign, approve, coach, pause, escalate or scale.</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase text-slate-9500">Expected output</p>
              <p className="mt-2 font-black">Better conversion, safer content and stronger ambassador trust.</p>
            </div>
          </div>
        </Card>


        <Card>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-wide text-slate-9500">Operational control layer 008</p>
              <h3 className="mt-1 text-xl font-black">Ambassador execution checkpoint 008</h3>
              <p className="mt-2 text-sm text-slate-600">This checkpoint reinforces affiliate program production discipline: recruitment quality, mission clarity, proof validation, payout trust, territory focus and brand safety.</p>
            </div>
            <Pill tone="slate">Control 008</Pill>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase text-slate-9500">Decision input</p>
              <p className="mt-2 font-black">Segment, status, lead quality, risk and payout context.</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase text-slate-9500">Operator action</p>
              <p className="mt-2 font-black">Assign, approve, coach, pause, escalate or scale.</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase text-slate-9500">Expected output</p>
              <p className="mt-2 font-black">Better conversion, safer content and stronger ambassador trust.</p>
            </div>
          </div>
        </Card>


        <Card>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-wide text-slate-9500">Operational control layer 009</p>
              <h3 className="mt-1 text-xl font-black">Ambassador execution checkpoint 009</h3>
              <p className="mt-2 text-sm text-slate-600">This checkpoint reinforces affiliate program production discipline: recruitment quality, mission clarity, proof validation, payout trust, territory focus and brand safety.</p>
            </div>
            <Pill tone="slate">Control 009</Pill>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase text-slate-9500">Decision input</p>
              <p className="mt-2 font-black">Segment, status, lead quality, risk and payout context.</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase text-slate-9500">Operator action</p>
              <p className="mt-2 font-black">Assign, approve, coach, pause, escalate or scale.</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase text-slate-9500">Expected output</p>
              <p className="mt-2 font-black">Better conversion, safer content and stronger ambassador trust.</p>
            </div>
          </div>
        </Card>


        <Card>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-wide text-slate-9500">Operational control layer 010</p>
              <h3 className="mt-1 text-xl font-black">Ambassador execution checkpoint 010</h3>
              <p className="mt-2 text-sm text-slate-600">This checkpoint reinforces affiliate program production discipline: recruitment quality, mission clarity, proof validation, payout trust, territory focus and brand safety.</p>
            </div>
            <Pill tone="slate">Control 010</Pill>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase text-slate-9500">Decision input</p>
              <p className="mt-2 font-black">Segment, status, lead quality, risk and payout context.</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase text-slate-9500">Operator action</p>
              <p className="mt-2 font-black">Assign, approve, coach, pause, escalate or scale.</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase text-slate-9500">Expected output</p>
              <p className="mt-2 font-black">Better conversion, safer content and stronger ambassador trust.</p>
            </div>
          </div>
        </Card>


        <Card>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-wide text-slate-9500">Operational control layer 011</p>
              <h3 className="mt-1 text-xl font-black">Ambassador execution checkpoint 011</h3>
              <p className="mt-2 text-sm text-slate-600">This checkpoint reinforces affiliate program production discipline: recruitment quality, mission clarity, proof validation, payout trust, territory focus and brand safety.</p>
            </div>
            <Pill tone="slate">Control 011</Pill>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase text-slate-9500">Decision input</p>
              <p className="mt-2 font-black">Segment, status, lead quality, risk and payout context.</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase text-slate-9500">Operator action</p>
              <p className="mt-2 font-black">Assign, approve, coach, pause, escalate or scale.</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase text-slate-9500">Expected output</p>
              <p className="mt-2 font-black">Better conversion, safer content and stronger ambassador trust.</p>
            </div>
          </div>
        </Card>


        <Card>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-wide text-slate-9500">Operational control layer 012</p>
              <h3 className="mt-1 text-xl font-black">Ambassador execution checkpoint 012</h3>
              <p className="mt-2 text-sm text-slate-600">This checkpoint reinforces affiliate program production discipline: recruitment quality, mission clarity, proof validation, payout trust, territory focus and brand safety.</p>
            </div>
            <Pill tone="slate">Control 012</Pill>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase text-slate-9500">Decision input</p>
              <p className="mt-2 font-black">Segment, status, lead quality, risk and payout context.</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase text-slate-9500">Operator action</p>
              <p className="mt-2 font-black">Assign, approve, coach, pause, escalate or scale.</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase text-slate-9500">Expected output</p>
              <p className="mt-2 font-black">Better conversion, safer content and stronger ambassador trust.</p>
            </div>
          </div>
        </Card>


        <Card>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-wide text-slate-9500">Operational control layer 013</p>
              <h3 className="mt-1 text-xl font-black">Ambassador execution checkpoint 013</h3>
              <p className="mt-2 text-sm text-slate-600">This checkpoint reinforces affiliate program production discipline: recruitment quality, mission clarity, proof validation, payout trust, territory focus and brand safety.</p>
            </div>
            <Pill tone="slate">Control 013</Pill>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase text-slate-9500">Decision input</p>
              <p className="mt-2 font-black">Segment, status, lead quality, risk and payout context.</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase text-slate-9500">Operator action</p>
              <p className="mt-2 font-black">Assign, approve, coach, pause, escalate or scale.</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase text-slate-9500">Expected output</p>
              <p className="mt-2 font-black">Better conversion, safer content and stronger ambassador trust.</p>
            </div>
          </div>
        </Card>


        <Card>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-wide text-slate-9500">Operational control layer 014</p>
              <h3 className="mt-1 text-xl font-black">Ambassador execution checkpoint 014</h3>
              <p className="mt-2 text-sm text-slate-600">This checkpoint reinforces affiliate program production discipline: recruitment quality, mission clarity, proof validation, payout trust, territory focus and brand safety.</p>
            </div>
            <Pill tone="slate">Control 014</Pill>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase text-slate-9500">Decision input</p>
              <p className="mt-2 font-black">Segment, status, lead quality, risk and payout context.</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase text-slate-9500">Operator action</p>
              <p className="mt-2 font-black">Assign, approve, coach, pause, escalate or scale.</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase text-slate-9500">Expected output</p>
              <p className="mt-2 font-black">Better conversion, safer content and stronger ambassador trust.</p>
            </div>
          </div>
        </Card>


        <Card>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-wide text-slate-9500">Operational control layer 015</p>
              <h3 className="mt-1 text-xl font-black">Ambassador execution checkpoint 015</h3>
              <p className="mt-2 text-sm text-slate-600">This checkpoint reinforces affiliate program production discipline: recruitment quality, mission clarity, proof validation, payout trust, territory focus and brand safety.</p>
            </div>
            <Pill tone="slate">Control 015</Pill>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase text-slate-9500">Decision input</p>
              <p className="mt-2 font-black">Segment, status, lead quality, risk and payout context.</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase text-slate-9500">Operator action</p>
              <p className="mt-2 font-black">Assign, approve, coach, pause, escalate or scale.</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase text-slate-9500">Expected output</p>
              <p className="mt-2 font-black">Better conversion, safer content and stronger ambassador trust.</p>
            </div>
          </div>
        </Card>


        <Card>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-wide text-slate-9500">Operational control layer 016</p>
              <h3 className="mt-1 text-xl font-black">Ambassador execution checkpoint 016</h3>
              <p className="mt-2 text-sm text-slate-600">This checkpoint reinforces affiliate program production discipline: recruitment quality, mission clarity, proof validation, payout trust, territory focus and brand safety.</p>
            </div>
            <Pill tone="slate">Control 016</Pill>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase text-slate-9500">Decision input</p>
              <p className="mt-2 font-black">Segment, status, lead quality, risk and payout context.</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase text-slate-9500">Operator action</p>
              <p className="mt-2 font-black">Assign, approve, coach, pause, escalate or scale.</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase text-slate-9500">Expected output</p>
              <p className="mt-2 font-black">Better conversion, safer content and stronger ambassador trust.</p>
            </div>
          </div>
        </Card>


        <Card>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-wide text-slate-9500">Operational control layer 017</p>
              <h3 className="mt-1 text-xl font-black">Ambassador execution checkpoint 017</h3>
              <p className="mt-2 text-sm text-slate-600">This checkpoint reinforces affiliate program production discipline: recruitment quality, mission clarity, proof validation, payout trust, territory focus and brand safety.</p>
            </div>
            <Pill tone="slate">Control 017</Pill>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase text-slate-9500">Decision input</p>
              <p className="mt-2 font-black">Segment, status, lead quality, risk and payout context.</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase text-slate-9500">Operator action</p>
              <p className="mt-2 font-black">Assign, approve, coach, pause, escalate or scale.</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase text-slate-9500">Expected output</p>
              <p className="mt-2 font-black">Better conversion, safer content and stronger ambassador trust.</p>
            </div>
          </div>
        </Card>


        <Card>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-wide text-slate-9500">Operational control layer 018</p>
              <h3 className="mt-1 text-xl font-black">Ambassador execution checkpoint 018</h3>
              <p className="mt-2 text-sm text-slate-600">This checkpoint reinforces affiliate program production discipline: recruitment quality, mission clarity, proof validation, payout trust, territory focus and brand safety.</p>
            </div>
            <Pill tone="slate">Control 018</Pill>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase text-slate-9500">Decision input</p>
              <p className="mt-2 font-black">Segment, status, lead quality, risk and payout context.</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase text-slate-9500">Operator action</p>
              <p className="mt-2 font-black">Assign, approve, coach, pause, escalate or scale.</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase text-slate-9500">Expected output</p>
              <p className="mt-2 font-black">Better conversion, safer content and stronger ambassador trust.</p>
            </div>
          </div>
        </Card>


        <Card>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-wide text-slate-9500">Operational control layer 019</p>
              <h3 className="mt-1 text-xl font-black">Ambassador execution checkpoint 019</h3>
              <p className="mt-2 text-sm text-slate-600">This checkpoint reinforces affiliate program production discipline: recruitment quality, mission clarity, proof validation, payout trust, territory focus and brand safety.</p>
            </div>
            <Pill tone="slate">Control 019</Pill>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase text-slate-9500">Decision input</p>
              <p className="mt-2 font-black">Segment, status, lead quality, risk and payout context.</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase text-slate-9500">Operator action</p>
              <p className="mt-2 font-black">Assign, approve, coach, pause, escalate or scale.</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase text-slate-9500">Expected output</p>
              <p className="mt-2 font-black">Better conversion, safer content and stronger ambassador trust.</p>
            </div>
          </div>
        </Card>


        <Card>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-wide text-slate-9500">Operational control layer 020</p>
              <h3 className="mt-1 text-xl font-black">Ambassador execution checkpoint 020</h3>
              <p className="mt-2 text-sm text-slate-600">This checkpoint reinforces affiliate program production discipline: recruitment quality, mission clarity, proof validation, payout trust, territory focus and brand safety.</p>
            </div>
            <Pill tone="slate">Control 020</Pill>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase text-slate-9500">Decision input</p>
              <p className="mt-2 font-black">Segment, status, lead quality, risk and payout context.</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase text-slate-9500">Operator action</p>
              <p className="mt-2 font-black">Assign, approve, coach, pause, escalate or scale.</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase text-slate-9500">Expected output</p>
              <p className="mt-2 font-black">Better conversion, safer content and stronger ambassador trust.</p>
            </div>
          </div>
        </Card>


        <Card>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-wide text-slate-9500">Operational control layer 021</p>
              <h3 className="mt-1 text-xl font-black">Ambassador execution checkpoint 021</h3>
              <p className="mt-2 text-sm text-slate-600">This checkpoint reinforces affiliate program production discipline: recruitment quality, mission clarity, proof validation, payout trust, territory focus and brand safety.</p>
            </div>
            <Pill tone="slate">Control 021</Pill>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase text-slate-9500">Decision input</p>
              <p className="mt-2 font-black">Segment, status, lead quality, risk and payout context.</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase text-slate-9500">Operator action</p>
              <p className="mt-2 font-black">Assign, approve, coach, pause, escalate or scale.</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase text-slate-9500">Expected output</p>
              <p className="mt-2 font-black">Better conversion, safer content and stronger ambassador trust.</p>
            </div>
          </div>
        </Card>


        <Card>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-wide text-slate-9500">Operational control layer 022</p>
              <h3 className="mt-1 text-xl font-black">Ambassador execution checkpoint 022</h3>
              <p className="mt-2 text-sm text-slate-600">This checkpoint reinforces affiliate program production discipline: recruitment quality, mission clarity, proof validation, payout trust, territory focus and brand safety.</p>
            </div>
            <Pill tone="slate">Control 022</Pill>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase text-slate-9500">Decision input</p>
              <p className="mt-2 font-black">Segment, status, lead quality, risk and payout context.</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase text-slate-9500">Operator action</p>
              <p className="mt-2 font-black">Assign, approve, coach, pause, escalate or scale.</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase text-slate-9500">Expected output</p>
              <p className="mt-2 font-black">Better conversion, safer content and stronger ambassador trust.</p>
            </div>
          </div>
        </Card>


        <Card>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-wide text-slate-9500">Operational control layer 023</p>
              <h3 className="mt-1 text-xl font-black">Ambassador execution checkpoint 023</h3>
              <p className="mt-2 text-sm text-slate-600">This checkpoint reinforces affiliate program production discipline: recruitment quality, mission clarity, proof validation, payout trust, territory focus and brand safety.</p>
            </div>
            <Pill tone="slate">Control 023</Pill>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase text-slate-9500">Decision input</p>
              <p className="mt-2 font-black">Segment, status, lead quality, risk and payout context.</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase text-slate-9500">Operator action</p>
              <p className="mt-2 font-black">Assign, approve, coach, pause, escalate or scale.</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase text-slate-9500">Expected output</p>
              <p className="mt-2 font-black">Better conversion, safer content and stronger ambassador trust.</p>
            </div>
          </div>
        </Card>


        <Card>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-wide text-slate-9500">Operational control layer 024</p>
              <h3 className="mt-1 text-xl font-black">Ambassador execution checkpoint 024</h3>
              <p className="mt-2 text-sm text-slate-600">This checkpoint reinforces affiliate program production discipline: recruitment quality, mission clarity, proof validation, payout trust, territory focus and brand safety.</p>
            </div>
            <Pill tone="slate">Control 024</Pill>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase text-slate-9500">Decision input</p>
              <p className="mt-2 font-black">Segment, status, lead quality, risk and payout context.</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase text-slate-9500">Operator action</p>
              <p className="mt-2 font-black">Assign, approve, coach, pause, escalate or scale.</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase text-slate-9500">Expected output</p>
              <p className="mt-2 font-black">Better conversion, safer content and stronger ambassador trust.</p>
            </div>
          </div>
        </Card>


        <Card>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-wide text-slate-9500">Operational control layer 025</p>
              <h3 className="mt-1 text-xl font-black">Ambassador execution checkpoint 025</h3>
              <p className="mt-2 text-sm text-slate-600">This checkpoint reinforces affiliate program production discipline: recruitment quality, mission clarity, proof validation, payout trust, territory focus and brand safety.</p>
            </div>
            <Pill tone="slate">Control 025</Pill>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase text-slate-9500">Decision input</p>
              <p className="mt-2 font-black">Segment, status, lead quality, risk and payout context.</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase text-slate-9500">Operator action</p>
              <p className="mt-2 font-black">Assign, approve, coach, pause, escalate or scale.</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase text-slate-9500">Expected output</p>
              <p className="mt-2 font-black">Better conversion, safer content and stronger ambassador trust.</p>
            </div>
          </div>
        </Card>


        <Card>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-wide text-slate-9500">Operational control layer 026</p>
              <h3 className="mt-1 text-xl font-black">Ambassador execution checkpoint 026</h3>
              <p className="mt-2 text-sm text-slate-600">This checkpoint reinforces affiliate program production discipline: recruitment quality, mission clarity, proof validation, payout trust, territory focus and brand safety.</p>
            </div>
            <Pill tone="slate">Control 026</Pill>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase text-slate-9500">Decision input</p>
              <p className="mt-2 font-black">Segment, status, lead quality, risk and payout context.</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase text-slate-9500">Operator action</p>
              <p className="mt-2 font-black">Assign, approve, coach, pause, escalate or scale.</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase text-slate-9500">Expected output</p>
              <p className="mt-2 font-black">Better conversion, safer content and stronger ambassador trust.</p>
            </div>
          </div>
        </Card>


        <Card>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-wide text-slate-9500">Operational control layer 027</p>
              <h3 className="mt-1 text-xl font-black">Ambassador execution checkpoint 027</h3>
              <p className="mt-2 text-sm text-slate-600">This checkpoint reinforces affiliate program production discipline: recruitment quality, mission clarity, proof validation, payout trust, territory focus and brand safety.</p>
            </div>
            <Pill tone="slate">Control 027</Pill>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase text-slate-9500">Decision input</p>
              <p className="mt-2 font-black">Segment, status, lead quality, risk and payout context.</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase text-slate-9500">Operator action</p>
              <p className="mt-2 font-black">Assign, approve, coach, pause, escalate or scale.</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase text-slate-9500">Expected output</p>
              <p className="mt-2 font-black">Better conversion, safer content and stronger ambassador trust.</p>
            </div>
          </div>
        </Card>


        <Card>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-wide text-slate-9500">Operational control layer 028</p>
              <h3 className="mt-1 text-xl font-black">Ambassador execution checkpoint 028</h3>
              <p className="mt-2 text-sm text-slate-600">This checkpoint reinforces affiliate program production discipline: recruitment quality, mission clarity, proof validation, payout trust, territory focus and brand safety.</p>
            </div>
            <Pill tone="slate">Control 028</Pill>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase text-slate-9500">Decision input</p>
              <p className="mt-2 font-black">Segment, status, lead quality, risk and payout context.</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase text-slate-9500">Operator action</p>
              <p className="mt-2 font-black">Assign, approve, coach, pause, escalate or scale.</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase text-slate-9500">Expected output</p>
              <p className="mt-2 font-black">Better conversion, safer content and stronger ambassador trust.</p>
            </div>
          </div>
        </Card>


        <Card>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-wide text-slate-9500">Operational control layer 029</p>
              <h3 className="mt-1 text-xl font-black">Ambassador execution checkpoint 029</h3>
              <p className="mt-2 text-sm text-slate-600">This checkpoint reinforces affiliate program production discipline: recruitment quality, mission clarity, proof validation, payout trust, territory focus and brand safety.</p>
            </div>
            <Pill tone="slate">Control 029</Pill>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase text-slate-9500">Decision input</p>
              <p className="mt-2 font-black">Segment, status, lead quality, risk and payout context.</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase text-slate-9500">Operator action</p>
              <p className="mt-2 font-black">Assign, approve, coach, pause, escalate or scale.</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase text-slate-9500">Expected output</p>
              <p className="mt-2 font-black">Better conversion, safer content and stronger ambassador trust.</p>
            </div>
          </div>
        </Card>


        <Card>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-wide text-slate-9500">Operational control layer 030</p>
              <h3 className="mt-1 text-xl font-black">Ambassador execution checkpoint 030</h3>
              <p className="mt-2 text-sm text-slate-600">This checkpoint reinforces affiliate program production discipline: recruitment quality, mission clarity, proof validation, payout trust, territory focus and brand safety.</p>
            </div>
            <Pill tone="slate">Control 030</Pill>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase text-slate-9500">Decision input</p>
              <p className="mt-2 font-black">Segment, status, lead quality, risk and payout context.</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase text-slate-9500">Operator action</p>
              <p className="mt-2 font-black">Assign, approve, coach, pause, escalate or scale.</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase text-slate-9500">Expected output</p>
              <p className="mt-2 font-black">Better conversion, safer content and stronger ambassador trust.</p>
            </div>
          </div>
        </Card>


        <Card>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-wide text-slate-9500">Operational control layer 031</p>
              <h3 className="mt-1 text-xl font-black">Ambassador execution checkpoint 031</h3>
              <p className="mt-2 text-sm text-slate-600">This checkpoint reinforces affiliate program production discipline: recruitment quality, mission clarity, proof validation, payout trust, territory focus and brand safety.</p>
            </div>
            <Pill tone="slate">Control 031</Pill>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase text-slate-9500">Decision input</p>
              <p className="mt-2 font-black">Segment, status, lead quality, risk and payout context.</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase text-slate-9500">Operator action</p>
              <p className="mt-2 font-black">Assign, approve, coach, pause, escalate or scale.</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase text-slate-9500">Expected output</p>
              <p className="mt-2 font-black">Better conversion, safer content and stronger ambassador trust.</p>
            </div>
          </div>
        </Card>


        <Card>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-wide text-slate-9500">Operational control layer 032</p>
              <h3 className="mt-1 text-xl font-black">Ambassador execution checkpoint 032</h3>
              <p className="mt-2 text-sm text-slate-600">This checkpoint reinforces affiliate program production discipline: recruitment quality, mission clarity, proof validation, payout trust, territory focus and brand safety.</p>
            </div>
            <Pill tone="slate">Control 032</Pill>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase text-slate-9500">Decision input</p>
              <p className="mt-2 font-black">Segment, status, lead quality, risk and payout context.</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase text-slate-9500">Operator action</p>
              <p className="mt-2 font-black">Assign, approve, coach, pause, escalate or scale.</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase text-slate-9500">Expected output</p>
              <p className="mt-2 font-black">Better conversion, safer content and stronger ambassador trust.</p>
            </div>
          </div>
        </Card>


        <Card>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-wide text-slate-9500">Operational control layer 033</p>
              <h3 className="mt-1 text-xl font-black">Ambassador execution checkpoint 033</h3>
              <p className="mt-2 text-sm text-slate-600">This checkpoint reinforces affiliate program production discipline: recruitment quality, mission clarity, proof validation, payout trust, territory focus and brand safety.</p>
            </div>
            <Pill tone="slate">Control 033</Pill>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase text-slate-9500">Decision input</p>
              <p className="mt-2 font-black">Segment, status, lead quality, risk and payout context.</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase text-slate-9500">Operator action</p>
              <p className="mt-2 font-black">Assign, approve, coach, pause, escalate or scale.</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase text-slate-9500">Expected output</p>
              <p className="mt-2 font-black">Better conversion, safer content and stronger ambassador trust.</p>
            </div>
          </div>
        </Card>


        <Card>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-wide text-slate-9500">Operational control layer 034</p>
              <h3 className="mt-1 text-xl font-black">Ambassador execution checkpoint 034</h3>
              <p className="mt-2 text-sm text-slate-600">This checkpoint reinforces affiliate program production discipline: recruitment quality, mission clarity, proof validation, payout trust, territory focus and brand safety.</p>
            </div>
            <Pill tone="slate">Control 034</Pill>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase text-slate-9500">Decision input</p>
              <p className="mt-2 font-black">Segment, status, lead quality, risk and payout context.</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase text-slate-9500">Operator action</p>
              <p className="mt-2 font-black">Assign, approve, coach, pause, escalate or scale.</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase text-slate-9500">Expected output</p>
              <p className="mt-2 font-black">Better conversion, safer content and stronger ambassador trust.</p>
            </div>
          </div>
        </Card>


        <Card>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-wide text-slate-9500">Operational control layer 035</p>
              <h3 className="mt-1 text-xl font-black">Ambassador execution checkpoint 035</h3>
              <p className="mt-2 text-sm text-slate-600">This checkpoint reinforces affiliate program production discipline: recruitment quality, mission clarity, proof validation, payout trust, territory focus and brand safety.</p>
            </div>
            <Pill tone="slate">Control 035</Pill>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase text-slate-9500">Decision input</p>
              <p className="mt-2 font-black">Segment, status, lead quality, risk and payout context.</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase text-slate-9500">Operator action</p>
              <p className="mt-2 font-black">Assign, approve, coach, pause, escalate or scale.</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase text-slate-9500">Expected output</p>
              <p className="mt-2 font-black">Better conversion, safer content and stronger ambassador trust.</p>
            </div>
          </div>
        </Card>


        <Card>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-wide text-slate-9500">Operational control layer 036</p>
              <h3 className="mt-1 text-xl font-black">Ambassador execution checkpoint 036</h3>
              <p className="mt-2 text-sm text-slate-600">This checkpoint reinforces affiliate program production discipline: recruitment quality, mission clarity, proof validation, payout trust, territory focus and brand safety.</p>
            </div>
            <Pill tone="slate">Control 036</Pill>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase text-slate-9500">Decision input</p>
              <p className="mt-2 font-black">Segment, status, lead quality, risk and payout context.</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase text-slate-9500">Operator action</p>
              <p className="mt-2 font-black">Assign, approve, coach, pause, escalate or scale.</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase text-slate-9500">Expected output</p>
              <p className="mt-2 font-black">Better conversion, safer content and stronger ambassador trust.</p>
            </div>
          </div>
        </Card>


        <Card>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-wide text-slate-9500">Operational control layer 037</p>
              <h3 className="mt-1 text-xl font-black">Ambassador execution checkpoint 037</h3>
              <p className="mt-2 text-sm text-slate-600">This checkpoint reinforces affiliate program production discipline: recruitment quality, mission clarity, proof validation, payout trust, territory focus and brand safety.</p>
            </div>
            <Pill tone="slate">Control 037</Pill>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase text-slate-9500">Decision input</p>
              <p className="mt-2 font-black">Segment, status, lead quality, risk and payout context.</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase text-slate-9500">Operator action</p>
              <p className="mt-2 font-black">Assign, approve, coach, pause, escalate or scale.</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase text-slate-9500">Expected output</p>
              <p className="mt-2 font-black">Better conversion, safer content and stronger ambassador trust.</p>
            </div>
          </div>
        </Card>


        <Card>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-wide text-slate-9500">Operational control layer 038</p>
              <h3 className="mt-1 text-xl font-black">Ambassador execution checkpoint 038</h3>
              <p className="mt-2 text-sm text-slate-600">This checkpoint reinforces affiliate program production discipline: recruitment quality, mission clarity, proof validation, payout trust, territory focus and brand safety.</p>
            </div>
            <Pill tone="slate">Control 038</Pill>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase text-slate-9500">Decision input</p>
              <p className="mt-2 font-black">Segment, status, lead quality, risk and payout context.</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase text-slate-9500">Operator action</p>
              <p className="mt-2 font-black">Assign, approve, coach, pause, escalate or scale.</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase text-slate-9500">Expected output</p>
              <p className="mt-2 font-black">Better conversion, safer content and stronger ambassador trust.</p>
            </div>
          </div>
        </Card>


        <Card>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-wide text-slate-9500">Operational control layer 039</p>
              <h3 className="mt-1 text-xl font-black">Ambassador execution checkpoint 039</h3>
              <p className="mt-2 text-sm text-slate-600">This checkpoint reinforces affiliate program production discipline: recruitment quality, mission clarity, proof validation, payout trust, territory focus and brand safety.</p>
            </div>
            <Pill tone="slate">Control 039</Pill>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase text-slate-9500">Decision input</p>
              <p className="mt-2 font-black">Segment, status, lead quality, risk and payout context.</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase text-slate-9500">Operator action</p>
              <p className="mt-2 font-black">Assign, approve, coach, pause, escalate or scale.</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase text-slate-9500">Expected output</p>
              <p className="mt-2 font-black">Better conversion, safer content and stronger ambassador trust.</p>
            </div>
          </div>
        </Card>


        <Card>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-wide text-slate-9500">Operational control layer 040</p>
              <h3 className="mt-1 text-xl font-black">Ambassador execution checkpoint 040</h3>
              <p className="mt-2 text-sm text-slate-600">This checkpoint reinforces affiliate program production discipline: recruitment quality, mission clarity, proof validation, payout trust, territory focus and brand safety.</p>
            </div>
            <Pill tone="slate">Control 040</Pill>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase text-slate-9500">Decision input</p>
              <p className="mt-2 font-black">Segment, status, lead quality, risk and payout context.</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase text-slate-9500">Operator action</p>
              <p className="mt-2 font-black">Assign, approve, coach, pause, escalate or scale.</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase text-slate-9500">Expected output</p>
              <p className="mt-2 font-black">Better conversion, safer content and stronger ambassador trust.</p>
            </div>
          </div>
        </Card>


        <Card>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-wide text-slate-9500">Operational control layer 041</p>
              <h3 className="mt-1 text-xl font-black">Ambassador execution checkpoint 041</h3>
              <p className="mt-2 text-sm text-slate-600">This checkpoint reinforces affiliate program production discipline: recruitment quality, mission clarity, proof validation, payout trust, territory focus and brand safety.</p>
            </div>
            <Pill tone="slate">Control 041</Pill>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase text-slate-9500">Decision input</p>
              <p className="mt-2 font-black">Segment, status, lead quality, risk and payout context.</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase text-slate-9500">Operator action</p>
              <p className="mt-2 font-black">Assign, approve, coach, pause, escalate or scale.</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase text-slate-9500">Expected output</p>
              <p className="mt-2 font-black">Better conversion, safer content and stronger ambassador trust.</p>
            </div>
          </div>
        </Card>


        <Card>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-wide text-slate-9500">Operational control layer 042</p>
              <h3 className="mt-1 text-xl font-black">Ambassador execution checkpoint 042</h3>
              <p className="mt-2 text-sm text-slate-600">This checkpoint reinforces affiliate program production discipline: recruitment quality, mission clarity, proof validation, payout trust, territory focus and brand safety.</p>
            </div>
            <Pill tone="slate">Control 042</Pill>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase text-slate-9500">Decision input</p>
              <p className="mt-2 font-black">Segment, status, lead quality, risk and payout context.</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase text-slate-9500">Operator action</p>
              <p className="mt-2 font-black">Assign, approve, coach, pause, escalate or scale.</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase text-slate-9500">Expected output</p>
              <p className="mt-2 font-black">Better conversion, safer content and stronger ambassador trust.</p>
            </div>
          </div>
        </Card>


        <Card>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-wide text-slate-9500">Operational control layer 043</p>
              <h3 className="mt-1 text-xl font-black">Ambassador execution checkpoint 043</h3>
              <p className="mt-2 text-sm text-slate-600">This checkpoint reinforces affiliate program production discipline: recruitment quality, mission clarity, proof validation, payout trust, territory focus and brand safety.</p>
            </div>
            <Pill tone="slate">Control 043</Pill>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase text-slate-9500">Decision input</p>
              <p className="mt-2 font-black">Segment, status, lead quality, risk and payout context.</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase text-slate-9500">Operator action</p>
              <p className="mt-2 font-black">Assign, approve, coach, pause, escalate or scale.</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase text-slate-9500">Expected output</p>
              <p className="mt-2 font-black">Better conversion, safer content and stronger ambassador trust.</p>
            </div>
          </div>
        </Card>


        <Card>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-wide text-slate-9500">Operational control layer 044</p>
              <h3 className="mt-1 text-xl font-black">Ambassador execution checkpoint 044</h3>
              <p className="mt-2 text-sm text-slate-600">This checkpoint reinforces affiliate program production discipline: recruitment quality, mission clarity, proof validation, payout trust, territory focus and brand safety.</p>
            </div>
            <Pill tone="slate">Control 044</Pill>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase text-slate-9500">Decision input</p>
              <p className="mt-2 font-black">Segment, status, lead quality, risk and payout context.</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase text-slate-9500">Operator action</p>
              <p className="mt-2 font-black">Assign, approve, coach, pause, escalate or scale.</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase text-slate-9500">Expected output</p>
              <p className="mt-2 font-black">Better conversion, safer content and stronger ambassador trust.</p>
            </div>
          </div>
        </Card>


        <Card>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-wide text-slate-9500">Operational control layer 045</p>
              <h3 className="mt-1 text-xl font-black">Ambassador execution checkpoint 045</h3>
              <p className="mt-2 text-sm text-slate-600">This checkpoint reinforces affiliate program production discipline: recruitment quality, mission clarity, proof validation, payout trust, territory focus and brand safety.</p>
            </div>
            <Pill tone="slate">Control 045</Pill>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase text-slate-9500">Decision input</p>
              <p className="mt-2 font-black">Segment, status, lead quality, risk and payout context.</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase text-slate-9500">Operator action</p>
              <p className="mt-2 font-black">Assign, approve, coach, pause, escalate or scale.</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase text-slate-9500">Expected output</p>
              <p className="mt-2 font-black">Better conversion, safer content and stronger ambassador trust.</p>
            </div>
          </div>
        </Card>


        <Card>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-wide text-slate-9500">Operational control layer 046</p>
              <h3 className="mt-1 text-xl font-black">Ambassador execution checkpoint 046</h3>
              <p className="mt-2 text-sm text-slate-600">This checkpoint reinforces affiliate program production discipline: recruitment quality, mission clarity, proof validation, payout trust, territory focus and brand safety.</p>
            </div>
            <Pill tone="slate">Control 046</Pill>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase text-slate-9500">Decision input</p>
              <p className="mt-2 font-black">Segment, status, lead quality, risk and payout context.</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase text-slate-9500">Operator action</p>
              <p className="mt-2 font-black">Assign, approve, coach, pause, escalate or scale.</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase text-slate-9500">Expected output</p>
              <p className="mt-2 font-black">Better conversion, safer content and stronger ambassador trust.</p>
            </div>
          </div>
        </Card>


        <Card>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-wide text-slate-9500">Operational control layer 047</p>
              <h3 className="mt-1 text-xl font-black">Ambassador execution checkpoint 047</h3>
              <p className="mt-2 text-sm text-slate-600">This checkpoint reinforces affiliate program production discipline: recruitment quality, mission clarity, proof validation, payout trust, territory focus and brand safety.</p>
            </div>
            <Pill tone="slate">Control 047</Pill>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase text-slate-9500">Decision input</p>
              <p className="mt-2 font-black">Segment, status, lead quality, risk and payout context.</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase text-slate-9500">Operator action</p>
              <p className="mt-2 font-black">Assign, approve, coach, pause, escalate or scale.</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase text-slate-9500">Expected output</p>
              <p className="mt-2 font-black">Better conversion, safer content and stronger ambassador trust.</p>
            </div>
          </div>
        </Card>


        <Card>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-wide text-slate-9500">Operational control layer 048</p>
              <h3 className="mt-1 text-xl font-black">Ambassador execution checkpoint 048</h3>
              <p className="mt-2 text-sm text-slate-600">This checkpoint reinforces affiliate program production discipline: recruitment quality, mission clarity, proof validation, payout trust, territory focus and brand safety.</p>
            </div>
            <Pill tone="slate">Control 048</Pill>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase text-slate-9500">Decision input</p>
              <p className="mt-2 font-black">Segment, status, lead quality, risk and payout context.</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase text-slate-9500">Operator action</p>
              <p className="mt-2 font-black">Assign, approve, coach, pause, escalate or scale.</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase text-slate-9500">Expected output</p>
              <p className="mt-2 font-black">Better conversion, safer content and stronger ambassador trust.</p>
            </div>
          </div>
        </Card>


        <Card>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-wide text-slate-9500">Operational control layer 049</p>
              <h3 className="mt-1 text-xl font-black">Ambassador execution checkpoint 049</h3>
              <p className="mt-2 text-sm text-slate-600">This checkpoint reinforces affiliate program production discipline: recruitment quality, mission clarity, proof validation, payout trust, territory focus and brand safety.</p>
            </div>
            <Pill tone="slate">Control 049</Pill>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase text-slate-9500">Decision input</p>
              <p className="mt-2 font-black">Segment, status, lead quality, risk and payout context.</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase text-slate-9500">Operator action</p>
              <p className="mt-2 font-black">Assign, approve, coach, pause, escalate or scale.</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase text-slate-9500">Expected output</p>
              <p className="mt-2 font-black">Better conversion, safer content and stronger ambassador trust.</p>
            </div>
          </div>
        </Card>


        <Card>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-wide text-slate-9500">Operational control layer 050</p>
              <h3 className="mt-1 text-xl font-black">Ambassador execution checkpoint 050</h3>
              <p className="mt-2 text-sm text-slate-600">This checkpoint reinforces affiliate program production discipline: recruitment quality, mission clarity, proof validation, payout trust, territory focus and brand safety.</p>
            </div>
            <Pill tone="slate">Control 050</Pill>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase text-slate-9500">Decision input</p>
              <p className="mt-2 font-black">Segment, status, lead quality, risk and payout context.</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase text-slate-9500">Operator action</p>
              <p className="mt-2 font-black">Assign, approve, coach, pause, escalate or scale.</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase text-slate-9500">Expected output</p>
              <p className="mt-2 font-black">Better conversion, safer content and stronger ambassador trust.</p>
            </div>
          </div>
        </Card>


        <Card>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-wide text-slate-9500">Operational control layer 051</p>
              <h3 className="mt-1 text-xl font-black">Ambassador execution checkpoint 051</h3>
              <p className="mt-2 text-sm text-slate-600">This checkpoint reinforces affiliate program production discipline: recruitment quality, mission clarity, proof validation, payout trust, territory focus and brand safety.</p>
            </div>
            <Pill tone="slate">Control 051</Pill>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase text-slate-9500">Decision input</p>
              <p className="mt-2 font-black">Segment, status, lead quality, risk and payout context.</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase text-slate-9500">Operator action</p>
              <p className="mt-2 font-black">Assign, approve, coach, pause, escalate or scale.</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase text-slate-9500">Expected output</p>
              <p className="mt-2 font-black">Better conversion, safer content and stronger ambassador trust.</p>
            </div>
          </div>
        </Card>


        <Card>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-wide text-slate-9500">Operational control layer 052</p>
              <h3 className="mt-1 text-xl font-black">Ambassador execution checkpoint 052</h3>
              <p className="mt-2 text-sm text-slate-600">This checkpoint reinforces affiliate program production discipline: recruitment quality, mission clarity, proof validation, payout trust, territory focus and brand safety.</p>
            </div>
            <Pill tone="slate">Control 052</Pill>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase text-slate-9500">Decision input</p>
              <p className="mt-2 font-black">Segment, status, lead quality, risk and payout context.</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase text-slate-9500">Operator action</p>
              <p className="mt-2 font-black">Assign, approve, coach, pause, escalate or scale.</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase text-slate-9500">Expected output</p>
              <p className="mt-2 font-black">Better conversion, safer content and stronger ambassador trust.</p>
            </div>
          </div>
        </Card>


        <Card>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-wide text-slate-9500">Operational control layer 053</p>
              <h3 className="mt-1 text-xl font-black">Ambassador execution checkpoint 053</h3>
              <p className="mt-2 text-sm text-slate-600">This checkpoint reinforces affiliate program production discipline: recruitment quality, mission clarity, proof validation, payout trust, territory focus and brand safety.</p>
            </div>
            <Pill tone="slate">Control 053</Pill>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase text-slate-9500">Decision input</p>
              <p className="mt-2 font-black">Segment, status, lead quality, risk and payout context.</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase text-slate-9500">Operator action</p>
              <p className="mt-2 font-black">Assign, approve, coach, pause, escalate or scale.</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase text-slate-9500">Expected output</p>
              <p className="mt-2 font-black">Better conversion, safer content and stronger ambassador trust.</p>
            </div>
          </div>
        </Card>


        <Card>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-wide text-slate-9500">Operational control layer 054</p>
              <h3 className="mt-1 text-xl font-black">Ambassador execution checkpoint 054</h3>
              <p className="mt-2 text-sm text-slate-600">This checkpoint reinforces affiliate program production discipline: recruitment quality, mission clarity, proof validation, payout trust, territory focus and brand safety.</p>
            </div>
            <Pill tone="slate">Control 054</Pill>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase text-slate-9500">Decision input</p>
              <p className="mt-2 font-black">Segment, status, lead quality, risk and payout context.</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase text-slate-9500">Operator action</p>
              <p className="mt-2 font-black">Assign, approve, coach, pause, escalate or scale.</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase text-slate-9500">Expected output</p>
              <p className="mt-2 font-black">Better conversion, safer content and stronger ambassador trust.</p>
            </div>
          </div>
        </Card>


        <Card>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-wide text-slate-9500">Operational control layer 055</p>
              <h3 className="mt-1 text-xl font-black">Ambassador execution checkpoint 055</h3>
              <p className="mt-2 text-sm text-slate-600">This checkpoint reinforces affiliate program production discipline: recruitment quality, mission clarity, proof validation, payout trust, territory focus and brand safety.</p>
            </div>
            <Pill tone="slate">Control 055</Pill>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase text-slate-9500">Decision input</p>
              <p className="mt-2 font-black">Segment, status, lead quality, risk and payout context.</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase text-slate-9500">Operator action</p>
              <p className="mt-2 font-black">Assign, approve, coach, pause, escalate or scale.</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase text-slate-9500">Expected output</p>
              <p className="mt-2 font-black">Better conversion, safer content and stronger ambassador trust.</p>
            </div>
          </div>
        </Card>


        <Card>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-wide text-slate-9500">Operational control layer 056</p>
              <h3 className="mt-1 text-xl font-black">Ambassador execution checkpoint 056</h3>
              <p className="mt-2 text-sm text-slate-600">This checkpoint reinforces affiliate program production discipline: recruitment quality, mission clarity, proof validation, payout trust, territory focus and brand safety.</p>
            </div>
            <Pill tone="slate">Control 056</Pill>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase text-slate-9500">Decision input</p>
              <p className="mt-2 font-black">Segment, status, lead quality, risk and payout context.</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase text-slate-9500">Operator action</p>
              <p className="mt-2 font-black">Assign, approve, coach, pause, escalate or scale.</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase text-slate-9500">Expected output</p>
              <p className="mt-2 font-black">Better conversion, safer content and stronger ambassador trust.</p>
            </div>
          </div>
        </Card>


        <Card>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-wide text-slate-9500">Operational control layer 057</p>
              <h3 className="mt-1 text-xl font-black">Ambassador execution checkpoint 057</h3>
              <p className="mt-2 text-sm text-slate-600">This checkpoint reinforces affiliate program production discipline: recruitment quality, mission clarity, proof validation, payout trust, territory focus and brand safety.</p>
            </div>
            <Pill tone="slate">Control 057</Pill>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase text-slate-9500">Decision input</p>
              <p className="mt-2 font-black">Segment, status, lead quality, risk and payout context.</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase text-slate-9500">Operator action</p>
              <p className="mt-2 font-black">Assign, approve, coach, pause, escalate or scale.</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase text-slate-9500">Expected output</p>
              <p className="mt-2 font-black">Better conversion, safer content and stronger ambassador trust.</p>
            </div>
          </div>
        </Card>


        <Card>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-wide text-slate-9500">Operational control layer 058</p>
              <h3 className="mt-1 text-xl font-black">Ambassador execution checkpoint 058</h3>
              <p className="mt-2 text-sm text-slate-600">This checkpoint reinforces affiliate program production discipline: recruitment quality, mission clarity, proof validation, payout trust, territory focus and brand safety.</p>
            </div>
            <Pill tone="slate">Control 058</Pill>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase text-slate-9500">Decision input</p>
              <p className="mt-2 font-black">Segment, status, lead quality, risk and payout context.</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase text-slate-9500">Operator action</p>
              <p className="mt-2 font-black">Assign, approve, coach, pause, escalate or scale.</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase text-slate-9500">Expected output</p>
              <p className="mt-2 font-black">Better conversion, safer content and stronger ambassador trust.</p>
            </div>
          </div>
        </Card>


        <Card>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-wide text-slate-9500">Operational control layer 059</p>
              <h3 className="mt-1 text-xl font-black">Ambassador execution checkpoint 059</h3>
              <p className="mt-2 text-sm text-slate-600">This checkpoint reinforces affiliate program production discipline: recruitment quality, mission clarity, proof validation, payout trust, territory focus and brand safety.</p>
            </div>
            <Pill tone="slate">Control 059</Pill>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase text-slate-9500">Decision input</p>
              <p className="mt-2 font-black">Segment, status, lead quality, risk and payout context.</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase text-slate-9500">Operator action</p>
              <p className="mt-2 font-black">Assign, approve, coach, pause, escalate or scale.</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase text-slate-9500">Expected output</p>
              <p className="mt-2 font-black">Better conversion, safer content and stronger ambassador trust.</p>
            </div>
          </div>
        </Card>


        <Card>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-wide text-slate-9500">Operational control layer 060</p>
              <h3 className="mt-1 text-xl font-black">Ambassador execution checkpoint 060</h3>
              <p className="mt-2 text-sm text-slate-600">This checkpoint reinforces affiliate program production discipline: recruitment quality, mission clarity, proof validation, payout trust, territory focus and brand safety.</p>
            </div>
            <Pill tone="slate">Control 060</Pill>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase text-slate-9500">Decision input</p>
              <p className="mt-2 font-black">Segment, status, lead quality, risk and payout context.</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase text-slate-9500">Operator action</p>
              <p className="mt-2 font-black">Assign, approve, coach, pause, escalate or scale.</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase text-slate-9500">Expected output</p>
              <p className="mt-2 font-black">Better conversion, safer content and stronger ambassador trust.</p>
            </div>
          </div>
        </Card>


        <Card>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-wide text-slate-9500">Operational control layer 061</p>
              <h3 className="mt-1 text-xl font-black">Ambassador execution checkpoint 061</h3>
              <p className="mt-2 text-sm text-slate-600">This checkpoint reinforces affiliate program production discipline: recruitment quality, mission clarity, proof validation, payout trust, territory focus and brand safety.</p>
            </div>
            <Pill tone="slate">Control 061</Pill>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase text-slate-9500">Decision input</p>
              <p className="mt-2 font-black">Segment, status, lead quality, risk and payout context.</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase text-slate-9500">Operator action</p>
              <p className="mt-2 font-black">Assign, approve, coach, pause, escalate or scale.</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase text-slate-9500">Expected output</p>
              <p className="mt-2 font-black">Better conversion, safer content and stronger ambassador trust.</p>
            </div>
          </div>
        </Card>


        <Card>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-wide text-slate-9500">Operational control layer 062</p>
              <h3 className="mt-1 text-xl font-black">Ambassador execution checkpoint 062</h3>
              <p className="mt-2 text-sm text-slate-600">This checkpoint reinforces affiliate program production discipline: recruitment quality, mission clarity, proof validation, payout trust, territory focus and brand safety.</p>
            </div>
            <Pill tone="slate">Control 062</Pill>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase text-slate-9500">Decision input</p>
              <p className="mt-2 font-black">Segment, status, lead quality, risk and payout context.</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase text-slate-9500">Operator action</p>
              <p className="mt-2 font-black">Assign, approve, coach, pause, escalate or scale.</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase text-slate-9500">Expected output</p>
              <p className="mt-2 font-black">Better conversion, safer content and stronger ambassador trust.</p>
            </div>
          </div>
        </Card>


        <Card>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-wide text-slate-9500">Operational control layer 063</p>
              <h3 className="mt-1 text-xl font-black">Ambassador execution checkpoint 063</h3>
              <p className="mt-2 text-sm text-slate-600">This checkpoint reinforces affiliate program production discipline: recruitment quality, mission clarity, proof validation, payout trust, territory focus and brand safety.</p>
            </div>
            <Pill tone="slate">Control 063</Pill>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase text-slate-9500">Decision input</p>
              <p className="mt-2 font-black">Segment, status, lead quality, risk and payout context.</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase text-slate-9500">Operator action</p>
              <p className="mt-2 font-black">Assign, approve, coach, pause, escalate or scale.</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase text-slate-9500">Expected output</p>
              <p className="mt-2 font-black">Better conversion, safer content and stronger ambassador trust.</p>
            </div>
          </div>
        </Card>


        <Card>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-wide text-slate-9500">Operational control layer 064</p>
              <h3 className="mt-1 text-xl font-black">Ambassador execution checkpoint 064</h3>
              <p className="mt-2 text-sm text-slate-600">This checkpoint reinforces affiliate program production discipline: recruitment quality, mission clarity, proof validation, payout trust, territory focus and brand safety.</p>
            </div>
            <Pill tone="slate">Control 064</Pill>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase text-slate-9500">Decision input</p>
              <p className="mt-2 font-black">Segment, status, lead quality, risk and payout context.</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase text-slate-9500">Operator action</p>
              <p className="mt-2 font-black">Assign, approve, coach, pause, escalate or scale.</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase text-slate-9500">Expected output</p>
              <p className="mt-2 font-black">Better conversion, safer content and stronger ambassador trust.</p>
            </div>
          </div>
        </Card>


        <Card>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-wide text-slate-9500">Operational control layer 065</p>
              <h3 className="mt-1 text-xl font-black">Ambassador execution checkpoint 065</h3>
              <p className="mt-2 text-sm text-slate-600">This checkpoint reinforces affiliate program production discipline: recruitment quality, mission clarity, proof validation, payout trust, territory focus and brand safety.</p>
            </div>
            <Pill tone="slate">Control 065</Pill>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase text-slate-9500">Decision input</p>
              <p className="mt-2 font-black">Segment, status, lead quality, risk and payout context.</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase text-slate-9500">Operator action</p>
              <p className="mt-2 font-black">Assign, approve, coach, pause, escalate or scale.</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase text-slate-9500">Expected output</p>
              <p className="mt-2 font-black">Better conversion, safer content and stronger ambassador trust.</p>
            </div>
          </div>
        </Card>


        <Card>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-wide text-slate-9500">Operational control layer 066</p>
              <h3 className="mt-1 text-xl font-black">Ambassador execution checkpoint 066</h3>
              <p className="mt-2 text-sm text-slate-600">This checkpoint reinforces affiliate program production discipline: recruitment quality, mission clarity, proof validation, payout trust, territory focus and brand safety.</p>
            </div>
            <Pill tone="slate">Control 066</Pill>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase text-slate-9500">Decision input</p>
              <p className="mt-2 font-black">Segment, status, lead quality, risk and payout context.</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase text-slate-9500">Operator action</p>
              <p className="mt-2 font-black">Assign, approve, coach, pause, escalate or scale.</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase text-slate-9500">Expected output</p>
              <p className="mt-2 font-black">Better conversion, safer content and stronger ambassador trust.</p>
            </div>
          </div>
        </Card>


        <Card>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-wide text-slate-9500">Operational control layer 067</p>
              <h3 className="mt-1 text-xl font-black">Ambassador execution checkpoint 067</h3>
              <p className="mt-2 text-sm text-slate-600">This checkpoint reinforces affiliate program production discipline: recruitment quality, mission clarity, proof validation, payout trust, territory focus and brand safety.</p>
            </div>
            <Pill tone="slate">Control 067</Pill>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase text-slate-9500">Decision input</p>
              <p className="mt-2 font-black">Segment, status, lead quality, risk and payout context.</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase text-slate-9500">Operator action</p>
              <p className="mt-2 font-black">Assign, approve, coach, pause, escalate or scale.</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase text-slate-9500">Expected output</p>
              <p className="mt-2 font-black">Better conversion, safer content and stronger ambassador trust.</p>
            </div>
          </div>
        </Card>


        <Card>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-wide text-slate-9500">Operational control layer 068</p>
              <h3 className="mt-1 text-xl font-black">Ambassador execution checkpoint 068</h3>
              <p className="mt-2 text-sm text-slate-600">This checkpoint reinforces affiliate program production discipline: recruitment quality, mission clarity, proof validation, payout trust, territory focus and brand safety.</p>
            </div>
            <Pill tone="slate">Control 068</Pill>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase text-slate-9500">Decision input</p>
              <p className="mt-2 font-black">Segment, status, lead quality, risk and payout context.</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase text-slate-9500">Operator action</p>
              <p className="mt-2 font-black">Assign, approve, coach, pause, escalate or scale.</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase text-slate-9500">Expected output</p>
              <p className="mt-2 font-black">Better conversion, safer content and stronger ambassador trust.</p>
            </div>
          </div>
        </Card>


        <Card>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-wide text-slate-9500">Operational control layer 069</p>
              <h3 className="mt-1 text-xl font-black">Ambassador execution checkpoint 069</h3>
              <p className="mt-2 text-sm text-slate-600">This checkpoint reinforces affiliate program production discipline: recruitment quality, mission clarity, proof validation, payout trust, territory focus and brand safety.</p>
            </div>
            <Pill tone="slate">Control 069</Pill>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase text-slate-9500">Decision input</p>
              <p className="mt-2 font-black">Segment, status, lead quality, risk and payout context.</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase text-slate-9500">Operator action</p>
              <p className="mt-2 font-black">Assign, approve, coach, pause, escalate or scale.</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase text-slate-9500">Expected output</p>
              <p className="mt-2 font-black">Better conversion, safer content and stronger ambassador trust.</p>
            </div>
          </div>
        </Card>


        <Card>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-wide text-slate-9500">Operational control layer 070</p>
              <h3 className="mt-1 text-xl font-black">Ambassador execution checkpoint 070</h3>
              <p className="mt-2 text-sm text-slate-600">This checkpoint reinforces affiliate program production discipline: recruitment quality, mission clarity, proof validation, payout trust, territory focus and brand safety.</p>
            </div>
            <Pill tone="slate">Control 070</Pill>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase text-slate-9500">Decision input</p>
              <p className="mt-2 font-black">Segment, status, lead quality, risk and payout context.</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase text-slate-9500">Operator action</p>
              <p className="mt-2 font-black">Assign, approve, coach, pause, escalate or scale.</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase text-slate-9500">Expected output</p>
              <p className="mt-2 font-black">Better conversion, safer content and stronger ambassador trust.</p>
            </div>
          </div>
        </Card>


        <Card>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-wide text-slate-9500">Operational control layer 071</p>
              <h3 className="mt-1 text-xl font-black">Ambassador execution checkpoint 071</h3>
              <p className="mt-2 text-sm text-slate-600">This checkpoint reinforces affiliate program production discipline: recruitment quality, mission clarity, proof validation, payout trust, territory focus and brand safety.</p>
            </div>
            <Pill tone="slate">Control 071</Pill>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase text-slate-9500">Decision input</p>
              <p className="mt-2 font-black">Segment, status, lead quality, risk and payout context.</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase text-slate-9500">Operator action</p>
              <p className="mt-2 font-black">Assign, approve, coach, pause, escalate or scale.</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase text-slate-9500">Expected output</p>
              <p className="mt-2 font-black">Better conversion, safer content and stronger ambassador trust.</p>
            </div>
          </div>
        </Card>


        <Card>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-wide text-slate-9500">Operational control layer 072</p>
              <h3 className="mt-1 text-xl font-black">Ambassador execution checkpoint 072</h3>
              <p className="mt-2 text-sm text-slate-600">This checkpoint reinforces affiliate program production discipline: recruitment quality, mission clarity, proof validation, payout trust, territory focus and brand safety.</p>
            </div>
            <Pill tone="slate">Control 072</Pill>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase text-slate-9500">Decision input</p>
              <p className="mt-2 font-black">Segment, status, lead quality, risk and payout context.</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase text-slate-9500">Operator action</p>
              <p className="mt-2 font-black">Assign, approve, coach, pause, escalate or scale.</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase text-slate-9500">Expected output</p>
              <p className="mt-2 font-black">Better conversion, safer content and stronger ambassador trust.</p>
            </div>
          </div>
        </Card>


        <Card>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-wide text-slate-9500">Operational control layer 073</p>
              <h3 className="mt-1 text-xl font-black">Ambassador execution checkpoint 073</h3>
              <p className="mt-2 text-sm text-slate-600">This checkpoint reinforces affiliate program production discipline: recruitment quality, mission clarity, proof validation, payout trust, territory focus and brand safety.</p>
            </div>
            <Pill tone="slate">Control 073</Pill>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase text-slate-9500">Decision input</p>
              <p className="mt-2 font-black">Segment, status, lead quality, risk and payout context.</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase text-slate-9500">Operator action</p>
              <p className="mt-2 font-black">Assign, approve, coach, pause, escalate or scale.</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase text-slate-9500">Expected output</p>
              <p className="mt-2 font-black">Better conversion, safer content and stronger ambassador trust.</p>
            </div>
          </div>
        </Card>


        <Card>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-wide text-slate-9500">Operational control layer 074</p>
              <h3 className="mt-1 text-xl font-black">Ambassador execution checkpoint 074</h3>
              <p className="mt-2 text-sm text-slate-600">This checkpoint reinforces affiliate program production discipline: recruitment quality, mission clarity, proof validation, payout trust, territory focus and brand safety.</p>
            </div>
            <Pill tone="slate">Control 074</Pill>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase text-slate-9500">Decision input</p>
              <p className="mt-2 font-black">Segment, status, lead quality, risk and payout context.</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase text-slate-9500">Operator action</p>
              <p className="mt-2 font-black">Assign, approve, coach, pause, escalate or scale.</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase text-slate-9500">Expected output</p>
              <p className="mt-2 font-black">Better conversion, safer content and stronger ambassador trust.</p>
            </div>
          </div>
        </Card>


        <Card>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-wide text-slate-9500">Operational control layer 075</p>
              <h3 className="mt-1 text-xl font-black">Ambassador execution checkpoint 075</h3>
              <p className="mt-2 text-sm text-slate-600">This checkpoint reinforces affiliate program production discipline: recruitment quality, mission clarity, proof validation, payout trust, territory focus and brand safety.</p>
            </div>
            <Pill tone="slate">Control 075</Pill>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase text-slate-9500">Decision input</p>
              <p className="mt-2 font-black">Segment, status, lead quality, risk and payout context.</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase text-slate-9500">Operator action</p>
              <p className="mt-2 font-black">Assign, approve, coach, pause, escalate or scale.</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase text-slate-9500">Expected output</p>
              <p className="mt-2 font-black">Better conversion, safer content and stronger ambassador trust.</p>
            </div>
          </div>
        </Card>


        <Card>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-wide text-slate-9500">Operational control layer 076</p>
              <h3 className="mt-1 text-xl font-black">Ambassador execution checkpoint 076</h3>
              <p className="mt-2 text-sm text-slate-600">This checkpoint reinforces affiliate program production discipline: recruitment quality, mission clarity, proof validation, payout trust, territory focus and brand safety.</p>
            </div>
            <Pill tone="slate">Control 076</Pill>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase text-slate-9500">Decision input</p>
              <p className="mt-2 font-black">Segment, status, lead quality, risk and payout context.</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase text-slate-9500">Operator action</p>
              <p className="mt-2 font-black">Assign, approve, coach, pause, escalate or scale.</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase text-slate-9500">Expected output</p>
              <p className="mt-2 font-black">Better conversion, safer content and stronger ambassador trust.</p>
            </div>
          </div>
        </Card>


        <Card>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-wide text-slate-9500">Operational control layer 077</p>
              <h3 className="mt-1 text-xl font-black">Ambassador execution checkpoint 077</h3>
              <p className="mt-2 text-sm text-slate-600">This checkpoint reinforces affiliate program production discipline: recruitment quality, mission clarity, proof validation, payout trust, territory focus and brand safety.</p>
            </div>
            <Pill tone="slate">Control 077</Pill>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase text-slate-9500">Decision input</p>
              <p className="mt-2 font-black">Segment, status, lead quality, risk and payout context.</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase text-slate-9500">Operator action</p>
              <p className="mt-2 font-black">Assign, approve, coach, pause, escalate or scale.</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase text-slate-9500">Expected output</p>
              <p className="mt-2 font-black">Better conversion, safer content and stronger ambassador trust.</p>
            </div>
          </div>
        </Card>


        <Card>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-wide text-slate-9500">Operational control layer 078</p>
              <h3 className="mt-1 text-xl font-black">Ambassador execution checkpoint 078</h3>
              <p className="mt-2 text-sm text-slate-600">This checkpoint reinforces affiliate program production discipline: recruitment quality, mission clarity, proof validation, payout trust, territory focus and brand safety.</p>
            </div>
            <Pill tone="slate">Control 078</Pill>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase text-slate-9500">Decision input</p>
              <p className="mt-2 font-black">Segment, status, lead quality, risk and payout context.</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase text-slate-9500">Operator action</p>
              <p className="mt-2 font-black">Assign, approve, coach, pause, escalate or scale.</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase text-slate-9500">Expected output</p>
              <p className="mt-2 font-black">Better conversion, safer content and stronger ambassador trust.</p>
            </div>
          </div>
        </Card>


        <Card>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-wide text-slate-9500">Operational control layer 079</p>
              <h3 className="mt-1 text-xl font-black">Ambassador execution checkpoint 079</h3>
              <p className="mt-2 text-sm text-slate-600">This checkpoint reinforces affiliate program production discipline: recruitment quality, mission clarity, proof validation, payout trust, territory focus and brand safety.</p>
            </div>
            <Pill tone="slate">Control 079</Pill>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase text-slate-9500">Decision input</p>
              <p className="mt-2 font-black">Segment, status, lead quality, risk and payout context.</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase text-slate-9500">Operator action</p>
              <p className="mt-2 font-black">Assign, approve, coach, pause, escalate or scale.</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase text-slate-9500">Expected output</p>
              <p className="mt-2 font-black">Better conversion, safer content and stronger ambassador trust.</p>
            </div>
          </div>
        </Card>


        <Card>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-wide text-slate-9500">Operational control layer 080</p>
              <h3 className="mt-1 text-xl font-black">Ambassador execution checkpoint 080</h3>
              <p className="mt-2 text-sm text-slate-600">This checkpoint reinforces affiliate program production discipline: recruitment quality, mission clarity, proof validation, payout trust, territory focus and brand safety.</p>
            </div>
            <Pill tone="slate">Control 080</Pill>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase text-slate-9500">Decision input</p>
              <p className="mt-2 font-black">Segment, status, lead quality, risk and payout context.</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase text-slate-9500">Operator action</p>
              <p className="mt-2 font-black">Assign, approve, coach, pause, escalate or scale.</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase text-slate-9500">Expected output</p>
              <p className="mt-2 font-black">Better conversion, safer content and stronger ambassador trust.</p>
            </div>
          </div>
        </Card>


        <Card>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-wide text-slate-9500">Operational control layer 081</p>
              <h3 className="mt-1 text-xl font-black">Ambassador execution checkpoint 081</h3>
              <p className="mt-2 text-sm text-slate-600">This checkpoint reinforces affiliate program production discipline: recruitment quality, mission clarity, proof validation, payout trust, territory focus and brand safety.</p>
            </div>
            <Pill tone="slate">Control 081</Pill>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase text-slate-9500">Decision input</p>
              <p className="mt-2 font-black">Segment, status, lead quality, risk and payout context.</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase text-slate-9500">Operator action</p>
              <p className="mt-2 font-black">Assign, approve, coach, pause, escalate or scale.</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase text-slate-9500">Expected output</p>
              <p className="mt-2 font-black">Better conversion, safer content and stronger ambassador trust.</p>
            </div>
          </div>
        </Card>


        <Card>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-wide text-slate-9500">Operational control layer 082</p>
              <h3 className="mt-1 text-xl font-black">Ambassador execution checkpoint 082</h3>
              <p className="mt-2 text-sm text-slate-600">This checkpoint reinforces affiliate program production discipline: recruitment quality, mission clarity, proof validation, payout trust, territory focus and brand safety.</p>
            </div>
            <Pill tone="slate">Control 082</Pill>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase text-slate-9500">Decision input</p>
              <p className="mt-2 font-black">Segment, status, lead quality, risk and payout context.</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase text-slate-9500">Operator action</p>
              <p className="mt-2 font-black">Assign, approve, coach, pause, escalate or scale.</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase text-slate-9500">Expected output</p>
              <p className="mt-2 font-black">Better conversion, safer content and stronger ambassador trust.</p>
            </div>
          </div>
        </Card>


        <Card>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-wide text-slate-9500">Operational control layer 083</p>
              <h3 className="mt-1 text-xl font-black">Ambassador execution checkpoint 083</h3>
              <p className="mt-2 text-sm text-slate-600">This checkpoint reinforces affiliate program production discipline: recruitment quality, mission clarity, proof validation, payout trust, territory focus and brand safety.</p>
            </div>
            <Pill tone="slate">Control 083</Pill>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase text-slate-9500">Decision input</p>
              <p className="mt-2 font-black">Segment, status, lead quality, risk and payout context.</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase text-slate-9500">Operator action</p>
              <p className="mt-2 font-black">Assign, approve, coach, pause, escalate or scale.</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase text-slate-9500">Expected output</p>
              <p className="mt-2 font-black">Better conversion, safer content and stronger ambassador trust.</p>
            </div>
          </div>
        </Card>


        <Card>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-wide text-slate-9500">Operational control layer 084</p>
              <h3 className="mt-1 text-xl font-black">Ambassador execution checkpoint 084</h3>
              <p className="mt-2 text-sm text-slate-600">This checkpoint reinforces affiliate program production discipline: recruitment quality, mission clarity, proof validation, payout trust, territory focus and brand safety.</p>
            </div>
            <Pill tone="slate">Control 084</Pill>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase text-slate-9500">Decision input</p>
              <p className="mt-2 font-black">Segment, status, lead quality, risk and payout context.</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase text-slate-9500">Operator action</p>
              <p className="mt-2 font-black">Assign, approve, coach, pause, escalate or scale.</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase text-slate-9500">Expected output</p>
              <p className="mt-2 font-black">Better conversion, safer content and stronger ambassador trust.</p>
            </div>
          </div>
        </Card>


        <Card>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-wide text-slate-9500">Operational control layer 085</p>
              <h3 className="mt-1 text-xl font-black">Ambassador execution checkpoint 085</h3>
              <p className="mt-2 text-sm text-slate-600">This checkpoint reinforces affiliate program production discipline: recruitment quality, mission clarity, proof validation, payout trust, territory focus and brand safety.</p>
            </div>
            <Pill tone="slate">Control 085</Pill>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase text-slate-9500">Decision input</p>
              <p className="mt-2 font-black">Segment, status, lead quality, risk and payout context.</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase text-slate-9500">Operator action</p>
              <p className="mt-2 font-black">Assign, approve, coach, pause, escalate or scale.</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase text-slate-9500">Expected output</p>
              <p className="mt-2 font-black">Better conversion, safer content and stronger ambassador trust.</p>
            </div>
          </div>
        </Card>


        <Card>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-wide text-slate-9500">Operational control layer 086</p>
              <h3 className="mt-1 text-xl font-black">Ambassador execution checkpoint 086</h3>
              <p className="mt-2 text-sm text-slate-600">This checkpoint reinforces affiliate program production discipline: recruitment quality, mission clarity, proof validation, payout trust, territory focus and brand safety.</p>
            </div>
            <Pill tone="slate">Control 086</Pill>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase text-slate-9500">Decision input</p>
              <p className="mt-2 font-black">Segment, status, lead quality, risk and payout context.</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase text-slate-9500">Operator action</p>
              <p className="mt-2 font-black">Assign, approve, coach, pause, escalate or scale.</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase text-slate-9500">Expected output</p>
              <p className="mt-2 font-black">Better conversion, safer content and stronger ambassador trust.</p>
            </div>
          </div>
        </Card>


        <Card>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-wide text-slate-9500">Operational control layer 087</p>
              <h3 className="mt-1 text-xl font-black">Ambassador execution checkpoint 087</h3>
              <p className="mt-2 text-sm text-slate-600">This checkpoint reinforces affiliate program production discipline: recruitment quality, mission clarity, proof validation, payout trust, territory focus and brand safety.</p>
            </div>
            <Pill tone="slate">Control 087</Pill>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase text-slate-9500">Decision input</p>
              <p className="mt-2 font-black">Segment, status, lead quality, risk and payout context.</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase text-slate-9500">Operator action</p>
              <p className="mt-2 font-black">Assign, approve, coach, pause, escalate or scale.</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase text-slate-9500">Expected output</p>
              <p className="mt-2 font-black">Better conversion, safer content and stronger ambassador trust.</p>
            </div>
          </div>
        </Card>


        <Card>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-wide text-slate-9500">Operational control layer 088</p>
              <h3 className="mt-1 text-xl font-black">Ambassador execution checkpoint 088</h3>
              <p className="mt-2 text-sm text-slate-600">This checkpoint reinforces affiliate program production discipline: recruitment quality, mission clarity, proof validation, payout trust, territory focus and brand safety.</p>
            </div>
            <Pill tone="slate">Control 088</Pill>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase text-slate-9500">Decision input</p>
              <p className="mt-2 font-black">Segment, status, lead quality, risk and payout context.</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase text-slate-9500">Operator action</p>
              <p className="mt-2 font-black">Assign, approve, coach, pause, escalate or scale.</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase text-slate-9500">Expected output</p>
              <p className="mt-2 font-black">Better conversion, safer content and stronger ambassador trust.</p>
            </div>
          </div>
        </Card>


        <Card>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-wide text-slate-9500">Operational control layer 089</p>
              <h3 className="mt-1 text-xl font-black">Ambassador execution checkpoint 089</h3>
              <p className="mt-2 text-sm text-slate-600">This checkpoint reinforces affiliate program production discipline: recruitment quality, mission clarity, proof validation, payout trust, territory focus and brand safety.</p>
            </div>
            <Pill tone="slate">Control 089</Pill>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase text-slate-9500">Decision input</p>
              <p className="mt-2 font-black">Segment, status, lead quality, risk and payout context.</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase text-slate-9500">Operator action</p>
              <p className="mt-2 font-black">Assign, approve, coach, pause, escalate or scale.</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase text-slate-9500">Expected output</p>
              <p className="mt-2 font-black">Better conversion, safer content and stronger ambassador trust.</p>
            </div>
          </div>
        </Card>


        <Card>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-wide text-slate-9500">Operational control layer 090</p>
              <h3 className="mt-1 text-xl font-black">Ambassador execution checkpoint 090</h3>
              <p className="mt-2 text-sm text-slate-600">This checkpoint reinforces affiliate program production discipline: recruitment quality, mission clarity, proof validation, payout trust, territory focus and brand safety.</p>
            </div>
            <Pill tone="slate">Control 090</Pill>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase text-slate-9500">Decision input</p>
              <p className="mt-2 font-black">Segment, status, lead quality, risk and payout context.</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase text-slate-9500">Operator action</p>
              <p className="mt-2 font-black">Assign, approve, coach, pause, escalate or scale.</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase text-slate-9500">Expected output</p>
              <p className="mt-2 font-black">Better conversion, safer content and stronger ambassador trust.</p>
            </div>
          </div>
        </Card>


        <Card>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-wide text-slate-9500">Operational control layer 091</p>
              <h3 className="mt-1 text-xl font-black">Ambassador execution checkpoint 091</h3>
              <p className="mt-2 text-sm text-slate-600">This checkpoint reinforces affiliate program production discipline: recruitment quality, mission clarity, proof validation, payout trust, territory focus and brand safety.</p>
            </div>
            <Pill tone="slate">Control 091</Pill>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase text-slate-9500">Decision input</p>
              <p className="mt-2 font-black">Segment, status, lead quality, risk and payout context.</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase text-slate-9500">Operator action</p>
              <p className="mt-2 font-black">Assign, approve, coach, pause, escalate or scale.</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase text-slate-9500">Expected output</p>
              <p className="mt-2 font-black">Better conversion, safer content and stronger ambassador trust.</p>
            </div>
          </div>
        </Card>


        <Card>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-wide text-slate-9500">Operational control layer 092</p>
              <h3 className="mt-1 text-xl font-black">Ambassador execution checkpoint 092</h3>
              <p className="mt-2 text-sm text-slate-600">This checkpoint reinforces affiliate program production discipline: recruitment quality, mission clarity, proof validation, payout trust, territory focus and brand safety.</p>
            </div>
            <Pill tone="slate">Control 092</Pill>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase text-slate-9500">Decision input</p>
              <p className="mt-2 font-black">Segment, status, lead quality, risk and payout context.</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase text-slate-9500">Operator action</p>
              <p className="mt-2 font-black">Assign, approve, coach, pause, escalate or scale.</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase text-slate-9500">Expected output</p>
              <p className="mt-2 font-black">Better conversion, safer content and stronger ambassador trust.</p>
            </div>
          </div>
        </Card>


        <Card>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-wide text-slate-9500">Operational control layer 093</p>
              <h3 className="mt-1 text-xl font-black">Ambassador execution checkpoint 093</h3>
              <p className="mt-2 text-sm text-slate-600">This checkpoint reinforces affiliate program production discipline: recruitment quality, mission clarity, proof validation, payout trust, territory focus and brand safety.</p>
            </div>
            <Pill tone="slate">Control 093</Pill>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase text-slate-9500">Decision input</p>
              <p className="mt-2 font-black">Segment, status, lead quality, risk and payout context.</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase text-slate-9500">Operator action</p>
              <p className="mt-2 font-black">Assign, approve, coach, pause, escalate or scale.</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase text-slate-9500">Expected output</p>
              <p className="mt-2 font-black">Better conversion, safer content and stronger ambassador trust.</p>
            </div>
          </div>
        </Card>


        <Card>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-wide text-slate-9500">Operational control layer 094</p>
              <h3 className="mt-1 text-xl font-black">Ambassador execution checkpoint 094</h3>
              <p className="mt-2 text-sm text-slate-600">This checkpoint reinforces affiliate program production discipline: recruitment quality, mission clarity, proof validation, payout trust, territory focus and brand safety.</p>
            </div>
            <Pill tone="slate">Control 094</Pill>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase text-slate-9500">Decision input</p>
              <p className="mt-2 font-black">Segment, status, lead quality, risk and payout context.</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase text-slate-9500">Operator action</p>
              <p className="mt-2 font-black">Assign, approve, coach, pause, escalate or scale.</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase text-slate-9500">Expected output</p>
              <p className="mt-2 font-black">Better conversion, safer content and stronger ambassador trust.</p>
            </div>
          </div>
        </Card>


        <Card>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-wide text-slate-9500">Operational control layer 095</p>
              <h3 className="mt-1 text-xl font-black">Ambassador execution checkpoint 095</h3>
              <p className="mt-2 text-sm text-slate-600">This checkpoint reinforces affiliate program production discipline: recruitment quality, mission clarity, proof validation, payout trust, territory focus and brand safety.</p>
            </div>
            <Pill tone="slate">Control 095</Pill>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase text-slate-9500">Decision input</p>
              <p className="mt-2 font-black">Segment, status, lead quality, risk and payout context.</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase text-slate-9500">Operator action</p>
              <p className="mt-2 font-black">Assign, approve, coach, pause, escalate or scale.</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase text-slate-9500">Expected output</p>
              <p className="mt-2 font-black">Better conversion, safer content and stronger ambassador trust.</p>
            </div>
          </div>
        </Card>


        <Card>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-wide text-slate-9500">Operational control layer 096</p>
              <h3 className="mt-1 text-xl font-black">Ambassador execution checkpoint 096</h3>
              <p className="mt-2 text-sm text-slate-600">This checkpoint reinforces affiliate program production discipline: recruitment quality, mission clarity, proof validation, payout trust, territory focus and brand safety.</p>
            </div>
            <Pill tone="slate">Control 096</Pill>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase text-slate-9500">Decision input</p>
              <p className="mt-2 font-black">Segment, status, lead quality, risk and payout context.</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase text-slate-9500">Operator action</p>
              <p className="mt-2 font-black">Assign, approve, coach, pause, escalate or scale.</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase text-slate-9500">Expected output</p>
              <p className="mt-2 font-black">Better conversion, safer content and stronger ambassador trust.</p>
            </div>
          </div>
        </Card>


        <Card>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-wide text-slate-9500">Operational control layer 097</p>
              <h3 className="mt-1 text-xl font-black">Ambassador execution checkpoint 097</h3>
              <p className="mt-2 text-sm text-slate-600">This checkpoint reinforces affiliate program production discipline: recruitment quality, mission clarity, proof validation, payout trust, territory focus and brand safety.</p>
            </div>
            <Pill tone="slate">Control 097</Pill>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase text-slate-9500">Decision input</p>
              <p className="mt-2 font-black">Segment, status, lead quality, risk and payout context.</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase text-slate-9500">Operator action</p>
              <p className="mt-2 font-black">Assign, approve, coach, pause, escalate or scale.</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase text-slate-9500">Expected output</p>
              <p className="mt-2 font-black">Better conversion, safer content and stronger ambassador trust.</p>
            </div>
          </div>
        </Card>


        <Card>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-wide text-slate-9500">Operational control layer 098</p>
              <h3 className="mt-1 text-xl font-black">Ambassador execution checkpoint 098</h3>
              <p className="mt-2 text-sm text-slate-600">This checkpoint reinforces affiliate program production discipline: recruitment quality, mission clarity, proof validation, payout trust, territory focus and brand safety.</p>
            </div>
            <Pill tone="slate">Control 098</Pill>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase text-slate-9500">Decision input</p>
              <p className="mt-2 font-black">Segment, status, lead quality, risk and payout context.</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase text-slate-9500">Operator action</p>
              <p className="mt-2 font-black">Assign, approve, coach, pause, escalate or scale.</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase text-slate-9500">Expected output</p>
              <p className="mt-2 font-black">Better conversion, safer content and stronger ambassador trust.</p>
            </div>
          </div>
        </Card>


        <Card>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-wide text-slate-9500">Operational control layer 099</p>
              <h3 className="mt-1 text-xl font-black">Ambassador execution checkpoint 099</h3>
              <p className="mt-2 text-sm text-slate-600">This checkpoint reinforces affiliate program production discipline: recruitment quality, mission clarity, proof validation, payout trust, territory focus and brand safety.</p>
            </div>
            <Pill tone="slate">Control 099</Pill>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase text-slate-9500">Decision input</p>
              <p className="mt-2 font-black">Segment, status, lead quality, risk and payout context.</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase text-slate-9500">Operator action</p>
              <p className="mt-2 font-black">Assign, approve, coach, pause, escalate or scale.</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase text-slate-9500">Expected output</p>
              <p className="mt-2 font-black">Better conversion, safer content and stronger ambassador trust.</p>
            </div>
          </div>
        </Card>


        <Card>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-wide text-slate-9500">Operational control layer 100</p>
              <h3 className="mt-1 text-xl font-black">Ambassador execution checkpoint 100</h3>
              <p className="mt-2 text-sm text-slate-600">This checkpoint reinforces affiliate program production discipline: recruitment quality, mission clarity, proof validation, payout trust, territory focus and brand safety.</p>
            </div>
            <Pill tone="slate">Control 100</Pill>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase text-slate-9500">Decision input</p>
              <p className="mt-2 font-black">Segment, status, lead quality, risk and payout context.</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase text-slate-9500">Operator action</p>
              <p className="mt-2 font-black">Assign, approve, coach, pause, escalate or scale.</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase text-slate-9500">Expected output</p>
              <p className="mt-2 font-black">Better conversion, safer content and stronger ambassador trust.</p>
            </div>
          </div>
        </Card>


        <Card>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-wide text-slate-9500">Operational control layer 101</p>
              <h3 className="mt-1 text-xl font-black">Ambassador execution checkpoint 101</h3>
              <p className="mt-2 text-sm text-slate-600">This checkpoint reinforces affiliate program production discipline: recruitment quality, mission clarity, proof validation, payout trust, territory focus and brand safety.</p>
            </div>
            <Pill tone="slate">Control 101</Pill>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase text-slate-9500">Decision input</p>
              <p className="mt-2 font-black">Segment, status, lead quality, risk and payout context.</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase text-slate-9500">Operator action</p>
              <p className="mt-2 font-black">Assign, approve, coach, pause, escalate or scale.</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase text-slate-9500">Expected output</p>
              <p className="mt-2 font-black">Better conversion, safer content and stronger ambassador trust.</p>
            </div>
          </div>
        </Card>


        <Card>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-wide text-slate-9500">Operational control layer 102</p>
              <h3 className="mt-1 text-xl font-black">Ambassador execution checkpoint 102</h3>
              <p className="mt-2 text-sm text-slate-600">This checkpoint reinforces affiliate program production discipline: recruitment quality, mission clarity, proof validation, payout trust, territory focus and brand safety.</p>
            </div>
            <Pill tone="slate">Control 102</Pill>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase text-slate-9500">Decision input</p>
              <p className="mt-2 font-black">Segment, status, lead quality, risk and payout context.</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase text-slate-9500">Operator action</p>
              <p className="mt-2 font-black">Assign, approve, coach, pause, escalate or scale.</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase text-slate-9500">Expected output</p>
              <p className="mt-2 font-black">Better conversion, safer content and stronger ambassador trust.</p>
            </div>
          </div>
        </Card>


        <Card>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-wide text-slate-9500">Operational control layer 103</p>
              <h3 className="mt-1 text-xl font-black">Ambassador execution checkpoint 103</h3>
              <p className="mt-2 text-sm text-slate-600">This checkpoint reinforces affiliate program production discipline: recruitment quality, mission clarity, proof validation, payout trust, territory focus and brand safety.</p>
            </div>
            <Pill tone="slate">Control 103</Pill>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase text-slate-9500">Decision input</p>
              <p className="mt-2 font-black">Segment, status, lead quality, risk and payout context.</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase text-slate-9500">Operator action</p>
              <p className="mt-2 font-black">Assign, approve, coach, pause, escalate or scale.</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase text-slate-9500">Expected output</p>
              <p className="mt-2 font-black">Better conversion, safer content and stronger ambassador trust.</p>
            </div>
          </div>
        </Card>


        <Card>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-wide text-slate-9500">Operational control layer 104</p>
              <h3 className="mt-1 text-xl font-black">Ambassador execution checkpoint 104</h3>
              <p className="mt-2 text-sm text-slate-600">This checkpoint reinforces affiliate program production discipline: recruitment quality, mission clarity, proof validation, payout trust, territory focus and brand safety.</p>
            </div>
            <Pill tone="slate">Control 104</Pill>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase text-slate-9500">Decision input</p>
              <p className="mt-2 font-black">Segment, status, lead quality, risk and payout context.</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase text-slate-9500">Operator action</p>
              <p className="mt-2 font-black">Assign, approve, coach, pause, escalate or scale.</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase text-slate-9500">Expected output</p>
              <p className="mt-2 font-black">Better conversion, safer content and stronger ambassador trust.</p>
            </div>
          </div>
        </Card>


        <Card>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-wide text-slate-9500">Operational control layer 105</p>
              <h3 className="mt-1 text-xl font-black">Ambassador execution checkpoint 105</h3>
              <p className="mt-2 text-sm text-slate-600">This checkpoint reinforces affiliate program production discipline: recruitment quality, mission clarity, proof validation, payout trust, territory focus and brand safety.</p>
            </div>
            <Pill tone="slate">Control 105</Pill>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase text-slate-9500">Decision input</p>
              <p className="mt-2 font-black">Segment, status, lead quality, risk and payout context.</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase text-slate-9500">Operator action</p>
              <p className="mt-2 font-black">Assign, approve, coach, pause, escalate or scale.</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase text-slate-9500">Expected output</p>
              <p className="mt-2 font-black">Better conversion, safer content and stronger ambassador trust.</p>
            </div>
          </div>
        </Card>


        <Card>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-wide text-slate-9500">Operational control layer 106</p>
              <h3 className="mt-1 text-xl font-black">Ambassador execution checkpoint 106</h3>
              <p className="mt-2 text-sm text-slate-600">This checkpoint reinforces affiliate program production discipline: recruitment quality, mission clarity, proof validation, payout trust, territory focus and brand safety.</p>
            </div>
            <Pill tone="slate">Control 106</Pill>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase text-slate-9500">Decision input</p>
              <p className="mt-2 font-black">Segment, status, lead quality, risk and payout context.</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase text-slate-9500">Operator action</p>
              <p className="mt-2 font-black">Assign, approve, coach, pause, escalate or scale.</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase text-slate-9500">Expected output</p>
              <p className="mt-2 font-black">Better conversion, safer content and stronger ambassador trust.</p>
            </div>
          </div>
        </Card>


        <Card>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-wide text-slate-9500">Operational control layer 107</p>
              <h3 className="mt-1 text-xl font-black">Ambassador execution checkpoint 107</h3>
              <p className="mt-2 text-sm text-slate-600">This checkpoint reinforces affiliate program production discipline: recruitment quality, mission clarity, proof validation, payout trust, territory focus and brand safety.</p>
            </div>
            <Pill tone="slate">Control 107</Pill>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase text-slate-9500">Decision input</p>
              <p className="mt-2 font-black">Segment, status, lead quality, risk and payout context.</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase text-slate-9500">Operator action</p>
              <p className="mt-2 font-black">Assign, approve, coach, pause, escalate or scale.</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase text-slate-9500">Expected output</p>
              <p className="mt-2 font-black">Better conversion, safer content and stronger ambassador trust.</p>
            </div>
          </div>
        </Card>


        <Card>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-wide text-slate-9500">Operational control layer 108</p>
              <h3 className="mt-1 text-xl font-black">Ambassador execution checkpoint 108</h3>
              <p className="mt-2 text-sm text-slate-600">This checkpoint reinforces affiliate program production discipline: recruitment quality, mission clarity, proof validation, payout trust, territory focus and brand safety.</p>
            </div>
            <Pill tone="slate">Control 108</Pill>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase text-slate-9500">Decision input</p>
              <p className="mt-2 font-black">Segment, status, lead quality, risk and payout context.</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase text-slate-9500">Operator action</p>
              <p className="mt-2 font-black">Assign, approve, coach, pause, escalate or scale.</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase text-slate-9500">Expected output</p>
              <p className="mt-2 font-black">Better conversion, safer content and stronger ambassador trust.</p>
            </div>
          </div>
        </Card>


        <Card>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-wide text-slate-9500">Operational control layer 109</p>
              <h3 className="mt-1 text-xl font-black">Ambassador execution checkpoint 109</h3>
              <p className="mt-2 text-sm text-slate-600">This checkpoint reinforces affiliate program production discipline: recruitment quality, mission clarity, proof validation, payout trust, territory focus and brand safety.</p>
            </div>
            <Pill tone="slate">Control 109</Pill>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase text-slate-9500">Decision input</p>
              <p className="mt-2 font-black">Segment, status, lead quality, risk and payout context.</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase text-slate-9500">Operator action</p>
              <p className="mt-2 font-black">Assign, approve, coach, pause, escalate or scale.</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase text-slate-9500">Expected output</p>
              <p className="mt-2 font-black">Better conversion, safer content and stronger ambassador trust.</p>
            </div>
          </div>
        </Card>


        <Card>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-wide text-slate-9500">Operational control layer 110</p>
              <h3 className="mt-1 text-xl font-black">Ambassador execution checkpoint 110</h3>
              <p className="mt-2 text-sm text-slate-600">This checkpoint reinforces affiliate program production discipline: recruitment quality, mission clarity, proof validation, payout trust, territory focus and brand safety.</p>
            </div>
            <Pill tone="slate">Control 110</Pill>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase text-slate-9500">Decision input</p>
              <p className="mt-2 font-black">Segment, status, lead quality, risk and payout context.</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase text-slate-9500">Operator action</p>
              <p className="mt-2 font-black">Assign, approve, coach, pause, escalate or scale.</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase text-slate-9500">Expected output</p>
              <p className="mt-2 font-black">Better conversion, safer content and stronger ambassador trust.</p>
            </div>
          </div>
        </Card>


        <Card>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-wide text-slate-9500">Operational control layer 111</p>
              <h3 className="mt-1 text-xl font-black">Ambassador execution checkpoint 111</h3>
              <p className="mt-2 text-sm text-slate-600">This checkpoint reinforces affiliate program production discipline: recruitment quality, mission clarity, proof validation, payout trust, territory focus and brand safety.</p>
            </div>
            <Pill tone="slate">Control 111</Pill>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase text-slate-9500">Decision input</p>
              <p className="mt-2 font-black">Segment, status, lead quality, risk and payout context.</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase text-slate-9500">Operator action</p>
              <p className="mt-2 font-black">Assign, approve, coach, pause, escalate or scale.</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase text-slate-9500">Expected output</p>
              <p className="mt-2 font-black">Better conversion, safer content and stronger ambassador trust.</p>
            </div>
          </div>
        </Card>


        <Card>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-wide text-slate-9500">Operational control layer 112</p>
              <h3 className="mt-1 text-xl font-black">Ambassador execution checkpoint 112</h3>
              <p className="mt-2 text-sm text-slate-600">This checkpoint reinforces affiliate program production discipline: recruitment quality, mission clarity, proof validation, payout trust, territory focus and brand safety.</p>
            </div>
            <Pill tone="slate">Control 112</Pill>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase text-slate-9500">Decision input</p>
              <p className="mt-2 font-black">Segment, status, lead quality, risk and payout context.</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase text-slate-9500">Operator action</p>
              <p className="mt-2 font-black">Assign, approve, coach, pause, escalate or scale.</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase text-slate-9500">Expected output</p>
              <p className="mt-2 font-black">Better conversion, safer content and stronger ambassador trust.</p>
            </div>
          </div>
        </Card>


        <Card>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-wide text-slate-9500">Operational control layer 113</p>
              <h3 className="mt-1 text-xl font-black">Ambassador execution checkpoint 113</h3>
              <p className="mt-2 text-sm text-slate-600">This checkpoint reinforces affiliate program production discipline: recruitment quality, mission clarity, proof validation, payout trust, territory focus and brand safety.</p>
            </div>
            <Pill tone="slate">Control 113</Pill>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase text-slate-9500">Decision input</p>
              <p className="mt-2 font-black">Segment, status, lead quality, risk and payout context.</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase text-slate-9500">Operator action</p>
              <p className="mt-2 font-black">Assign, approve, coach, pause, escalate or scale.</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase text-slate-9500">Expected output</p>
              <p className="mt-2 font-black">Better conversion, safer content and stronger ambassador trust.</p>
            </div>
          </div>
        </Card>


        <Card>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-wide text-slate-9500">Operational control layer 114</p>
              <h3 className="mt-1 text-xl font-black">Ambassador execution checkpoint 114</h3>
              <p className="mt-2 text-sm text-slate-600">This checkpoint reinforces affiliate program production discipline: recruitment quality, mission clarity, proof validation, payout trust, territory focus and brand safety.</p>
            </div>
            <Pill tone="slate">Control 114</Pill>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase text-slate-9500">Decision input</p>
              <p className="mt-2 font-black">Segment, status, lead quality, risk and payout context.</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase text-slate-9500">Operator action</p>
              <p className="mt-2 font-black">Assign, approve, coach, pause, escalate or scale.</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase text-slate-9500">Expected output</p>
              <p className="mt-2 font-black">Better conversion, safer content and stronger ambassador trust.</p>
            </div>
          </div>
        </Card>


        <Card>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-wide text-slate-9500">Operational control layer 115</p>
              <h3 className="mt-1 text-xl font-black">Ambassador execution checkpoint 115</h3>
              <p className="mt-2 text-sm text-slate-600">This checkpoint reinforces affiliate program production discipline: recruitment quality, mission clarity, proof validation, payout trust, territory focus and brand safety.</p>
            </div>
            <Pill tone="slate">Control 115</Pill>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase text-slate-9500">Decision input</p>
              <p className="mt-2 font-black">Segment, status, lead quality, risk and payout context.</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase text-slate-9500">Operator action</p>
              <p className="mt-2 font-black">Assign, approve, coach, pause, escalate or scale.</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase text-slate-9500">Expected output</p>
              <p className="mt-2 font-black">Better conversion, safer content and stronger ambassador trust.</p>
            </div>
          </div>
        </Card>


        <Card>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-wide text-slate-9500">Operational control layer 116</p>
              <h3 className="mt-1 text-xl font-black">Ambassador execution checkpoint 116</h3>
              <p className="mt-2 text-sm text-slate-600">This checkpoint reinforces affiliate program production discipline: recruitment quality, mission clarity, proof validation, payout trust, territory focus and brand safety.</p>
            </div>
            <Pill tone="slate">Control 116</Pill>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase text-slate-9500">Decision input</p>
              <p className="mt-2 font-black">Segment, status, lead quality, risk and payout context.</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase text-slate-9500">Operator action</p>
              <p className="mt-2 font-black">Assign, approve, coach, pause, escalate or scale.</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase text-slate-9500">Expected output</p>
              <p className="mt-2 font-black">Better conversion, safer content and stronger ambassador trust.</p>
            </div>
          </div>
        </Card>


        <Card>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-wide text-slate-9500">Operational control layer 117</p>
              <h3 className="mt-1 text-xl font-black">Ambassador execution checkpoint 117</h3>
              <p className="mt-2 text-sm text-slate-600">This checkpoint reinforces affiliate program production discipline: recruitment quality, mission clarity, proof validation, payout trust, territory focus and brand safety.</p>
            </div>
            <Pill tone="slate">Control 117</Pill>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase text-slate-9500">Decision input</p>
              <p className="mt-2 font-black">Segment, status, lead quality, risk and payout context.</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase text-slate-9500">Operator action</p>
              <p className="mt-2 font-black">Assign, approve, coach, pause, escalate or scale.</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase text-slate-9500">Expected output</p>
              <p className="mt-2 font-black">Better conversion, safer content and stronger ambassador trust.</p>
            </div>
          </div>
        </Card>


        <Card>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-wide text-slate-9500">Operational control layer 118</p>
              <h3 className="mt-1 text-xl font-black">Ambassador execution checkpoint 118</h3>
              <p className="mt-2 text-sm text-slate-600">This checkpoint reinforces affiliate program production discipline: recruitment quality, mission clarity, proof validation, payout trust, territory focus and brand safety.</p>
            </div>
            <Pill tone="slate">Control 118</Pill>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase text-slate-9500">Decision input</p>
              <p className="mt-2 font-black">Segment, status, lead quality, risk and payout context.</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase text-slate-9500">Operator action</p>
              <p className="mt-2 font-black">Assign, approve, coach, pause, escalate or scale.</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase text-slate-9500">Expected output</p>
              <p className="mt-2 font-black">Better conversion, safer content and stronger ambassador trust.</p>
            </div>
          </div>
        </Card>


        <Card>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-wide text-slate-9500">Operational control layer 119</p>
              <h3 className="mt-1 text-xl font-black">Ambassador execution checkpoint 119</h3>
              <p className="mt-2 text-sm text-slate-600">This checkpoint reinforces affiliate program production discipline: recruitment quality, mission clarity, proof validation, payout trust, territory focus and brand safety.</p>
            </div>
            <Pill tone="slate">Control 119</Pill>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase text-slate-9500">Decision input</p>
              <p className="mt-2 font-black">Segment, status, lead quality, risk and payout context.</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase text-slate-9500">Operator action</p>
              <p className="mt-2 font-black">Assign, approve, coach, pause, escalate or scale.</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase text-slate-9500">Expected output</p>
              <p className="mt-2 font-black">Better conversion, safer content and stronger ambassador trust.</p>
            </div>
          </div>
        </Card>


        <Card>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-wide text-slate-9500">Operational control layer 120</p>
              <h3 className="mt-1 text-xl font-black">Ambassador execution checkpoint 120</h3>
              <p className="mt-2 text-sm text-slate-600">This checkpoint reinforces affiliate program production discipline: recruitment quality, mission clarity, proof validation, payout trust, territory focus and brand safety.</p>
            </div>
            <Pill tone="slate">Control 120</Pill>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase text-slate-9500">Decision input</p>
              <p className="mt-2 font-black">Segment, status, lead quality, risk and payout context.</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase text-slate-9500">Operator action</p>
              <p className="mt-2 font-black">Assign, approve, coach, pause, escalate or scale.</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase text-slate-9500">Expected output</p>
              <p className="mt-2 font-black">Better conversion, safer content and stronger ambassador trust.</p>
            </div>
          </div>
        </Card>


        <Card>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-wide text-slate-9500">Operational control layer 121</p>
              <h3 className="mt-1 text-xl font-black">Ambassador execution checkpoint 121</h3>
              <p className="mt-2 text-sm text-slate-600">This checkpoint reinforces affiliate program production discipline: recruitment quality, mission clarity, proof validation, payout trust, territory focus and brand safety.</p>
            </div>
            <Pill tone="slate">Control 121</Pill>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase text-slate-9500">Decision input</p>
              <p className="mt-2 font-black">Segment, status, lead quality, risk and payout context.</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase text-slate-9500">Operator action</p>
              <p className="mt-2 font-black">Assign, approve, coach, pause, escalate or scale.</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase text-slate-9500">Expected output</p>
              <p className="mt-2 font-black">Better conversion, safer content and stronger ambassador trust.</p>
            </div>
          </div>
        </Card>


        <Card>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-wide text-slate-9500">Operational control layer 122</p>
              <h3 className="mt-1 text-xl font-black">Ambassador execution checkpoint 122</h3>
              <p className="mt-2 text-sm text-slate-600">This checkpoint reinforces affiliate program production discipline: recruitment quality, mission clarity, proof validation, payout trust, territory focus and brand safety.</p>
            </div>
            <Pill tone="slate">Control 122</Pill>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase text-slate-9500">Decision input</p>
              <p className="mt-2 font-black">Segment, status, lead quality, risk and payout context.</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase text-slate-9500">Operator action</p>
              <p className="mt-2 font-black">Assign, approve, coach, pause, escalate or scale.</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase text-slate-9500">Expected output</p>
              <p className="mt-2 font-black">Better conversion, safer content and stronger ambassador trust.</p>
            </div>
          </div>
        </Card>


        <Card>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-wide text-slate-9500">Operational control layer 123</p>
              <h3 className="mt-1 text-xl font-black">Ambassador execution checkpoint 123</h3>
              <p className="mt-2 text-sm text-slate-600">This checkpoint reinforces affiliate program production discipline: recruitment quality, mission clarity, proof validation, payout trust, territory focus and brand safety.</p>
            </div>
            <Pill tone="slate">Control 123</Pill>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase text-slate-9500">Decision input</p>
              <p className="mt-2 font-black">Segment, status, lead quality, risk and payout context.</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase text-slate-9500">Operator action</p>
              <p className="mt-2 font-black">Assign, approve, coach, pause, escalate or scale.</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase text-slate-9500">Expected output</p>
              <p className="mt-2 font-black">Better conversion, safer content and stronger ambassador trust.</p>
            </div>
          </div>
        </Card>


        <Card>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-wide text-slate-9500">Operational control layer 124</p>
              <h3 className="mt-1 text-xl font-black">Ambassador execution checkpoint 124</h3>
              <p className="mt-2 text-sm text-slate-600">This checkpoint reinforces affiliate program production discipline: recruitment quality, mission clarity, proof validation, payout trust, territory focus and brand safety.</p>
            </div>
            <Pill tone="slate">Control 124</Pill>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase text-slate-9500">Decision input</p>
              <p className="mt-2 font-black">Segment, status, lead quality, risk and payout context.</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase text-slate-9500">Operator action</p>
              <p className="mt-2 font-black">Assign, approve, coach, pause, escalate or scale.</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase text-slate-9500">Expected output</p>
              <p className="mt-2 font-black">Better conversion, safer content and stronger ambassador trust.</p>
            </div>
          </div>
        </Card>


        <Card>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-wide text-slate-9500">Operational control layer 125</p>
              <h3 className="mt-1 text-xl font-black">Ambassador execution checkpoint 125</h3>
              <p className="mt-2 text-sm text-slate-600">This checkpoint reinforces affiliate program production discipline: recruitment quality, mission clarity, proof validation, payout trust, territory focus and brand safety.</p>
            </div>
            <Pill tone="slate">Control 125</Pill>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase text-slate-9500">Decision input</p>
              <p className="mt-2 font-black">Segment, status, lead quality, risk and payout context.</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase text-slate-9500">Operator action</p>
              <p className="mt-2 font-black">Assign, approve, coach, pause, escalate or scale.</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase text-slate-9500">Expected output</p>
              <p className="mt-2 font-black">Better conversion, safer content and stronger ambassador trust.</p>
            </div>
          </div>
        </Card>


        <Card>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-wide text-slate-9500">Operational control layer 126</p>
              <h3 className="mt-1 text-xl font-black">Ambassador execution checkpoint 126</h3>
              <p className="mt-2 text-sm text-slate-600">This checkpoint reinforces affiliate program production discipline: recruitment quality, mission clarity, proof validation, payout trust, territory focus and brand safety.</p>
            </div>
            <Pill tone="slate">Control 126</Pill>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase text-slate-9500">Decision input</p>
              <p className="mt-2 font-black">Segment, status, lead quality, risk and payout context.</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase text-slate-9500">Operator action</p>
              <p className="mt-2 font-black">Assign, approve, coach, pause, escalate or scale.</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase text-slate-9500">Expected output</p>
              <p className="mt-2 font-black">Better conversion, safer content and stronger ambassador trust.</p>
            </div>
          </div>
        </Card>


        <Card>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-wide text-slate-9500">Operational control layer 127</p>
              <h3 className="mt-1 text-xl font-black">Ambassador execution checkpoint 127</h3>
              <p className="mt-2 text-sm text-slate-600">This checkpoint reinforces affiliate program production discipline: recruitment quality, mission clarity, proof validation, payout trust, territory focus and brand safety.</p>
            </div>
            <Pill tone="slate">Control 127</Pill>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase text-slate-9500">Decision input</p>
              <p className="mt-2 font-black">Segment, status, lead quality, risk and payout context.</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase text-slate-9500">Operator action</p>
              <p className="mt-2 font-black">Assign, approve, coach, pause, escalate or scale.</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase text-slate-9500">Expected output</p>
              <p className="mt-2 font-black">Better conversion, safer content and stronger ambassador trust.</p>
            </div>
          </div>
        </Card>


        <Card>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-wide text-slate-9500">Operational control layer 128</p>
              <h3 className="mt-1 text-xl font-black">Ambassador execution checkpoint 128</h3>
              <p className="mt-2 text-sm text-slate-600">This checkpoint reinforces affiliate program production discipline: recruitment quality, mission clarity, proof validation, payout trust, territory focus and brand safety.</p>
            </div>
            <Pill tone="slate">Control 128</Pill>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase text-slate-9500">Decision input</p>
              <p className="mt-2 font-black">Segment, status, lead quality, risk and payout context.</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase text-slate-9500">Operator action</p>
              <p className="mt-2 font-black">Assign, approve, coach, pause, escalate or scale.</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase text-slate-9500">Expected output</p>
              <p className="mt-2 font-black">Better conversion, safer content and stronger ambassador trust.</p>
            </div>
          </div>
        </Card>


        <Card>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-wide text-slate-9500">Operational control layer 129</p>
              <h3 className="mt-1 text-xl font-black">Ambassador execution checkpoint 129</h3>
              <p className="mt-2 text-sm text-slate-600">This checkpoint reinforces affiliate program production discipline: recruitment quality, mission clarity, proof validation, payout trust, territory focus and brand safety.</p>
            </div>
            <Pill tone="slate">Control 129</Pill>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase text-slate-9500">Decision input</p>
              <p className="mt-2 font-black">Segment, status, lead quality, risk and payout context.</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase text-slate-9500">Operator action</p>
              <p className="mt-2 font-black">Assign, approve, coach, pause, escalate or scale.</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase text-slate-9500">Expected output</p>
              <p className="mt-2 font-black">Better conversion, safer content and stronger ambassador trust.</p>
            </div>
          </div>
        </Card>


        <Card>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-wide text-slate-9500">Operational control layer 130</p>
              <h3 className="mt-1 text-xl font-black">Ambassador execution checkpoint 130</h3>
              <p className="mt-2 text-sm text-slate-600">This checkpoint reinforces affiliate program production discipline: recruitment quality, mission clarity, proof validation, payout trust, territory focus and brand safety.</p>
            </div>
            <Pill tone="slate">Control 130</Pill>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase text-slate-9500">Decision input</p>
              <p className="mt-2 font-black">Segment, status, lead quality, risk and payout context.</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase text-slate-9500">Operator action</p>
              <p className="mt-2 font-black">Assign, approve, coach, pause, escalate or scale.</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase text-slate-9500">Expected output</p>
              <p className="mt-2 font-black">Better conversion, safer content and stronger ambassador trust.</p>
            </div>
          </div>
        </Card>


        <Card>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-wide text-slate-9500">Operational control layer 131</p>
              <h3 className="mt-1 text-xl font-black">Ambassador execution checkpoint 131</h3>
              <p className="mt-2 text-sm text-slate-600">This checkpoint reinforces affiliate program production discipline: recruitment quality, mission clarity, proof validation, payout trust, territory focus and brand safety.</p>
            </div>
            <Pill tone="slate">Control 131</Pill>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase text-slate-9500">Decision input</p>
              <p className="mt-2 font-black">Segment, status, lead quality, risk and payout context.</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase text-slate-9500">Operator action</p>
              <p className="mt-2 font-black">Assign, approve, coach, pause, escalate or scale.</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase text-slate-9500">Expected output</p>
              <p className="mt-2 font-black">Better conversion, safer content and stronger ambassador trust.</p>
            </div>
          </div>
        </Card>


        <Card>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-wide text-slate-9500">Operational control layer 132</p>
              <h3 className="mt-1 text-xl font-black">Ambassador execution checkpoint 132</h3>
              <p className="mt-2 text-sm text-slate-600">This checkpoint reinforces affiliate program production discipline: recruitment quality, mission clarity, proof validation, payout trust, territory focus and brand safety.</p>
            </div>
            <Pill tone="slate">Control 132</Pill>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase text-slate-9500">Decision input</p>
              <p className="mt-2 font-black">Segment, status, lead quality, risk and payout context.</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase text-slate-9500">Operator action</p>
              <p className="mt-2 font-black">Assign, approve, coach, pause, escalate or scale.</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase text-slate-9500">Expected output</p>
              <p className="mt-2 font-black">Better conversion, safer content and stronger ambassador trust.</p>
            </div>
          </div>
        </Card>


        <Card>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-wide text-slate-9500">Operational control layer 133</p>
              <h3 className="mt-1 text-xl font-black">Ambassador execution checkpoint 133</h3>
              <p className="mt-2 text-sm text-slate-600">This checkpoint reinforces affiliate program production discipline: recruitment quality, mission clarity, proof validation, payout trust, territory focus and brand safety.</p>
            </div>
            <Pill tone="slate">Control 133</Pill>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase text-slate-9500">Decision input</p>
              <p className="mt-2 font-black">Segment, status, lead quality, risk and payout context.</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase text-slate-9500">Operator action</p>
              <p className="mt-2 font-black">Assign, approve, coach, pause, escalate or scale.</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase text-slate-9500">Expected output</p>
              <p className="mt-2 font-black">Better conversion, safer content and stronger ambassador trust.</p>
            </div>
          </div>
        </Card>


        <Card>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-wide text-slate-9500">Operational control layer 134</p>
              <h3 className="mt-1 text-xl font-black">Ambassador execution checkpoint 134</h3>
              <p className="mt-2 text-sm text-slate-600">This checkpoint reinforces affiliate program production discipline: recruitment quality, mission clarity, proof validation, payout trust, territory focus and brand safety.</p>
            </div>
            <Pill tone="slate">Control 134</Pill>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase text-slate-9500">Decision input</p>
              <p className="mt-2 font-black">Segment, status, lead quality, risk and payout context.</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase text-slate-9500">Operator action</p>
              <p className="mt-2 font-black">Assign, approve, coach, pause, escalate or scale.</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase text-slate-9500">Expected output</p>
              <p className="mt-2 font-black">Better conversion, safer content and stronger ambassador trust.</p>
            </div>
          </div>
        </Card>


        <Card>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-wide text-slate-9500">Operational control layer 135</p>
              <h3 className="mt-1 text-xl font-black">Ambassador execution checkpoint 135</h3>
              <p className="mt-2 text-sm text-slate-600">This checkpoint reinforces affiliate program production discipline: recruitment quality, mission clarity, proof validation, payout trust, territory focus and brand safety.</p>
            </div>
            <Pill tone="slate">Control 135</Pill>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase text-slate-9500">Decision input</p>
              <p className="mt-2 font-black">Segment, status, lead quality, risk and payout context.</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase text-slate-9500">Operator action</p>
              <p className="mt-2 font-black">Assign, approve, coach, pause, escalate or scale.</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase text-slate-9500">Expected output</p>
              <p className="mt-2 font-black">Better conversion, safer content and stronger ambassador trust.</p>
            </div>
          </div>
        </Card>


        <Card>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-wide text-slate-9500">Operational control layer 136</p>
              <h3 className="mt-1 text-xl font-black">Ambassador execution checkpoint 136</h3>
              <p className="mt-2 text-sm text-slate-600">This checkpoint reinforces affiliate program production discipline: recruitment quality, mission clarity, proof validation, payout trust, territory focus and brand safety.</p>
            </div>
            <Pill tone="slate">Control 136</Pill>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase text-slate-9500">Decision input</p>
              <p className="mt-2 font-black">Segment, status, lead quality, risk and payout context.</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase text-slate-9500">Operator action</p>
              <p className="mt-2 font-black">Assign, approve, coach, pause, escalate or scale.</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase text-slate-9500">Expected output</p>
              <p className="mt-2 font-black">Better conversion, safer content and stronger ambassador trust.</p>
            </div>
          </div>
        </Card>


        <Card>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-wide text-slate-9500">Operational control layer 137</p>
              <h3 className="mt-1 text-xl font-black">Ambassador execution checkpoint 137</h3>
              <p className="mt-2 text-sm text-slate-600">This checkpoint reinforces affiliate program production discipline: recruitment quality, mission clarity, proof validation, payout trust, territory focus and brand safety.</p>
            </div>
            <Pill tone="slate">Control 137</Pill>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase text-slate-9500">Decision input</p>
              <p className="mt-2 font-black">Segment, status, lead quality, risk and payout context.</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase text-slate-9500">Operator action</p>
              <p className="mt-2 font-black">Assign, approve, coach, pause, escalate or scale.</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase text-slate-9500">Expected output</p>
              <p className="mt-2 font-black">Better conversion, safer content and stronger ambassador trust.</p>
            </div>
          </div>
        </Card>


        <Card>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-wide text-slate-9500">Operational control layer 138</p>
              <h3 className="mt-1 text-xl font-black">Ambassador execution checkpoint 138</h3>
              <p className="mt-2 text-sm text-slate-600">This checkpoint reinforces affiliate program production discipline: recruitment quality, mission clarity, proof validation, payout trust, territory focus and brand safety.</p>
            </div>
            <Pill tone="slate">Control 138</Pill>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase text-slate-9500">Decision input</p>
              <p className="mt-2 font-black">Segment, status, lead quality, risk and payout context.</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase text-slate-9500">Operator action</p>
              <p className="mt-2 font-black">Assign, approve, coach, pause, escalate or scale.</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase text-slate-9500">Expected output</p>
              <p className="mt-2 font-black">Better conversion, safer content and stronger ambassador trust.</p>
            </div>
          </div>
        </Card>


        <Card>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-wide text-slate-9500">Operational control layer 139</p>
              <h3 className="mt-1 text-xl font-black">Ambassador execution checkpoint 139</h3>
              <p className="mt-2 text-sm text-slate-600">This checkpoint reinforces affiliate program production discipline: recruitment quality, mission clarity, proof validation, payout trust, territory focus and brand safety.</p>
            </div>
            <Pill tone="slate">Control 139</Pill>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase text-slate-9500">Decision input</p>
              <p className="mt-2 font-black">Segment, status, lead quality, risk and payout context.</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase text-slate-9500">Operator action</p>
              <p className="mt-2 font-black">Assign, approve, coach, pause, escalate or scale.</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase text-slate-9500">Expected output</p>
              <p className="mt-2 font-black">Better conversion, safer content and stronger ambassador trust.</p>
            </div>
          </div>
        </Card>


        <Card>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-wide text-slate-9500">Operational control layer 140</p>
              <h3 className="mt-1 text-xl font-black">Ambassador execution checkpoint 140</h3>
              <p className="mt-2 text-sm text-slate-600">This checkpoint reinforces affiliate program production discipline: recruitment quality, mission clarity, proof validation, payout trust, territory focus and brand safety.</p>
            </div>
            <Pill tone="slate">Control 140</Pill>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase text-slate-9500">Decision input</p>
              <p className="mt-2 font-black">Segment, status, lead quality, risk and payout context.</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase text-slate-9500">Operator action</p>
              <p className="mt-2 font-black">Assign, approve, coach, pause, escalate or scale.</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase text-slate-9500">Expected output</p>
              <p className="mt-2 font-black">Better conversion, safer content and stronger ambassador trust.</p>
            </div>
          </div>
        </Card>


        <Card>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-wide text-slate-9500">Operational control layer 141</p>
              <h3 className="mt-1 text-xl font-black">Ambassador execution checkpoint 141</h3>
              <p className="mt-2 text-sm text-slate-600">This checkpoint reinforces affiliate program production discipline: recruitment quality, mission clarity, proof validation, payout trust, territory focus and brand safety.</p>
            </div>
            <Pill tone="slate">Control 141</Pill>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase text-slate-9500">Decision input</p>
              <p className="mt-2 font-black">Segment, status, lead quality, risk and payout context.</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase text-slate-9500">Operator action</p>
              <p className="mt-2 font-black">Assign, approve, coach, pause, escalate or scale.</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase text-slate-9500">Expected output</p>
              <p className="mt-2 font-black">Better conversion, safer content and stronger ambassador trust.</p>
            </div>
          </div>
        </Card>


        <Card>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-wide text-slate-9500">Operational control layer 142</p>
              <h3 className="mt-1 text-xl font-black">Ambassador execution checkpoint 142</h3>
              <p className="mt-2 text-sm text-slate-600">This checkpoint reinforces affiliate program production discipline: recruitment quality, mission clarity, proof validation, payout trust, territory focus and brand safety.</p>
            </div>
            <Pill tone="slate">Control 142</Pill>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase text-slate-9500">Decision input</p>
              <p className="mt-2 font-black">Segment, status, lead quality, risk and payout context.</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase text-slate-9500">Operator action</p>
              <p className="mt-2 font-black">Assign, approve, coach, pause, escalate or scale.</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase text-slate-9500">Expected output</p>
              <p className="mt-2 font-black">Better conversion, safer content and stronger ambassador trust.</p>
            </div>
          </div>
        </Card>


        <Card>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-wide text-slate-9500">Operational control layer 143</p>
              <h3 className="mt-1 text-xl font-black">Ambassador execution checkpoint 143</h3>
              <p className="mt-2 text-sm text-slate-600">This checkpoint reinforces affiliate program production discipline: recruitment quality, mission clarity, proof validation, payout trust, territory focus and brand safety.</p>
            </div>
            <Pill tone="slate">Control 143</Pill>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase text-slate-9500">Decision input</p>
              <p className="mt-2 font-black">Segment, status, lead quality, risk and payout context.</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase text-slate-9500">Operator action</p>
              <p className="mt-2 font-black">Assign, approve, coach, pause, escalate or scale.</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase text-slate-9500">Expected output</p>
              <p className="mt-2 font-black">Better conversion, safer content and stronger ambassador trust.</p>
            </div>
          </div>
        </Card>


        <Card>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-wide text-slate-9500">Operational control layer 144</p>
              <h3 className="mt-1 text-xl font-black">Ambassador execution checkpoint 144</h3>
              <p className="mt-2 text-sm text-slate-600">This checkpoint reinforces affiliate program production discipline: recruitment quality, mission clarity, proof validation, payout trust, territory focus and brand safety.</p>
            </div>
            <Pill tone="slate">Control 144</Pill>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase text-slate-9500">Decision input</p>
              <p className="mt-2 font-black">Segment, status, lead quality, risk and payout context.</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase text-slate-9500">Operator action</p>
              <p className="mt-2 font-black">Assign, approve, coach, pause, escalate or scale.</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase text-slate-9500">Expected output</p>
              <p className="mt-2 font-black">Better conversion, safer content and stronger ambassador trust.</p>
            </div>
          </div>
        </Card>


        <Card>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-wide text-slate-9500">Operational control layer 145</p>
              <h3 className="mt-1 text-xl font-black">Ambassador execution checkpoint 145</h3>
              <p className="mt-2 text-sm text-slate-600">This checkpoint reinforces affiliate program production discipline: recruitment quality, mission clarity, proof validation, payout trust, territory focus and brand safety.</p>
            </div>
            <Pill tone="slate">Control 145</Pill>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase text-slate-9500">Decision input</p>
              <p className="mt-2 font-black">Segment, status, lead quality, risk and payout context.</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase text-slate-9500">Operator action</p>
              <p className="mt-2 font-black">Assign, approve, coach, pause, escalate or scale.</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase text-slate-9500">Expected output</p>
              <p className="mt-2 font-black">Better conversion, safer content and stronger ambassador trust.</p>
            </div>
          </div>
        </Card>


        <Card>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-wide text-slate-9500">Operational control layer 146</p>
              <h3 className="mt-1 text-xl font-black">Ambassador execution checkpoint 146</h3>
              <p className="mt-2 text-sm text-slate-600">This checkpoint reinforces affiliate program production discipline: recruitment quality, mission clarity, proof validation, payout trust, territory focus and brand safety.</p>
            </div>
            <Pill tone="slate">Control 146</Pill>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase text-slate-9500">Decision input</p>
              <p className="mt-2 font-black">Segment, status, lead quality, risk and payout context.</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase text-slate-9500">Operator action</p>
              <p className="mt-2 font-black">Assign, approve, coach, pause, escalate or scale.</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase text-slate-9500">Expected output</p>
              <p className="mt-2 font-black">Better conversion, safer content and stronger ambassador trust.</p>
            </div>
          </div>
        </Card>


        <Card>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-wide text-slate-9500">Operational control layer 147</p>
              <h3 className="mt-1 text-xl font-black">Ambassador execution checkpoint 147</h3>
              <p className="mt-2 text-sm text-slate-600">This checkpoint reinforces affiliate program production discipline: recruitment quality, mission clarity, proof validation, payout trust, territory focus and brand safety.</p>
            </div>
            <Pill tone="slate">Control 147</Pill>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase text-slate-9500">Decision input</p>
              <p className="mt-2 font-black">Segment, status, lead quality, risk and payout context.</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase text-slate-9500">Operator action</p>
              <p className="mt-2 font-black">Assign, approve, coach, pause, escalate or scale.</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase text-slate-9500">Expected output</p>
              <p className="mt-2 font-black">Better conversion, safer content and stronger ambassador trust.</p>
            </div>
          </div>
        </Card>


        <Card>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-wide text-slate-9500">Operational control layer 148</p>
              <h3 className="mt-1 text-xl font-black">Ambassador execution checkpoint 148</h3>
              <p className="mt-2 text-sm text-slate-600">This checkpoint reinforces affiliate program production discipline: recruitment quality, mission clarity, proof validation, payout trust, territory focus and brand safety.</p>
            </div>
            <Pill tone="slate">Control 148</Pill>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase text-slate-9500">Decision input</p>
              <p className="mt-2 font-black">Segment, status, lead quality, risk and payout context.</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase text-slate-9500">Operator action</p>
              <p className="mt-2 font-black">Assign, approve, coach, pause, escalate or scale.</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase text-slate-9500">Expected output</p>
              <p className="mt-2 font-black">Better conversion, safer content and stronger ambassador trust.</p>
            </div>
          </div>
        </Card>


        <Card>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-wide text-slate-9500">Operational control layer 149</p>
              <h3 className="mt-1 text-xl font-black">Ambassador execution checkpoint 149</h3>
              <p className="mt-2 text-sm text-slate-600">This checkpoint reinforces affiliate program production discipline: recruitment quality, mission clarity, proof validation, payout trust, territory focus and brand safety.</p>
            </div>
            <Pill tone="slate">Control 149</Pill>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase text-slate-9500">Decision input</p>
              <p className="mt-2 font-black">Segment, status, lead quality, risk and payout context.</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase text-slate-9500">Operator action</p>
              <p className="mt-2 font-black">Assign, approve, coach, pause, escalate or scale.</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase text-slate-9500">Expected output</p>
              <p className="mt-2 font-black">Better conversion, safer content and stronger ambassador trust.</p>
            </div>
          </div>
        </Card>


        <Card>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-wide text-slate-9500">Operational control layer 150</p>
              <h3 className="mt-1 text-xl font-black">Ambassador execution checkpoint 150</h3>
              <p className="mt-2 text-sm text-slate-600">This checkpoint reinforces affiliate program production discipline: recruitment quality, mission clarity, proof validation, payout trust, territory focus and brand safety.</p>
            </div>
            <Pill tone="slate">Control 150</Pill>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase text-slate-9500">Decision input</p>
              <p className="mt-2 font-black">Segment, status, lead quality, risk and payout context.</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase text-slate-9500">Operator action</p>
              <p className="mt-2 font-black">Assign, approve, coach, pause, escalate or scale.</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase text-slate-9500">Expected output</p>
              <p className="mt-2 font-black">Better conversion, safer content and stronger ambassador trust.</p>
            </div>
          </div>
        </Card>


        <Card>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-wide text-slate-9500">Operational control layer 151</p>
              <h3 className="mt-1 text-xl font-black">Ambassador execution checkpoint 151</h3>
              <p className="mt-2 text-sm text-slate-600">This checkpoint reinforces affiliate program production discipline: recruitment quality, mission clarity, proof validation, payout trust, territory focus and brand safety.</p>
            </div>
            <Pill tone="slate">Control 151</Pill>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase text-slate-9500">Decision input</p>
              <p className="mt-2 font-black">Segment, status, lead quality, risk and payout context.</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase text-slate-9500">Operator action</p>
              <p className="mt-2 font-black">Assign, approve, coach, pause, escalate or scale.</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase text-slate-9500">Expected output</p>
              <p className="mt-2 font-black">Better conversion, safer content and stronger ambassador trust.</p>
            </div>
          </div>
        </Card>


        <Card>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-wide text-slate-9500">Operational control layer 152</p>
              <h3 className="mt-1 text-xl font-black">Ambassador execution checkpoint 152</h3>
              <p className="mt-2 text-sm text-slate-600">This checkpoint reinforces affiliate program production discipline: recruitment quality, mission clarity, proof validation, payout trust, territory focus and brand safety.</p>
            </div>
            <Pill tone="slate">Control 152</Pill>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase text-slate-9500">Decision input</p>
              <p className="mt-2 font-black">Segment, status, lead quality, risk and payout context.</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase text-slate-9500">Operator action</p>
              <p className="mt-2 font-black">Assign, approve, coach, pause, escalate or scale.</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase text-slate-9500">Expected output</p>
              <p className="mt-2 font-black">Better conversion, safer content and stronger ambassador trust.</p>
            </div>
          </div>
        </Card>


        <Card>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-wide text-slate-9500">Operational control layer 153</p>
              <h3 className="mt-1 text-xl font-black">Ambassador execution checkpoint 153</h3>
              <p className="mt-2 text-sm text-slate-600">This checkpoint reinforces affiliate program production discipline: recruitment quality, mission clarity, proof validation, payout trust, territory focus and brand safety.</p>
            </div>
            <Pill tone="slate">Control 153</Pill>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase text-slate-9500">Decision input</p>
              <p className="mt-2 font-black">Segment, status, lead quality, risk and payout context.</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase text-slate-9500">Operator action</p>
              <p className="mt-2 font-black">Assign, approve, coach, pause, escalate or scale.</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase text-slate-9500">Expected output</p>
              <p className="mt-2 font-black">Better conversion, safer content and stronger ambassador trust.</p>
            </div>
          </div>
        </Card>


        <Card>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-wide text-slate-9500">Operational control layer 154</p>
              <h3 className="mt-1 text-xl font-black">Ambassador execution checkpoint 154</h3>
              <p className="mt-2 text-sm text-slate-600">This checkpoint reinforces affiliate program production discipline: recruitment quality, mission clarity, proof validation, payout trust, territory focus and brand safety.</p>
            </div>
            <Pill tone="slate">Control 154</Pill>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase text-slate-9500">Decision input</p>
              <p className="mt-2 font-black">Segment, status, lead quality, risk and payout context.</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase text-slate-9500">Operator action</p>
              <p className="mt-2 font-black">Assign, approve, coach, pause, escalate or scale.</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase text-slate-9500">Expected output</p>
              <p className="mt-2 font-black">Better conversion, safer content and stronger ambassador trust.</p>
            </div>
          </div>
        </Card>


        <Card>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-wide text-slate-9500">Operational control layer 155</p>
              <h3 className="mt-1 text-xl font-black">Ambassador execution checkpoint 155</h3>
              <p className="mt-2 text-sm text-slate-600">This checkpoint reinforces affiliate program production discipline: recruitment quality, mission clarity, proof validation, payout trust, territory focus and brand safety.</p>
            </div>
            <Pill tone="slate">Control 155</Pill>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase text-slate-9500">Decision input</p>
              <p className="mt-2 font-black">Segment, status, lead quality, risk and payout context.</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase text-slate-9500">Operator action</p>
              <p className="mt-2 font-black">Assign, approve, coach, pause, escalate or scale.</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase text-slate-9500">Expected output</p>
              <p className="mt-2 font-black">Better conversion, safer content and stronger ambassador trust.</p>
            </div>
          </div>
        </Card>


        <Card>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-wide text-slate-9500">Operational control layer 156</p>
              <h3 className="mt-1 text-xl font-black">Ambassador execution checkpoint 156</h3>
              <p className="mt-2 text-sm text-slate-600">This checkpoint reinforces affiliate program production discipline: recruitment quality, mission clarity, proof validation, payout trust, territory focus and brand safety.</p>
            </div>
            <Pill tone="slate">Control 156</Pill>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase text-slate-9500">Decision input</p>
              <p className="mt-2 font-black">Segment, status, lead quality, risk and payout context.</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase text-slate-9500">Operator action</p>
              <p className="mt-2 font-black">Assign, approve, coach, pause, escalate or scale.</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase text-slate-9500">Expected output</p>
              <p className="mt-2 font-black">Better conversion, safer content and stronger ambassador trust.</p>
            </div>
          </div>
        </Card>


        <Card>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-wide text-slate-9500">Operational control layer 157</p>
              <h3 className="mt-1 text-xl font-black">Ambassador execution checkpoint 157</h3>
              <p className="mt-2 text-sm text-slate-600">This checkpoint reinforces affiliate program production discipline: recruitment quality, mission clarity, proof validation, payout trust, territory focus and brand safety.</p>
            </div>
            <Pill tone="slate">Control 157</Pill>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase text-slate-9500">Decision input</p>
              <p className="mt-2 font-black">Segment, status, lead quality, risk and payout context.</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase text-slate-9500">Operator action</p>
              <p className="mt-2 font-black">Assign, approve, coach, pause, escalate or scale.</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase text-slate-9500">Expected output</p>
              <p className="mt-2 font-black">Better conversion, safer content and stronger ambassador trust.</p>
            </div>
          </div>
        </Card>


        <Card>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-wide text-slate-9500">Operational control layer 158</p>
              <h3 className="mt-1 text-xl font-black">Ambassador execution checkpoint 158</h3>
              <p className="mt-2 text-sm text-slate-600">This checkpoint reinforces affiliate program production discipline: recruitment quality, mission clarity, proof validation, payout trust, territory focus and brand safety.</p>
            </div>
            <Pill tone="slate">Control 158</Pill>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase text-slate-9500">Decision input</p>
              <p className="mt-2 font-black">Segment, status, lead quality, risk and payout context.</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase text-slate-9500">Operator action</p>
              <p className="mt-2 font-black">Assign, approve, coach, pause, escalate or scale.</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase text-slate-9500">Expected output</p>
              <p className="mt-2 font-black">Better conversion, safer content and stronger ambassador trust.</p>
            </div>
          </div>
        </Card>


        <Card>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-wide text-slate-9500">Operational control layer 159</p>
              <h3 className="mt-1 text-xl font-black">Ambassador execution checkpoint 159</h3>
              <p className="mt-2 text-sm text-slate-600">This checkpoint reinforces affiliate program production discipline: recruitment quality, mission clarity, proof validation, payout trust, territory focus and brand safety.</p>
            </div>
            <Pill tone="slate">Control 159</Pill>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase text-slate-9500">Decision input</p>
              <p className="mt-2 font-black">Segment, status, lead quality, risk and payout context.</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase text-slate-9500">Operator action</p>
              <p className="mt-2 font-black">Assign, approve, coach, pause, escalate or scale.</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase text-slate-9500">Expected output</p>
              <p className="mt-2 font-black">Better conversion, safer content and stronger ambassador trust.</p>
            </div>
          </div>
        </Card>


        <Card>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-wide text-slate-9500">Operational control layer 160</p>
              <h3 className="mt-1 text-xl font-black">Ambassador execution checkpoint 160</h3>
              <p className="mt-2 text-sm text-slate-600">This checkpoint reinforces affiliate program production discipline: recruitment quality, mission clarity, proof validation, payout trust, territory focus and brand safety.</p>
            </div>
            <Pill tone="slate">Control 160</Pill>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase text-slate-9500">Decision input</p>
              <p className="mt-2 font-black">Segment, status, lead quality, risk and payout context.</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase text-slate-9500">Operator action</p>
              <p className="mt-2 font-black">Assign, approve, coach, pause, escalate or scale.</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase text-slate-9500">Expected output</p>
              <p className="mt-2 font-black">Better conversion, safer content and stronger ambassador trust.</p>
            </div>
          </div>
        </Card>


        <Card>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-wide text-slate-9500">Operational control layer 161</p>
              <h3 className="mt-1 text-xl font-black">Ambassador execution checkpoint 161</h3>
              <p className="mt-2 text-sm text-slate-600">This checkpoint reinforces affiliate program production discipline: recruitment quality, mission clarity, proof validation, payout trust, territory focus and brand safety.</p>
            </div>
            <Pill tone="slate">Control 161</Pill>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase text-slate-9500">Decision input</p>
              <p className="mt-2 font-black">Segment, status, lead quality, risk and payout context.</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase text-slate-9500">Operator action</p>
              <p className="mt-2 font-black">Assign, approve, coach, pause, escalate or scale.</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase text-slate-9500">Expected output</p>
              <p className="mt-2 font-black">Better conversion, safer content and stronger ambassador trust.</p>
            </div>
          </div>
        </Card>


        <Card>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-wide text-slate-9500">Operational control layer 162</p>
              <h3 className="mt-1 text-xl font-black">Ambassador execution checkpoint 162</h3>
              <p className="mt-2 text-sm text-slate-600">This checkpoint reinforces affiliate program production discipline: recruitment quality, mission clarity, proof validation, payout trust, territory focus and brand safety.</p>
            </div>
            <Pill tone="slate">Control 162</Pill>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase text-slate-9500">Decision input</p>
              <p className="mt-2 font-black">Segment, status, lead quality, risk and payout context.</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase text-slate-9500">Operator action</p>
              <p className="mt-2 font-black">Assign, approve, coach, pause, escalate or scale.</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase text-slate-9500">Expected output</p>
              <p className="mt-2 font-black">Better conversion, safer content and stronger ambassador trust.</p>
            </div>
          </div>
        </Card>


        <Card>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-wide text-slate-9500">Operational control layer 163</p>
              <h3 className="mt-1 text-xl font-black">Ambassador execution checkpoint 163</h3>
              <p className="mt-2 text-sm text-slate-600">This checkpoint reinforces affiliate program production discipline: recruitment quality, mission clarity, proof validation, payout trust, territory focus and brand safety.</p>
            </div>
            <Pill tone="slate">Control 163</Pill>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase text-slate-9500">Decision input</p>
              <p className="mt-2 font-black">Segment, status, lead quality, risk and payout context.</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase text-slate-9500">Operator action</p>
              <p className="mt-2 font-black">Assign, approve, coach, pause, escalate or scale.</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase text-slate-9500">Expected output</p>
              <p className="mt-2 font-black">Better conversion, safer content and stronger ambassador trust.</p>
            </div>
          </div>
        </Card>


        <Card>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-wide text-slate-9500">Operational control layer 164</p>
              <h3 className="mt-1 text-xl font-black">Ambassador execution checkpoint 164</h3>
              <p className="mt-2 text-sm text-slate-600">This checkpoint reinforces affiliate program production discipline: recruitment quality, mission clarity, proof validation, payout trust, territory focus and brand safety.</p>
            </div>
            <Pill tone="slate">Control 164</Pill>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase text-slate-9500">Decision input</p>
              <p className="mt-2 font-black">Segment, status, lead quality, risk and payout context.</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase text-slate-9500">Operator action</p>
              <p className="mt-2 font-black">Assign, approve, coach, pause, escalate or scale.</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase text-slate-9500">Expected output</p>
              <p className="mt-2 font-black">Better conversion, safer content and stronger ambassador trust.</p>
            </div>
          </div>
        </Card>


        <Card>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-wide text-slate-9500">Operational control layer 165</p>
              <h3 className="mt-1 text-xl font-black">Ambassador execution checkpoint 165</h3>
              <p className="mt-2 text-sm text-slate-600">This checkpoint reinforces affiliate program production discipline: recruitment quality, mission clarity, proof validation, payout trust, territory focus and brand safety.</p>
            </div>
            <Pill tone="slate">Control 165</Pill>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase text-slate-9500">Decision input</p>
              <p className="mt-2 font-black">Segment, status, lead quality, risk and payout context.</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase text-slate-9500">Operator action</p>
              <p className="mt-2 font-black">Assign, approve, coach, pause, escalate or scale.</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase text-slate-9500">Expected output</p>
              <p className="mt-2 font-black">Better conversion, safer content and stronger ambassador trust.</p>
            </div>
          </div>
        </Card>


        <Card>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-wide text-slate-9500">Operational control layer 166</p>
              <h3 className="mt-1 text-xl font-black">Ambassador execution checkpoint 166</h3>
              <p className="mt-2 text-sm text-slate-600">This checkpoint reinforces affiliate program production discipline: recruitment quality, mission clarity, proof validation, payout trust, territory focus and brand safety.</p>
            </div>
            <Pill tone="slate">Control 166</Pill>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase text-slate-9500">Decision input</p>
              <p className="mt-2 font-black">Segment, status, lead quality, risk and payout context.</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase text-slate-9500">Operator action</p>
              <p className="mt-2 font-black">Assign, approve, coach, pause, escalate or scale.</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase text-slate-9500">Expected output</p>
              <p className="mt-2 font-black">Better conversion, safer content and stronger ambassador trust.</p>
            </div>
          </div>
        </Card>


        <Card>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-wide text-slate-9500">Operational control layer 167</p>
              <h3 className="mt-1 text-xl font-black">Ambassador execution checkpoint 167</h3>
              <p className="mt-2 text-sm text-slate-600">This checkpoint reinforces affiliate program production discipline: recruitment quality, mission clarity, proof validation, payout trust, territory focus and brand safety.</p>
            </div>
            <Pill tone="slate">Control 167</Pill>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase text-slate-9500">Decision input</p>
              <p className="mt-2 font-black">Segment, status, lead quality, risk and payout context.</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase text-slate-9500">Operator action</p>
              <p className="mt-2 font-black">Assign, approve, coach, pause, escalate or scale.</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase text-slate-9500">Expected output</p>
              <p className="mt-2 font-black">Better conversion, safer content and stronger ambassador trust.</p>
            </div>
          </div>
        </Card>


        <Card>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-wide text-slate-9500">Operational control layer 168</p>
              <h3 className="mt-1 text-xl font-black">Ambassador execution checkpoint 168</h3>
              <p className="mt-2 text-sm text-slate-600">This checkpoint reinforces affiliate program production discipline: recruitment quality, mission clarity, proof validation, payout trust, territory focus and brand safety.</p>
            </div>
            <Pill tone="slate">Control 168</Pill>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase text-slate-9500">Decision input</p>
              <p className="mt-2 font-black">Segment, status, lead quality, risk and payout context.</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase text-slate-9500">Operator action</p>
              <p className="mt-2 font-black">Assign, approve, coach, pause, escalate or scale.</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase text-slate-9500">Expected output</p>
              <p className="mt-2 font-black">Better conversion, safer content and stronger ambassador trust.</p>
            </div>
          </div>
        </Card>


        <Card>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-wide text-slate-9500">Operational control layer 169</p>
              <h3 className="mt-1 text-xl font-black">Ambassador execution checkpoint 169</h3>
              <p className="mt-2 text-sm text-slate-600">This checkpoint reinforces affiliate program production discipline: recruitment quality, mission clarity, proof validation, payout trust, territory focus and brand safety.</p>
            </div>
            <Pill tone="slate">Control 169</Pill>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase text-slate-9500">Decision input</p>
              <p className="mt-2 font-black">Segment, status, lead quality, risk and payout context.</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase text-slate-9500">Operator action</p>
              <p className="mt-2 font-black">Assign, approve, coach, pause, escalate or scale.</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase text-slate-9500">Expected output</p>
              <p className="mt-2 font-black">Better conversion, safer content and stronger ambassador trust.</p>
            </div>
          </div>
        </Card>


        <Card>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-wide text-slate-9500">Operational control layer 170</p>
              <h3 className="mt-1 text-xl font-black">Ambassador execution checkpoint 170</h3>
              <p className="mt-2 text-sm text-slate-600">This checkpoint reinforces affiliate program production discipline: recruitment quality, mission clarity, proof validation, payout trust, territory focus and brand safety.</p>
            </div>
            <Pill tone="slate">Control 170</Pill>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase text-slate-9500">Decision input</p>
              <p className="mt-2 font-black">Segment, status, lead quality, risk and payout context.</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase text-slate-9500">Operator action</p>
              <p className="mt-2 font-black">Assign, approve, coach, pause, escalate or scale.</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase text-slate-9500">Expected output</p>
              <p className="mt-2 font-black">Better conversion, safer content and stronger ambassador trust.</p>
            </div>
          </div>
        </Card>


        <Card>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-wide text-slate-9500">Operational control layer 171</p>
              <h3 className="mt-1 text-xl font-black">Ambassador execution checkpoint 171</h3>
              <p className="mt-2 text-sm text-slate-600">This checkpoint reinforces affiliate program production discipline: recruitment quality, mission clarity, proof validation, payout trust, territory focus and brand safety.</p>
            </div>
            <Pill tone="slate">Control 171</Pill>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase text-slate-9500">Decision input</p>
              <p className="mt-2 font-black">Segment, status, lead quality, risk and payout context.</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase text-slate-9500">Operator action</p>
              <p className="mt-2 font-black">Assign, approve, coach, pause, escalate or scale.</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase text-slate-9500">Expected output</p>
              <p className="mt-2 font-black">Better conversion, safer content and stronger ambassador trust.</p>
            </div>
          </div>
        </Card>


        <Card>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-wide text-slate-9500">Operational control layer 172</p>
              <h3 className="mt-1 text-xl font-black">Ambassador execution checkpoint 172</h3>
              <p className="mt-2 text-sm text-slate-600">This checkpoint reinforces affiliate program production discipline: recruitment quality, mission clarity, proof validation, payout trust, territory focus and brand safety.</p>
            </div>
            <Pill tone="slate">Control 172</Pill>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase text-slate-9500">Decision input</p>
              <p className="mt-2 font-black">Segment, status, lead quality, risk and payout context.</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase text-slate-9500">Operator action</p>
              <p className="mt-2 font-black">Assign, approve, coach, pause, escalate or scale.</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase text-slate-9500">Expected output</p>
              <p className="mt-2 font-black">Better conversion, safer content and stronger ambassador trust.</p>
            </div>
          </div>
        </Card>


        <Card>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-wide text-slate-9500">Operational control layer 173</p>
              <h3 className="mt-1 text-xl font-black">Ambassador execution checkpoint 173</h3>
              <p className="mt-2 text-sm text-slate-600">This checkpoint reinforces affiliate program production discipline: recruitment quality, mission clarity, proof validation, payout trust, territory focus and brand safety.</p>
            </div>
            <Pill tone="slate">Control 173</Pill>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase text-slate-9500">Decision input</p>
              <p className="mt-2 font-black">Segment, status, lead quality, risk and payout context.</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase text-slate-9500">Operator action</p>
              <p className="mt-2 font-black">Assign, approve, coach, pause, escalate or scale.</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase text-slate-9500">Expected output</p>
              <p className="mt-2 font-black">Better conversion, safer content and stronger ambassador trust.</p>
            </div>
          </div>
        </Card>


        <Card>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-wide text-slate-9500">Operational control layer 174</p>
              <h3 className="mt-1 text-xl font-black">Ambassador execution checkpoint 174</h3>
              <p className="mt-2 text-sm text-slate-600">This checkpoint reinforces affiliate program production discipline: recruitment quality, mission clarity, proof validation, payout trust, territory focus and brand safety.</p>
            </div>
            <Pill tone="slate">Control 174</Pill>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase text-slate-9500">Decision input</p>
              <p className="mt-2 font-black">Segment, status, lead quality, risk and payout context.</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase text-slate-9500">Operator action</p>
              <p className="mt-2 font-black">Assign, approve, coach, pause, escalate or scale.</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase text-slate-9500">Expected output</p>
              <p className="mt-2 font-black">Better conversion, safer content and stronger ambassador trust.</p>
            </div>
          </div>
        </Card>


        <Card>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-wide text-slate-9500">Operational control layer 175</p>
              <h3 className="mt-1 text-xl font-black">Ambassador execution checkpoint 175</h3>
              <p className="mt-2 text-sm text-slate-600">This checkpoint reinforces affiliate program production discipline: recruitment quality, mission clarity, proof validation, payout trust, territory focus and brand safety.</p>
            </div>
            <Pill tone="slate">Control 175</Pill>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase text-slate-9500">Decision input</p>
              <p className="mt-2 font-black">Segment, status, lead quality, risk and payout context.</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase text-slate-9500">Operator action</p>
              <p className="mt-2 font-black">Assign, approve, coach, pause, escalate or scale.</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase text-slate-9500">Expected output</p>
              <p className="mt-2 font-black">Better conversion, safer content and stronger ambassador trust.</p>
            </div>
          </div>
        </Card>


        <Card>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-wide text-slate-9500">Operational control layer 176</p>
              <h3 className="mt-1 text-xl font-black">Ambassador execution checkpoint 176</h3>
              <p className="mt-2 text-sm text-slate-600">This checkpoint reinforces affiliate program production discipline: recruitment quality, mission clarity, proof validation, payout trust, territory focus and brand safety.</p>
            </div>
            <Pill tone="slate">Control 176</Pill>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase text-slate-9500">Decision input</p>
              <p className="mt-2 font-black">Segment, status, lead quality, risk and payout context.</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase text-slate-9500">Operator action</p>
              <p className="mt-2 font-black">Assign, approve, coach, pause, escalate or scale.</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase text-slate-9500">Expected output</p>
              <p className="mt-2 font-black">Better conversion, safer content and stronger ambassador trust.</p>
            </div>
          </div>
        </Card>


        <Card>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-wide text-slate-9500">Operational control layer 177</p>
              <h3 className="mt-1 text-xl font-black">Ambassador execution checkpoint 177</h3>
              <p className="mt-2 text-sm text-slate-600">This checkpoint reinforces affiliate program production discipline: recruitment quality, mission clarity, proof validation, payout trust, territory focus and brand safety.</p>
            </div>
            <Pill tone="slate">Control 177</Pill>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase text-slate-9500">Decision input</p>
              <p className="mt-2 font-black">Segment, status, lead quality, risk and payout context.</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase text-slate-9500">Operator action</p>
              <p className="mt-2 font-black">Assign, approve, coach, pause, escalate or scale.</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase text-slate-9500">Expected output</p>
              <p className="mt-2 font-black">Better conversion, safer content and stronger ambassador trust.</p>
            </div>
          </div>
        </Card>


        <Card>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-wide text-slate-9500">Operational control layer 178</p>
              <h3 className="mt-1 text-xl font-black">Ambassador execution checkpoint 178</h3>
              <p className="mt-2 text-sm text-slate-600">This checkpoint reinforces affiliate program production discipline: recruitment quality, mission clarity, proof validation, payout trust, territory focus and brand safety.</p>
            </div>
            <Pill tone="slate">Control 178</Pill>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase text-slate-9500">Decision input</p>
              <p className="mt-2 font-black">Segment, status, lead quality, risk and payout context.</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase text-slate-9500">Operator action</p>
              <p className="mt-2 font-black">Assign, approve, coach, pause, escalate or scale.</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase text-slate-9500">Expected output</p>
              <p className="mt-2 font-black">Better conversion, safer content and stronger ambassador trust.</p>
            </div>
          </div>
        </Card>


        <Card>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-wide text-slate-9500">Operational control layer 179</p>
              <h3 className="mt-1 text-xl font-black">Ambassador execution checkpoint 179</h3>
              <p className="mt-2 text-sm text-slate-600">This checkpoint reinforces affiliate program production discipline: recruitment quality, mission clarity, proof validation, payout trust, territory focus and brand safety.</p>
            </div>
            <Pill tone="slate">Control 179</Pill>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase text-slate-9500">Decision input</p>
              <p className="mt-2 font-black">Segment, status, lead quality, risk and payout context.</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase text-slate-9500">Operator action</p>
              <p className="mt-2 font-black">Assign, approve, coach, pause, escalate or scale.</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase text-slate-9500">Expected output</p>
              <p className="mt-2 font-black">Better conversion, safer content and stronger ambassador trust.</p>
            </div>
          </div>
        </Card>


        <Card>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-wide text-slate-9500">Operational control layer 180</p>
              <h3 className="mt-1 text-xl font-black">Ambassador execution checkpoint 180</h3>
              <p className="mt-2 text-sm text-slate-600">This checkpoint reinforces affiliate program production discipline: recruitment quality, mission clarity, proof validation, payout trust, territory focus and brand safety.</p>
            </div>
            <Pill tone="slate">Control 180</Pill>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase text-slate-9500">Decision input</p>
              <p className="mt-2 font-black">Segment, status, lead quality, risk and payout context.</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase text-slate-9500">Operator action</p>
              <p className="mt-2 font-black">Assign, approve, coach, pause, escalate or scale.</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase text-slate-9500">Expected output</p>
              <p className="mt-2 font-black">Better conversion, safer content and stronger ambassador trust.</p>
            </div>
          </div>
        </Card>

      </div>
    </main>
  )
}
