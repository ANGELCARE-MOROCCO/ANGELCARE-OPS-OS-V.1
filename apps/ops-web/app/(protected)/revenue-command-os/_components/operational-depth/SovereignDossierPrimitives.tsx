'use client'

import { useState, type ReactNode } from 'react'
import type { LucideIcon } from 'lucide-react'
import { Activity, CheckCircle2, CircleAlert, GitBranch, Link2, Loader2, Plus, Trash2, Unlink } from 'lucide-react'
import { dateTimeLabel, money, statusTone } from './sovereign-workspace-utils'

export function TonePill({ value }: { value: string }) {
  const tone = statusTone(value)
  const styles = {
    emerald: 'border-emerald-200 bg-emerald-50 text-emerald-800',
    rose: 'border-rose-200 bg-rose-50 text-rose-800',
    amber: 'border-amber-200 bg-amber-50 text-amber-800',
    blue: 'border-blue-200 bg-blue-50 text-blue-800',
    slate: 'border-slate-200 bg-slate-100 text-slate-700',
  }[tone]
  return <span className={`inline-flex items-center rounded-full border px-3 py-1 text-[9px] font-black uppercase tracking-[.08em] ${styles}`}>{value || '—'}</span>
}

export function StudioMetric({
  icon: Icon,
  label,
  value,
  detail,
  tone = 'slate',
}: {
  icon: LucideIcon
  label: string
  value: ReactNode
  detail: string
  tone?: 'blue' | 'emerald' | 'rose' | 'amber' | 'indigo' | 'slate'
}) {
  const iconStyle = {
    blue: 'bg-blue-50 text-blue-700',
    emerald: 'bg-emerald-50 text-emerald-700',
    rose: 'bg-rose-50 text-rose-700',
    amber: 'bg-amber-50 text-amber-700',
    indigo: 'bg-indigo-50 text-indigo-700',
    slate: 'bg-slate-100 text-slate-700',
  }[tone]
  return <div className="rounded-[22px] border border-slate-200 bg-white p-4 shadow-[0_12px_35px_rgba(15,23,42,.045)]">
    <div className="flex items-center gap-3"><span className={`grid h-9 w-9 place-items-center rounded-xl ${iconStyle}`}><Icon size={16} /></span><p className="text-[9px] font-black uppercase tracking-[.12em] text-slate-500">{label}</p></div>
    <p className="mt-3 text-2xl font-black tracking-[-.04em] text-slate-950">{value}</p>
    <p className="mt-1 text-[10px] leading-4 text-slate-500">{detail}</p>
  </div>
}

export function DossierBackdrop({
  children,
  onClose,
  maxWidth = 'max-w-[1540px]',
}: {
  children: ReactNode
  onClose: () => void
  maxWidth?: string
}) {
  return <div className="fixed inset-0 z-[160] grid place-items-center bg-slate-950/55 p-2 backdrop-blur-md sm:p-5" onMouseDown={(event) => { if (event.currentTarget === event.target) onClose() }}>
    <section role="dialog" aria-modal="true" className={`flex h-[calc(100vh-16px)] w-full ${maxWidth} flex-col overflow-hidden rounded-[30px] border border-white/70 bg-[#f8fafc] shadow-[0_50px_160px_rgba(15,23,42,.38)] sm:h-[calc(100vh-40px)] sm:rounded-[38px]`}>
      {children}
    </section>
  </div>
}

export function StudioField({
  label,
  value,
  onChange,
  type = 'text',
  placeholder,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  type?: string
  placeholder?: string
}) {
  return <label className="block text-[9px] font-black uppercase tracking-[.11em] text-slate-500">{label}<input type={type} value={value} placeholder={placeholder} onChange={(event) => onChange(event.target.value)} className="mt-2 h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100" /></label>
}

export function StudioTextArea({
  label,
  value,
  onChange,
  rows = 4,
  placeholder,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  rows?: number
  placeholder?: string
}) {
  return <label className="block text-[9px] font-black uppercase tracking-[.11em] text-slate-500">{label}<textarea value={value} placeholder={placeholder} rows={rows} onChange={(event) => onChange(event.target.value)} className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold leading-6 text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100" /></label>
}

export function StudioSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  options: Array<{ value: string; label: string }>
}) {
  return <label className="block text-[9px] font-black uppercase tracking-[.11em] text-slate-500">{label}<select value={value} onChange={(event) => onChange(event.target.value)} className="mt-2 h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-bold text-slate-900 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100">{options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></label>
}

export function ProgressBar({ value, tone = 'blue' }: { value: number; tone?: 'blue' | 'emerald' | 'rose' | 'amber' | 'indigo' }) {
  const bar = { blue: 'bg-blue-600', emerald: 'bg-emerald-600', rose: 'bg-rose-600', amber: 'bg-amber-500', indigo: 'bg-indigo-600' }[tone]
  return <div className="h-2 overflow-hidden rounded-full bg-slate-100"><div className={`h-full rounded-full transition-all ${bar}`} style={{ width: `${Math.max(0, Math.min(100, value))}%` }} /></div>
}

export function NoteComposer({
  tone,
  defaultKind,
  title,
  onAdd,
  busy,
}: {
  tone: 'blue' | 'emerald' | 'indigo' | 'rose'
  defaultKind: string
  title: string
  onAdd: (payload: { kind: string; title: string; body: string; dueAt: string; valueNumeric?: number }) => Promise<unknown>
  busy: boolean
}) {
  const noteTitle = useLocalState('')
  const body = useLocalState('')
  const dueAt = useLocalState('')
  const button = { blue: 'bg-blue-700', emerald: 'bg-emerald-700', indigo: 'bg-indigo-700', rose: 'bg-rose-700' }[tone]
  return <section className="rounded-[24px] border border-slate-200 bg-white p-4">
    <div className="flex items-center gap-3"><span className={`grid h-9 w-9 place-items-center rounded-xl text-white ${button}`}><Plus size={15} /></span><div><p className="text-[9px] font-black uppercase tracking-[.12em] text-slate-500">{defaultKind}</p><h3 className="text-sm font-black text-slate-950">{title}</h3></div></div>
    <div className="mt-4 space-y-3"><StudioField label="Titre" value={noteTitle.value} onChange={noteTitle.set} /><StudioTextArea label="Contenu" value={body.value} onChange={body.set} rows={3} /><StudioField label="Échéance" value={dueAt.value} onChange={dueAt.set} type="datetime-local" /></div>
    <button type="button" disabled={!noteTitle.value.trim() || busy} onClick={async () => { await onAdd({ kind: defaultKind, title: noteTitle.value, body: body.value, dueAt: dueAt.value }); noteTitle.set(''); body.set(''); dueAt.set('') }} className={`mt-4 inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-black text-white disabled:opacity-40 ${button}`}><Plus size={14} />Ajouter</button>
  </section>
}

function useLocalState(initial: string) {
  const [value, set] = useState(initial)
  return { value, set }
}

export function NoteFeed({
  notes,
  empty,
  onDelete,
}: {
  notes: Array<Record<string, any>>
  empty: string
  onDelete?: (noteId: string) => Promise<unknown>
}) {
  if (!notes.length) return <div className="rounded-[22px] border border-dashed border-slate-300 bg-white p-6 text-center text-xs font-semibold text-slate-500">{empty}</div>
  return <div className="space-y-3">{notes.map((note) => <article key={note.id} className="rounded-[22px] border border-slate-200 bg-white p-4">
    <div className="flex items-start gap-3">
      <span className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-slate-100 text-slate-700">{note.status === 'completed' ? <CheckCircle2 size={15} /> : <CircleAlert size={15} />}</span>
      <div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><p className="text-sm font-black text-slate-950">{note.title}</p><TonePill value={String(note.status || 'active')} /></div><p className="mt-2 whitespace-pre-wrap text-xs leading-5 text-slate-600">{note.body || 'Aucun détail.'}</p><div className="mt-3 flex flex-wrap gap-3 text-[9px] font-bold text-slate-400"><span>{String(note.note_kind || 'note')}</span>{note.due_at ? <span>Échéance {dateTimeLabel(note.due_at)}</span> : null}{note.value_numeric != null ? <span>Valeur {money(Number(note.value_numeric))}</span> : null}</div></div>
      {onDelete ? <button type="button" onClick={() => void onDelete(String(note.id))} className="grid h-8 w-8 place-items-center rounded-lg text-slate-400 hover:bg-rose-50 hover:text-rose-700"><Trash2 size={14} /></button> : null}
    </div>
  </article>)}</div>
}

export function AuditFeed({ items }: { items: Array<Record<string, any>> }) {
  if (!items.length) return <div className="rounded-[22px] border border-dashed border-slate-300 bg-white p-6 text-center text-xs font-semibold text-slate-500">Aucune activité d’audit disponible.</div>
  return <div className="relative space-y-3 before:absolute before:bottom-4 before:left-[17px] before:top-4 before:w-px before:bg-slate-200">{items.map((item) => <article key={item.id} className="relative flex gap-4 pl-1"><span className="relative z-10 mt-1 grid h-8 w-8 shrink-0 place-items-center rounded-full bg-slate-950 text-white"><Activity size={13} /></span><div className="min-w-0 flex-1 rounded-[20px] border border-slate-200 bg-white p-4"><div className="flex flex-wrap items-center justify-between gap-2"><p className="text-xs font-black text-slate-950">{String(item.action || 'Événement')}</p><span className="text-[9px] font-bold text-slate-400">{dateTimeLabel(item.created_at)}</span></div><p className="mt-1 text-xs leading-5 text-slate-600">{String(item.summary || item.outcome || 'Événement enregistré.')}</p><p className="mt-2 text-[9px] font-bold text-slate-400">{String(item.actor_label || item.actor_id || 'Système')}</p></div></article>)}</div>
}


export function RelationManager({
  relations,
  tone,
  onLink,
  onUnlink,
  title = 'Graphe de relations',
}: {
  relations: Array<Record<string, any>>
  tone: 'blue' | 'emerald' | 'indigo' | 'rose'
  onLink: (payload: { toType: string; toId: string; relationKind: string }) => Promise<unknown>
  onUnlink: (relationId: string) => Promise<unknown>
  title?: string
}) {
  const [toType, setToType] = useState('program')
  const [toId, setToId] = useState('')
  const [relationKind, setRelationKind] = useState('related')
  const button = {
    blue: 'bg-blue-700 hover:bg-blue-800',
    emerald: 'bg-emerald-700 hover:bg-emerald-800',
    indigo: 'bg-indigo-700 hover:bg-indigo-800',
    rose: 'bg-rose-700 hover:bg-rose-800',
  }[tone]
  const icon = {
    blue: 'bg-blue-50 text-blue-700',
    emerald: 'bg-emerald-50 text-emerald-700',
    indigo: 'bg-indigo-50 text-indigo-700',
    rose: 'bg-rose-50 text-rose-700',
  }[tone]
  return <section className="rounded-[26px] border border-slate-200 bg-white p-5">
    <div className="flex items-center gap-3">
      <span className={`grid h-10 w-10 place-items-center rounded-xl ${icon}`}><GitBranch size={16} /></span>
      <div><p className="text-[9px] font-black uppercase tracking-[.12em] text-slate-500">Relations persistées</p><h3 className="text-base font-black text-slate-950">{title}</h3></div>
    </div>
    <div className="mt-4 grid gap-3 md:grid-cols-[160px_minmax(0,1fr)_minmax(0,1fr)_auto]">
      <StudioSelect label="Type cible" value={toType} onChange={setToType} options={[
        { value: 'objective', label: 'Objectif' },
        { value: 'strategy', label: 'Stratégie' },
        { value: 'program', label: 'Programme' },
        { value: 'mission', label: 'Mission' },
        { value: 'task', label: 'Tâche' },
        { value: 'exception', label: 'Exception' },
      ]} />
      <StudioField label="ID du dossier cible" value={toId} onChange={setToId} placeholder="Identifiant persistant" />
      <StudioField label="Nature du lien" value={relationKind} onChange={setRelationKind} placeholder="related, depends_on, recovers…" />
      <button type="button" disabled={!toId.trim()} onClick={async () => { await onLink({ toType, toId: toId.trim(), relationKind: relationKind.trim() || 'related' }); setToId('') }} className={`mt-[25px] inline-flex h-11 items-center justify-center gap-2 rounded-xl px-4 text-xs font-black text-white disabled:opacity-40 ${button}`}><Link2 size={14} />Relier</button>
    </div>
    <div className="mt-5 space-y-2">
      {relations.map((item) => <div key={String(item.id)} className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-3">
        <GitBranch size={15} className="shrink-0 text-slate-500" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-xs font-black text-slate-900">{String(item.from_type || 'entity')}/{String(item.from_id || '—')} → {String(item.to_type || 'entity')}/{String(item.to_id || '—')}</p>
          <p className="mt-1 text-[9px] font-bold uppercase tracking-[.1em] text-slate-400">{String(item.relation_kind || 'related')}</p>
        </div>
        <button type="button" onClick={() => void onUnlink(String(item.id))} className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-slate-400 transition hover:bg-rose-50 hover:text-rose-700" aria-label="Supprimer la relation"><Unlink size={14} /></button>
      </div>)}
      {!relations.length ? <p className="rounded-2xl border border-dashed border-slate-300 p-5 text-center text-xs font-semibold text-slate-500">Aucune relation explicite. Reliez ce dossier à son contexte commercial.</p> : null}
    </div>
  </section>
}

export function BusyOverlay({ label = 'Synchronisation…' }: { label?: string }) {
  return <div className="absolute inset-0 z-20 grid place-items-center bg-white/75 backdrop-blur-sm"><div className="inline-flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-5 py-3 text-xs font-black text-slate-700 shadow-xl"><Loader2 size={16} className="animate-spin" />{label}</div></div>
}
