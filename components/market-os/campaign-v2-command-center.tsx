'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { Activity, AlertTriangle, ArrowRight, BarChart3, CalendarDays, CheckCircle2, ClipboardList, DollarSign, FileText, Flag, Gauge, Layers, Megaphone, PauseCircle, PlayCircle, Plus, RefreshCw, Rocket, Search, ShieldCheck, Sparkles, Target, TrendingUp, Users, Wand2 } from 'lucide-react'
import { calculateCampaignHealth, campaignActionPlaybook, campaignScenarioTemplates, campaignStages, fallbackCampaigns, type CampaignV2 } from '@/lib/market-os/campaign-v2'

const card = 'rounded-3xl border border-slate-200 bg-white p-5 shadow-sm'
const input = 'w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold outline-none focus:border-slate-900 focus:ring-4 focus:ring-rose-100'

function badge(value: string) {
  if (['active','live','scale','completed'].includes(value)) return 'border-emerald-200 bg-emerald-50 text-emerald-700'
  if (['risk','paused'].includes(value)) return 'border-red-200 bg-red-50 text-red-700'
  if (['approval','optimize'].includes(value)) return 'border-amber-200 bg-amber-50 text-amber-700'
  return 'border-slate-200 bg-slate-50 text-slate-700'
}

function fmt(n: number) { return new Intl.NumberFormat('fr-MA').format(Math.round(n || 0)) }

export function CampaignV2CommandCenter() {
  const [campaigns, setCampaigns] = useState<CampaignV2[]>(fallbackCampaigns)
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState('')
  const [stage, setStage] = useState('all')
  const [creating, setCreating] = useState(false)
  const [form, setForm] = useState({ title: '', owner: '', city: 'Rabat / Témara', template: campaignScenarioTemplates[0].name })
  const [notice, setNotice] = useState('')

  async function load() {
    setLoading(true)
    try {
      const res = await fetch('/api/market-os/campaign-lifecycle')
      const json = await res.json()
      if (json.ok && Array.isArray(json.campaigns)) setCampaigns(json.campaigns)
    } catch {}
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const filtered = useMemo(() => campaigns.filter(c => {
    const q = query.toLowerCase().trim()
    return (!q || c.title.toLowerCase().includes(q) || c.objective.toLowerCase().includes(q) || c.city.toLowerCase().includes(q)) && (stage === 'all' || c.stage === stage)
  }), [campaigns, query, stage])

  const summary = useMemo(() => campaigns.reduce((acc, c) => {
    const h = calculateCampaignHealth(c)
    acc.budget += c.budget; acc.spent += c.spent; acc.leads += c.leads; acc.conversions += c.conversions; acc.revenue += c.revenue; acc.risk += c.risk_score > 50 ? 1 : 0; acc.health += h.health
    return acc
  }, { budget:0, spent:0, leads:0, conversions:0, revenue:0, risk:0, health:0 }), [campaigns])

  async function createCampaign() {
    const tpl = campaignScenarioTemplates.find(t => t.name === form.template) || campaignScenarioTemplates[0]
    setCreating(true); setNotice('')
    try {
      const res = await fetch('/api/market-os/campaign-lifecycle', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ title: form.title || tpl.name, owner: form.owner || 'Marketing Lead', city: form.city, objective: tpl.objective, target_audience: tpl.audience, offer: tpl.offer, channel_mix: tpl.channels, budget: tpl.budget, stage:'strategy', status:'draft', readiness_score:72 }) })
      const json = await res.json()
      if (!json.ok) throw new Error(json.error || 'Create failed')
      setNotice('Campaign created and synced to database.')
      setForm({ title:'', owner:'', city:'Rabat / Témara', template: campaignScenarioTemplates[0].name })
      await load()
    } catch (e) { setNotice(e instanceof Error ? e.message : 'Unable to create campaign') }
    setCreating(false)
  }

  return <div className="min-h-screen bg-slate-50 p-6 text-slate-950">
    <div className="mx-auto max-w-7xl space-y-6">
      <section className="rounded-[2rem] bg-gradient-to-br from-slate-950 via-slate-900 to-rose-950 p-7 text-white shadow-xl">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-xs font-black uppercase tracking-[0.2em] text-rose-100"><Sparkles className="h-4 w-4"/> Campaign Lifecycle V2</div>
            <h1 className="text-4xl font-black tracking-tight md:text-5xl">Campaign command center for strategy, launch, control, optimization and closure.</h1>
            <p className="mt-4 text-sm font-semibold leading-7 text-slate-200">A mature execution workspace connecting content, SEO, ambassadors, partners, leads, budget, approvals, risk and ROI into one operating system.</p>
          </div>
          <div className="grid grid-cols-2 gap-3 text-sm md:grid-cols-4 lg:w-[520px]">
            {[['Budget', `${fmt(summary.budget)} MAD`, DollarSign], ['Revenue', `${fmt(summary.revenue)} MAD`, TrendingUp], ['Leads', fmt(summary.leads), Users], ['Risk', `${summary.risk} flags`, AlertTriangle]].map(([label,value,Icon]: any) => <div key={label} className="rounded-3xl border border-white/10 bg-white/10 p-4"><Icon className="mb-3 h-5 w-5 text-rose-200"/><div className="text-xs font-bold uppercase text-slate-300">{label}</div><div className="mt-1 text-xl font-black">{value}</div></div>)}
          </div>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-4">
        <div className={card}><Gauge className="h-5 w-5 text-emerald-600"/><p className="mt-3 text-xs font-black uppercase text-slate-500">Avg health</p><p className="text-3xl font-black">{campaigns.length ? Math.round(summary.health / campaigns.length) : 0}%</p></div>
        <div className={card}><Target className="h-5 w-5 text-blue-600"/><p className="mt-3 text-xs font-black uppercase text-slate-500">Conversions</p><p className="text-3xl font-black">{fmt(summary.conversions)}</p></div>
        <div className={card}><BarChart3 className="h-5 w-5 text-purple-600"/><p className="mt-3 text-xs font-black uppercase text-slate-500">Spend</p><p className="text-3xl font-black">{fmt(summary.spent)} MAD</p></div>
        <div className={card}><ShieldCheck className="h-5 w-5 text-rose-600"/><p className="mt-3 text-xs font-black uppercase text-slate-500">Control model</p><p className="text-3xl font-black">7 stages</p></div>
      </section>

      <section className="grid gap-6 lg:grid-cols-[1fr_420px]">
        <div className={card}>
          <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div><h2 className="text-2xl font-black">Live campaign portfolio</h2><p className="text-sm font-semibold text-slate-500">Filter, open war rooms, and monitor execution health.</p></div>
            <button onClick={load} className="inline-flex items-center gap-2 rounded-2xl bg-slate-950 px-4 py-3 text-sm font-black text-white"><RefreshCw className="h-4 w-4"/> Refresh</button>
          </div>
          <div className="grid gap-3 md:grid-cols-[1fr_220px]">
            <div className="relative"><Search className="absolute left-4 top-3.5 h-4 w-4 text-slate-400"/><input className={`${input} pl-10`} value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search campaigns, cities, objectives"/></div>
            <select className={input} value={stage} onChange={e=>setStage(e.target.value)}><option value="all">All stages</option>{campaignStages.map(s=><option key={s} value={s}>{s}</option>)}</select>
          </div>
          <div className="mt-5 grid gap-4">
            {loading ? <div className="rounded-3xl bg-slate-100 p-8 text-center font-bold text-slate-500">Loading campaigns...</div> : filtered.map(c => {
              const h = calculateCampaignHealth(c); const playbook = campaignActionPlaybook(c)
              return <Link href={`/market-os/campaign-lifecycle/${c.id}`} key={c.id} className="block rounded-3xl border border-slate-200 bg-slate-50 p-5 transition hover:-translate-y-0.5 hover:bg-white hover:shadow-md">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><span className={`rounded-full border px-3 py-1 text-xs font-black uppercase ${badge(c.status)}`}>{c.status}</span><span className={`rounded-full border px-3 py-1 text-xs font-black uppercase ${badge(c.stage)}`}>{c.stage}</span><span className="rounded-full bg-white px-3 py-1 text-xs font-black text-slate-600">{c.city}</span></div><h3 className="mt-3 text-xl font-black">{c.title}</h3><p className="mt-1 text-sm font-semibold text-slate-600">{c.objective} · {c.target_audience} · {c.offer}</p><p className="mt-3 text-sm font-bold text-rose-700">Next: {playbook[0]}</p></div>
                  <div className="grid grid-cols-4 gap-2 text-center lg:w-[430px]"><Mini label="Health" value={`${h.health}%`}/><Mini label="ROI" value={`${h.roi}%`}/><Mini label="CPL" value={`${h.cpl}`}/><Mini label="Burn" value={`${h.budgetBurn}%`}/></div>
                </div><div className="mt-4 flex items-center justify-between rounded-2xl bg-white px-4 py-3 text-sm font-black text-slate-600"><span>{c.channel_mix.join(' + ')}</span><span className="inline-flex items-center gap-1 text-slate-950">Open war room <ArrowRight className="h-4 w-4"/></span></div>
              </Link>
            })}
          </div>
        </div>

        <aside className="space-y-6">
          <div className={card}>
            <h2 className="flex items-center gap-2 text-xl font-black"><Plus className="h-5 w-5"/> Create campaign</h2>
            <div className="mt-4 space-y-3"><input className={input} placeholder="Campaign title" value={form.title} onChange={e=>setForm({...form,title:e.target.value})}/><input className={input} placeholder="Owner" value={form.owner} onChange={e=>setForm({...form,owner:e.target.value})}/><input className={input} placeholder="City / territory" value={form.city} onChange={e=>setForm({...form,city:e.target.value})}/><select className={input} value={form.template} onChange={e=>setForm({...form,template:e.target.value})}>{campaignScenarioTemplates.map(t=><option key={t.name}>{t.name}</option>)}</select><button disabled={creating} onClick={createCampaign} className="w-full rounded-2xl bg-rose-600 px-4 py-3 text-sm font-black text-white disabled:opacity-50"><Rocket className="mr-2 inline h-4 w-4"/>{creating ? 'Creating...' : 'Create synced campaign'}</button>{notice && <p className="rounded-2xl bg-slate-100 p-3 text-sm font-bold text-slate-700">{notice}</p>}</div>
          </div>
          <div className={card}>
            <h2 className="flex items-center gap-2 text-xl font-black"><Layers className="h-5 w-5"/> Operational gateways</h2>
            <div className="mt-4 grid gap-3">{[['Tasks','tasks',ClipboardList],['Budget','budget',DollarSign],['Approvals','approvals',CheckCircle2],['Analytics','analytics',BarChart3],['Automation','automation',Wand2],['Cross-module links','links',Megaphone],['Calendar','calendar',CalendarDays]].map(([l,path,Icon]: any)=><Link key={path} href={`/market-os/campaign-lifecycle/${path}`} className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-black hover:bg-white"><span className="inline-flex items-center gap-2"><Icon className="h-4 w-4 text-rose-600"/>{l}</span><ArrowRight className="h-4 w-4"/></Link>)}</div>
          </div>
        </aside>
      </section>
    </div>
  </div>
}

function Mini({label,value}:{label:string,value:string}) { return <div className="rounded-2xl bg-white p-3"><div className="text-[10px] font-black uppercase text-slate-400">{label}</div><div className="text-lg font-black text-slate-950">{value}</div></div> }
