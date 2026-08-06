'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { Activity, AlertTriangle, FlaskConical, Loader2, Play, RefreshCw, RotateCcw, Square, Wrench } from 'lucide-react'
import type { MegaProductionDashboard } from '@/lib/revenue-command-os/mega-production/types'
import { managedRevenueHeaders } from '../../_components/action-center/action-events'

export default function ProductionControlWorkbench() {
  const [data, setData] = useState<MegaProductionDashboard | null>(null)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
  const [tab, setTab] = useState<'queues' | 'experiments' | 'forecast' | 'attribution'>('queues')
  const [experiment, setExperiment] = useState({ name: '', hypothesis: '', primaryMetric: 'conversion_rate', sampleSize: '100' })

  const load = useCallback(async () => {
    setBusy(true); setMessage('')
    try {
      const response = await fetch('/api/revenue-command-os/mega-production', { cache: 'no-store' })
      const body = await response.json()
      if (!response.ok || !body.ok) throw new Error(body?.error?.message || 'Chargement impossible.')
      setData(body.data)
    } catch (error) { setMessage(error instanceof Error ? error.message : 'Chargement impossible.') }
    finally { setBusy(false) }
  }, [])
  useEffect(() => { void load() }, [load])

  async function action(path: string, payload: Record<string, unknown>) {
    setBusy(true); setMessage('')
    try {
      const response = await fetch(`/api/revenue-command-os/${path}`, { method: 'POST', headers: managedRevenueHeaders({ 'Content-Type': 'application/json' }), body: JSON.stringify(payload) })
      const body = await response.json()
      if (!response.ok || !body.ok) throw new Error(body?.error?.message || 'Action impossible.')
      setMessage('Action persistée et synchronisée.')
      await load()
      window.dispatchEvent(new CustomEvent('revenue-os:operation-completed', { detail: body.data }))
    } catch (error) { setMessage(error instanceof Error ? error.message : 'Action impossible.') }
    finally { setBusy(false) }
  }

  async function createExperiment() {
    await action('experiments/create', {
      name: experiment.name,
      experimentType: 'commercial_strategy_test',
      hypothesis: experiment.hypothesis,
      primaryMetric: experiment.primaryMetric,
      secondaryMetrics: ['revenue', 'margin', 'meeting_rate'],
      eligiblePopulation: {},
      variants: [
        { code: 'CONTROL', label: 'Contrôle', allocationPercent: 50, payload: {}, control: true },
        { code: 'VARIANT-A', label: 'Variante A', allocationPercent: 50, payload: {}, control: false },
      ],
      sampleSize: Number(experiment.sampleSize || 100),
      approvalClass: 'none',
      attributionWindowDays: 30,
      riskLimit: {}, stopRules: [], idempotencyKey: crypto.randomUUID(),
    })
    setExperiment({ name: '', hypothesis: '', primaryMetric: 'conversion_rate', sampleSize: '100' })
  }

  const deadLetters = useMemo(() => {
    const raw = data as any
    return Array.isArray(raw?.deadLetters) ? raw.deadLetters : []
  }, [data])

  return <section className="mx-auto mt-8 max-w-[1740px] rounded-[42px] border border-violet-200 bg-white p-6 shadow-[0_30px_90px_rgba(76,29,149,.08)] sm:p-8"><div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between"><div><p className="text-[10px] font-black uppercase tracking-[.18em] text-violet-700">Production Control Workbench</p><h2 className="mt-2 text-3xl font-black tracking-[-.045em] text-slate-950">Agir sur les queues, expériences, prévisions et attributions.</h2><p className="mt-3 max-w-4xl text-sm leading-6 text-slate-600">Ce cockpit complète l’observabilité par des mutations opérateur: retry, replay, arrêt, création d’expérience et inspection des résultats.</p></div><button type="button" onClick={() => void load()} disabled={busy} className="inline-flex items-center gap-2 rounded-2xl bg-slate-950 px-5 py-3 text-xs font-black text-white disabled:opacity-50">{busy ? <Loader2 size={15} className="animate-spin" /> : <RefreshCw size={15} />}Actualiser</button></div>
    {message ? <p className={`mt-5 rounded-2xl border p-4 text-sm font-bold ${/impossible|échec|error/i.test(message) ? 'border-rose-200 bg-rose-50 text-rose-800' : 'border-emerald-200 bg-emerald-50 text-emerald-800'}`}>{message}</p> : null}
    <nav className="mt-6 flex flex-wrap gap-2">{(['queues', 'experiments', 'forecast', 'attribution'] as const).map((item) => <button type="button" key={item} onClick={() => setTab(item)} className={`rounded-xl px-4 py-2 text-[10px] font-black uppercase tracking-[.1em] ${tab === item ? 'bg-violet-700 text-white' : 'border border-slate-200 bg-white text-slate-600'}`}>{item}</button>)}</nav>

    {tab === 'queues' ? <div className="mt-6 grid gap-6 xl:grid-cols-[1fr_420px]"><div className="overflow-x-auto rounded-[28px] border border-slate-200"><table className="min-w-full text-left text-xs"><thead className="bg-slate-950 text-white"><tr>{['Queue', 'Profondeur', 'Leased', 'Retries', 'Dead letters', 'Throughput', 'État'].map((item) => <th key={item} className="px-4 py-3 text-[9px] font-black uppercase tracking-[.1em]">{item}</th>)}</tr></thead><tbody>{(data?.queues || []).map((queue) => <tr key={queue.queue} className="border-t border-slate-200"><td className="px-4 py-3 font-black text-slate-950">{queue.queue}</td><td className="px-4 py-3">{queue.depth}</td><td className="px-4 py-3">{queue.leased}</td><td className="px-4 py-3">{queue.retries}</td><td className="px-4 py-3 font-black text-rose-700">{queue.deadLetters}</td><td className="px-4 py-3">{queue.throughputPerMinute}/min</td><td className="px-4 py-3"><span className="rounded-full bg-slate-100 px-3 py-1 text-[9px] font-black uppercase">{queue.status}</span></td></tr>)}{!data?.queues?.length ? <tr><td colSpan={7} className="p-8 text-center text-slate-500">Aucune queue disponible.</td></tr> : null}</tbody></table></div><aside className="rounded-[28px] border border-rose-200 bg-rose-50 p-5"><div className="flex items-center gap-3"><AlertTriangle size={18} className="text-rose-700" /><h3 className="text-lg font-black text-slate-950">Dead letters</h3></div><div className="mt-4 space-y-3">{deadLetters.map((item: any) => <article key={item.id} className="rounded-2xl border border-rose-200 bg-white p-4"><p className="text-sm font-black text-slate-950">{item.queue_name || item.queue || 'Action en échec'}</p><p className="mt-1 break-all font-mono text-[9px] text-slate-400">{item.id}</p><p className="mt-2 text-[10px] leading-5 text-slate-600">{item.error || item.last_error || 'Erreur sans détail.'}</p><div className="mt-3 flex gap-2"><button type="button" onClick={() => void action('production/retry', { jobId: item.job_id || item.id, reason: 'Retry direct depuis Production Control', idempotencyKey: crypto.randomUUID() })} className="inline-flex items-center gap-1 rounded-xl bg-blue-700 px-3 py-2 text-[9px] font-black text-white"><RotateCcw size={12} />Retry</button><button type="button" onClick={() => void action('production/replay', { jobId: item.job_id || item.id, reason: 'Replay direct depuis Production Control', idempotencyKey: crypto.randomUUID() })} className="inline-flex items-center gap-1 rounded-xl bg-violet-700 px-3 py-2 text-[9px] font-black text-white"><Play size={12} />Replay</button></div></article>)}{!deadLetters.length ? <p className="rounded-2xl bg-white p-5 text-sm text-slate-500">Aucune dead letter exposée par le dashboard courant.</p> : null}</div></aside></div> : null}

    {tab === 'experiments' ? <div className="mt-6 grid gap-6 xl:grid-cols-[460px_1fr]"><section className="rounded-[28px] border border-violet-200 bg-violet-50 p-5"><div className="flex items-center gap-3"><FlaskConical size={18} className="text-violet-700" /><h3 className="text-xl font-black text-slate-950">Créer une expérience</h3></div><div className="mt-5 space-y-3"><Field label="Nom" value={experiment.name} onChange={(value) => setExperiment((current) => ({ ...current, name: value }))} /><label className="block text-[10px] font-black uppercase tracking-[.1em] text-slate-500">Hypothèse<textarea value={experiment.hypothesis} onChange={(event) => setExperiment((current) => ({ ...current, hypothesis: event.target.value }))} rows={4} className="mt-2 w-full rounded-2xl border border-violet-200 bg-white px-4 py-3 text-sm font-semibold" /></label><Field label="Métrique principale" value={experiment.primaryMetric} onChange={(value) => setExperiment((current) => ({ ...current, primaryMetric: value }))} /><Field label="Taille échantillon" value={experiment.sampleSize} type="number" onChange={(value) => setExperiment((current) => ({ ...current, sampleSize: value }))} /><button type="button" onClick={() => void createExperiment()} disabled={!experiment.name || experiment.hypothesis.length < 10 || busy} className="inline-flex items-center gap-2 rounded-xl bg-violet-700 px-4 py-2.5 text-xs font-black text-white disabled:opacity-40"><FlaskConical size={15} />Créer</button></div></section><section className="rounded-[28px] border border-slate-200 bg-white p-5"><h3 className="text-xl font-black text-slate-950">Expériences persistées</h3><div className="mt-4 grid gap-4 lg:grid-cols-2">{(data?.experiments || []).map((item: any) => <article key={item.id} className="rounded-2xl border border-slate-200 p-4"><div className="flex items-start justify-between"><div><p className="font-mono text-[9px] font-black text-violet-700">{item.code}</p><h4 className="mt-1 text-sm font-black text-slate-950">{item.name}</h4></div><span className="rounded-full bg-slate-100 px-3 py-1 text-[9px] font-black uppercase">{item.status}</span></div><p className="mt-3 text-xs leading-5 text-slate-600">{item.hypothesis}</p><div className="mt-3 flex gap-2"><button type="button" onClick={() => void action('experiments/activate', { experimentId: item.id, reason: 'Activation directe par opérateur', idempotencyKey: crypto.randomUUID() })} className="inline-flex items-center gap-1 rounded-xl bg-emerald-700 px-3 py-2 text-[9px] font-black text-white"><Play size={12} />Activer</button><button type="button" onClick={() => void action('experiments/stop', { experimentId: item.id, reason: 'Arrêt direct par opérateur', idempotencyKey: crypto.randomUUID() })} className="inline-flex items-center gap-1 rounded-xl bg-slate-700 px-3 py-2 text-[9px] font-black text-white"><Square size={12} />Arrêter</button></div></article>)}{!data?.experiments?.length ? <p className="col-span-full rounded-2xl bg-slate-50 p-6 text-center text-sm text-slate-500">Aucune expérience créée.</p> : null}</div></section></div> : null}

    {tab === 'forecast' ? <section className="mt-6 rounded-[28px] border border-slate-200 bg-white p-6"><div className="flex items-center gap-3"><Activity size={18} className="text-blue-700" /><h3 className="text-xl font-black text-slate-950">Prévision et calibration</h3></div><div className="mt-5 grid gap-4 md:grid-cols-3"><Metric label="Précision" value={`${Math.round(data?.metrics?.forecastAccuracy || 0)}%`} /><Metric label="Anomalies ouvertes" value={data?.metrics?.openAnomalies || 0} /><Metric label="Échantillons learning" value={data?.metrics?.learningSamples || 0} /></div><div className="mt-5 space-y-3">{(data?.calibrations || []).map((item: any) => <pre key={item.id || item.code} className="max-h-44 overflow-auto rounded-2xl bg-slate-950 p-4 text-[10px] leading-5 text-blue-100">{JSON.stringify(item, null, 2)}</pre>)}{!data?.calibrations?.length ? <p className="rounded-2xl bg-slate-50 p-5 text-sm text-slate-500">Aucune calibration persistée.</p> : null}</div></section> : null}

    {tab === 'attribution' ? <section className="mt-6 rounded-[28px] border border-slate-200 bg-white p-6"><div className="flex items-center gap-3"><Wrench size={18} className="text-emerald-700" /><h3 className="text-xl font-black text-slate-950">Attribution et résultats</h3></div><div className="mt-5 grid gap-4 lg:grid-cols-2">{(data?.attributions || []).map((item: any) => <article key={item.id || item.code} className="rounded-2xl border border-slate-200 p-4"><pre className="max-h-52 overflow-auto whitespace-pre-wrap break-all text-[10px] leading-5 text-slate-600">{JSON.stringify(item, null, 2)}</pre></article>)}{!data?.attributions?.length ? <p className="col-span-full rounded-2xl bg-slate-50 p-6 text-sm text-slate-500">Aucune attribution disponible.</p> : null}</div></section> : null}
  </section>
}

function Field({ label, value, onChange, type = 'text' }: { label: string; value: string; onChange: (value: string) => void; type?: string }) { return <label className="block text-[10px] font-black uppercase tracking-[.1em] text-slate-500">{label}<input type={type} value={value} onChange={(event) => onChange(event.target.value)} className="mt-2 h-11 w-full rounded-xl border border-violet-200 bg-white px-3 text-sm font-semibold" /></label> }
function Metric({ label, value }: { label: string; value: string | number }) { return <div className="rounded-2xl bg-slate-50 p-4"><p className="text-[9px] font-black uppercase tracking-[.1em] text-slate-500">{label}</p><p className="mt-2 text-2xl font-black text-slate-950">{value}</p></div> }
