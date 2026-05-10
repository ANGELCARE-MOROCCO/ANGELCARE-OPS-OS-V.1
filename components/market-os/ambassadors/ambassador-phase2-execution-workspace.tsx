"use client"

import * as React from "react"
import Link from "next/link"
import {
  Application,
  ApplicationStage,
  Program,
  Mission,
  Proof,
  Reward,
  Payout,
  Territory,
  Lead,
  ComplianceIssue,
  TrainingItem,
  Communication,
  Priority,
  Button,
  Panel,
  DarkPanel,
  Field,
  Input,
  TextArea,
  Select,
  Shell,
  Badge,
  Metric,
  mad,
  pct,
  todayISO,
  uid,
  useAmbassadorStore,
  ambassadorName,
  programName,
  territoryName,
  applicationNext,
  missionNext,
  statusTone,
  riskTone,
} from "./ambassador-backoffice-system"

type Mode = "recruitment" | "onboarding" | "programs" | "missions" | "proofs" | "rewards" | "payouts" | "territories" | "leads" | "compliance" | "analytics" | "training" | "communications" | "settings" | "execution-center"

type Tone = "slate" | "emerald" | "amber" | "rose" | "blue"

type ModeConfig = {
  title: string
  description: string
  command: string
  primaryHref: string
  primaryLabel: string
}

const configs: Record<Mode, ModeConfig> = {
  "execution-center": { title: "Ambassador Execution Center", description: "One command layer to control priorities, unblock operational bottlenecks, and keep the ambassador network converting every day.", command: "Daily operational command", primaryHref: "/market-os/ambassadors/missions", primaryLabel: "Open missions" },
  recruitment: { title: "Recruitment & Selection", description: "Manage applications, qualify candidates, advance stages, reject weak profiles, and approve high-potential ambassadors into onboarding.", command: "Build the network", primaryHref: "/market-os/ambassadors/create", primaryLabel: "+ Ambassador profile" },
  onboarding: { title: "Formation & Onboarding", description: "Convert approved candidates into trained, compliant, active ambassadors with readiness tasks, training, first missions and activation gates.", command: "Activate safely", primaryHref: "/market-os/ambassadors/training", primaryLabel: "Training center" },
  programs: { title: "Ambassador Programs", description: "Create and manage program logic: eligibility, commission, bonus, training requirements, rules and activation status.", command: "Structure growth", primaryHref: "/market-os/ambassadors/create", primaryLabel: "+ Ambassador" },
  missions: { title: "Mission Command", description: "Create, assign and move missions through execution from draft to proof submission, validation, rewards and payout readiness.", command: "Execute campaigns", primaryHref: "/market-os/ambassadors/proofs", primaryLabel: "Validate proofs" },
  proofs: { title: "Proof Validation", description: "Review submitted proof, approve quality execution, reject unsafe activity and generate reward records only when proof is approved.", command: "Protect quality", primaryHref: "/market-os/ambassadors/rewards", primaryLabel: "Rewards" },
  rewards: { title: "Challenges & Rewards", description: "Control earned rewards, bonuses and incentives connected to proof approval and ambassador performance.", command: "Motivate impact", primaryHref: "/market-os/ambassadors/payouts", primaryLabel: "Payout control" },
  payouts: { title: "Payout Control", description: "Approve, block and mark payouts paid with clear operational notes for finance and management traceability.", command: "Finance governance", primaryHref: "/market-os/ambassadors/rewards", primaryLabel: "Rewards" },
  territories: { title: "Territory Coverage", description: "Manage city coverage, capacity, regional managers and strategic gaps across Moroccan priority zones.", command: "Expand coverage", primaryHref: "/market-os/ambassadors/leads", primaryLabel: "Leads" },
  leads: { title: "Lead Attribution", description: "Capture ambassador-generated leads, qualify them, convert them and measure revenue impact by ambassador and territory.", command: "Turn influence into revenue", primaryHref: "/market-os/ambassadors/analytics", primaryLabel: "Analytics" },
  compliance: { title: "Compliance Control", description: "Control brand safety, coaching, escalations and issue resolution before risks damage the AngelCare brand.", command: "Protect the brand", primaryHref: "/market-os/ambassadors/training", primaryLabel: "Training" },
  analytics: { title: "Performance Analytics", description: "Read the network by revenue, readiness, conversion, compliance, territory strength and execution velocity.", command: "Know what to scale", primaryHref: "/market-os/ambassadors/recruitment", primaryLabel: "Recruitment" },
  training: { title: "Training & Certification", description: "Assign modules, track scores, complete certification and raise readiness before ambassadors execute sensitive missions.", command: "Build capability", primaryHref: "/market-os/ambassadors/onboarding", primaryLabel: "Onboarding" },
  communications: { title: "Communication Hub", description: "Prepare WhatsApp, email, SMS and announcement messages for ambassadors, groups and territories.", command: "Animate the network", primaryHref: "/market-os/ambassadors/missions", primaryLabel: "Missions" },
  settings: { title: "Operating Rules", description: "Configure default manager, commission, payout cycle and proof policy without touching Market-OS main pages.", command: "Govern the system", primaryHref: "/market-os/ambassadors", primaryLabel: "Cockpit" },
}

const nav: Array<{ mode: Mode; label: string; href: string }> = [
  { mode: "execution-center", label: "Execution", href: "/market-os/ambassadors/execution-center" },
  { mode: "recruitment", label: "Recruitment", href: "/market-os/ambassadors/recruitment" },
  { mode: "onboarding", label: "Onboarding", href: "/market-os/ambassadors/onboarding" },
  { mode: "programs", label: "Programs", href: "/market-os/ambassadors/programs" },
  { mode: "missions", label: "Missions", href: "/market-os/ambassadors/missions" },
  { mode: "proofs", label: "Proofs", href: "/market-os/ambassadors/proofs" },
  { mode: "rewards", label: "Rewards", href: "/market-os/ambassadors/rewards" },
  { mode: "payouts", label: "Payouts", href: "/market-os/ambassadors/payouts" },
  { mode: "territories", label: "Territories", href: "/market-os/ambassadors/territories" },
  { mode: "leads", label: "Leads", href: "/market-os/ambassadors/leads" },
  { mode: "training", label: "Training", href: "/market-os/ambassadors/training" },
  { mode: "communications", label: "Comms", href: "/market-os/ambassadors/communications" },
  { mode: "compliance", label: "Compliance", href: "/market-os/ambassadors/compliance" },
  { mode: "analytics", label: "Analytics", href: "/market-os/ambassadors/analytics" },
  { mode: "settings", label: "Settings", href: "/market-os/ambassadors/settings" },
]

function Header({ mode }: { mode: Mode }) {
  const c = configs[mode]
  return (
    <DarkPanel className="overflow-hidden p-6 lg:p-8">
      <div className="grid gap-6 lg:grid-cols-[1.2fr_.8fr] lg:items-end">
        <div>
          <div className="flex flex-wrap gap-2"><Badge tone="emerald">AngelCare</Badge><Badge tone="amber">Ambassador Unit</Badge><Badge tone="blue">Phase 2 Execution</Badge></div>
          <h1 className="mt-4 text-4xl font-black tracking-tight text-white md:text-5xl">{c.title}</h1>
          <p className="mt-4 max-w-5xl text-sm font-semibold leading-7 text-emerald-50/80 md:text-base">{c.description}</p>
        </div>
        <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
          <p className="text-xs font-black uppercase tracking-[0.24em] text-emerald-200">Command focus</p>
          <p className="mt-2 text-2xl font-black text-white">{c.command}</p>
          <div className="mt-4 flex flex-wrap gap-2"><Button href="/market-os/ambassadors" kind="soft">Cockpit</Button><Button href={c.primaryHref} kind="primary">{c.primaryLabel}</Button></div>
        </div>
      </div>
    </DarkPanel>
  )
}

function NavTabs({ mode }: { mode: Mode }) {
  return <Panel className="p-3"><div className="flex gap-2 overflow-x-auto">{nav.map(item => <Link key={item.mode} href={item.href} className={`whitespace-nowrap rounded-2xl px-4 py-3 text-xs font-black uppercase tracking-wide transition ${item.mode === mode ? "bg-slate-950 text-white" : "bg-slate-50 text-slate-700 hover:bg-slate-100"}`}>{item.label}</Link>)}</div></Panel>
}

function Section({ eyebrow, title, description, children }: { eyebrow: string; title: string; description: string; children: React.ReactNode }) {
  return <Panel className="p-5"><p className="text-xs font-black uppercase tracking-[0.24em] text-emerald-700">{eyebrow}</p><h2 className="mt-2 text-2xl font-black text-slate-950">{title}</h2><p className="mt-2 max-w-5xl text-sm font-semibold leading-6 text-slate-600">{description}</p><div className="mt-5">{children}</div></Panel>
}

function CommandMetrics() {
  const { store } = useAmbassadorStore()
  const revenue = store.ambassadors.reduce((sum, item) => sum + item.revenueMAD, 0) + store.leads.reduce((sum, item) => sum + item.revenueMAD, 0)
  const ready = Math.round(store.ambassadors.reduce((sum, item) => sum + item.readiness, 0) / Math.max(1, store.ambassadors.length))
  const pendingProofs = store.proofs.filter(item => item.status === "submitted").length
  const openRisks = store.compliance.filter(item => item.status !== "resolved").length
  return <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5"><Metric label="Ambassadors" value={String(store.ambassadors.length)} sub="Profiles in network" /><Metric label="Revenue impact" value={mad(revenue)} sub="Attributed and influenced" /><Metric label="Readiness" value={pct(ready)} sub="Average operational score" /><Metric label="Proof queue" value={String(pendingProofs)} sub="Waiting validation" /><Metric label="Risks" value={String(openRisks)} sub="Open compliance items" /></section>
}

function ExecutionCenter() {
  const { store, commit } = useAmbassadorStore()
  const stalledMissions = store.missions.filter(m => ["assigned", "in_progress", "proof_submitted"].includes(m.status))
  const weakAmbassadors = store.ambassadors.filter(a => a.readiness < 70 || a.complianceScore < 80)
  const topLeads = store.leads.filter(l => l.status === "qualified" || l.status === "new")
  return <div className="grid gap-5 xl:grid-cols-3"><Section eyebrow="today" title="Operational priority queue" description="Use this board as the daily manager layer: unblock missions, protect compliance and convert leads."><div className="grid gap-3">{stalledMissions.map(m => <div key={m.id} className="rounded-2xl border border-slate-200 p-4"><div className="flex flex-wrap items-start justify-between gap-3"><div><p className="font-black text-slate-950">{m.title}</p><p className="mt-1 text-sm font-bold text-slate-500">{ambassadorName(store, m.ambassadorId)} • {m.status} • due {m.dueDate}</p></div><Badge tone={statusTone(m.status) as Tone}>{m.status}</Badge></div><div className="mt-3 flex flex-wrap gap-2"><Button onClick={() => commit(d => { d.missions = d.missions.map(x => x.id === m.id ? { ...x, status: missionNext(x.status) } : x) }, "advance mission", `Advanced ${m.title}`)} kind="primary">Advance</Button><Button href="/market-os/ambassadors/proofs">Proofs</Button></div></div>)}</div></Section><Section eyebrow="risk" title="Coaching and compliance watch" description="Ambassadors under readiness or compliance threshold should be trained before sensitive missions."><div className="grid gap-3">{weakAmbassadors.map(a => <div key={a.id} className="rounded-2xl border border-amber-200 bg-amber-50 p-4"><p className="font-black text-amber-950">{a.name}</p><p className="mt-1 text-sm font-bold text-amber-800">Readiness {pct(a.readiness)} • Compliance {pct(a.complianceScore)}</p><div className="mt-3"><Button href="/market-os/ambassadors/training" kind="soft">Assign training</Button></div></div>)}</div></Section><Section eyebrow="revenue" title="Lead conversion focus" description="Qualified and new ambassador leads that deserve commercial follow-up."><div className="grid gap-3">{topLeads.map(l => <div key={l.id} className="rounded-2xl border p-4"><p className="font-black">{l.parentName}</p><p className="text-sm font-bold text-slate-500">{ambassadorName(store, l.ambassadorId)} • {l.service} • {mad(l.revenueMAD)}</p><Button onClick={() => commit(d => { d.leads = d.leads.map(x => x.id === l.id ? { ...x, status: "converted" } : x) }, "convert lead", `Converted ${l.parentName}`)} kind="success">Mark converted</Button></div>)}</div></Section></div>
}

function Recruitment() {
  const { store, commit } = useAmbassadorStore()
  const [form, setForm] = React.useState<Application>({ id: "", name: "", phone: "", city: "Rabat", source: "WhatsApp", stage: "lead", priority: "High", owner: store.settings.defaultManager, nextStep: "Qualification call", notes: "", createdAt: todayISO() })
  const set = <K extends keyof Application>(key: K, value: Application[K]) => setForm(prev => ({ ...prev, [key]: value }))
  const create = () => commit(d => { d.applications.unshift({ ...form, id: uid("app") }) }, "create application", `Created application ${form.name || "candidate"}`)
  const approve = (application: Application) => commit(d => { d.applications = d.applications.map(item => item.id === application.id ? { ...item, stage: "onboarding" } : item); d.ambassadors.unshift({ id: uid("amb"), name: application.name, phone: application.phone, email: "", city: application.city, territoryId: d.territories[0]?.id || "ter-rabat", status: "onboarding", tier: "Starter", programId: d.programs[0]?.id || "prog-community", source: application.source, manager: application.owner, joinedAt: todayISO(), readiness: 45, complianceScore: 75, leadScore: 50, revenueMAD: 0, notes: application.notes }) }, "approve candidate", `Approved ${application.name} into onboarding`)
  return <div className="grid gap-5 xl:grid-cols-[.8fr_1.2fr]"><Section eyebrow="candidate intake" title="Create application" description="Capture incoming ambassador candidates and qualify them before activation."><div className="grid gap-4 md:grid-cols-2"><Field label="Name"><Input value={form.name} onChange={e => set("name", e.target.value)} /></Field><Field label="Phone"><Input value={form.phone} onChange={e => set("phone", e.target.value)} /></Field><Field label="City"><Input value={form.city} onChange={e => set("city", e.target.value)} /></Field><Field label="Source"><Input value={form.source} onChange={e => set("source", e.target.value)} /></Field><Field label="Priority"><Select value={form.priority} onChange={e => set("priority", e.target.value as Priority)}><option>Low</option><option>Medium</option><option>High</option><option>Critical</option></Select></Field><Field label="Owner"><Input value={form.owner} onChange={e => set("owner", e.target.value)} /></Field><Field label="Next step"><Input value={form.nextStep} onChange={e => set("nextStep", e.target.value)} /></Field><div className="md:col-span-2"><Field label="Notes"><TextArea value={form.notes} onChange={e => set("notes", e.target.value)} /></Field></div></div><div className="mt-4"><Button kind="primary" onClick={create}>Create application</Button></div></Section><Section eyebrow="pipeline" title="Selection board" description="Advance candidates, reject poor fit, or approve them into onboarding."><div className="grid gap-3">{store.applications.map(app => <div key={app.id} className="rounded-2xl border p-4"><div className="flex flex-wrap items-start justify-between gap-3"><div><p className="font-black">{app.name}</p><p className="text-sm font-bold text-slate-500">{app.city} • {app.source} • next: {app.nextStep}</p></div><div className="flex gap-2"><Badge tone={statusTone(app.stage) as Tone}>{app.stage}</Badge><Badge tone={riskTone(app.priority) as Tone}>{app.priority}</Badge></div></div><div className="mt-3 flex flex-wrap gap-2"><Button onClick={() => commit(d => { d.applications = d.applications.map(item => item.id === app.id ? { ...item, stage: applicationNext(item.stage) } : item) }, "advance application", `Advanced ${app.name}`)} kind="primary">Advance stage</Button><Button onClick={() => approve(app)} kind="success">Approve to onboarding</Button><Button onClick={() => commit(d => { d.applications = d.applications.map(item => item.id === app.id ? { ...item, stage: "rejected" } : item) }, "reject application", `Rejected ${app.name}`)} kind="danger">Reject</Button></div></div>)}</div></Section></div>
}

function Onboarding() {
  const { store, commit } = useAmbassadorStore()
  const items = store.ambassadors.filter(a => a.status === "onboarding" || a.status === "applicant")
  return <Section eyebrow="activation gates" title="Onboarding command board" description="Every new ambassador must have training, territory, program, compliance briefing and first mission before activation."><div className="grid gap-4">{items.map(a => <div key={a.id} className="rounded-2xl border p-4"><div className="flex flex-wrap items-start justify-between gap-3"><div><p className="font-black text-slate-950">{a.name}</p><p className="text-sm font-bold text-slate-500">{a.city} • {programName(store, a.programId)} • readiness {pct(a.readiness)}</p></div><Badge tone={a.readiness >= 80 ? "emerald" : "amber"}>{a.status}</Badge></div><div className="mt-4 grid gap-2 md:grid-cols-3">{["Profile", "Program", "Territory", "Training", "First mission", "Compliance"].map(label => <div key={label} className="rounded-xl bg-emerald-50 p-3 text-xs font-black text-emerald-900">✓ {label}</div>)}</div><div className="mt-4 flex flex-wrap gap-2"><Button kind="primary" onClick={() => commit(d => { d.training.unshift({ id: uid("train"), ambassadorId: a.id, module: "AngelCare ambassador certification", status: "in_progress", score: 0, dueDate: todayISO(5) }) }, "assign onboarding training", `Assigned onboarding training to ${a.name}`)}>Assign training</Button><Button onClick={() => commit(d => { d.missions.unshift({ id: uid("mis"), title: "First ambassador activation mission", ambassadorId: a.id, programId: a.programId, territoryId: a.territoryId, channel: "WhatsApp", objective: "Generate first 3 qualified family leads", rewardMAD: 300, dueDate: todayISO(7), status: "assigned", proofRequired: "Screenshot + lead list", instructions: "Use approved AngelCare introduction script only.", priority: "High" }) }, "assign first mission", `Assigned first mission to ${a.name}`)}>Assign first mission</Button><Button kind="success" onClick={() => commit(d => { d.ambassadors = d.ambassadors.map(item => item.id === a.id ? { ...item, status: "active", readiness: Math.max(85, item.readiness), complianceScore: Math.max(85, item.complianceScore) } : item) }, "activate ambassador", `Activated ${a.name}`)}>Activate</Button></div></div>)}</div></Section>
}

function Programs() {
  const { store, commit } = useAmbassadorStore()
  const [form, setForm] = React.useState<Program>({ id: "", name: "", tier: "Growth", eligibility: "", commissionPercent: store.settings.defaultCommission, bonusMAD: 250, rules: "Use approved scripts and submit proof before payout.", trainingRequired: "Brand safety certification", active: true })
  const set = <K extends keyof Program>(key: K, value: Program[K]) => setForm(prev => ({ ...prev, [key]: value }))
  return <div className="grid gap-5 xl:grid-cols-[.8fr_1.2fr]"><Section eyebrow="program builder" title="Create program rules" description="Program logic controls eligibility, commission, bonus, training and brand safety rules."><div className="grid gap-4 md:grid-cols-2"><Field label="Name"><Input value={form.name} onChange={e => set("name", e.target.value)} /></Field><Field label="Tier"><Input value={form.tier} onChange={e => set("tier", e.target.value)} /></Field><Field label="Commission"><Input type="number" value={form.commissionPercent} onChange={e => set("commissionPercent", Number(e.target.value))} /></Field><Field label="Bonus MAD"><Input type="number" value={form.bonusMAD} onChange={e => set("bonusMAD", Number(e.target.value))} /></Field><Field label="Eligibility"><TextArea value={form.eligibility} onChange={e => set("eligibility", e.target.value)} /></Field><Field label="Rules"><TextArea value={form.rules} onChange={e => set("rules", e.target.value)} /></Field><div className="md:col-span-2"><Field label="Training required"><Input value={form.trainingRequired} onChange={e => set("trainingRequired", e.target.value)} /></Field></div></div><div className="mt-4"><Button kind="primary" onClick={() => commit(d => { d.programs.unshift({ ...form, id: uid("prog") }) }, "create program", `Created ${form.name || "program"}`)}>Create program</Button></div></Section><Section eyebrow="active structures" title="Program portfolio" description="Toggle programs and see what rules each ambassador program applies."><div className="grid gap-3">{store.programs.map(p => <div key={p.id} className="rounded-2xl border p-4"><div className="flex flex-wrap justify-between gap-3"><div><p className="font-black">{p.name}</p><p className="text-sm font-bold text-slate-500">{p.tier} • {p.commissionPercent}% commission • {mad(p.bonusMAD)} bonus</p></div><Badge tone={p.active ? "emerald" : "slate"}>{p.active ? "active" : "inactive"}</Badge></div><p className="mt-2 text-sm font-semibold text-slate-600">{p.rules}</p><div className="mt-3"><Button onClick={() => commit(d => { d.programs = d.programs.map(item => item.id === p.id ? { ...item, active: !item.active } : item) }, "toggle program", `Toggled ${p.name}`)}>Toggle active</Button></div></div>)}</div></Section></div>
}

function Missions() {
  const { store, commit } = useAmbassadorStore()
  const [form, setForm] = React.useState<Mission>({ id: "", title: "", ambassadorId: store.ambassadors[0]?.id || "", programId: store.programs[0]?.id || "", territoryId: store.territories[0]?.id || "", channel: "WhatsApp", objective: "", rewardMAD: 500, dueDate: todayISO(7), status: "draft", proofRequired: "Screenshot + leads", instructions: "Use approved AngelCare wording only.", priority: "High" })
  const set = <K extends keyof Mission>(key: K, value: Mission[K]) => setForm(prev => ({ ...prev, [key]: value }))
  const submitProof = (mission: Mission) => commit(d => { d.missions = d.missions.map(item => item.id === mission.id ? { ...item, status: "proof_submitted" } : item); d.proofs.unshift({ id: uid("proof"), missionId: mission.id, ambassadorId: mission.ambassadorId, type: "Mission proof", link: "Proof captured by manager", status: "submitted", reviewer: d.settings.defaultManager, decisionNote: "Needs review", submittedAt: todayISO() }) }, "submit proof", `Proof submitted for ${mission.title}`)
  return <div className="grid gap-5 xl:grid-cols-[.8fr_1.2fr]"><Section eyebrow="mission builder" title="Create mission" description="Assign operational work to a specific ambassador, program and territory."><div className="grid gap-4 md:grid-cols-2"><Field label="Title"><Input value={form.title} onChange={e => set("title", e.target.value)} /></Field><Field label="Ambassador"><Select value={form.ambassadorId} onChange={e => set("ambassadorId", e.target.value)}>{store.ambassadors.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}</Select></Field><Field label="Program"><Select value={form.programId} onChange={e => set("programId", e.target.value)}>{store.programs.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</Select></Field><Field label="Territory"><Select value={form.territoryId} onChange={e => set("territoryId", e.target.value)}>{store.territories.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}</Select></Field><Field label="Channel"><Input value={form.channel} onChange={e => set("channel", e.target.value)} /></Field><Field label="Reward"><Input type="number" value={form.rewardMAD} onChange={e => set("rewardMAD", Number(e.target.value))} /></Field><Field label="Due date"><Input type="date" value={form.dueDate} onChange={e => set("dueDate", e.target.value)} /></Field><Field label="Priority"><Select value={form.priority} onChange={e => set("priority", e.target.value as Priority)}><option>Low</option><option>Medium</option><option>High</option><option>Critical</option></Select></Field><div className="md:col-span-2"><Field label="Objective"><TextArea value={form.objective} onChange={e => set("objective", e.target.value)} /></Field></div><div className="md:col-span-2"><Field label="Instructions"><TextArea value={form.instructions} onChange={e => set("instructions", e.target.value)} /></Field></div></div><div className="mt-4"><Button kind="primary" onClick={() => commit(d => { d.missions.unshift({ ...form, id: uid("mis"), status: "assigned" }) }, "create mission", `Created mission ${form.title || "untitled"}`)}>Create and assign</Button></div></Section><Section eyebrow="execution board" title="Mission pipeline" description="Advance missions or submit proof for validation."><div className="grid gap-3">{store.missions.map(m => <div key={m.id} className="rounded-2xl border p-4"><div className="flex flex-wrap justify-between gap-3"><div><p className="font-black">{m.title}</p><p className="text-sm font-bold text-slate-500">{ambassadorName(store, m.ambassadorId)} • {territoryName(store, m.territoryId)} • {mad(m.rewardMAD)}</p></div><Badge tone={statusTone(m.status) as Tone}>{m.status}</Badge></div><div className="mt-3 flex flex-wrap gap-2"><Button onClick={() => commit(d => { d.missions = d.missions.map(item => item.id === m.id ? { ...item, status: missionNext(item.status) } : item) }, "advance mission", `Advanced ${m.title}`)} kind="primary">Advance</Button><Button onClick={() => submitProof(m)} kind="success">Submit proof</Button></div></div>)}</div></Section></div>
}

function Proofs() {
  const { store, commit } = useAmbassadorStore()
  const approve = (proof: Proof) => commit(d => { d.proofs = d.proofs.map(item => item.id === proof.id ? { ...item, status: "approved", decisionNote: "Approved for reward" } : item); d.missions = d.missions.map(item => item.id === proof.missionId ? { ...item, status: "approved" } : item); const mission = d.missions.find(item => item.id === proof.missionId); d.rewards.unshift({ id: uid("rew"), ambassadorId: proof.ambassadorId, missionId: proof.missionId, label: mission?.title || "Approved mission", amountMAD: mission?.rewardMAD || 0, status: "pending", reason: "Approved proof", createdAt: todayISO() }) }, "approve proof", `Approved proof ${proof.id}`)
  return <Section eyebrow="validation" title="Proof review queue" description="Approve only safe, compliant proof. Approval creates rewards; rejection blocks reward generation."><div className="grid gap-3">{store.proofs.map(p => <div key={p.id} className="rounded-2xl border p-4"><div className="flex flex-wrap justify-between gap-3"><div><p className="font-black">{programName(store, store.missions.find(m => m.id === p.missionId)?.programId || "")}</p><p className="text-sm font-bold text-slate-500">{ambassadorName(store, p.ambassadorId)} • {p.type} • {p.submittedAt}</p><p className="mt-1 text-sm font-semibold text-slate-600">{p.link}</p></div><Badge tone={statusTone(p.status) as Tone}>{p.status}</Badge></div><div className="mt-3 flex flex-wrap gap-2"><Button onClick={() => approve(p)} kind="success">Approve + create reward</Button><Button onClick={() => commit(d => { d.proofs = d.proofs.map(item => item.id === p.id ? { ...item, status: "rejected", decisionNote: "Rejected: proof needs correction" } : item); d.missions = d.missions.map(item => item.id === p.missionId ? { ...item, status: "rejected" } : item) }, "reject proof", `Rejected proof ${p.id}`)} kind="danger">Reject</Button></div></div>)}</div></Section>
}

function RewardsAndPayouts({ mode }: { mode: "rewards" | "payouts" }) {
  const { store, commit } = useAmbassadorStore()
  const createPayout = (reward: Reward) => commit(d => { d.rewards = d.rewards.map(item => item.id === reward.id ? { ...item, status: "approved" } : item); d.payouts.unshift({ id: uid("pay"), ambassadorId: reward.ambassadorId, amountMAD: reward.amountMAD, method: "Bank transfer", status: "pending", approvalNote: `From reward ${reward.label}`, payDate: todayISO(7) }) }, "prepare payout", `Prepared payout for ${reward.label}`)
  if (mode === "rewards") return <Section eyebrow="incentives" title="Reward queue" description="Approve earned rewards and convert them into payout records."><div className="grid gap-3">{store.rewards.map(r => <div key={r.id} className="rounded-2xl border p-4"><div className="flex flex-wrap justify-between gap-3"><div><p className="font-black">{r.label}</p><p className="text-sm font-bold text-slate-500">{ambassadorName(store, r.ambassadorId)} • {mad(r.amountMAD)} • {r.reason}</p></div><Badge tone={statusTone(r.status) as Tone}>{r.status}</Badge></div><div className="mt-3"><Button onClick={() => createPayout(r)} kind="primary">Approve and prepare payout</Button></div></div>)}</div></Section>
  return <Section eyebrow="finance" title="Payout approval board" description="Approve, block or mark payments as paid with traceability."><div className="grid gap-3">{store.payouts.map(p => <div key={p.id} className="rounded-2xl border p-4"><div className="flex flex-wrap justify-between gap-3"><div><p className="font-black">{ambassadorName(store, p.ambassadorId)}</p><p className="text-sm font-bold text-slate-500">{mad(p.amountMAD)} • {p.method} • pay date {p.payDate}</p><p className="mt-1 text-sm font-semibold text-slate-600">{p.approvalNote}</p></div><Badge tone={statusTone(p.status) as Tone}>{p.status}</Badge></div><div className="mt-3 flex flex-wrap gap-2"><Button onClick={() => commit(d => { d.payouts = d.payouts.map(item => item.id === p.id ? { ...item, status: "approved" } : item) }, "approve payout", `Approved payout ${p.id}`)} kind="primary">Approve</Button><Button onClick={() => commit(d => { d.payouts = d.payouts.map(item => item.id === p.id ? { ...item, status: "paid" } : item) }, "mark payout paid", `Paid payout ${p.id}`)} kind="success">Mark paid</Button><Button onClick={() => commit(d => { d.payouts = d.payouts.map(item => item.id === p.id ? { ...item, status: "blocked" } : item) }, "block payout", `Blocked payout ${p.id}`)} kind="danger">Block</Button></div></div>)}</div></Section>
}

function Territories() {
  const { store, commit } = useAmbassadorStore()
  const [form, setForm] = React.useState<Territory>({ id: "", name: "", city: "", capacity: 10, manager: store.settings.defaultManager, priority: "Medium", notes: "" })
  return <div className="grid gap-5 xl:grid-cols-[.7fr_1.3fr]"><Section eyebrow="coverage builder" title="Create territory" description="Define target zones, managers and capacity for expansion."><div className="grid gap-4"><Field label="Name"><Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></Field><Field label="City"><Input value={form.city} onChange={e => setForm({ ...form, city: e.target.value })} /></Field><Field label="Capacity"><Input type="number" value={form.capacity} onChange={e => setForm({ ...form, capacity: Number(e.target.value) })} /></Field><Field label="Manager"><Input value={form.manager} onChange={e => setForm({ ...form, manager: e.target.value })} /></Field><Field label="Priority"><Select value={form.priority} onChange={e => setForm({ ...form, priority: e.target.value as Priority })}><option>Low</option><option>Medium</option><option>High</option><option>Critical</option></Select></Field><Field label="Notes"><TextArea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} /></Field></div><div className="mt-4"><Button kind="primary" onClick={() => commit(d => { d.territories.unshift({ ...form, id: uid("ter") }) }, "create territory", `Created territory ${form.name || "zone"}`)}>Create territory</Button></div></Section><Section eyebrow="map logic" title="Territory portfolio" description="Coverage capacity and ambassador load by territory."><div className="grid gap-3">{store.territories.map(t => { const load = store.ambassadors.filter(a => a.territoryId === t.id).length; return <div key={t.id} className="rounded-2xl border p-4"><div className="flex justify-between gap-3"><div><p className="font-black">{t.name}</p><p className="text-sm font-bold text-slate-500">{t.city} • manager {t.manager} • load {load}/{t.capacity}</p></div><Badge tone={riskTone(t.priority) as Tone}>{t.priority}</Badge></div></div> })}</div></Section></div>
}

function Leads() {
  const { store, commit } = useAmbassadorStore()
  const [form, setForm] = React.useState<Lead>({ id: "", ambassadorId: store.ambassadors[0]?.id || "", parentName: "", phone: "", service: "", status: "new", revenueMAD: 0, createdAt: todayISO() })
  return <div className="grid gap-5 xl:grid-cols-[.8fr_1.2fr]"><Section eyebrow="lead capture" title="Create attributed lead" description="Every ambassador referral should be captured with source and revenue potential."><div className="grid gap-4 md:grid-cols-2"><Field label="Ambassador"><Select value={form.ambassadorId} onChange={e => setForm({ ...form, ambassadorId: e.target.value })}>{store.ambassadors.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}</Select></Field><Field label="Parent / client"><Input value={form.parentName} onChange={e => setForm({ ...form, parentName: e.target.value })} /></Field><Field label="Phone"><Input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} /></Field><Field label="Service"><Input value={form.service} onChange={e => setForm({ ...form, service: e.target.value })} /></Field><Field label="Revenue MAD"><Input type="number" value={form.revenueMAD} onChange={e => setForm({ ...form, revenueMAD: Number(e.target.value) })} /></Field></div><div className="mt-4"><Button kind="primary" onClick={() => commit(d => { d.leads.unshift({ ...form, id: uid("lead") }) }, "create lead", `Created lead ${form.parentName || "client"}`)}>Create lead</Button></div></Section><Section eyebrow="conversion board" title="Lead pipeline" description="Move referrals through commercial status and conversion."><div className="grid gap-3">{store.leads.map(l => <div key={l.id} className="rounded-2xl border p-4"><div className="flex flex-wrap justify-between gap-3"><div><p className="font-black">{l.parentName}</p><p className="text-sm font-bold text-slate-500">{ambassadorName(store, l.ambassadorId)} • {l.service} • {mad(l.revenueMAD)}</p></div><Badge tone={statusTone(l.status) as Tone}>{l.status}</Badge></div><div className="mt-3 flex flex-wrap gap-2"><Button onClick={() => commit(d => { d.leads = d.leads.map(item => item.id === l.id ? { ...item, status: "qualified" } : item) }, "qualify lead", `Qualified ${l.parentName}`)} kind="primary">Qualify</Button><Button onClick={() => commit(d => { d.leads = d.leads.map(item => item.id === l.id ? { ...item, status: "converted" } : item); d.ambassadors = d.ambassadors.map(a => a.id === l.ambassadorId ? { ...a, revenueMAD: a.revenueMAD + l.revenueMAD } : a) }, "convert lead", `Converted ${l.parentName}`)} kind="success">Convert</Button><Button onClick={() => commit(d => { d.leads = d.leads.map(item => item.id === l.id ? { ...item, status: "lost" } : item) }, "lose lead", `Lost ${l.parentName}`)} kind="danger">Lost</Button></div></div>)}</div></Section></div>
}

function Compliance() {
  const { store, commit } = useAmbassadorStore()
  const [form, setForm] = React.useState<ComplianceIssue>({ id: "", ambassadorId: store.ambassadors[0]?.id || "", severity: "Medium", category: "", status: "open", description: "", action: "" })
  return <div className="grid gap-5 xl:grid-cols-[.8fr_1.2fr]"><Section eyebrow="risk intake" title="Create compliance issue" description="Log risks early and manage coaching or escalation."><div className="grid gap-4 md:grid-cols-2"><Field label="Ambassador"><Select value={form.ambassadorId} onChange={e => setForm({ ...form, ambassadorId: e.target.value })}>{store.ambassadors.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}</Select></Field><Field label="Severity"><Select value={form.severity} onChange={e => setForm({ ...form, severity: e.target.value as Priority })}><option>Low</option><option>Medium</option><option>High</option><option>Critical</option></Select></Field><Field label="Category"><Input value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} /></Field><Field label="Action"><Input value={form.action} onChange={e => setForm({ ...form, action: e.target.value })} /></Field><div className="md:col-span-2"><Field label="Description"><TextArea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} /></Field></div></div><div className="mt-4"><Button kind="primary" onClick={() => commit(d => { d.compliance.unshift({ ...form, id: uid("comp") }) }, "create compliance issue", `Created compliance issue ${form.category || "risk"}`)}>Create issue</Button></div></Section><Section eyebrow="brand safety" title="Issue resolution board" description="Coach, escalate or resolve ambassador risks."><div className="grid gap-3">{store.compliance.map(c => <div key={c.id} className="rounded-2xl border p-4"><div className="flex flex-wrap justify-between gap-3"><div><p className="font-black">{c.category}</p><p className="text-sm font-bold text-slate-500">{ambassadorName(store, c.ambassadorId)} • {c.action}</p></div><div className="flex gap-2"><Badge tone={riskTone(c.severity) as Tone}>{c.severity}</Badge><Badge tone={statusTone(c.status) as Tone}>{c.status}</Badge></div></div><div className="mt-3 flex flex-wrap gap-2"><Button onClick={() => commit(d => { d.compliance = d.compliance.map(item => item.id === c.id ? { ...item, status: "coaching" } : item) }, "coach compliance", `Coaching ${c.category}`)} kind="primary">Coaching</Button><Button onClick={() => commit(d => { d.compliance = d.compliance.map(item => item.id === c.id ? { ...item, status: "resolved" } : item) }, "resolve compliance", `Resolved ${c.category}`)} kind="success">Resolve</Button><Button onClick={() => commit(d => { d.compliance = d.compliance.map(item => item.id === c.id ? { ...item, status: "escalated" } : item) }, "escalate compliance", `Escalated ${c.category}`)} kind="danger">Escalate</Button></div></div>)}</div></Section></div>
}

function Training() {
  const { store, commit } = useAmbassadorStore()
  const [form, setForm] = React.useState<TrainingItem>({ id: "", ambassadorId: store.ambassadors[0]?.id || "", module: "", status: "not_started", score: 0, dueDate: todayISO(7) })
  return <div className="grid gap-5 xl:grid-cols-[.8fr_1.2fr]"><Section eyebrow="certification" title="Assign training" description="Training raises readiness and lowers brand risk."><div className="grid gap-4 md:grid-cols-2"><Field label="Ambassador"><Select value={form.ambassadorId} onChange={e => setForm({ ...form, ambassadorId: e.target.value })}>{store.ambassadors.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}</Select></Field><Field label="Module"><Input value={form.module} onChange={e => setForm({ ...form, module: e.target.value })} /></Field><Field label="Score"><Input type="number" value={form.score} onChange={e => setForm({ ...form, score: Number(e.target.value) })} /></Field><Field label="Due date"><Input type="date" value={form.dueDate} onChange={e => setForm({ ...form, dueDate: e.target.value })} /></Field></div><div className="mt-4"><Button kind="primary" onClick={() => commit(d => { d.training.unshift({ ...form, id: uid("train") }) }, "assign training", `Assigned ${form.module || "training"}`)}>Assign training</Button></div></Section><Section eyebrow="learning board" title="Training progress" description="Complete modules and increase ambassador readiness."><div className="grid gap-3">{store.training.map(t => <div key={t.id} className="rounded-2xl border p-4"><div className="flex flex-wrap justify-between gap-3"><div><p className="font-black">{t.module}</p><p className="text-sm font-bold text-slate-500">{ambassadorName(store, t.ambassadorId)} • score {t.score} • due {t.dueDate}</p></div><Badge tone={statusTone(t.status) as Tone}>{t.status}</Badge></div><div className="mt-3"><Button onClick={() => commit(d => { d.training = d.training.map(item => item.id === t.id ? { ...item, status: "completed", score: Math.max(90, item.score) } : item); d.ambassadors = d.ambassadors.map(a => a.id === t.ambassadorId ? { ...a, readiness: Math.min(100, a.readiness + 15), complianceScore: Math.min(100, a.complianceScore + 10) } : a) }, "complete training", `Completed ${t.module}`)} kind="success">Complete + raise readiness</Button></div></div>)}</div></Section></div>
}

function Communications() {
  const { store, commit } = useAmbassadorStore()
  const [form, setForm] = React.useState<Communication>({ id: "", audience: "All active ambassadors", title: "", channel: "WhatsApp", message: "", status: "draft", sendDate: todayISO(1) })
  return <div className="grid gap-5 xl:grid-cols-[.8fr_1.2fr]"><Section eyebrow="broadcast builder" title="Create communication" description="Prepare operational broadcasts, reminders and motivational messages."><div className="grid gap-4 md:grid-cols-2"><Field label="Audience"><Input value={form.audience} onChange={e => setForm({ ...form, audience: e.target.value })} /></Field><Field label="Title"><Input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} /></Field><Field label="Channel"><Select value={form.channel} onChange={e => setForm({ ...form, channel: e.target.value })}><option>WhatsApp</option><option>Email</option><option>SMS</option><option>Internal announcement</option></Select></Field><Field label="Send date"><Input type="date" value={form.sendDate} onChange={e => setForm({ ...form, sendDate: e.target.value })} /></Field><div className="md:col-span-2"><Field label="Message"><TextArea value={form.message} onChange={e => setForm({ ...form, message: e.target.value })} /></Field></div></div><div className="mt-4"><Button kind="primary" onClick={() => commit(d => { d.communications.unshift({ ...form, id: uid("com") }) }, "create communication", `Created communication ${form.title || "message"}`)}>Save communication</Button></div></Section><Section eyebrow="message queue" title="Communication history" description="Mark messages scheduled or sent."><div className="grid gap-3">{store.communications.map(c => <div key={c.id} className="rounded-2xl border p-4"><div className="flex flex-wrap justify-between gap-3"><div><p className="font-black">{c.title}</p><p className="text-sm font-bold text-slate-500">{c.audience} • {c.channel} • {c.sendDate}</p><p className="mt-1 text-sm font-semibold text-slate-600">{c.message}</p></div><Badge tone={statusTone(c.status) as Tone}>{c.status}</Badge></div><div className="mt-3 flex flex-wrap gap-2"><Button onClick={() => commit(d => { d.communications = d.communications.map(item => item.id === c.id ? { ...item, status: "scheduled" } : item) }, "schedule communication", `Scheduled ${c.title}`)}>Schedule</Button><Button onClick={() => commit(d => { d.communications = d.communications.map(item => item.id === c.id ? { ...item, status: "sent" } : item) }, "send communication", `Sent ${c.title}`)} kind="success">Mark sent</Button></div></div>)}</div></Section></div>
}

function Analytics() {
  const { store } = useAmbassadorStore()
  const active = store.ambassadors.filter(a => a.status === "active").length
  const converted = store.leads.filter(l => l.status === "converted").length
  const missionVelocity = Math.round((store.missions.filter(m => ["approved", "paid"].includes(m.status)).length / Math.max(1, store.missions.length)) * 100)
  return <div className="space-y-5"><section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4"><Metric label="Active rate" value={pct((active / Math.max(1, store.ambassadors.length)) * 100)} sub="Activated ambassadors" /><Metric label="Mission velocity" value={pct(missionVelocity)} sub="Approved or paid missions" /><Metric label="Converted leads" value={String(converted)} sub="Commercial output" /><Metric label="Territories" value={String(store.territories.length)} sub="Managed coverage zones" /></section><Section eyebrow="ranking" title="Ambassador scorecards" description="Rank ambassadors by revenue, readiness, compliance and lead score."><div className="grid gap-3">{[...store.ambassadors].sort((a, b) => b.revenueMAD - a.revenueMAD).map(a => <div key={a.id} className="rounded-2xl border p-4"><div className="flex flex-wrap justify-between gap-3"><div><p className="font-black">{a.name}</p><p className="text-sm font-bold text-slate-500">{a.city} • {a.tier} • {mad(a.revenueMAD)}</p></div><div className="flex gap-2"><Badge tone={a.readiness >= 80 ? "emerald" : "amber"}>Ready {pct(a.readiness)}</Badge><Badge tone={a.complianceScore >= 85 ? "emerald" : "rose"}>Safe {pct(a.complianceScore)}</Badge></div></div></div>)}</div></Section></div>
}

function Settings() {
  const { store, commit, reset } = useAmbassadorStore()
  const [settings, setSettings] = React.useState(store.settings)
  React.useEffect(() => setSettings(store.settings), [store.settings])
  return <Section eyebrow="configuration" title="Ambassador operating rules" description="This controls local operating defaults. Database/server sync can be added in the next pack."><div className="grid gap-4 md:grid-cols-2"><Field label="Default commission"><Input type="number" value={settings.defaultCommission} onChange={e => setSettings({ ...settings, defaultCommission: Number(e.target.value) })} /></Field><Field label="Default manager"><Input value={settings.defaultManager} onChange={e => setSettings({ ...settings, defaultManager: e.target.value })} /></Field><Field label="Payout cycle"><Input value={settings.payoutCycle} onChange={e => setSettings({ ...settings, payoutCycle: e.target.value })} /></Field><Field label="Proof policy"><Input value={settings.proofPolicy} onChange={e => setSettings({ ...settings, proofPolicy: e.target.value })} /></Field></div><div className="mt-5 flex flex-wrap gap-2"><Button kind="primary" onClick={() => commit(d => { d.settings = settings }, "update settings", "Updated ambassador settings")}>Save settings</Button><Button kind="danger" onClick={reset}>Reset local workspace seed</Button></div></Section>
}

function Body({ mode }: { mode: Mode }) {
  if (mode === "execution-center") return <ExecutionCenter />
  if (mode === "recruitment") return <Recruitment />
  if (mode === "onboarding") return <Onboarding />
  if (mode === "programs") return <Programs />
  if (mode === "missions") return <Missions />
  if (mode === "proofs") return <Proofs />
  if (mode === "rewards" || mode === "payouts") return <RewardsAndPayouts mode={mode} />
  if (mode === "territories") return <Territories />
  if (mode === "leads") return <Leads />
  if (mode === "compliance") return <Compliance />
  if (mode === "analytics") return <Analytics />
  if (mode === "training") return <Training />
  if (mode === "communications") return <Communications />
  return <Settings />
}

export default function AmbassadorPhase2ExecutionWorkspace({ mode }: { mode: Mode }) {
  return <Shell><main className="mx-auto max-w-[1800px] space-y-6 p-4 lg:p-8"><Header mode={mode} /><NavTabs mode={mode} /><CommandMetrics /><Body mode={mode} /></main></Shell>
}
