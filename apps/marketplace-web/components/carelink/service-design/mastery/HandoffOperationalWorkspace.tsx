'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import {
  AlertTriangle, ArrowRight, CalendarDays, CheckCircle2, ClipboardCheck, FileText,
  Loader2, Network, Plus, RefreshCw, Route, Smartphone, Trash2, UserRound,
  UsersRound, WalletCards, Wrench,
} from 'lucide-react'
import { explainServiceDesignError } from '@/components/carelink/service-design/feedback/client'
import { useServiceDesignActions } from '@/components/carelink/service-design/feedback/ServiceDesignActionCenter'
import { listMastery, loadMastery, masteryAction } from './client'
import type { MasteryPayload } from './types'

type Section =
  | 'customer' | 'beneficiaries' | 'calendar' | 'sub_missions' | 'programmes' | 'staffing'
  | 'routes' | 'allowances' | 'checklists' | 'reports' | 'mobile_brief' | 'failures'
  | 'reconciliation' | 'amendments' | 'overview'

type Row = Record<string, any>

const sectionMeta: Record<Section, { title: string; detail: string; icon: typeof Network; key: string }> = {
  overview: { title: 'Dossier CARELINK opérationnel', detail: 'Architecture complète du handoff sélectionné.', icon: Network, key: 'events' },
  customer: { title: 'Client & contacts', detail: 'Référence client, instantanés confirmés et accès opérationnel.', icon: UserRound, key: 'customers' },
  beneficiaries: { title: 'Bénéficiaires', detail: 'Bénéficiaires réellement attachés au handoff.', icon: UsersRound, key: 'beneficiaries' },
  calendar: { title: 'Calendrier missions', detail: 'Dates et fenêtres horaires réellement transmises.', icon: CalendarDays, key: 'dates' },
  sub_missions: { title: 'Sous-missions', detail: 'Blueprints datés qui deviendront les sous-missions CARELINK.', icon: Network, key: 'subMissions' },
  programmes: { title: 'Programmes', detail: 'Blocs de programme issus du plan technique sélectionné.', icon: ClipboardCheck, key: 'programmes' },
  staffing: { title: 'Staffing', detail: 'Besoins de personnel issus du snapshot et des programmes.', icon: UsersRound, key: 'programmes' },
  routes: { title: 'Routes & transport', detail: 'Routes et consignes transport rattachées au dossier.', icon: Route, key: 'routes' },
  allowances: { title: 'Allowances', detail: 'Indemnités opérationnelles préparées pour CARELINK.', icon: WalletCards, key: 'allowances' },
  checklists: { title: 'Checklists', detail: 'Checklists dynamiques préparées pour chaque mission.', icon: CheckCircle2, key: 'checklists' },
  reports: { title: 'Rapports', detail: 'Structures de rapports attendues après l’exécution terrain.', icon: FileText, key: 'reports' },
  mobile_brief: { title: 'Brief mobile', detail: 'Brief terrain versionné pour l’application CARELINK.', icon: Smartphone, key: 'mobileBriefs' },
  failures: { title: 'Échecs & récupération', detail: 'Échecs réels, causes et possibilités de reprise.', icon: AlertTriangle, key: 'failures' },
  reconciliation: { title: 'Réconciliation', detail: 'Comparaison réelle entre handoff et dossiers CARELINK créés.', icon: RefreshCw, key: 'reconciliationFindings' },
  amendments: { title: 'Amendements', detail: 'Modifications préparées après création du handoff.', icon: Wrench, key: 'amendments' },
}

function array(value: unknown): Row[] { return Array.isArray(value) ? value as Row[] : [] }
function label(row: Row) { return row.title || row.name_fr || row.name || row.label || row.code || row.service_date || row.target_type || row.id }
function detail(row: Row) {
  const value = row.detail || row.summary || row.description_fr || row.daily_objective || row.reason || row.status || row.target_value
  if (value && typeof value === 'object') return JSON.stringify(value)
  return String(value || '')
}

function State({ value }: { value: unknown }) {
  const text = String(value || 'draft')
  const positive = ['valid', 'ready', 'confirmed', 'completed', 'reconciled', 'published', 'success'].includes(text)
  const negative = ['failed', 'blocked', 'critical', 'rejected'].includes(text)
  return <span className={`rounded-full border px-2.5 py-1 text-[9px] font-black uppercase tracking-[.12em] ${positive ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : negative ? 'border-rose-200 bg-rose-50 text-rose-700' : 'border-amber-200 bg-amber-50 text-amber-800'}`}>{text.replaceAll('_', ' ')}</span>
}

function JsonSummary({ value }: { value: unknown }) {
  if (!value || typeof value !== 'object') return <p className="text-sm font-semibold text-slate-500">Aucune donnée structurée.</p>
  const entries = Object.entries(value as Row).slice(0, 12)
  if (!entries.length) return <p className="text-sm font-semibold text-slate-500">Aucune donnée structurée.</p>
  return <div className="grid gap-2 sm:grid-cols-2">{entries.map(([key, item]) => <article key={key} className="rounded-2xl border border-slate-200 bg-slate-50 p-3"><p className="text-[9px] font-black uppercase tracking-[.12em] text-slate-400">{key.replaceAll('_', ' ')}</p><p className="mt-1 break-words text-xs font-bold text-slate-800">{typeof item === 'object' ? JSON.stringify(item) : String(item ?? '—')}</p></article>)}</div>
}

export function HandoffOperationalWorkspace({ section }: { section: Section }) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const actions = useServiceDesignActions()
  const [records, setRecords] = useState<Row[]>([])
  const [payload, setPayload] = useState<MasteryPayload | null>(null)
  const [selectedId, setSelectedId] = useState(searchParams.get('handoffId') || '')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [dateForm, setDateForm] = useState({ serviceDate: '', startTime: '09:00', endTime: '17:00', dailyObjective: '' })

  const meta = sectionMeta[section]
  const Icon = meta.icon

  const load = useCallback(async () => {
    setLoading(true); setError(null)
    try {
      const registry = await listMastery('handoff')
      const rows = registry.records || []
      setRecords(rows)
      const id = selectedId || rows[0]?.id || ''
      if (id && id !== selectedId) setSelectedId(id)
      if (id) setPayload(await loadMastery('handoff', id))
      else setPayload(null)
    } catch (reason) {
      const value = explainServiceDesignError(reason, 'Impossible de charger les handoffs.')
      setError(`${value.message} ${value.instruction}`)
    } finally { setLoading(false) }
  }, [selectedId])

  useEffect(() => { void load() }, [load])

  const select = (id: string) => {
    setSelectedId(id)
    const params = new URLSearchParams(searchParams.toString())
    params.set('handoffId', id)
    router.replace(`?${params.toString()}`, { scroll: false })
  }

  const run = async (title: string, job: () => Promise<any>, success: string) => {
    const actionId = actions.start({ title, detail: payload?.record?.code || selectedId, progress: 12, currentStep: 'Connexion au dossier' })
    try {
      actions.update(actionId, { progress: 52, currentStep: 'Exécution de l’opération' })
      const result = await job()
      actions.succeed(actionId, { detail: success, currentStep: 'Terminé' })
      await load()
      return result
    } catch (reason) {
      const value = explainServiceDesignError(reason, 'Action impossible.')
      actions.fail(actionId, { detail: value.message, instruction: value.instruction, preserved: value.preserved })
      return null
    }
  }

  const rows = useMemo(() => array(payload?.related?.[meta.key]), [meta.key, payload])

  if (loading) return <div className="grid min-h-[520px] place-items-center rounded-[34px] border border-slate-200 bg-white"><Loader2 className="animate-spin text-blue-600" size={30}/></div>

  return <div className="space-y-6">
    <section className="relative overflow-hidden rounded-[38px] border border-slate-800 bg-[linear-gradient(135deg,#06132a,#0e2c53_58%,#146089)] p-7 text-white shadow-[0_28px_90px_rgba(15,23,42,.24)]">
      <div className="absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-blue-500 via-cyan-400 to-emerald-400"/>
      <div className="relative flex flex-wrap items-start justify-between gap-6"><div><div className="flex items-center gap-3"><span className="grid h-11 w-11 place-items-center rounded-2xl bg-white/10 text-cyan-300"><Icon size={19}/></span><p className="text-[9px] font-black uppercase tracking-[.28em] text-cyan-300">CARELINK Bridge · dossier réel</p></div><h1 className="mt-5 text-3xl font-black tracking-[-.05em] sm:text-5xl">{meta.title}</h1><p className="mt-3 max-w-3xl text-sm font-semibold text-slate-300">{meta.detail}</p></div><div className="min-w-[270px] rounded-[22px] border border-white/10 bg-white/5 p-4"><label className="text-[9px] font-black uppercase tracking-[.14em] text-slate-300">Handoff actif</label><select value={selectedId} onChange={(event: any) => select(event.target.value)} className="mt-2 w-full rounded-xl border border-white/10 bg-slate-950 px-3 py-3 text-xs font-bold text-white"><option value="">Choisir un dossier</option>{records.map((record) => <option key={record.id} value={record.id}>{record.code} · {record.status}</option>)}</select></div></div>
    </section>

    {error ? <section className="rounded-[28px] border border-rose-200 bg-rose-50 p-6"><p className="font-black text-rose-950">Chargement impossible</p><p className="mt-2 text-sm font-semibold text-rose-700">{error}</p><button type="button" onClick={() => void load()} className="mt-4 rounded-xl bg-rose-600 px-4 py-2 text-xs font-black text-white">Réessayer</button></section> : null}

    {!payload ? <section className="rounded-[30px] border border-dashed border-slate-300 bg-white p-12 text-center"><Network className="mx-auto text-slate-400"/><h2 className="mt-4 text-xl font-black">Aucun handoff disponible</h2><p className="mt-2 text-sm font-semibold text-slate-500">Préparez un handoff depuis une référence vendable ou un plan technique.</p><a href="/carelink-ops/service-design/handoffs/new" className="mt-5 inline-flex rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-black text-white">Créer un handoff</a></section> : null}

    {payload ? <>
      <section className="grid gap-3 md:grid-cols-4"><article className="rounded-[24px] border border-slate-200 bg-white p-4"><p className="text-[9px] font-black uppercase text-slate-400">Dossier</p><p className="mt-2 text-lg font-black">{payload.record.code}</p></article><article className="rounded-[24px] border border-slate-200 bg-white p-4"><p className="text-[9px] font-black uppercase text-slate-400">Statut</p><div className="mt-2"><State value={payload.record.status}/></div></article><article className="rounded-[24px] border border-slate-200 bg-white p-4"><p className="text-[9px] font-black uppercase text-slate-400">Missions</p><p className="mt-2 text-2xl font-black">{array(payload.related.dates).length}</p></article><article className="rounded-[24px] border border-slate-200 bg-white p-4"><p className="text-[9px] font-black uppercase text-slate-400">CARELINK links</p><p className="mt-2 text-2xl font-black">{array(payload.related.links).length}</p></article></section>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.35fr)_340px]">
        <section className="rounded-[30px] border border-slate-200 bg-white p-5 shadow-[0_14px_42px_rgba(15,23,42,.055)] sm:p-6">
          <div className="flex flex-wrap items-start justify-between gap-4"><div><h2 className="text-xl font-black">{meta.title}</h2><p className="mt-1 text-xs font-semibold text-slate-500">{rows.length} élément(s) réellement attaché(s) à {payload.record.code}.</p></div><button type="button" onClick={() => void load()} className="grid h-10 w-10 place-items-center rounded-xl border border-slate-200 text-slate-600"><RefreshCw size={15}/></button></div>

          {section === 'customer' ? <div className="mt-5 space-y-5"><JsonSummary value={payload.record.customer_snapshot}/><JsonSummary value={payload.record.operational_contacts}/><JsonSummary value={payload.record.access_instructions}/></div> : null}
          {section === 'beneficiaries' ? <div className="mt-5"><JsonSummary value={payload.record.beneficiary_snapshot}/></div> : null}
          {section === 'staffing' ? <div className="mt-5"><JsonSummary value={payload.record.blueprint_summary?.staffing || payload.record.blueprint_summary}/></div> : null}

          {section === 'calendar' ? <div className="mt-5 rounded-[24px] border border-blue-100 bg-blue-50/60 p-4"><p className="text-sm font-black text-blue-950">Ajouter une mission datée</p><div className="mt-3 grid gap-3 md:grid-cols-2 xl:grid-cols-4"><input type="date" value={dateForm.serviceDate} onChange={(event: any) => setDateForm({ ...dateForm, serviceDate: event.target.value })} className="rounded-xl border border-blue-200 bg-white px-3 py-2.5 text-xs font-bold"/><input type="time" value={dateForm.startTime} onChange={(event: any) => setDateForm({ ...dateForm, startTime: event.target.value })} className="rounded-xl border border-blue-200 bg-white px-3 py-2.5 text-xs font-bold"/><input type="time" value={dateForm.endTime} onChange={(event: any) => setDateForm({ ...dateForm, endTime: event.target.value })} className="rounded-xl border border-blue-200 bg-white px-3 py-2.5 text-xs font-bold"/><button type="button" disabled={!dateForm.serviceDate} onClick={() => void run('Ajout de la mission datée', () => masteryAction('handoff', payload.record.id, 'add_handoff_date', dateForm), 'Date ajoutée au handoff.')} className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-3 py-2.5 text-xs font-black text-white disabled:opacity-40"><Plus size={14}/> Ajouter</button></div></div> : null}

          {rows.length ? <div className="mt-5 space-y-3">{rows.map((row) => <article key={row.id || JSON.stringify(row)} className="group rounded-[22px] border border-slate-200 p-4 transition hover:border-blue-300 hover:bg-blue-50/30"><div className="flex items-start justify-between gap-4"><div className="min-w-0"><p className="break-words text-sm font-black text-slate-950">{label(row)}</p><p className="mt-1 break-words text-xs font-semibold leading-5 text-slate-500">{detail(row) || 'Donnée rattachée au dossier sélectionné.'}</p>{row.start_time || row.end_time ? <p className="mt-2 text-[10px] font-black uppercase tracking-[.12em] text-blue-700">{String(row.start_time || '').slice(0, 5)} → {String(row.end_time || '').slice(0, 5)}</p> : null}</div><div className="flex shrink-0 items-center gap-2"><State value={row.status || row.severity || 'registered'}/>{section === 'calendar' ? <button type="button" onClick={() => void run('Suppression de la date', () => masteryAction('handoff', payload.record.id, 'remove_handoff_date', { dateId: row.id }), 'Date supprimée du handoff.')} className="grid h-9 w-9 place-items-center rounded-xl border border-rose-200 text-rose-600"><Trash2 size={14}/></button> : null}</div></div></article>)}</div> : section !== 'customer' && section !== 'beneficiaries' && section !== 'staffing' ? <div className="mt-5 rounded-[24px] border border-dashed border-slate-300 bg-slate-50 p-9 text-center"><p className="font-black text-slate-800">Aucun élément réel dans cette section</p><p className="mt-2 text-sm font-semibold text-slate-500">Le dossier reste honnêtement vide; aucune valeur de démonstration n’est injectée.</p></div> : null}
        </section>

        <aside className="space-y-4"><section className="rounded-[28px] border border-slate-200 bg-slate-950 p-5 text-white"><p className="text-[9px] font-black uppercase tracking-[.16em] text-cyan-300">Actions du dossier</p><div className="mt-4 grid gap-2"><a href={`/carelink-ops/service-design/handoffs/${payload.record.id}`} className="flex items-center justify-between rounded-xl bg-white px-4 py-3 text-xs font-black text-slate-950">Ouvrir le dossier complet <ArrowRight size={14}/></a><a href={`/carelink-ops/service-design/handoffs/preflight/${payload.record.id}`} className="flex items-center justify-between rounded-xl border border-white/15 px-4 py-3 text-xs font-black">Exécuter le préflight <ArrowRight size={14}/></a><a href={`/carelink-ops/service-design/handoffs/transmission/${payload.record.id}`} className="flex items-center justify-between rounded-xl border border-white/15 px-4 py-3 text-xs font-black">Transmission CARELINK <ArrowRight size={14}/></a><a href={`/carelink-ops/service-design/handoffs/${section}?handoffId=${payload.record.id}`} className="flex items-center justify-between rounded-xl border border-white/15 px-4 py-3 text-xs font-black">Actualiser cette vue <ArrowRight size={14}/></a></div></section>{section === 'amendments' ? <section className="rounded-[28px] border border-amber-200 bg-amber-50 p-5"><p className="font-black text-amber-950">Nouvel amendement</p><p className="mt-2 text-xs font-semibold leading-5 text-amber-800">Crée une modification brouillon rattachée à ce handoff, sans altérer les missions CARELINK existantes.</p><button type="button" onClick={() => void run('Création de l’amendement', () => masteryAction('handoff', payload.record.id, 'create_amendment', {}), 'Amendement créé.')} className="mt-4 inline-flex items-center gap-2 rounded-xl bg-amber-600 px-4 py-2.5 text-xs font-black text-white"><Plus size={14}/> Créer</button></section> : null}</aside>
      </div>
    </> : null}
  </div>
}
