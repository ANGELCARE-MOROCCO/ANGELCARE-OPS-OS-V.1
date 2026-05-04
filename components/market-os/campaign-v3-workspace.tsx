'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'
import { ArrowLeft, Activity, AlertTriangle, BarChart3, CalendarDays, CheckCircle2, CircleDollarSign, ClipboardCheck, ExternalLink, Filter, GitBranch, Link2, LockKeyhole, Plus, Rocket, Search, ShieldCheck, Sparkles, Target, Workflow, Zap } from 'lucide-react'
import { approvalQueue, automationRules, calendarMilestones, campaignDecisionCards, campaignV3Workspaces, moduleLinks, portfolioMetrics, v3Campaigns, v3Tasks, type CampaignWorkspaceKind } from '@/lib/market-os/campaign-v3-core'

const iconMap: Record<CampaignWorkspaceKind, any> = {
  tasks: Workflow,
  budget: CircleDollarSign,
  approvals: ClipboardCheck,
  analytics: BarChart3,
  automation: Zap,
  calendar: CalendarDays,
  links: Link2,
  new: Rocket,
}

const workspaces: CampaignWorkspaceKind[] = ['tasks', 'budget', 'approvals', 'analytics', 'automation', 'calendar', 'links', 'new']

function classNames(...items: Array<string | false | null | undefined>) {
  return items.filter(Boolean).join(' ')
}

function StatCard({ label, value, detail, icon: Icon }: any) {
  return <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
    <div className="flex items-center justify-between gap-3"><p className="text-xs font-black uppercase tracking-[0.18em] text-slate-400">{label}</p><div className="rounded-2xl bg-slate-950 p-2 text-white"><Icon className="h-4 w-4" /></div></div>
    <div className="mt-4 text-3xl font-black text-slate-950">{value}</div>
    <p className="mt-2 text-sm font-semibold text-slate-500">{detail}</p>
  </div>
}

function WorkspaceNav({ active }: { active: CampaignWorkspaceKind }) {
  return <div className="grid gap-3 md:grid-cols-4">
    {workspaces.map((key) => {
      const Icon = iconMap[key]
      return <Link key={key} href={`/market-os/campaign-lifecycle/${key === 'new' ? 'new' : key}`} className={classNames('rounded-2xl border p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg', active === key ? 'border-slate-950 bg-slate-950 text-white' : 'border-slate-200 bg-white text-slate-950')}>
        <div className="flex items-center gap-3"><Icon className="h-5 w-5" /><span className="text-sm font-black">{campaignV3Workspaces[key].title.replace('Campaign ', '')}</span></div>
      </Link>
    })}
  </div>
}

function TaskBoard() {
  const [q, setQ] = useState('')
  const filtered = useMemo(() => v3Tasks.filter(t => `${t.title} ${t.owner} ${t.workstream} ${t.status}`.toLowerCase().includes(q.toLowerCase())), [q])
  const lanes = ['blocked', 'queued', 'in_progress', 'done']
  return <section className="space-y-5">
    <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm"><div className="flex items-center gap-3"><Search className="h-5 w-5 text-slate-400"/><input value={q} onChange={e=>setQ(e.target.value)} placeholder="Search by task, owner, workstream, status..." className="w-full bg-transparent text-sm font-bold outline-none" /></div></div>
    <div className="grid gap-4 lg:grid-cols-4">{lanes.map(lane => <div key={lane} className="rounded-3xl border border-slate-200 bg-slate-50 p-4"><h3 className="mb-4 text-sm font-black uppercase tracking-[0.18em] text-slate-500">{lane.replace('_',' ')}</h3><div className="space-y-3">{filtered.filter(t=>t.status===lane).map(t=><div key={t.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"><div className="flex items-start justify-between gap-3"><h4 className="text-sm font-black text-slate-950">{t.title}</h4><span className={classNames('rounded-full px-2 py-1 text-[10px] font-black uppercase', t.priority==='critical'?'bg-rose-100 text-rose-700':t.priority==='high'?'bg-amber-100 text-amber-700':'bg-slate-100 text-slate-600')}>{t.priority}</span></div><p className="mt-3 text-xs font-bold text-slate-500">Owner: {t.owner}</p><p className="text-xs font-bold text-slate-500">Workstream: {t.workstream}</p>{t.proof_required && <p className="mt-3 inline-flex items-center gap-1 rounded-full bg-indigo-50 px-3 py-1 text-xs font-black text-indigo-700"><ShieldCheck className="h-3 w-3"/> Proof required</p>}</div>)}</div></div>)}</div>
  </section>
}

function BudgetBoard() {
  const rows = campaignDecisionCards()
  return <section className="space-y-4">{rows.map(({ campaign, health }) => <div key={campaign.id} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm"><div className="flex flex-col justify-between gap-4 lg:flex-row"><div><h3 className="text-xl font-black text-slate-950">{campaign.title}</h3><p className="mt-1 text-sm font-semibold text-slate-500">Budget governance for {campaign.city}</p></div><div className="flex flex-wrap gap-2"><span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-600">Budget {campaign.budget.toLocaleString()} MAD</span><span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-black text-emerald-700">Spent {campaign.spent.toLocaleString()} MAD</span><span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-black text-blue-700">ROI {health.roi}%</span><span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-black text-amber-700">Burn {health.budgetBurn}%</span></div></div><div className="mt-5 h-3 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-slate-950" style={{width: `${Math.min(100, health.budgetBurn)}%`}} /></div><div className="mt-4 grid gap-3 md:grid-cols-4"><button className="rounded-2xl border border-slate-200 p-3 text-sm font-black">Approve scale</button><button className="rounded-2xl border border-slate-200 p-3 text-sm font-black">Freeze spend</button><button className="rounded-2xl border border-slate-200 p-3 text-sm font-black">Reallocate channels</button><button className="rounded-2xl bg-slate-950 p-3 text-sm font-black text-white">Open finance note</button></div></div>)}</section>
}

function ApprovalsBoard() {
  return <section className="grid gap-4 lg:grid-cols-3">{approvalQueue.map(a => <div key={a.id} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm"><div className="flex items-center justify-between"><ClipboardCheck className="h-6 w-6 text-slate-950"/><span className={classNames('rounded-full px-3 py-1 text-xs font-black', a.risk==='High'?'bg-rose-100 text-rose-700':a.risk==='Medium'?'bg-amber-100 text-amber-700':'bg-emerald-100 text-emerald-700')}>{a.risk} risk</span></div><h3 className="mt-4 text-lg font-black text-slate-950">{a.gate}</h3><p className="mt-2 text-sm font-semibold text-slate-500">{a.campaign}</p><p className="mt-4 text-xs font-black uppercase tracking-[0.18em] text-slate-400">Owner</p><p className="font-bold text-slate-700">{a.owner}</p><p className="mt-3 text-xs font-black uppercase tracking-[0.18em] text-slate-400">SLA</p><p className="font-bold text-slate-700">{a.sla}</p><div className="mt-5 flex gap-2"><button className="flex-1 rounded-2xl bg-slate-950 p-3 text-sm font-black text-white">Approve</button><button className="flex-1 rounded-2xl border border-slate-200 p-3 text-sm font-black">Request proof</button></div></div>)}</section>
}

function AnalyticsBoard() {
  return <section className="space-y-4">{campaignDecisionCards().map(({ campaign, health, playbook }) => <div key={campaign.id} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm"><div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between"><div><h3 className="text-xl font-black text-slate-950">{campaign.title}</h3><p className="mt-1 text-sm font-semibold text-slate-500">{campaign.objective} • {campaign.channel_mix.join(' / ')}</p></div><div className="grid grid-cols-4 gap-2 text-center"><div><b>{health.health}%</b><p className="text-[10px] font-black uppercase text-slate-400">Health</p></div><div><b>{health.roi}%</b><p className="text-[10px] font-black uppercase text-slate-400">ROI</p></div><div><b>{health.cpl}</b><p className="text-[10px] font-black uppercase text-slate-400">CPL</p></div><div><b>{health.conversionRate}%</b><p className="text-[10px] font-black uppercase text-slate-400">Conv.</p></div></div></div><div className="mt-5 rounded-2xl bg-slate-50 p-4"><p className="mb-2 text-xs font-black uppercase tracking-[0.18em] text-slate-400">Next best actions</p>{playbook.map((p, i) => <p key={i} className="flex items-start gap-2 text-sm font-semibold text-slate-700"><CheckCircle2 className="mt-0.5 h-4 w-4 text-emerald-600"/>{p}</p>)}</div></div>)}</section>
}

function AutomationBoard() {
  return <section className="grid gap-4 lg:grid-cols-2">{automationRules.map(r => <div key={r.id} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm"><div className="flex items-center justify-between"><Zap className="h-6 w-6 text-purple-700"/><span className={classNames('rounded-full px-3 py-1 text-xs font-black', r.status==='Active'?'bg-emerald-100 text-emerald-700':'bg-slate-100 text-slate-600')}>{r.status}</span></div><h3 className="mt-4 text-lg font-black text-slate-950">{r.name}</h3><p className="mt-3 text-sm font-semibold text-slate-500"><b>Trigger:</b> {r.trigger}</p><p className="mt-2 text-sm font-semibold text-slate-500"><b>Action:</b> {r.action}</p><div className="mt-5 flex gap-2"><button className="rounded-2xl bg-slate-950 px-4 py-3 text-sm font-black text-white">Enable</button><button className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-black">Edit rule</button><button className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-black">Audit</button></div></div>)}</section>
}

function CalendarBoard() {
  return <section className="space-y-4">{calendarMilestones.map(m => <div key={m.title} className="flex flex-col gap-4 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm md:flex-row md:items-center md:justify-between"><div className="flex items-center gap-4"><div className="rounded-2xl bg-slate-950 px-4 py-3 text-center text-white"><p className="text-xs font-black uppercase">{m.date.slice(5,7)}</p><p className="text-2xl font-black">{m.date.slice(8,10)}</p></div><div><h3 className="text-lg font-black text-slate-950">{m.title}</h3><p className="text-sm font-semibold text-slate-500">{m.type} • {m.owner}</p></div></div><button className="rounded-2xl border border-slate-200 px-5 py-3 text-sm font-black">Open milestone</button></div>)}</section>
}

function LinksBoard() {
  return <section className="grid gap-4 lg:grid-cols-2">{moduleLinks.map(l => <div key={l.module} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm"><div className="flex items-center justify-between"><GitBranch className="h-6 w-6 text-cyan-700"/><span className={classNames('rounded-full px-3 py-1 text-xs font-black', l.health<70?'bg-rose-100 text-rose-700':l.health<80?'bg-amber-100 text-amber-700':'bg-emerald-100 text-emerald-700')}>{l.health}% health</span></div><h3 className="mt-4 text-lg font-black text-slate-950">{l.module}</h3><p className="mt-2 text-sm font-semibold text-slate-500">{l.relation}</p><div className="mt-5 flex items-center justify-between"><span className="text-sm font-black text-slate-600">{l.status}</span><button className="inline-flex items-center gap-2 rounded-2xl bg-slate-950 px-4 py-3 text-sm font-black text-white">Sync <ExternalLink className="h-4 w-4"/></button></div></div>)}</section>
}

function NewCampaignBoard() {
  const scenarios = ['Rabat childcare lead sprint', 'Senior care trust campaign', 'Partner referral activation', 'Ambassador city launch', 'Ramadan support campaign', 'Post-partum premium launch']
  return <section className="grid gap-4 lg:grid-cols-3">{scenarios.map((s, i) => <div key={s} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm"><Sparkles className="h-6 w-6 text-emerald-700"/><h3 className="mt-4 text-lg font-black text-slate-950">{s}</h3><p className="mt-2 text-sm font-semibold text-slate-500">Preconfigured scenario with audience, channel mix, budget logic, checklist, approval gates and KPI targets.</p><button className="mt-5 w-full rounded-2xl bg-slate-950 p-3 text-sm font-black text-white">Use template {i + 1}</button></div>)}</section>
}

export function CampaignV3Workspace({ kind }: { kind: CampaignWorkspaceKind }) {
  const config = campaignV3Workspaces[kind]
  const Icon = iconMap[kind]
  const metrics = portfolioMetrics()
  return <main className="min-h-screen bg-slate-50 p-6 text-slate-950">
    <div className="mx-auto max-w-7xl space-y-6">
      <Link href="/market-os/campaign-lifecycle" className="inline-flex items-center gap-2 text-sm font-black text-slate-600"><ArrowLeft className="h-4 w-4"/> Back to campaign command center</Link>
      <section className={`overflow-hidden rounded-[2rem] bg-gradient-to-br ${config.accent} p-8 text-white shadow-xl`}>
        <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
          <div><div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-xs font-black uppercase tracking-[0.2em] text-white/80"><Icon className="h-4 w-4"/> {config.eyebrow}</div><h1 className="text-4xl font-black tracking-tight md:text-5xl">{config.title}</h1><p className="mt-4 max-w-3xl text-sm font-semibold leading-7 text-slate-200">{config.description}</p></div>
          <button className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-5 py-4 text-sm font-black text-slate-950 shadow-lg"><Plus className="h-4 w-4"/> {config.primaryAction}</button>
        </div>
      </section>
      <WorkspaceNav active={kind} />
      <section className="grid gap-4 md:grid-cols-4"><StatCard label="Portfolio ROI" value={`${metrics.roi}%`} detail="Revenue vs spent" icon={Activity}/><StatCard label="Total leads" value={metrics.totalLeads} detail="All active campaigns" icon={Target}/><StatCard label="CPL" value={`${metrics.cpl} MAD`} detail="Average lead cost" icon={CircleDollarSign}/><StatCard label="Risk index" value={`${metrics.risk}%`} detail="Portfolio exposure" icon={AlertTriangle}/></section>
      <section className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm"><div className="flex flex-wrap items-center justify-between gap-3"><div className="flex items-center gap-2 text-sm font-black text-slate-600"><Filter className="h-4 w-4"/> Permission-aware controls ready: CEO / Manager / Officer / Finance / Read-only</div><div className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-600"><LockKeyhole className="h-3 w-3"/> V3 governance layer</div></div></section>
      {kind === 'tasks' && <TaskBoard />}
      {kind === 'budget' && <BudgetBoard />}
      {kind === 'approvals' && <ApprovalsBoard />}
      {kind === 'analytics' && <AnalyticsBoard />}
      {kind === 'automation' && <AutomationBoard />}
      {kind === 'calendar' && <CalendarBoard />}
      {kind === 'links' && <LinksBoard />}
      {kind === 'new' && <NewCampaignBoard />}
    </div>
  </main>
}
