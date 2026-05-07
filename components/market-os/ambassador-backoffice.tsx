"use client"

import * as React from "react"
import Link from "next/link"
import {
  Ambassador,
  AmbassadorStatus,
  ApplicationStage,
  Button,
  DarkPanel,
  Field,
  Input,
  Metric,
  Meter,
  Panel,
  Select,
  Shell,
  TextArea,
  applicationNext,
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

const gateways = [
  ["Create ambassador", "/market-os/ambassadors/create", "Create profile, territory, program, tier and operating notes."],
  ["Recruitment", "/market-os/ambassadors/recruitment", "Move applicants through qualification, interview, approval and onboarding."],
  ["Onboarding", "/market-os/ambassadors/onboarding", "Training, documents, WhatsApp access, first mission and readiness."],
  ["Programs", "/market-os/ambassadors/programs", "Build commission rules, eligibility and tier logic."],
  ["Mission command", "/market-os/ambassadors/missions", "Create, assign and execute ambassador missions."],
  ["Proof validation", "/market-os/ambassadors/proofs", "Approve or reject proof and generate rewards."],
  ["Rewards", "/market-os/ambassadors/rewards", "Control bonuses, commissions and reward reasons."],
  ["Payouts", "/market-os/ambassadors/payouts", "Approve, block, or mark payouts as paid."],
  ["Territories", "/market-os/ambassadors/territories", "Control city coverage, capacity and regional managers."],
  ["Leads", "/market-os/ambassadors/leads", "Track ambassador generated leads and revenue."],
  ["Compliance", "/market-os/ambassadors/compliance", "Warnings, coaching, brand issues and escalation."],
  ["Analytics", "/market-os/ambassadors/analytics", "Performance, revenue, readiness and risk intelligence."],
  ["Training", "/market-os/ambassadors/training", "Education modules, scores and readiness controls."],
  ["Communications", "/market-os/ambassadors/communications", "Messages, reminders and program announcements."],
  ["Settings", "/market-os/ambassadors/settings", "Proof policy, payout cycle and manager defaults."],
]

function Hero({ total, active, payouts, proofs, reset }:{total:number; active:number; payouts:number; proofs:number; reset:()=>void}) {
  return <DarkPanel className="overflow-hidden p-6 lg:p-8">
    <div className="grid gap-6 xl:grid-cols-[1.35fr_.8fr]">
      <div>
        <div className="flex flex-wrap gap-2">
          <Badge tone="emerald">Market-OS</Badge><Badge tone="emerald">Ambassador Backoffice OS</Badge><Badge tone="amber">Affiliate operations</Badge>
        </div>
        <h1 className="mt-5 max-w-5xl text-4xl font-black leading-tight tracking-tight text-white md:text-6xl">Ambassador network command backoffice.</h1>
        <p className="mt-5 max-w-4xl text-base font-semibold leading-8 text-emerald-50/85 md:text-lg">A dedicated operator system for recruiting, onboarding, assigning missions, validating proof, controlling rewards, managing territories, tracking leads, enforcing compliance and scaling the AngelCare ambassador network.</p>
        <div className="mt-7 flex flex-wrap gap-3">
          <Button href="/market-os/ambassadors/create" kind="primary">+ New ambassador</Button>
          <Button href="/market-os/ambassadors/missions" kind="soft">Create mission</Button>
          <Button href="/market-os/ambassadors/proofs" kind="soft">Validate proofs</Button>
          <Button href="/market-os/ambassadors/payouts" kind="soft">Payout control</Button>
          <Button onClick={reset} kind="danger">Reset local workspace</Button>
        </div>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-3xl border border-white/10 bg-white/10 p-5"><p className="text-xs font-black uppercase text-emerald-100/70">Ambassadors</p><p className="mt-2 text-4xl font-black text-white">{total}</p><p className="text-sm font-bold text-emerald-50/70">Profiles in local backoffice</p></div>
        <div className="rounded-3xl border border-white/10 bg-white/10 p-5"><p className="text-xs font-black uppercase text-emerald-100/70">Active</p><p className="mt-2 text-4xl font-black text-white">{active}</p><p className="text-sm font-bold text-emerald-50/70">Ready to execute</p></div>
        <div className="rounded-3xl border border-white/10 bg-white/10 p-5"><p className="text-xs font-black uppercase text-emerald-100/70">Proof queue</p><p className="mt-2 text-4xl font-black text-white">{proofs}</p><p className="text-sm font-bold text-emerald-50/70">Needs review</p></div>
        <div className="rounded-3xl border border-white/10 bg-white/10 p-5"><p className="text-xs font-black uppercase text-emerald-100/70">Payout queue</p><p className="mt-2 text-4xl font-black text-white">{payouts}</p><p className="text-sm font-bold text-emerald-50/70">Pending approval/payment</p></div>
      </div>
    </div>
  </DarkPanel>
}

function Gateways(){ return <Panel className="p-5"><div><p className="text-xs font-black uppercase tracking-[0.24em] text-emerald-700">Execution gateways</p><h2 className="mt-2 text-2xl font-black text-slate-950">Backoffice workspaces</h2><p className="mt-2 text-sm font-semibold text-slate-600">Every card opens a real route where the action can be completed.</p></div><div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-5">{gateways.map(([label,href,detail])=><Link key={href} href={href} className="group rounded-3xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:border-emerald-400 hover:shadow-xl"><div className="flex items-start justify-between"><div className="rounded-2xl bg-emerald-50 px-3 py-2 text-xs font-black text-emerald-800">OPEN</div><span className="text-slate-300 group-hover:text-emerald-700">→</span></div><h3 className="mt-4 text-lg font-black text-slate-950">{label}</h3><p className="mt-2 text-sm font-semibold leading-6 text-slate-600">{detail}</p></Link>)}</div></Panel> }

function AmbassadorCard({ a, onStatus }:{a:Ambassador; onStatus:(id:string,status:AmbassadorStatus)=>void}) {
  return <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
    <div className="flex items-start justify-between gap-3"><div><Link href={`/market-os/ambassadors/${a.id}`} className="text-lg font-black text-slate-950 hover:underline">{a.name}</Link><p className="mt-1 text-sm font-bold text-slate-500">{a.city} • {a.tier} • {a.manager}</p></div><Badge tone={statusTone(a.status) as any}>{a.status}</Badge></div>
    <div className="mt-4 grid gap-3 md:grid-cols-3"><div><p className="text-xs font-black uppercase text-slate-400">Readiness</p><Meter value={a.readiness}/><p className="mt-1 text-xs font-black">{pct(a.readiness)}</p></div><div><p className="text-xs font-black uppercase text-slate-400">Compliance</p><Meter value={a.complianceScore}/><p className="mt-1 text-xs font-black">{pct(a.complianceScore)}</p></div><div><p className="text-xs font-black uppercase text-slate-400">Lead score</p><Meter value={a.leadScore}/><p className="mt-1 text-xs font-black">{pct(a.leadScore)}</p></div></div>
    <div className="mt-4 grid gap-2 md:grid-cols-2"><p className="rounded-2xl bg-slate-50 p-3 text-sm font-bold text-slate-700">Revenue: <b className="text-slate-950">{mad(a.revenueMAD)}</b></p><p className="rounded-2xl bg-slate-50 p-3 text-sm font-bold text-slate-700">Program: <b className="text-slate-950">{a.programId}</b></p></div>
    <div className="mt-4 flex flex-wrap gap-2"><Button href={`/market-os/ambassadors/${a.id}`} kind="dark">Open</Button><Button href={`/market-os/ambassadors/${a.id}/edit`}>Edit</Button><Button href="/market-os/ambassadors/missions" kind="primary">Assign mission</Button><Button href={`/market-os/ambassadors/${a.id}/delete`} kind="danger">Delete</Button><select value={a.status} onChange={e=>onStatus(a.id,e.target.value as AmbassadorStatus)} className="rounded-2xl border border-slate-200 px-3 py-2 text-sm font-black"><option value="applicant">applicant</option><option value="onboarding">onboarding</option><option value="active">active</option><option value="paused">paused</option><option value="watchlist">watchlist</option><option value="offboarded">offboarded</option></select></div>
  </div>
}

function CommandTables({ view }:{view:ViewMode}) {
  const { store, commit } = useAmbassadorStore()
  if (view==="recruitment") return <Panel className="p-5"><h2 className="text-2xl font-black">Recruitment pipeline</h2><div className="mt-5 grid gap-3">{store.applications.map(app=><div key={app.id} className="rounded-2xl border p-4"><div className="flex justify-between"><div><p className="font-black">{app.name}</p><p className="text-sm font-bold text-slate-500">{app.city} • {app.source}</p></div><Badge tone={riskTone(app.priority)}>{app.stage}</Badge></div><p className="mt-2 text-sm font-semibold text-slate-600">Next: {app.nextStep}</p><Button onClick={()=>commit(d=>{d.applications=d.applications.map(x=>x.id===app.id?{...x,stage:applicationNext(x.stage)}:x)},"advance application",`Advanced ${app.name}`)} kind="primary">Advance stage</Button></div>)}</div></Panel>
  if (view==="missions") return <Panel className="p-5"><h2 className="text-2xl font-black">Mission command</h2><div className="mt-5 grid gap-3">{store.missions.map(m=><div key={m.id} className="rounded-2xl border p-4"><div className="flex justify-between"><div><p className="font-black">{m.title}</p><p className="text-sm font-bold text-slate-500">{ambassadorName(store,m.ambassadorId)} • {m.channel} • Due {m.dueDate}</p></div><Badge tone={statusTone(m.status) as any}>{m.status}</Badge></div><p className="mt-2 text-sm font-semibold text-slate-600">{m.instructions}</p><Button onClick={()=>commit(d=>{d.missions=d.missions.map(x=>x.id===m.id?{...x,status:missionNext(x.status)}:x)},"advance mission",`Moved ${m.title}`)} kind="primary">Move mission forward</Button></div>)}</div></Panel>
  if (view==="proofs") return <Panel className="p-5"><h2 className="text-2xl font-black">Proof validation</h2><div className="mt-5 grid gap-3">{store.proofs.map(p=><div key={p.id} className="rounded-2xl border p-4"><p className="font-black">{ambassadorName(store,p.ambassadorId)} proof</p><p className="text-sm font-bold text-slate-500">{p.type} • {p.link}</p><div className="mt-3 flex gap-2"><Button onClick={()=>commit(d=>{d.proofs=d.proofs.map(x=>x.id===p.id?{...x,status:"approved",decisionNote:"Approved from main cockpit"}:x); const mission=d.missions.find(m=>m.id===p.missionId); if(mission){mission.status="approved"; d.rewards.push({id:uid("reward"), ambassadorId:p.ambassadorId, missionId:p.missionId, label:`Reward for ${mission.title}`, amountMAD:mission.rewardMAD, status:"pending", reason:"Proof approved", createdAt:todayISO()})}},"approve proof",`Approved proof ${p.id}`)} kind="success">Approve</Button><Button onClick={()=>commit(d=>{d.proofs=d.proofs.map(x=>x.id===p.id?{...x,status:"rejected",decisionNote:"Rejected from main cockpit"}:x)},"reject proof",`Rejected proof ${p.id}`)} kind="danger">Reject</Button></div></div>)}</div></Panel>
  return <Panel className="p-5"><h2 className="text-2xl font-black">{view} workspace</h2><p className="mt-2 text-sm font-semibold text-slate-600">Open the dedicated route for full form controls and detailed execution tools.</p><Button href={`/market-os/ambassadors/${view}`} kind="primary">Open {view}</Button></Panel>
}

export default function AmbassadorBackoffice() {
  const { store, commit, reset } = useAmbassadorStore()
  const [query,setQuery]=React.useState("")
  const [view,setView]=React.useState<ViewMode>("crm")
  const [focus,setFocus]=React.useState<FocusMode>("all")
  const filtered = store.ambassadors.filter(a => {
    const hay = `${a.name} ${a.city} ${a.status} ${a.tier} ${a.manager} ${a.notes}`.toLowerCase()
    const q = query ? hay.includes(query.toLowerCase()) : true
    const f = focus==="all"?true:focus==="onboarding"?a.status==="onboarding":focus==="compliance"?a.complianceScore<85:focus==="territory"?true:focus==="payout"?store.payouts.some(p=>p.ambassadorId===a.id&&p.status==="pending"):focus==="urgent"?a.status==="watchlist"||a.complianceScore<80:true
    return q && f
  })
  const pendingProofs=store.proofs.filter(p=>p.status==="submitted").length
  const pendingPayouts=store.payouts.filter(p=>p.status==="pending"||p.status==="approved").length
  return <Shell><main className="mx-auto max-w-[1900px] space-y-6 p-4 lg:p-8">
    <Hero total={store.ambassadors.length} active={store.ambassadors.filter(a=>a.status==="active").length} payouts={pendingPayouts} proofs={pendingProofs} reset={reset}/>
    <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-6"><Metric label="Revenue impact" value={mad(store.ambassadors.reduce((s,a)=>s+a.revenueMAD,0))} sub="Ambassador attributed"/><Metric label="Applications" value={String(store.applications.length)} sub="Recruitment pipeline"/><Metric label="Missions" value={String(store.missions.length)} sub="Execution units"/><Metric label="Territories" value={String(store.territories.length)} sub="Coverage areas"/><Metric label="Compliance" value={String(store.compliance.filter(c=>c.status!=="resolved").length)} sub="Open issues"/><Metric label="Leads" value={String(store.leads.length)} sub="Generated contacts"/></section>
    <Panel className="p-5"><div className="grid gap-4 xl:grid-cols-[1.2fr_.6fr_.6fr_.6fr]">
      <Input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search ambassador, city, tier, manager, note..."/>
      <Select value={view} onChange={e=>setView(e.target.value as ViewMode)}><option value="crm">CRM command</option><option value="recruitment">Recruitment</option><option value="missions">Missions</option><option value="proofs">Proofs</option><option value="payouts">Payouts</option><option value="territories">Territories</option><option value="leads">Leads</option><option value="compliance">Compliance</option></Select>
      <Select value={focus} onChange={e=>setFocus(e.target.value as FocusMode)}><option value="all">All focus</option><option value="urgent">Urgent</option><option value="onboarding">Onboarding</option><option value="payout">Payout</option><option value="compliance">Compliance</option><option value="territory">Territory</option></Select>
      <Button href="/market-os/ambassadors/create" kind="primary">+ Create</Button>
    </div></Panel>
    <Gateways/>
    {view==="crm" ? <div className="grid gap-5 xl:grid-cols-[1.1fr_.6fr]"><Panel className="p-5"><div className="flex items-center justify-between"><div><p className="text-xs font-black uppercase tracking-[0.24em] text-emerald-700">CRM cockpit</p><h2 className="mt-2 text-2xl font-black">Ambassador control table</h2></div><Button href="/market-os/ambassadors/create" kind="primary">New ambassador</Button></div><div className="mt-5 grid gap-4">{filtered.map(a=><AmbassadorCard key={a.id} a={a} onStatus={(id,status)=>commit(d=>{d.ambassadors=d.ambassadors.map(x=>x.id===id?{...x,status}:x)},"status update",`Updated ambassador ${id} status`)}/>)}</div></Panel><DarkPanel className="p-5"><p className="text-xs font-black uppercase tracking-[0.24em] text-emerald-200">Decision panel</p><h2 className="mt-2 text-2xl font-black text-white">Operator next moves</h2><div className="mt-5 space-y-3 text-sm font-bold text-emerald-50/80"><p className="rounded-2xl bg-white/10 p-4">Validate {pendingProofs} pending proof item(s) before payout creation.</p><p className="rounded-2xl bg-white/10 p-4">Complete onboarding for {store.ambassadors.filter(a=>a.status==="onboarding").length} ambassador profile(s).</p><p className="rounded-2xl bg-white/10 p-4">Resolve {store.compliance.filter(c=>c.status!=="resolved").length} compliance item(s) to protect brand trust.</p><p className="rounded-2xl bg-white/10 p-4">Review territory capacity and coverage for expansion decisions.</p></div></DarkPanel></div> : <CommandTables view={view}/>} 
    <Panel className="p-5"><p className="text-xs font-black uppercase tracking-[0.24em] text-emerald-700">Activity log</p><h2 className="mt-2 text-2xl font-black">Recent execution trail</h2><div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">{store.logs.slice(0,8).map(log=><div key={log.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4"><p className="text-xs font-black uppercase text-slate-400">{log.action}</p><p className="mt-2 text-sm font-black text-slate-950">{log.entity}</p><p className="mt-1 text-xs font-bold text-slate-500">{log.detail}</p></div>)}</div></Panel>
  </main></Shell>
}
