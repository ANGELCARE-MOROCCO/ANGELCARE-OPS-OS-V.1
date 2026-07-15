'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import {
  Activity, AlertTriangle, ArrowLeft, BadgeCheck, BarChart3, BriefcaseBusiness, CalendarDays,
  CheckCircle2, ChevronRight, ClipboardCheck, ClipboardList, Copy, DollarSign, Edit3, Eye,
  FileText, Filter, Flag, Gauge, Layers, Megaphone, MessageSquare, MoreHorizontal, PauseCircle,
  PieChart, PlayCircle, Plus, RefreshCw, Rocket, Search, Settings, ShieldCheck, Sparkles,
  Target, Timer, Trash2, TrendingUp, Users, Wand2, Workflow, XCircle
} from 'lucide-react'
import {
  CampaignRisk, CampaignStage, ExecutiveCampaign, calculateBudgetBurn, calculateTaskCompletion,
  campaignChannels, campaignExecutiveScore, campaignReadinessWarnings, campaignRisks, campaignStages,
  executiveCampaigns, formatMad, stageLabel
} from '@/lib/market-os/campaign-lifecycle-executive'

type WorkspaceMode = 'overview' | 'detail' | 'create' | 'calendar' | 'launch' | 'budget' | 'performance' | 'approvals' | 'experiments' | 'postmortem'

type Props = {
  mode?: WorkspaceMode
  campaignId?: string
}

type DraftCampaign = {
  title: string
  objective: string
  channel: string
  serviceLine: string
  city: string
  audience: string
  persona: string
  offer: string
  hook: string
  cta: string
  budgetMad: string
  launchDate: string
  endDate: string
  owner: string
  complianceNote: string
}

const defaultDraft: DraftCampaign = {
  title: '',
  objective: 'Qualified leads',
  channel: 'Meta',
  serviceLine: 'Childcare',
  city: 'Rabat / Témara / Salé',
  audience: 'Mothers 25-45',
  persona: 'Busy parent seeking safe, reliable care',
  offer: 'Premium trusted family care',
  hook: '',
  cta: 'Request callback',
  budgetMad: '25000',
  launchDate: '2026-05-20',
  endDate: '2026-06-20',
  owner: 'Marketing Director',
  complianceNote: 'Avoid unverified guarantees. Keep claims operational and trust-based.',
}

const inputClass = 'w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-900 outline-none transition focus:border-rose-400 focus:ring-4 focus:ring-rose-100'
const labelClass = 'text-xs font-black uppercase tracking-[0.18em] text-slate-9500'

function badgeClass(value: string) {
  if (['live', 'ready', 'low', 'approved', 'done', 'winner'].includes(value)) return 'border-emerald-200 bg-emerald-50 text-emerald-700'
  if (['critical', 'high', 'blocked', 'missing', 'stopped'].includes(value)) return 'border-red-200 bg-red-50 text-red-700'
  if (['approval', 'review', 'planned', 'running', 'doing'].includes(value)) return 'border-blue-200 bg-blue-50 text-blue-700'
  if (['optimization', 'medium', 'draft'].includes(value)) return 'border-amber-200 bg-amber-50 text-amber-700'
  return 'border-slate-200 bg-slate-50 text-slate-700'
}

function Bar({ value }: { value: number }) {
  return <div className="h-2 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-white" style={{ width: `${Math.max(0, Math.min(100, value))}%` }} /></div>
}

function StatCard({ icon, label, value, note }: { icon: React.ReactNode; label: string; value: string; note: string }) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <div className="rounded-2xl bg-white p-3 text-slate-950">{icon}</div>
        <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-black text-slate-600">Live control</span>
      </div>
      <p className={labelClass}>{label}</p>
      <p className="mt-2 text-3xl font-black text-slate-950">{value}</p>
      <p className="mt-2 text-sm font-semibold text-slate-9500">{note}</p>
    </div>
  )
}

function ActionButton({ children, onClick, tone = 'dark' }: { children: React.ReactNode; onClick?: () => void; tone?: 'dark' | 'light' | 'danger' }) {
  const cls = tone === 'dark'
    ? 'bg-white text-slate-950 hover:bg-white'
    : tone === 'danger'
      ? 'border border-red-200 bg-red-50 text-red-700 hover:bg-red-100'
      : 'border border-slate-200 bg-white text-slate-800 hover:bg-slate-50'
  return <button onClick={onClick} className={`inline-flex items-center gap-2 rounded-2xl px-4 py-3 text-sm font-black transition ${cls}`}>{children}</button>
}

function ExecutiveHeader({ mode }: { mode: WorkspaceMode }) {
  return (
    <section className="relative overflow-hidden rounded-[2rem] bg-white p-6 text-slate-950 shadow-2xl lg:p-8">
      <div className="absolute -right-20 -top-20 h-72 w-72 rounded-full bg-rose-500/20 blur-3xl" />
      <div className="absolute bottom-0 left-0 h-44 w-44 rounded-full bg-amber-400/20 blur-3xl" />
      <div className="relative z-10 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="mb-4 flex flex-wrap gap-2">
            <span className="rounded-full border border-slate-200 bg-white/10 px-3 py-1 text-xs font-black uppercase tracking-[0.2em] text-slate-950/80">Market-OS</span>
            <span className="rounded-full border border-slate-200 bg-white/10 px-3 py-1 text-xs font-black uppercase tracking-[0.2em] text-slate-950/80">Campaign Lifecycle</span>
            <span className="rounded-full border border-emerald-300/30 bg-emerald-400/10 px-3 py-1 text-xs font-black uppercase tracking-[0.2em] text-emerald-100">Original-context recovery</span>
          </div>
          <h1 className="max-w-4xl text-4xl font-black tracking-tight lg:text-6xl">Executive digital marketing campaign management cockpit</h1>
          <p className="mt-4 max-w-3xl text-base font-semibold leading-7 text-slate-600">
            Preserves your original AngelCare campaign logic and adds launch governance, readiness control, budget discipline, asset management, approval flow, experiments, performance closure, and campaign-specific action rooms.
          </p>
        </div>
        <div className="grid min-w-[280px] gap-3 rounded-3xl border border-slate-200 bg-white/10 p-4 backdrop-blur">
          <Link href="/market-os/campaign-lifecycle/create" className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-5 py-3 text-sm font-black text-slate-950"><Plus className="h-4 w-4" /> New campaign</Link>
          <Link href="/market-os/campaign-lifecycle/launch-control" className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 px-5 py-3 text-sm font-black text-slate-950"><Rocket className="h-4 w-4" /> Launch control</Link>
          <p className="text-center text-xs font-bold text-slate-600">Current room: {mode}</p>
        </div>
      </div>
    </section>
  )
}

function NavigationTabs() {
  const tabs = [
    ['/market-os/campaign-lifecycle', 'Command', Activity],
    ['/market-os/campaign-lifecycle/create', 'Create', Plus],
    ['/market-os/campaign-lifecycle/calendar', 'Calendar', CalendarDays],
    ['/market-os/campaign-lifecycle/launch-control', 'Launch', Rocket],
    ['/market-os/campaign-lifecycle/budget-control', 'Budget', DollarSign],
    ['/market-os/campaign-lifecycle/performance', 'Performance', TrendingUp],
    ['/market-os/campaign-lifecycle/approvals', 'Approvals', ShieldCheck],
    ['/market-os/campaign-lifecycle/experiments', 'Experiments', Sparkles],
    ['/market-os/campaign-lifecycle/post-mortem', 'Post-mortem', ClipboardCheck],
  ] as const
  return (
    <div className="sticky top-2 z-20 overflow-x-auto rounded-3xl border border-slate-200 bg-white/90 p-2 shadow-sm backdrop-blur">
      <div className="flex min-w-max gap-2">
        {tabs.map(([href, label, Icon]) => <Link key={href} href={href} className="inline-flex items-center gap-2 rounded-2xl px-4 py-3 text-sm font-black text-slate-700 hover:bg-slate-100"><Icon className="h-4 w-4" />{label}</Link>)}
      </div>
    </div>
  )
}

function CampaignCard({ campaign, selected, toggle }: { campaign: ExecutiveCampaign; selected: boolean; toggle: () => void }) {
  const score = campaignExecutiveScore(campaign)
  const warnings = campaignReadinessWarnings(campaign)
  return (
    <article className={`rounded-[2rem] border bg-white p-5 shadow-sm transition ${selected ? 'border-slate-950 ring-4 ring-slate-100' : 'border-slate-200'}`}>
      <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
        <div className="min-w-0 flex-1">
          <div className="mb-3 flex flex-wrap gap-2">
            <span className={`rounded-full border px-3 py-1 text-xs font-black ${badgeClass(campaign.stage)}`}>Stage: {stageLabel(campaign.stage)}</span>
            <span className={`rounded-full border px-3 py-1 text-xs font-black ${badgeClass(campaign.risk)}`}>Risk: {campaign.risk}</span>
            <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-black text-slate-600">{campaign.channel}</span>
            <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-black text-slate-600">{campaign.city}</span>
          </div>
          <h2 className="text-2xl font-black text-slate-950">{campaign.title}</h2>
          <p className="mt-2 text-sm font-semibold leading-6 text-slate-9500">{campaign.strategy} · Owner: {campaign.owner} · {campaign.funnelStage}</p>
        </div>
        <div className="grid gap-2 sm:grid-cols-2 xl:w-[360px]">
          <div className="rounded-2xl bg-slate-50 p-4"><p className={labelClass}>Executive score</p><p className="mt-1 text-2xl font-black">{score}%</p><Bar value={score} /></div>
          <div className="rounded-2xl bg-slate-50 p-4"><p className={labelClass}>Budget</p><p className="mt-1 text-2xl font-black">{formatMad(campaign.budgetMad)}</p><p className="text-xs font-bold text-slate-9500">Spent {formatMad(campaign.spentMad)}</p></div>
        </div>
      </div>
      <div className="mt-5 grid gap-4 lg:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 p-4"><p className={labelClass}>Audience</p><p className="mt-2 text-sm font-semibold text-slate-700">{campaign.audience}</p></div>
        <div className="rounded-2xl border border-slate-200 p-4"><p className={labelClass}>Offer</p><p className="mt-2 text-sm font-semibold text-slate-700">{campaign.offer}</p></div>
        <div className="rounded-2xl border border-slate-200 p-4"><p className={labelClass}>Next action</p><p className="mt-2 text-sm font-semibold text-slate-700">{campaign.nextAction}</p></div>
      </div>
      <div className="mt-5 grid gap-4 lg:grid-cols-4">
        <div><div className="mb-2 flex justify-between text-xs font-black uppercase text-slate-9500"><span>Readiness</span><span>{campaign.readiness}%</span></div><Bar value={campaign.readiness} /></div>
        <div><div className="mb-2 flex justify-between text-xs font-black uppercase text-slate-9500"><span>Confidence</span><span>{campaign.confidence}%</span></div><Bar value={campaign.confidence} /></div>
        <div><div className="mb-2 flex justify-between text-xs font-black uppercase text-slate-9500"><span>Tasks</span><span>{calculateTaskCompletion(campaign)}%</span></div><Bar value={calculateTaskCompletion(campaign)} /></div>
        <div><div className="mb-2 flex justify-between text-xs font-black uppercase text-slate-9500"><span>Budget burn</span><span>{calculateBudgetBurn(campaign)}%</span></div><Bar value={calculateBudgetBurn(campaign)} /></div>
      </div>
      <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 p-4">
        <p className="text-xs font-black uppercase tracking-[0.18em] text-amber-700">Launch blockers / warnings</p>
        <div className="mt-2 flex flex-wrap gap-2">{warnings.map((warning: string) => <span key={warning} className="rounded-full border border-amber-200 bg-white px-3 py-1 text-xs font-black text-amber-700">{warning}</span>)}</div>
      </div>
      <div className="mt-5 flex flex-wrap gap-2">
        <Link href={`/market-os/campaign-lifecycle/${campaign.id}`} className="inline-flex items-center gap-2 rounded-2xl bg-white px-4 py-3 text-sm font-black text-slate-950"><Eye className="h-4 w-4" /> Open control room</Link>
        <ActionButton onClick={toggle} tone="light">{selected ? <CheckCircle2 className="h-4 w-4" /> : <ClipboardList className="h-4 w-4" />} {selected ? 'Selected' : 'Select'}</ActionButton>
        <ActionButton tone="light"><Copy className="h-4 w-4" /> Duplicate scenario</ActionButton>
        <ActionButton tone="light"><ShieldCheck className="h-4 w-4" /> Request approval</ActionButton>
      </div>
    </article>
  )
}

function Overview({ campaigns }: { campaigns: ExecutiveCampaign[] }) {
  const [query, setQuery] = useState('')
  const [stage, setStage] = useState<CampaignStage | 'all'>('all')
  const [risk, setRisk] = useState<CampaignRisk | 'all'>('all')
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const filtered = useMemo(() => campaigns.filter((campaign) => {
    const q = query.toLowerCase()
    const matchesQuery = !q || [campaign.title, campaign.strategy, campaign.owner, campaign.audience, campaign.offer, campaign.city].join(' ').toLowerCase().includes(q)
    return matchesQuery && (stage === 'all' || campaign.stage === stage) && (risk === 'all' || campaign.risk === risk)
  }), [campaigns, query, stage, risk])
  const totalBudget = filtered.reduce((sum, campaign) => sum + campaign.budgetMad, 0)
  const launchReady = filtered.filter((campaign) => campaign.readiness >= 80).length
  const highRisk = filtered.filter((campaign) => campaign.risk === 'high' || campaign.risk === 'critical').length
  const avgScore = filtered.length ? Math.round(filtered.reduce((sum, campaign) => sum + campaignExecutiveScore(campaign), 0) / filtered.length) : 0
  return (
    <div className="space-y-6">
      <div className="grid gap-4 lg:grid-cols-4">
        <StatCard icon={<BriefcaseBusiness className="h-5 w-5" />} label="Active campaign portfolio" value={`${filtered.length}`} note="Filtered executive campaign initiatives." />
        <StatCard icon={<DollarSign className="h-5 w-5" />} label="Budget under control" value={formatMad(totalBudget)} note="Allocated MAD across selected campaigns." />
        <StatCard icon={<Rocket className="h-5 w-5" />} label="Launch ready" value={`${launchReady}`} note="Campaigns above readiness threshold." />
        <StatCard icon={<AlertTriangle className="h-5 w-5" />} label="Risk queue" value={`${highRisk}`} note="Need executive attention before launch." />
      </div>
      <section className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className={labelClass}>Campaign operating room</p>
            <h2 className="mt-2 text-2xl font-black text-slate-950">Control campaigns by readiness, risk, budget, assets, and execution status</h2>
          </div>
          <div className="flex flex-wrap gap-2">
            <ActionButton tone="dark"><PlayCircle className="h-4 w-4" /> Bulk launch validation</ActionButton>
            <ActionButton tone="light"><PauseCircle className="h-4 w-4" /> Pause selected</ActionButton>
            <ActionButton tone="danger"><Trash2 className="h-4 w-4" /> Archive selected</ActionButton>
          </div>
        </div>
        <div className="mt-5 grid gap-3 lg:grid-cols-[1fr_180px_180px]">
          <div className="relative"><Search className="absolute left-4 top-3.5 h-4 w-4 text-slate-500" /><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search campaign, owner, offer, city, audience..." className={`${inputClass} pl-11`} /></div>
          <select value={stage} onChange={(e) => setStage(e.target.value as CampaignStage | 'all')} className={inputClass}><option value="all">All stages</option>{campaignStages.map((item) => <option key={item} value={item}>{stageLabel(item)}</option>)}</select>
          <select value={risk} onChange={(e) => setRisk(e.target.value as CampaignRisk | 'all')} className={inputClass}><option value="all">All risks</option>{campaignRisks.map((item) => <option key={item} value={item}>{item}</option>)}</select>
        </div>
      </section>
      <section className="grid gap-5">{filtered.map((campaign) => <CampaignCard key={campaign.id} campaign={campaign} selected={selectedIds.includes(campaign.id)} toggle={() => setSelectedIds((ids) => ids.includes(campaign.id) ? ids.filter((id) => id !== campaign.id) : [...ids, campaign.id])} />)}</section>
      <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
        <p className={labelClass}>Executive intelligence</p>
        <h2 className="mt-2 text-2xl font-black">Portfolio command insight</h2>
        <div className="mt-5 grid gap-4 lg:grid-cols-3">
          <div className="rounded-2xl bg-slate-50 p-4"><p className="font-black">Average executive score</p><p className="mt-2 text-3xl font-black">{avgScore}%</p><p className="mt-1 text-sm font-semibold text-slate-9500">Combines readiness, confidence, tasks, budget and risk.</p></div>
          <div className="rounded-2xl bg-slate-50 p-4"><p className="font-black">Strategic bottleneck</p><p className="mt-2 text-sm font-semibold text-slate-600">Approvals and final proof assets are the main launch blockers. Fix these before buying media.</p></div>
          <div className="rounded-2xl bg-slate-50 p-4"><p className="font-black">Recommended next move</p><p className="mt-2 text-sm font-semibold text-slate-600">Run launch-control validation, close missing assets, then approve only campaigns scoring above 75%.</p></div>
        </div>
      </section>
    </div>
  )
}

function Detail({ campaign }: { campaign: ExecutiveCampaign }) {
  return (
    <div className="space-y-6">
      <Link href="/market-os/campaign-lifecycle" className="inline-flex items-center gap-2 text-sm font-black text-slate-600 hover:text-slate-950"><ArrowLeft className="h-4 w-4" /> Back to campaign command</Link>
      <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <div className="flex flex-wrap gap-2"><span className={`rounded-full border px-3 py-1 text-xs font-black ${badgeClass(campaign.stage)}`}>{stageLabel(campaign.stage)}</span><span className={`rounded-full border px-3 py-1 text-xs font-black ${badgeClass(campaign.risk)}`}>{campaign.risk} risk</span></div>
            <h2 className="mt-4 text-4xl font-black text-slate-950">{campaign.title}</h2>
            <p className="mt-3 max-w-4xl text-sm font-semibold leading-6 text-slate-9500">{campaign.hook}</p>
          </div>
          <div className="grid gap-2 sm:grid-cols-2 lg:w-[420px]"><ActionButton tone="dark"><Edit3 className="h-4 w-4" /> Edit campaign</ActionButton><ActionButton tone="light"><ShieldCheck className="h-4 w-4" /> Approve gate</ActionButton><ActionButton tone="light"><MessageSquare className="h-4 w-4" /> Add note</ActionButton><ActionButton tone="danger"><PauseCircle className="h-4 w-4" /> Pause risk</ActionButton></div>
        </div>
      </section>
      <section className="grid gap-4 lg:grid-cols-4"><StatCard icon={<Gauge className="h-5 w-5" />} label="Executive score" value={`${campaignExecutiveScore(campaign)}%`} note="Decision-quality score." /><StatCard icon={<Target className="h-5 w-5" />} label="Readiness" value={`${campaign.readiness}%`} note="Launch gate strength." /><StatCard icon={<DollarSign className="h-5 w-5" />} label="Budget burn" value={`${calculateBudgetBurn(campaign)}%`} note={`${formatMad(campaign.spentMad)} spent.`} /><StatCard icon={<ClipboardCheck className="h-5 w-5" />} label="Task completion" value={`${calculateTaskCompletion(campaign)}%`} note="Execution work closed." /></section>
      <section className="grid gap-5 lg:grid-cols-2">
        <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm"><p className={labelClass}>Strategy brief</p><div className="mt-4 grid gap-4">{[['Objective', campaign.objective], ['Audience', campaign.audience], ['Persona', campaign.persona], ['Offer', campaign.offer], ['Service line', campaign.serviceLine], ['Funnel', campaign.funnelStage], ['CTA', campaign.cta], ['Landing path', campaign.landingPath], ['Decision needed', campaign.decisionNeeded], ['Compliance', campaign.complianceNote]].map(([a,b]) => <div key={a} className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-black uppercase text-slate-9500">{a}</p><p className="mt-1 text-sm font-bold text-slate-800">{b}</p></div>)}</div></div>
        <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm"><p className={labelClass}>Launch warnings</p><div className="mt-4 grid gap-3">{campaignReadinessWarnings(campaign).map((warning: string) => <div key={warning} className="flex items-center gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm font-black text-amber-800"><AlertTriangle className="h-4 w-4" />{warning}</div>)}</div></div>
      </section>
      <section className="grid gap-5 lg:grid-cols-2"><Panel title="Execution tasks" items={campaign.tasks.map((task: any) => ({title: task.title, meta: `${task.department} · ${task.owner} · Due ${task.due}`, status: task.status, note: task.impact}))} /><Panel title="Campaign assets" items={campaign.assets.map((asset: any) => ({title: asset.name, meta: `${asset.type} · ${asset.owner}`, status: asset.status, note: 'Required for campaign quality and launch governance.'}))} /></section>
      <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm"><p className={labelClass}>Experiment room</p><div className="mt-4 grid gap-4">{campaign.experiments.map((experiment: any) => <div key={experiment.id} className="rounded-2xl border border-slate-200 p-4"><div className="flex flex-wrap items-center justify-between gap-2"><p className="font-black">{experiment.name}</p><span className={`rounded-full border px-3 py-1 text-xs font-black ${badgeClass(experiment.status)}`}>{experiment.status}</span></div><p className="mt-2 text-sm font-semibold text-slate-9500">{experiment.hypothesis}</p><div className="mt-3 grid gap-3 md:grid-cols-3"><div className="rounded-xl bg-slate-50 p-3 text-sm font-bold">A: {experiment.variantA}</div><div className="rounded-xl bg-slate-50 p-3 text-sm font-bold">B: {experiment.variantB}</div><div className="rounded-xl bg-slate-50 p-3 text-sm font-bold">Metric: {experiment.decisionMetric}</div></div></div>)}</div></section>
    </div>
  )
}

function Panel({ title, items }: { title: string; items: { title: string; meta: string; status: string; note: string }[] }) {
  return <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm"><p className={labelClass}>{title}</p><div className="mt-4 grid gap-3">{items.map((item) => <div key={item.title} className="rounded-2xl border border-slate-200 p-4"><div className="flex items-start justify-between gap-3"><div><p className="font-black text-slate-950">{item.title}</p><p className="mt-1 text-xs font-bold text-slate-9500">{item.meta}</p></div><span className={`rounded-full border px-3 py-1 text-xs font-black ${badgeClass(item.status)}`}>{item.status}</span></div><p className="mt-2 text-sm font-semibold text-slate-600">{item.note}</p></div>)}</div></section>
}

function CreateCampaign() {
  const [draft, setDraft] = useState<DraftCampaign>(defaultDraft)
  const [created, setCreated] = useState(false)
  const update = (key: keyof DraftCampaign, value: string) => setDraft((current) => ({ ...current, [key]: value }))
  const completion = Math.round((Object.values(draft).filter(Boolean).length / Object.values(draft).length) * 100)
  return (
    <div className="grid gap-6 xl:grid-cols-[1fr_420px]">
      <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm"><p className={labelClass}>Campaign creation studio</p><h2 className="mt-2 text-3xl font-black">Build a campaign with executive launch governance</h2><div className="mt-6 grid gap-4 md:grid-cols-2">{([
        ['title','Campaign title'], ['objective','Objective'], ['channel','Channel'], ['serviceLine','Service line'], ['city','City / territory'], ['audience','Audience'], ['persona','Buyer persona'], ['offer','Offer'], ['hook','Strategic hook'], ['cta','CTA'], ['budgetMad','Budget MAD'], ['launchDate','Launch date'], ['endDate','End date'], ['owner','Owner'], ['complianceNote','Compliance note']
      ] as [keyof DraftCampaign,string][]).map(([key,label]) => <label key={key} className={key === 'hook' || key === 'complianceNote' ? 'md:col-span-2' : ''}><span className={labelClass}>{label}</span>{key === 'hook' || key === 'complianceNote' ? <textarea value={draft[key]} onChange={(e)=>update(key,e.target.value)} className={`${inputClass} mt-2 min-h-28`} /> : <input value={draft[key]} onChange={(e)=>update(key,e.target.value)} className={`${inputClass} mt-2`} />}</label>)}</div><div className="mt-6 flex flex-wrap gap-2"><ActionButton onClick={() => setCreated(true)} tone="dark"><Rocket className="h-4 w-4" /> Save campaign brief</ActionButton><ActionButton tone="light"><Wand2 className="h-4 w-4" /> Generate launch checklist</ActionButton><ActionButton tone="light"><Copy className="h-4 w-4" /> Save as scenario</ActionButton></div>{created && <div className="mt-5 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-black text-emerald-700">Campaign brief saved locally in this workspace. Connect this action to Supabase/API when you are ready for persistence.</div>}</section>
      <aside className="space-y-5"><section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm"><p className={labelClass}>Readiness preview</p><p className="mt-2 text-5xl font-black">{completion}%</p><Bar value={completion} /><p className="mt-3 text-sm font-semibold text-slate-9500">The form forces campaign strategy, audience, offer, budget, owner, CTA and compliance before launch.</p></section><section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm"><p className={labelClass}>Recommended structure</p><div className="mt-4 grid gap-3">{['Brief approved', 'Assets assigned', 'Landing path ready', 'Budget guardrail set', 'Sales handoff ready', 'Approval gate passed'].map((item)=><div key={item} className="flex items-center gap-3 rounded-2xl bg-slate-50 p-3 text-sm font-black"><CheckCircle2 className="h-4 w-4" />{item}</div>)}</div></section></aside>
    </div>
  )
}

function SpecializedRoom({ mode, campaigns }: { mode: WorkspaceMode; campaigns: ExecutiveCampaign[] }) {
  const titleMap: Record<WorkspaceMode, string> = { overview: 'Command', detail: 'Detail', create: 'Create', calendar: 'Calendar and launch timeline', launch: 'Launch readiness control', budget: 'Budget and spend control', performance: 'Performance optimization', approvals: 'Approval governance', experiments: 'Experiment lab', postmortem: 'Post-mortem closure' }
  const iconMap: Record<WorkspaceMode, React.ReactNode> = { overview: <Activity className="h-5 w-5" />, detail: <Eye className="h-5 w-5" />, create: <Plus className="h-5 w-5" />, calendar: <CalendarDays className="h-5 w-5" />, launch: <Rocket className="h-5 w-5" />, budget: <DollarSign className="h-5 w-5" />, performance: <TrendingUp className="h-5 w-5" />, approvals: <ShieldCheck className="h-5 w-5" />, experiments: <Sparkles className="h-5 w-5" />, postmortem: <ClipboardCheck className="h-5 w-5" /> }
  if (mode === 'create') return <CreateCampaign />
  return (
    <div className="space-y-6">
      <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm"><div className="flex items-center gap-3"><div className="rounded-2xl bg-white p-3 text-slate-950">{iconMap[mode]}</div><div><p className={labelClass}>Campaign lifecycle subpage</p><h2 className="text-3xl font-black">{titleMap[mode]}</h2></div></div><p className="mt-4 max-w-4xl text-sm font-semibold leading-6 text-slate-9500">This room is not a generic page. It focuses on one executive workflow: calendar planning, launch control, spend discipline, optimization, approval governance, experimentation or closure learning.</p></section>
      <section className="grid gap-5 lg:grid-cols-3">{campaigns.map((campaign) => <div key={campaign.id} className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm"><div className="flex items-start justify-between gap-3"><div><p className="text-lg font-black">{campaign.title}</p><p className="mt-1 text-sm font-semibold text-slate-9500">{campaign.owner} · {campaign.channel}</p></div><span className={`rounded-full border px-3 py-1 text-xs font-black ${badgeClass(mode === 'budget' ? String(calculateBudgetBurn(campaign) > 70 ? 'high' : 'low') : campaign.stage)}`}>{mode === 'budget' ? `${calculateBudgetBurn(campaign)}% burn` : stageLabel(campaign.stage)}</span></div><div className="mt-4 grid gap-3">{mode === 'calendar' && <><RoomLine label="Launch date" value={campaign.launchDate} /><RoomLine label="End date" value={campaign.endDate} /><RoomLine label="Next milestone" value={campaign.nextAction} /></>}{mode === 'launch' && <><RoomLine label="Readiness" value={`${campaign.readiness}%`} /><RoomLine label="Warnings" value={`${campaignReadinessWarnings(campaign).length}`} /><RoomLine label="Decision" value={campaign.decisionNeeded} /></>}{mode === 'budget' && <><RoomLine label="Budget" value={formatMad(campaign.budgetMad)} /><RoomLine label="Spent" value={formatMad(campaign.spentMad)} /><RoomLine label="Guardrail" value={calculateBudgetBurn(campaign) > 70 ? 'Control spend now' : 'Spend safe'} /></>}{mode === 'performance' && campaign.metrics.map((m: any)=><RoomLine key={m.label} label={m.label} value={`${m.value}/${m.target}${m.suffix || ''}`} />)}{mode === 'approvals' && <><RoomLine label="Decision needed" value={campaign.decisionNeeded} /><RoomLine label="Compliance" value={campaign.complianceNote} /><RoomLine label="Risk" value={campaign.risk} /></>}{mode === 'experiments' && campaign.experiments.map((e: any)=><RoomLine key={e.id} label={e.name} value={e.status} />)}{mode === 'postmortem' && <><RoomLine label="Expected outcome" value={campaign.expectedOutcome} /><RoomLine label="Optimization focus" value={campaign.optimizationFocus} /><RoomLine label="Closure rule" value="Record win/loss learning before archive" /></>}</div><div className="mt-4 flex flex-wrap gap-2"><ActionButton tone="dark"><CheckCircle2 className="h-4 w-4" /> Execute</ActionButton><ActionButton tone="light"><MoreHorizontal className="h-4 w-4" /> More</ActionButton></div></div>)}</section>
    </div>
  )
}

function RoomLine({ label, value }: { label: string; value: string }) { return <div className="rounded-2xl bg-slate-50 p-3"><p className="text-xs font-black uppercase text-slate-9500">{label}</p><p className="mt-1 text-sm font-bold text-slate-800">{value}</p></div> }

export default function CampaignLifecycleExecutiveWorkspace({ mode = 'overview', campaignId }: Props) {
  const campaigns = executiveCampaigns
  const campaign = campaigns.find((item) => item.id === campaignId) || campaigns[0]
  return (
    <main data-market-os-root className="min-h-screen bg-slate-50 px-4 py-6 text-slate-950 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <ExecutiveHeader mode={mode} />
        <NavigationTabs />
        {mode === 'overview' && <Overview campaigns={campaigns} />}
        {mode === 'detail' && <Detail campaign={campaign} />}
        {mode !== 'overview' && mode !== 'detail' && <SpecializedRoom mode={mode} campaigns={campaigns} />}
      </div>
    </main>
  )
}
