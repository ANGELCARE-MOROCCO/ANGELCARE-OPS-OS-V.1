'use client'

import { useState } from 'react'
import { ArrowRight, Loader2, Target, X } from 'lucide-react'
import { useRevenueOs } from './RevenueOsContext'
import type { RevenueOsExecutionMode, RevenueOsPriority } from '@/lib/revenue-command-os/types'

const initialState = {
  title: '',
  mandate: '',
  businessUnit: 'AngelCare Academy × B2B Partnerships',
  targetMarket: 'Crèches, maternelles et préscolaires — Maroc',
  horizon: '30 jours',
  priority: 'high' as RevenueOsPriority,
  executionMode: 'shadow' as RevenueOsExecutionMode,
}

export default function ObjectiveComposer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { createObjective, busy } = useRevenueOs()
  const [form, setForm] = useState(initialState)
  const [localError, setLocalError] = useState<string | null>(null)

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
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-950/30 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-label="Composer un objectif revenus">
      <form onSubmit={submit} className="max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-[30px] border border-slate-200 bg-white shadow-[0_32px_100px_rgba(15,23,42,.24)]">
        <div className="flex items-start justify-between border-b border-slate-100 px-7 py-6">
          <div className="flex gap-4">
            <span className="grid h-12 w-12 place-items-center rounded-2xl bg-blue-50 text-blue-700"><Target size={23} /></span>
            <div>
              <p className="mb-1 text-xs font-black uppercase tracking-[.18em] text-blue-700">Objective Command</p>
              <h2 className="text-2xl font-black tracking-tight text-slate-950">Soumettre un mandat stratégique</h2>
              <p className="mt-1 max-w-xl text-sm leading-6 text-slate-500">La Phase 1 enregistre l’objectif sous gouvernance. Aucun moteur stratégique ni action externe n’est lancé.</p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="rounded-xl border border-slate-200 p-2 text-slate-500 transition hover:bg-slate-50" aria-label="Fermer"><X size={19} /></button>
        </div>

        <div className="grid gap-5 px-7 py-6 md:grid-cols-2">
          <label className="md:col-span-2">
            <span className="mb-2 block text-xs font-black uppercase tracking-[.12em] text-slate-500">Objectif</span>
            <input value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} className="w-full rounded-2xl border border-slate-200 px-4 py-3.5 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-50" placeholder="Ex. Dominer la fenêtre pré-rentrée Academy à Rabat et Casablanca" />
          </label>
          <label className="md:col-span-2">
            <span className="mb-2 block text-xs font-black uppercase tracking-[.12em] text-slate-500">Mandat exécutif</span>
            <textarea value={form.mandate} onChange={(event) => setForm({ ...form, mandate: event.target.value })} rows={4} className="w-full resize-none rounded-2xl border border-slate-200 px-4 py-3.5 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-50" placeholder="Définissez le résultat attendu, les limites, les marchés et les contraintes à respecter..." />
          </label>
          <label>
            <span className="mb-2 block text-xs font-black uppercase tracking-[.12em] text-slate-500">Business unit</span>
            <input value={form.businessUnit} onChange={(event) => setForm({ ...form, businessUnit: event.target.value })} className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-50" />
          </label>
          <label>
            <span className="mb-2 block text-xs font-black uppercase tracking-[.12em] text-slate-500">Marché cible</span>
            <input value={form.targetMarket} onChange={(event) => setForm({ ...form, targetMarket: event.target.value })} className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-50" />
          </label>
          <label>
            <span className="mb-2 block text-xs font-black uppercase tracking-[.12em] text-slate-500">Horizon</span>
            <input value={form.horizon} onChange={(event) => setForm({ ...form, horizon: event.target.value })} className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-50" />
          </label>
          <label>
            <span className="mb-2 block text-xs font-black uppercase tracking-[.12em] text-slate-500">Priorité</span>
            <select value={form.priority} onChange={(event) => setForm({ ...form, priority: event.target.value as RevenueOsPriority })} className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-50">
              <option value="critical">Critique</option><option value="high">Haute</option><option value="medium">Moyenne</option><option value="low">Basse</option>
            </select>
          </label>
          <label className="md:col-span-2">
            <span className="mb-2 block text-xs font-black uppercase tracking-[.12em] text-slate-500">Mode autorisé</span>
            <select value={form.executionMode} onChange={(event) => setForm({ ...form, executionMode: event.target.value as RevenueOsExecutionMode })} className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-50">
              <option value="shadow">Shadow — observer et enregistrer uniquement</option>
              <option value="recommend">Recommandation — préparer sans exécuter</option>
            </select>
          </label>
        </div>

        {localError ? <div className="mx-7 mb-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">{localError}</div> : null}

        <div className="flex flex-col-reverse gap-3 border-t border-slate-100 px-7 py-5 sm:flex-row sm:justify-end">
          <button type="button" onClick={onClose} className="rounded-2xl border border-slate-200 px-5 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50">Annuler</button>
          <button disabled={busy} className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-950 px-6 py-3 text-sm font-black text-white shadow-lg shadow-slate-900/15 disabled:opacity-60">
            {busy ? <Loader2 className="animate-spin" size={17} /> : <ArrowRight size={17} />}
            Enregistrer sous gouvernance
          </button>
        </div>
      </form>
    </div>
  )
}
