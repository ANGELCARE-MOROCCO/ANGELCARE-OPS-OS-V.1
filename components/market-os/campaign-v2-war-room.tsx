'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { AlertTriangle, ArrowLeft, BarChart3, CheckCircle2, ClipboardList, DollarSign, Flag, Gauge, Link2, PauseCircle, PlayCircle, RefreshCw, Rocket, ShieldCheck, Target, TrendingUp, Wand2 } from 'lucide-react'
import { calculateCampaignHealth, campaignActionPlaybook, type CampaignV2, type CampaignTask } from '@/lib/market-os/campaign-v2'

const card = 'rounded-3xl border border-slate-200 bg-white p-5 shadow-sm'
const btn = 'inline-flex items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-black transition disabled:opacity-50'
function fmt(n:number){return new Intl.NumberFormat('fr-MA').format(Math.round(n||0))}

export function CampaignV2WarRoom({ campaign, tasks }: { campaign: CampaignV2, tasks: CampaignTask[] }) {
  const [current, setCurrent] = useState(campaign)
  const [busy, setBusy] = useState('')
  const [notice, setNotice] = useState('')
  const health = useMemo(() => calculateCampaignHealth(current), [current])
  const playbook = useMemo(() => campaignActionPlaybook(current), [current])

  async function action(action: string) {
    setBusy(action); setNotice('')
    try {
      const res = await fetch(`/api/market-os/campaign-lifecycle/${current.id}/actions`, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ action }) })
      const json = await res.json()
      if (!json.ok) throw new Error(json.error || 'Action failed')
      setCurrent({ ...current, ...json.campaign })
      setNotice(`${action} executed and logged.`)
    } catch(e) { setNotice(e instanceof Error ? e.message : 'Unable to execute action') }
    setBusy('')
  }

  return <div className="min-h-screen bg-slate-50 p-6 text-slate-950"><div className="mx-auto max-w-7xl space-y-6">
    <Link href="/market-os/campaign-lifecycle" className="inline-flex items-center gap-2 text-sm font-black text-slate-600"><ArrowLeft className="h-4 w-4"/> Back to campaign command center</Link>
    <section className="rounded-[2rem] bg-gradient-to-br from-slate-950 via-slate-900 to-rose-950 p-7 text-white shadow-xl">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between"><div><p className="text-xs font-black uppercase tracking-[0.25em] text-rose-200">Campaign war room</p><h1 className="mt-3 text-4xl font-black tracking-tight">{current.title}</h1><p className="mt-3 max-w-3xl text-sm font-semibold leading-7 text-slate-200">{current.objective} · {current.target_audience} · {current.offer}</p></div><div className="grid grid-cols-2 gap-3 md:grid-cols-4 lg:w-[520px]"><Hero label="Health" value={`${health.health}%`} icon={Gauge}/><Hero label="ROI" value={`${health.roi}%`} icon={TrendingUp}/><Hero label="CPL" value={`${health.cpl} MAD`} icon={DollarSign}/><Hero label="Risk" value={`${current.risk_score}%`} icon={AlertTriangle}/></div></div>
    </section>

    <section className="sticky top-3 z-20 rounded-3xl border border-slate-200 bg-white/90 p-3 shadow-lg backdrop-blur"><div className="flex flex-wrap gap-2"><button disabled={!!busy} onClick={()=>action('approve')} className={`${btn} bg-emerald-600 text-white`}><CheckCircle2 className="h-4 w-4"/>Approve</button><button disabled={!!busy} onClick={()=>action('launch')} className={`${btn} bg-slate-950 text-white`}><PlayCircle className="h-4 w-4"/>Launch</button><button disabled={!!busy} onClick={()=>action('pause')} className={`${btn} bg-amber-500 text-white`}><PauseCircle className="h-4 w-4"/>Pause</button><button disabled={!!busy} onClick={()=>action('optimize')} className={`${btn} bg-blue-600 text-white`}><Wand2 className="h-4 w-4"/>Optimize</button><button disabled={!!busy} onClick={()=>action('scale')} className={`${btn} bg-rose-600 text-white`}><Rocket className="h-4 w-4"/>Scale</button><button disabled={!!busy} onClick={()=>action('risk')} className={`${btn} bg-red-600 text-white`}><Flag className="h-4 w-4"/>Flag Risk</button><button disabled={!!busy} onClick={()=>action('close')} className={`${btn} bg-slate-700 text-white`}><ShieldCheck className="h-4 w-4"/>Close</button>{notice && <span className="rounded-2xl bg-slate-100 px-4 py-3 text-sm font-bold text-slate-600">{notice}</span>}</div></section>

    <section className="grid gap-6 lg:grid-cols-[1.1fr_.9fr]"><div className={card}><h2 className="text-2xl font-black">Strategy & execution map</h2><div className="mt-5 grid gap-3 md:grid-cols-2"><Info label="Stage" value={current.stage}/><Info label="Status" value={current.status}/><Info label="Owner" value={current.owner}/><Info label="City" value={current.city}/><Info label="Channels" value={current.channel_mix.join(' + ')}/><Info label="Budget" value={`${fmt(current.budget)} MAD`}/></div><div className="mt-5 rounded-3xl bg-slate-50 p-5"><h3 className="font-black">Next-best-action playbook</h3><ul className="mt-3 space-y-2">{playbook.map(a=><li key={a} className="flex gap-2 text-sm font-semibold text-slate-700"><Target className="mt-0.5 h-4 w-4 shrink-0 text-rose-600"/>{a}</li>)}</ul></div></div><div className={card}><h2 className="text-2xl font-black">Performance cockpit</h2><div className="mt-5 grid grid-cols-2 gap-3"><K label="Leads" value={fmt(current.leads)}/><K label="Qualified" value={fmt(current.qualified_leads)}/><K label="Conversions" value={fmt(current.conversions)}/><K label="Revenue" value={`${fmt(current.revenue)} MAD`}/><K label="Spent" value={`${fmt(current.spent)} MAD`}/><K label="Budget burn" value={`${health.budgetBurn}%`}/></div></div></section>

    <section className="grid gap-6 lg:grid-cols-[1fr_380px]"><div className={card}><h2 className="flex items-center gap-2 text-2xl font-black"><ClipboardList className="h-5 w-5"/> Task orchestration</h2><div className="mt-4 grid gap-3">{tasks.map(t=><div key={t.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4"><div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between"><div><h3 className="font-black">{t.title}</h3><p className="text-sm font-semibold text-slate-500">{t.workstream} · {t.owner} · {t.priority}</p></div><span className="rounded-full bg-white px-3 py-1 text-xs font-black uppercase text-slate-600">{t.status}</span></div></div>)}</div></div><div className={card}><h2 className="flex items-center gap-2 text-2xl font-black"><Link2 className="h-5 w-5"/> Connected workspaces</h2><div className="mt-4 grid gap-3">{[['Content Command Center','/market-os/content-command-center'],['SEO Blog Workspace','/market-os/seo-blog-workspace'],['Ambassador Program','/market-os/ambassador-program'],['Partners Network','/market-os/partners-network']].map(([l,u])=><Link key={u} href={u} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-black hover:bg-white">{l}</Link>)}</div></div></section>
  </div></div>
}
function Hero({label,value,icon:Icon}:any){return <div className="rounded-3xl border border-white/10 bg-white/10 p-4"><Icon className="mb-3 h-5 w-5 text-rose-200"/><div className="text-xs font-bold uppercase text-slate-300">{label}</div><div className="mt-1 text-xl font-black">{value}</div></div>}
function Info({label,value}:{label:string,value:string}){return <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-black uppercase text-slate-400">{label}</p><p className="mt-1 font-black">{value}</p></div>}
function K({label,value}:{label:string,value:string}){return <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-black uppercase text-slate-400">{label}</p><p className="mt-1 text-xl font-black">{value}</p></div>}
