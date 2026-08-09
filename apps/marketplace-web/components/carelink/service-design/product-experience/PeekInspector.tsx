'use client'

import { useEffect, useState } from 'react'
import { Copy, Heart, Loader2, MessageSquarePlus, Replace, Trash2, X } from 'lucide-react'
import type { ProductExperienceInspector } from '@/types/service-design-product-experience'
import { productExperienceApi } from './client'

type AnnotationRow = { id: string; body: string; resolved: boolean; created_at: string }

export function PeekInspector({ entityType, entityId, open, onClose, onReplace, onDelete }: {
  entityType: string
  entityId: string
  open: boolean
  onClose: () => void
  onReplace?: (row: Record<string, unknown>) => void
  onDelete?: () => void
}) {
  const [data, setData] = useState<ProductExperienceInspector | null>(null)
  const [annotations, setAnnotations] = useState<AnnotationRow[]>([])
  const [note, setNote] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  async function load() {
    if (!open || !entityId) return
    setLoading(true)
    setData(null)
    try {
      const [record, notes] = await Promise.all([
        productExperienceApi<ProductExperienceInspector>(`/api/carelink-ops/service-design/product-experience/inspector?entityType=${encodeURIComponent(entityType)}&entityId=${encodeURIComponent(entityId)}`),
        productExperienceApi<AnnotationRow[]>(`/api/carelink-ops/service-design/product-experience/annotations?entityType=${encodeURIComponent(entityType)}&entityId=${encodeURIComponent(entityId)}`).catch(() => []),
      ])
      setData(record)
      setAnnotations(notes)
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Objet introuvable.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { void load() }, [open, entityId, entityType])

  async function favorite() {
    if (!data) return
    try {
      await productExperienceApi('/api/carelink-ops/service-design/product-experience/favorites', {
        method: 'POST',
        body: JSON.stringify({ entityType, entityId, label: data.title, href: '', metadata: { subtitle: data.subtitle } }),
      })
      setMessage('Ajouté aux favoris.')
    } catch (error) { setMessage(error instanceof Error ? error.message : 'Action impossible.') }
  }

  async function addAnnotation() {
    if (!note.trim()) return
    await productExperienceApi('/api/carelink-ops/service-design/product-experience/annotations', {
      method: 'POST', body: JSON.stringify({ entityType, entityId, body: note.trim(), anchor: { surface: 'peek' } }),
    })
    setNote('')
    await load()
  }

  async function resolveAnnotation(row: AnnotationRow) {
    await productExperienceApi('/api/carelink-ops/service-design/product-experience/annotations', {
      method: 'PATCH', body: JSON.stringify({ id: row.id, resolved: !row.resolved }),
    })
    await load()
  }

  async function deleteAnnotation(row: AnnotationRow) {
    if (!window.confirm('Supprimer définitivement cette annotation ?')) return
    await productExperienceApi(`/api/carelink-ops/service-design/product-experience/annotations?id=${encodeURIComponent(row.id)}`, { method: 'DELETE' })
    await load()
  }

  if (!open) return null
  return (
    <div className="fixed inset-0 z-[1700] flex justify-end bg-slate-950/25 backdrop-blur-[2px]" onMouseDown={(event: React.MouseEvent<HTMLDivElement>) => { if (event.target === event.currentTarget) onClose() }}>
      <aside className="h-full w-full max-w-[500px] overflow-y-auto border-l border-slate-200 bg-white shadow-[-28px_0_90px_rgba(15,23,42,.22)]">
        <header className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white/95 px-5 py-4 backdrop-blur">
          <div><p className="text-[9px] font-black uppercase tracking-[.2em] text-blue-600">Contextual Peek</p><p className="mt-1 text-sm font-black text-slate-950">Inspecter, commenter et agir sans quitter le canvas</p></div>
          <button type="button" onClick={onClose} className="grid h-10 w-10 place-items-center rounded-2xl border border-slate-200"><X size={16} /></button>
        </header>
        {loading ? <div className="grid min-h-[420px] place-items-center"><Loader2 className="animate-spin text-blue-600" /></div> : data ? (
          <div className="space-y-5 p-5">
            <section className="rounded-[28px] bg-slate-950 p-5 text-white"><p className="text-[9px] font-black uppercase tracking-[.2em] text-blue-300">{data.entityType}</p><h2 className="mt-2 text-2xl font-black tracking-[-.04em]">{data.title}</h2><p className="mt-2 text-xs font-semibold leading-5 text-slate-300">{data.subtitle}</p></section>
            <div className="grid grid-cols-2 gap-2">
              <button type="button" onClick={() => void favorite()} className="px-peek-action"><Heart size={14} />Favori</button>
              {onReplace ? <button type="button" onClick={() => onReplace(data.raw)} className="px-peek-action border-blue-200 bg-blue-50 text-blue-700"><Replace size={14} />Remplacer</button> : null}
              <button type="button" onClick={() => navigator.clipboard?.writeText(data.entityId)} className="px-peek-action"><Copy size={14} />Copier ID</button>
              {onDelete ? <button type="button" onClick={onDelete} className="px-peek-action border-rose-200 bg-rose-50 text-rose-700"><Trash2 size={14} />Retirer du plan</button> : null}
            </div>
            <section className="rounded-[26px] border border-slate-200 p-4"><h3 className="text-xs font-black uppercase tracking-[.15em] text-slate-500">Fiche source</h3><div className="mt-3 divide-y divide-slate-100">{data.fields.map((field) => <div key={field.label} className="grid grid-cols-[145px_1fr] gap-3 py-3"><span className="text-[10px] font-black capitalize text-slate-400">{field.label}</span><span className="break-words text-xs font-semibold text-slate-800">{field.value}</span></div>)}</div></section>
            <section className="rounded-[26px] border border-slate-200 p-4"><div className="flex items-center justify-between"><h3 className="text-xs font-black uppercase tracking-[.15em] text-slate-500">Commentaires contextuels</h3><span className="text-[9px] font-black text-slate-400">{annotations.filter((row) => !row.resolved).length} ouvert(s)</span></div><div className="mt-3 flex gap-2"><input value={note} onChange={(event: React.ChangeEvent<HTMLInputElement>) => setNote(event.target.value)} placeholder="Ajouter une note liée à cet objet…" className="min-w-0 flex-1 rounded-2xl border border-slate-200 px-3 py-2 text-xs font-semibold" /><button onClick={() => void addAnnotation()} disabled={!note.trim()} className="grid h-10 w-10 place-items-center rounded-2xl bg-blue-600 text-white disabled:opacity-40"><MessageSquarePlus size={15} /></button></div><div className="mt-3 space-y-2">{annotations.map((row) => <article key={row.id} className={`rounded-2xl border p-3 ${row.resolved ? 'border-slate-200 bg-slate-50 opacity-65' : 'border-blue-100 bg-blue-50'}`}><p className="text-xs font-semibold leading-5 text-slate-800">{row.body}</p><div className="mt-2 flex items-center justify-between"><button onClick={() => void resolveAnnotation(row)} className="text-[9px] font-black uppercase text-blue-700">{row.resolved ? 'Rouvrir' : 'Résoudre'}</button><button onClick={() => void deleteAnnotation(row)} className="text-[9px] font-black uppercase text-rose-700">Supprimer</button></div></article>)}</div></section>
            {message ? <p className="rounded-2xl bg-blue-50 px-4 py-3 text-xs font-bold text-blue-900">{message}</p> : null}
          </div>
        ) : <div className="p-6 text-sm font-bold text-rose-700">{message || 'Objet introuvable.'}</div>}
      </aside>
      <style>{`.px-peek-action{display:inline-flex;align-items:center;justify-content:center;gap:.5rem;border:1px solid rgb(226 232 240);border-radius:1rem;padding:.75rem;font-size:.65rem;font-weight:900}`}</style>
    </div>
  )
}
