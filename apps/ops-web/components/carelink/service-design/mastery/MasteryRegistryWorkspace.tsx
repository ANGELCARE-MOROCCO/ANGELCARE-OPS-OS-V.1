'use client'

import { AlertTriangle, ArrowRight, BriefcaseBusiness, CalendarDays, Loader2, PackageCheck, Plus, RefreshCw, Search, ShieldCheck, Sparkles } from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { serviceDesignRequest, explainServiceDesignError } from '@/components/carelink/service-design/feedback/client'
import type { MasteryDomain } from './types'

type RegistryPayload = { domain: MasteryDomain; label: string; records: Array<Record<string, any>> }

const config: Record<MasteryDomain, { eyebrow: string; title: string; description: string; gradient: string; icon: typeof Sparkles; detail: (id: string) => string; createHref?: string; createLabel?: string }> = {
  planning_request: { eyebrow: 'Planning Request Registry', title: 'Demandes de planification', description: 'Chaque demande ouvre son vrai dossier avec bénéficiaires, dates, faisabilité, scénarios et plan.', gradient: 'from-blue-600 to-cyan-400', icon: CalendarDays, detail: (id) => `/carelink-ops/service-design/planning/requests/${id}`, createHref: '/carelink-ops/service-design/planning/new', createLabel: 'Nouvelle planification' },
  planning_plan: { eyebrow: 'Technical Plan Registry', title: 'Plans techniques', description: 'Versions, jours, blocs, validation et documents reliés à chaque plan.', gradient: 'from-violet-600 to-fuchsia-400', icon: ShieldCheck, detail: (id) => `/carelink-ops/service-design/planning/plans/${id}` },
  commercial_request: { eyebrow: 'Commercial Request Registry', title: 'Demandes commerciales', description: 'Sources techniques, génération de scénarios et continuité vers les offres.', gradient: 'from-emerald-600 to-teal-400', icon: BriefcaseBusiness, detail: (id) => `/carelink-ops/service-design/offers/requests/${id}`, createHref: '/carelink-ops/service-design/offers/new', createLabel: 'Nouvelle demande commerciale' },
  commercial_scenario: { eyebrow: 'Commercial Scenario Registry', title: 'Scénarios commerciaux', description: 'Promesses, inclusions, calculs et conversion directe en offres.', gradient: 'from-emerald-600 to-cyan-400', icon: Sparkles, detail: (id) => `/carelink-ops/service-design/offers/scenarios/${id}` },
  offer: { eyebrow: 'Offer Registry', title: 'Offres', description: 'Offres réelles, calculs, versions et conversion en références vendables.', gradient: 'from-amber-500 to-orange-400', icon: BriefcaseBusiness, detail: (id) => `/carelink-ops/service-design/offers/scenarios/${id}` },
  bundle: { eyebrow: 'Bundle Registry', title: 'Bundles', description: 'Composition, compatibilité, calcul et publication des packages commerciaux.', gradient: 'from-violet-600 to-fuchsia-400', icon: PackageCheck, detail: (id) => `/carelink-ops/service-design/bundles/${id}`, createHref: '/carelink-ops/service-design/bundles/new', createLabel: 'Nouveau bundle' },
  sellable: { eyebrow: 'Vitrine Registry', title: 'Références vendables', description: 'Versions, prix, publications, documents et préparation CARELINK.', gradient: 'from-emerald-600 to-teal-400', icon: Sparkles, detail: (id) => `/carelink-ops/service-design/vitrine/${id}` },
  handoff: { eyebrow: 'CARELINK Handoff Registry', title: 'Handoffs CARELINK', description: 'Dossiers, préflights, transmissions et réconciliations réels.', gradient: 'from-blue-600 to-cyan-400', icon: ShieldCheck, detail: (id) => `/carelink-ops/service-design/handoffs/${id}`, createHref: '/carelink-ops/service-design/handoffs/new', createLabel: 'Nouveau handoff' },
  handoff_amendment: { eyebrow: 'Amendment Registry', title: 'Amendements CARELINK', description: 'Modifications ciblées et impacts reliés aux dossiers sources.', gradient: 'from-amber-500 to-orange-400', icon: ShieldCheck, detail: (id) => `/carelink-ops/service-design/handoffs/amendments/${id}` },
  customer_case: { eyebrow: 'Customer Experience Registry', title: 'Dossiers expérience client', description: 'Chaque dossier ouvre sa chronologie, ses actions de récupération et sa confirmation client.', gradient: 'from-rose-600 to-pink-400', icon: AlertTriangle, detail: (id) => `/carelink-ops/service-design/customer-experience/cases/${id}` },
  incident: { eyebrow: 'Incident Registry', title: 'Incidents opérationnels', description: 'Chronologie, investigation, résolution et retour d’expérience par incident.', gradient: 'from-rose-600 to-orange-400', icon: AlertTriangle, detail: (id) => `/carelink-ops/service-design/operations/incidents/${id}` },
  quality_signal: { eyebrow: 'Quality Signal Registry', title: 'Signaux qualité', description: 'Sources, impacts, causes et passage direct à l’amélioration.', gradient: 'from-amber-500 to-yellow-300', icon: Sparkles, detail: (id) => `/carelink-ops/service-design/quality/signals/${id}` },
  improvement: { eyebrow: 'Improvement Registry', title: 'Améliorations', description: 'Hypothèses, impacts, décisions et releases de chaque amélioration.', gradient: 'from-emerald-600 to-cyan-400', icon: Sparkles, detail: (id) => `/carelink-ops/service-design/quality/improvements/${id}` },
}

function statusClass(value: string) {
  if (['active', 'approved', 'published', 'valid', 'resolved', 'closed', 'committed'].includes(value)) return 'border-emerald-200 bg-emerald-50 text-emerald-700'
  if (['blocked', 'failed', 'rejected'].includes(value)) return 'border-rose-200 bg-rose-50 text-rose-700'
  return 'border-amber-200 bg-amber-50 text-amber-800'
}

export function MasteryRegistryWorkspace({ domain }: { domain: MasteryDomain }) {
  const meta = config[domain]
  const Icon = meta.icon
  const [payload, setPayload] = useState<RegistryPayload | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [query, setQuery] = useState('')

  const refresh = useCallback(async () => {
    setLoading(true); setError(null)
    try { setPayload(await serviceDesignRequest<RegistryPayload>(`/api/carelink-ops/service-design/mastery/${domain}`)) }
    catch (reason) { const value = explainServiceDesignError(reason, 'Registre impossible à charger.'); setError(`${value.message} ${value.instruction}`) }
    finally { setLoading(false) }
  }, [domain])

  useEffect(() => { void refresh() }, [refresh])
  const records = useMemo(() => (payload?.records || []).filter((record) => {
    const needle = query.trim().toLowerCase(); if (!needle) return true
    return [record.code, record.title, record.name, record.commercial_name, record.summary, record.status].some((value) => String(value || '').toLowerCase().includes(needle))
  }), [payload, query])

  return <div className="space-y-6">
    <section className="relative overflow-hidden rounded-[38px] border border-slate-800 bg-[linear-gradient(135deg,#06132a_0%,#0d2446_58%,#123f72_100%)] px-6 py-8 text-white shadow-[0_30px_90px_rgba(15,23,42,.25)] sm:px-8"><div className={`absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r ${meta.gradient}`} /><div className="flex flex-wrap items-start justify-between gap-7"><div className="max-w-4xl"><div className="flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-2xl bg-white/10 text-cyan-300"><Icon size={18} /></span><p className="text-[9px] font-black uppercase tracking-[.28em] text-cyan-300">ANGELCARE · {meta.eyebrow}</p></div><h1 className="mt-5 text-4xl font-black tracking-[-.055em] sm:text-5xl">{meta.title}</h1><p className="mt-4 max-w-3xl text-sm font-semibold leading-6 text-slate-300">{meta.description}</p></div><div className="flex flex-wrap gap-2">{meta.createHref ? <a href={meta.createHref} className="inline-flex items-center gap-2 rounded-2xl bg-blue-600 px-4 py-2.5 text-xs font-black text-white hover:bg-blue-700"><Plus size={14} />{meta.createLabel}</a> : null}<button type="button" onClick={() => void refresh()} className="inline-flex items-center gap-2 rounded-2xl border border-white/15 bg-white/5 px-4 py-2.5 text-xs font-black"><RefreshCw size={14} />Actualiser</button></div></div></section>

    <section className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-[0_16px_48px_rgba(15,23,42,.06)]"><div className="flex flex-wrap items-center justify-between gap-4"><label className="relative min-w-[280px] flex-1"><Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" /><input value={query} onChange={(event: any) => setQuery(event.target.value)} placeholder="Rechercher par code, titre, statut…" className="w-full rounded-2xl border border-slate-200 py-3 pl-11 pr-4 text-sm font-semibold outline-none focus:border-blue-400" /></label><span className="rounded-full border border-blue-100 bg-blue-50 px-3 py-1.5 text-[10px] font-black uppercase tracking-[.14em] text-blue-700">{records.length} dossier(s)</span></div></section>

    {loading ? <div className="grid min-h-[340px] place-items-center rounded-[28px] border border-slate-200 bg-white"><Loader2 className="animate-spin text-blue-600" size={28} /></div> : error ? <div className="rounded-[28px] border border-rose-200 bg-rose-50 p-6"><p className="font-black text-rose-950">Registre indisponible</p><p className="mt-2 text-sm font-semibold text-rose-700">{error}</p></div> : records.length ? <section className="grid gap-4 xl:grid-cols-2">{records.map((record) => <a key={record.id} href={meta.detail(record.id)} className="group relative overflow-hidden rounded-[28px] border border-slate-200 bg-white p-5 shadow-[0_14px_40px_rgba(15,23,42,.05)] transition hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-[0_24px_60px_rgba(37,99,235,.10)]"><div className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${meta.gradient}`} /><div className="flex items-start justify-between gap-4"><div><p className="text-[9px] font-black uppercase tracking-[.16em] text-slate-400">{record.code || domain.replaceAll('_', ' ')}</p><h2 className="mt-2 text-xl font-black tracking-[-.035em] text-slate-950">{record.title || record.name || record.commercial_name || record.code}</h2><p className="mt-2 line-clamp-2 text-xs font-semibold leading-5 text-slate-500">{record.summary || record.promise || record.commercial_objective || record.reason || 'Ouvrir le dossier complet.'}</p></div><span className={`rounded-full border px-2.5 py-1 text-[9px] font-black uppercase tracking-[.12em] ${statusClass(String(record.status || 'draft'))}`}>{String(record.status || 'draft').replaceAll('_', ' ')}</span></div><div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-4"><span className="text-[10px] font-black uppercase tracking-[.12em] text-slate-400">Mis à jour {new Date(record.updated_at || record.created_at || Date.now()).toLocaleDateString('fr-FR')}</span><span className="inline-flex items-center gap-2 text-xs font-black text-blue-700">Ouvrir <ArrowRight size={14} className="transition group-hover:translate-x-1" /></span></div></a>)}</section> : <div className="rounded-[30px] border border-dashed border-slate-200 bg-white px-6 py-16 text-center"><Icon className="mx-auto text-slate-300" size={34} /><h2 className="mt-4 text-xl font-black text-slate-950">Aucun dossier réel</h2><p className="mt-2 text-sm font-semibold text-slate-500">Créez le premier dossier depuis sa source métier; aucun enregistrement fictif n’est affiché.</p>{meta.createHref ? <a href={meta.createHref} className="mt-5 inline-flex items-center gap-2 rounded-2xl bg-blue-600 px-4 py-2.5 text-xs font-black text-white"><Plus size={14} />{meta.createLabel}</a> : null}</div>}
  </div>
}
