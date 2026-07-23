'use client'

import { useMemo, useState, type ReactNode } from 'react'
import { ArrowRight, BadgeCheck, Building2, CalendarRange, Compass, Loader2, ShieldCheck, Target, X } from 'lucide-react'
import { useRevenueOs } from './RevenueOsContext'
import type { RevenueOsExecutionMode, RevenueOsPriority } from '@/lib/revenue-command-os/types'
import { SChip, SIcon } from './visual-sovereignty/SovereignPrimitives'
import sovereigntyStyles from './visual-sovereignty/Sovereignty.module.css'

const initialState = {
  title: '',
  mandate: '',
  businessUnit: 'AngelCare Academy × B2B Partnerships',
  targetMarket: 'Crèches, maternelles et préscolaires — Maroc',
  horizon: '30 jours',
  priority: 'high' as RevenueOsPriority,
  executionMode: 'shadow' as RevenueOsExecutionMode,
}

const chapters = [
  ['01', 'Ambition', 'Résultat attendu'],
  ['02', 'Mandat', 'Cadre exécutif'],
  ['03', 'Périmètre', 'Business unit'],
  ['04', 'Marché', 'Cible commerciale'],
  ['05', 'Horizon', 'Fenêtre de temps'],
  ['06', 'Priorité', 'Niveau d’attention'],
  ['07', 'Posture', 'Mode autorisé'],
  ['08', 'Mémoire', 'Enregistrement gouverné'],
] as const

export default function ObjectiveComposer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { createObjective, busy } = useRevenueOs()
  const [form, setForm] = useState(initialState)
  const [localError, setLocalError] = useState<string | null>(null)
  const completion = useMemo(() => {
    const checks = [form.title.trim().length >= 8, form.mandate.trim().length >= 20, !!form.businessUnit, !!form.targetMarket, !!form.horizon, !!form.priority, !!form.executionMode]
    return Math.round(checks.filter(Boolean).length / checks.length * 100)
  }, [form])

  if (!open) return null

  async function submit(event: React.FormEvent) {
    event.preventDefault()
    setLocalError(null)
    if (form.title.trim().length < 8 || form.mandate.trim().length < 20) {
      setLocalError('Décrivez un objectif précis et un mandat suffisamment détaillé.')
      return
    }
    try {
      await createObjective(form)
      setForm(initialState)
      onClose()
    } catch (error) {
      setLocalError(error instanceof Error ? error.message : 'Création impossible.')
    }
  }

  return (
    <div className="fixed inset-0 z-[120] grid place-items-center bg-slate-950/55 p-3 backdrop-blur-xl sm:p-6" role="dialog" aria-modal="true" aria-label="Composer un mandat revenus">
      <form onSubmit={submit} className="grid max-h-[94vh] w-full max-w-[1380px] overflow-hidden rounded-[44px] border border-white/20 bg-white shadow-[0_50px_180px_rgba(2,6,23,.48)] xl:grid-cols-[310px_minmax(0,1fr)_340px]">
        <aside className="relative overflow-hidden bg-gradient-to-b from-slate-950 via-blue-950 to-slate-950 p-6 text-white sm:p-8">
          <div className={`absolute inset-0 opacity-20 ${sovereigntyStyles.gridFine}`} />
          <div className="relative">
            <SChip tone="blue"><Target size={11} /> Mandate Composer</SChip>
            <h2 className="mt-6 text-3xl font-black tracking-[-.055em]">Écrire un mandat, pas une simple tâche.</h2>
            <p className="mt-3 text-xs font-semibold leading-6 text-slate-300">L’objectif devient l’autorité amont des signaux, stratégies, commandes, programmes et missions.</p>
            <div className="mt-8 space-y-2">
              {chapters.map(([number, title, detail], index) => {
                const active = index <= Math.floor(completion / 15)
                return <div key={number} className={`grid grid-cols-[38px_1fr] gap-3 rounded-2xl border p-3 ${active ? 'border-blue-300/30 bg-blue-400/10' : 'border-white/10 bg-white/[.04]'}`}><span className={`grid h-9 w-9 place-items-center rounded-xl text-[9px] font-black ${active ? 'bg-white text-slate-950' : 'bg-white/10 text-slate-400'}`}>{number}</span><div><p className="text-[11px] font-black">{title}</p><p className="mt-0.5 text-[9px] text-slate-400">{detail}</p></div></div>
              })}
            </div>
          </div>
        </aside>

        <main className="overflow-y-auto p-6 sm:p-8 lg:p-10">
          <div className="flex items-start justify-between gap-6">
            <div><p className="text-[10px] font-black uppercase tracking-[.2em] text-blue-700">Mandate Ledger</p><h1 className="mt-2 text-3xl font-black tracking-[-.045em] text-slate-950">Soumettre un objectif stratégique</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">Le mandat est enregistré sous gouvernance. Aucun moteur stratégique ni action externe n’est lancé par cette opération.</p></div>
            <button type="button" onClick={onClose} className="rounded-2xl border border-slate-200 p-3 text-slate-500 transition hover:bg-slate-50" aria-label="Fermer"><X size={19} /></button>
          </div>

          <div className="mt-8 space-y-7">
            <Field icon={Target} label="Ambition revenue" number="01"><input value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} className="input-sovereign" placeholder="Ex. Dominer la fenêtre pré-rentrée Academy à Rabat et Casablanca" /></Field>
            <Field icon={ShieldCheck} label="Mandat exécutif" number="02"><textarea value={form.mandate} onChange={(event) => setForm({ ...form, mandate: event.target.value })} rows={5} className="input-sovereign resize-none" placeholder="Résultat attendu, limites, marchés, contraintes, critères de réussite…" /></Field>
            <div className="grid gap-5 md:grid-cols-2">
              <Field icon={Building2} label="Périmètre business" number="03"><input value={form.businessUnit} onChange={(event) => setForm({ ...form, businessUnit: event.target.value })} className="input-sovereign" /></Field>
              <Field icon={Compass} label="Marché cible" number="04"><input value={form.targetMarket} onChange={(event) => setForm({ ...form, targetMarket: event.target.value })} className="input-sovereign" /></Field>
              <Field icon={CalendarRange} label="Horizon" number="05"><input value={form.horizon} onChange={(event) => setForm({ ...form, horizon: event.target.value })} className="input-sovereign" /></Field>
              <Field icon={BadgeCheck} label="Priorité" number="06"><select value={form.priority} onChange={(event) => setForm({ ...form, priority: event.target.value as RevenueOsPriority })} className="input-sovereign"><option value="critical">Critique</option><option value="high">Haute</option><option value="medium">Moyenne</option><option value="low">Basse</option></select></Field>
            </div>
            <Field icon={ShieldCheck} label="Posture autorisée" number="07"><div className="grid gap-3 sm:grid-cols-2">{([['shadow', 'Shadow', 'Observer, calculer et enregistrer sans exécuter.'], ['recommend', 'Recommandation', 'Préparer une recommandation sans exécution.']] as const).map(([value, title, detail]) => <button key={value} type="button" onClick={() => setForm({ ...form, executionMode: value })} className={`rounded-[24px] border p-4 text-left transition ${form.executionMode === value ? 'border-blue-600 bg-blue-50 ring-4 ring-blue-50' : 'border-slate-200 hover:border-blue-300'}`}><p className="text-xs font-black text-slate-950">{title}</p><p className="mt-1 text-[10px] leading-5 text-slate-500">{detail}</p></button>)}</div></Field>
          </div>

          {localError ? <div className="mt-6 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">{localError}</div> : null}
          <style>{`.input-sovereign{width:100%;border:1px solid rgb(226 232 240);border-radius:18px;padding:13px 15px;outline:none;background:white;font-size:13px;font-weight:650;color:rgb(15 23 42);transition:.2s}.input-sovereign:focus{border-color:rgb(37 99 235);box-shadow:0 0 0 4px rgb(239 246 255)}`}</style>
        </main>

        <aside className="overflow-y-auto border-l border-slate-100 bg-slate-50/80 p-6 sm:p-8">
          <p className="text-[10px] font-black uppercase tracking-[.18em] text-slate-400">Executive preview</p>
          <div className="mt-5 rounded-[32px] border border-slate-200 bg-white p-6 shadow-[0_24px_70px_rgba(15,23,42,.08)]">
            <div className="flex items-center justify-between"><SIcon icon={Target} tone="blue" /><span className="text-4xl font-black tracking-[-.06em] text-slate-100">{completion}%</span></div>
            <h3 className="mt-6 text-xl font-black tracking-[-.035em] text-slate-950">{form.title || 'Objectif à formaliser'}</h3>
            <p className="mt-3 text-xs leading-6 text-slate-500">{form.mandate || 'Le mandat exécutif apparaîtra ici avec son périmètre et ses limites.'}</p>
            <div className="mt-5 space-y-2">{[['Business unit', form.businessUnit], ['Marché', form.targetMarket], ['Horizon', form.horizon], ['Priorité', form.priority], ['Posture', form.executionMode]].map(([label, value]) => <div key={label} className="rounded-2xl bg-slate-50 p-3"><p className="text-[8px] font-black uppercase tracking-[.12em] text-slate-400">{label}</p><p className="mt-1 text-[10px] font-black text-slate-700">{value}</p></div>)}</div>
          </div>
          <div className="mt-5 rounded-[28px] border border-emerald-200 bg-emerald-50 p-5"><div className="flex gap-3"><ShieldCheck size={18} className="shrink-0 text-emerald-700" /><div><p className="text-xs font-black text-emerald-950">Boundary preserved</p><p className="mt-1 text-[10px] leading-5 text-emerald-800">Enregistrement uniquement. Aucun message, campagne, commande ou worker externe n’est déclenché.</p></div></div></div>
          <div className="mt-6 grid gap-3"><button disabled={busy} className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-950 px-6 py-3.5 text-sm font-black text-white shadow-xl disabled:opacity-60">{busy ? <Loader2 className="animate-spin" size={17} /> : <ArrowRight size={17} />}Enregistrer sous gouvernance</button><button type="button" onClick={onClose} className="rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50">Annuler</button></div>
        </aside>
      </form>
    </div>
  )
}

function Field({ icon, label, number, children }: { icon: typeof Target; label: string; number: string; children: ReactNode }) {
  return <section><div className="mb-3 flex items-center gap-3"><SIcon icon={icon} tone="blue" /><div><p className="text-[8px] font-black uppercase tracking-[.16em] text-blue-700">Chapter {number}</p><p className="text-xs font-black text-slate-800">{label}</p></div></div>{children}</section>
}
