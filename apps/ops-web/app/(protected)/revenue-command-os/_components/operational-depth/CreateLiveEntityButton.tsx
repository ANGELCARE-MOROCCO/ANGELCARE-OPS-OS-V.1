'use client'

import { useState } from 'react'
import { Loader2, Plus, X } from 'lucide-react'
import { emitRevenueAction, managedRevenueHeaders, revenueActionId } from '../action-center/action-events'

type EntityType = 'objective' | 'strategy' | 'program' | 'mission' | 'task' | 'exception'

export default function CreateLiveEntityButton({ entityType, label, defaults = {}, onCreated }: { entityType: EntityType; label: string; defaults?: Record<string, unknown>; onCreated?: () => void }) {
  const [open, setOpen] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({ title: '', code: '', description: '', ownerLabel: '', status: 'active', deadline: '', priority: 'high', severity: 'high', revenueTargetDh: '', marginTargetPercent: '', targetMarket: '', businessUnit: 'ANGELCARE' })

  const validTitle = form.title.trim().length >= 8
  const validDescription = entityType !== 'objective' || form.description.trim().length >= 20
  const formValid = validTitle && validDescription

  async function create() {
    if (!formValid) {
      setError(entityType === 'objective' ? 'Le titre doit contenir au moins 8 caractères et le mandat au moins 20 caractères.' : 'Le titre doit contenir au moins 8 caractères.')
      return
    }
    const id = revenueActionId(`create-${entityType}`)
    const startedAt = new Date().toISOString()
    setBusy(true); setError('')
    emitRevenueAction({ id, title: `Créer ${label}`, workspace: entityType, state: 'running', step: 'Création du dossier', indeterminate: true, startedAt })
    try {
      const changes = {
        ...defaults,
        ...form,
        mandate: form.description,
        dueAt: form.deadline || undefined,
        revenueTargetDh: form.revenueTargetDh ? Number(form.revenueTargetDh) : undefined,
        marginTargetPercent: form.marginTargetPercent ? Number(form.marginTargetPercent) : undefined,
      }
      const response = await fetch('/api/revenue-command-os/live-operations', { method: 'POST', headers: managedRevenueHeaders({ 'Content-Type': 'application/json' }), body: JSON.stringify({ entityType, operation: 'create', changes }) })
      const body = await response.json()
      if (!response.ok || !body.ok) throw new Error(body?.error?.message || 'Création impossible.')
      emitRevenueAction({ id, title: `Créer ${label}`, workspace: entityType, state: 'success', step: 'Dossier créé', progress: 100, startedAt, completedAt: new Date().toISOString(), resultHref: window.location.pathname, auditHref: '/revenue-command-os/audit', dismissible: true })
      setOpen(false)
      setForm({ title: '', code: '', description: '', ownerLabel: '', status: 'active', deadline: '', priority: 'high', severity: 'high', revenueTargetDh: '', marginTargetPercent: '', targetMarket: '', businessUnit: 'ANGELCARE' })
      onCreated?.()
      window.dispatchEvent(new CustomEvent('revenue-os:operation-completed', { detail: body.data }))
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : 'Création impossible.'
      setError(message)
      emitRevenueAction({ id, title: `Créer ${label}`, workspace: entityType, state: 'failure', step: 'Échec', startedAt, completedAt: new Date().toISOString(), error: message, dismissible: true })
    } finally { setBusy(false) }
  }

  return <>
    <button type="button" onClick={() => setOpen(true)} className="inline-flex items-center gap-2 rounded-2xl bg-slate-950 px-5 py-3 text-xs font-black text-white shadow-lg transition hover:-translate-y-0.5"><Plus size={16} />{label}</button>
    {open ? <div className="fixed inset-0 z-[150] grid place-items-center bg-slate-950/50 p-4 backdrop-blur-sm" onMouseDown={(event) => { if (event.currentTarget === event.target) setOpen(false) }}><section className="w-full max-w-2xl rounded-[32px] border border-slate-200 bg-white p-6 shadow-2xl sm:p-8"><div className="flex items-start justify-between"><div><p className="text-[10px] font-black uppercase tracking-[.16em] text-blue-700">Création opérationnelle live</p><h2 className="mt-2 text-2xl font-black text-slate-950">{label}</h2></div><button type="button" onClick={() => setOpen(false)} className="grid h-10 w-10 place-items-center rounded-xl border border-slate-200"><X size={17} /></button></div>{error ? <p className="mt-4 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs font-bold text-rose-800">{error}</p> : null}<div className="mt-6 grid gap-4 md:grid-cols-2"><Field label="Titre" value={form.title} onChange={(value) => setForm((current) => ({ ...current, title: value }))} /><Field label="Code" value={form.code} onChange={(value) => setForm((current) => ({ ...current, code: value }))} /><Field label="Responsable" value={form.ownerLabel} onChange={(value) => setForm((current) => ({ ...current, ownerLabel: value }))} /><Field label="Échéance" value={form.deadline} type="date" onChange={(value) => setForm((current) => ({ ...current, deadline: value }))} /><Field label="Cible revenus (Dh)" value={form.revenueTargetDh} type="number" onChange={(value) => setForm((current) => ({ ...current, revenueTargetDh: value }))} /><Field label="Marge cible (%)" value={form.marginTargetPercent} type="number" onChange={(value) => setForm((current) => ({ ...current, marginTargetPercent: value }))} />{entityType === 'objective' ? <><Field label="Unité" value={form.businessUnit} onChange={(value) => setForm((current) => ({ ...current, businessUnit: value }))} /><Field label="Marché" value={form.targetMarket} onChange={(value) => setForm((current) => ({ ...current, targetMarket: value }))} /></> : null}{entityType === 'exception' ? <Field label="Sévérité" value={form.severity} onChange={(value) => setForm((current) => ({ ...current, severity: value }))} /> : <Field label="Priorité" value={form.priority} onChange={(value) => setForm((current) => ({ ...current, priority: value }))} />}</div><label className="mt-4 block text-[10px] font-black uppercase tracking-[.1em] text-slate-500">Description<textarea value={form.description} onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))} rows={4} className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100" /></label><p className={`mt-2 text-[10px] font-bold ${formValid ? 'text-emerald-700' : 'text-slate-500'}`}>{entityType === 'objective' ? 'Titre ≥ 8 caractères · mandat ≥ 20 caractères.' : 'Titre ≥ 8 caractères.'}</p><div className="mt-6 flex justify-end gap-3"><button type="button" onClick={() => setOpen(false)} className="rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-black text-slate-700">Annuler</button><button type="button" onClick={() => void create()} disabled={!formValid || busy} className="inline-flex items-center gap-2 rounded-xl bg-blue-700 px-5 py-2.5 text-xs font-black text-white disabled:opacity-40">{busy ? <Loader2 size={15} className="animate-spin" /> : <Plus size={15} />}Créer et ouvrir</button></div></section></div> : null}
  </>
}

function Field({ label, value, onChange, type = 'text' }: { label: string; value: string; onChange: (value: string) => void; type?: string }) {
  return <label className="block text-[10px] font-black uppercase tracking-[.1em] text-slate-500">{label}<input type={type} value={value} onChange={(event) => onChange(event.target.value)} className="mt-2 h-11 w-full rounded-xl border border-slate-200 px-3 text-sm font-semibold outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100" /></label>
}
