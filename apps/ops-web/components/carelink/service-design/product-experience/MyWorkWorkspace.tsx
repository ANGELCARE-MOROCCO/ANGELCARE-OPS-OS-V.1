'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { Bookmark, Clock3, FileText, Heart, LayoutTemplate, Loader2, Plus, Save, Trash2 } from 'lucide-react'
import { StudioHero, StudioSurface } from '../studio2030'
import { productExperienceApi } from './client'
import { PermanentDeleteButton } from './PermanentDeleteButton'

type Tab = 'drafts' | 'favorites' | 'views' | 'recent' | 'documents'
type Payload = Record<Tab, Array<Record<string, unknown>>>

export function MyWorkWorkspace() {
  const [data, setData] = useState<Payload | null>(null)
  const [tab, setTab] = useState<Tab>('drafts')
  const [selected, setSelected] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')

  async function load() {
    setLoading(true)
    try { setData(await productExperienceApi<Payload>('/api/carelink-ops/service-design/product-experience/my-work')) }
    catch (error) { setMessage(error instanceof Error ? error.message : 'Mon travail est indisponible.') }
    finally { setLoading(false) }
  }
  useEffect(() => { void load() }, [])

  const items = data?.[tab] || []
  const typeMap = { drafts: 'workbench_draft', favorites: 'favorite', views: 'saved_view', recent: 'recent', documents: 'document_entry' } as const

  async function bulkDelete() {
    if (!selected.length || tab === 'recent') return
    if (!window.confirm(`Supprimer définitivement ${selected.length} élément(s) ?`)) return
    const result = await productExperienceApi<Array<{ ok: boolean; error?: string }>>('/api/carelink-ops/service-design/product-experience/bulk', {
      method: 'POST', body: JSON.stringify({ items: selected.map((id) => ({ entityType: typeMap[tab], entityId: id })) }),
    })
    setMessage(`${result.filter((row) => row.ok).length}/${result.length} supprimé(s).`)
    setSelected([])
    await load()
  }

  async function saveCurrentView() {
    const defaultName = `Vue ${tab} · ${new Date().toLocaleDateString('fr-FR')}`
    const name = window.prompt('Nom de la vue sauvegardée', defaultName)?.trim()
    if (!name) return
    await productExperienceApi('/api/carelink-ops/service-design/product-experience/saved-views', {
      method: 'POST',
      body: JSON.stringify({ name, scope: 'my-work', filters: { tab }, presentation: { density: 'comfortable' } }),
    })
    setMessage(`Vue « ${name} » sauvegardée.`)
    await load()
  }

  function hrefFor(row: Record<string, unknown>) {
    if (row.href) return String(row.href)
    if (tab !== 'drafts') return '#'
    const workspaceKey = String(row.workspace_key || '')
    if (workspaceKey.startsWith('composition:')) return `/carelink-ops/service-design/workbench/composition/${workspaceKey.slice('composition:'.length)}`
    if (workspaceKey.startsWith('variant:')) return `/carelink-ops/service-design/workbench/draft/${String(row.id)}`
    return `/carelink-ops/service-design/workbench/${String(row.source_id || row.id)}`
  }

  return (
    <div className="space-y-6">
      <StudioHero
        eyebrow="ANGELCARE · Persistent Workbench Continuity"
        title="Mon travail Service Design"
        description="Reprenez vos drafts, favoris, vues, documents et dossiers récents sans perdre votre contexte."
        actions={<><button onClick={() => void saveCurrentView()} className="inline-flex items-center gap-2 rounded-2xl border border-white/15 bg-white/10 px-4 py-3 text-xs font-black text-white"><Save size={15} />Sauvegarder cette vue</button><Link href="/carelink-ops/service-design/factory" className="inline-flex items-center gap-2 rounded-2xl bg-blue-600 px-4 py-3 text-xs font-black text-white"><Plus size={15} />Créer</Link></>}
      />
      <section className="flex gap-2 overflow-x-auto rounded-[24px] border border-slate-200 bg-white p-2">
        {(['drafts', 'favorites', 'views', 'recent', 'documents'] as const).map((key) => <button key={key} onClick={() => { setTab(key); setSelected([]) }} className={`rounded-2xl px-4 py-3 text-[10px] font-black uppercase ${tab === key ? 'bg-slate-950 text-white' : 'text-slate-500 hover:bg-slate-50'}`}>{key === 'drafts' ? 'Workbenches' : key === 'favorites' ? 'Favoris' : key === 'views' ? 'Vues sauvegardées' : key === 'recent' ? 'Récents' : 'Documents PDF'}</button>)}
      </section>
      {loading ? <div className="grid min-h-[420px] place-items-center"><Loader2 className="animate-spin text-blue-600" /></div> : (
        <StudioSurface title={`${items.length} élément(s)`} subtitle="Chaque carte ouvre un vrai dossier ou une action réelle." action={selected.length && tab !== 'recent' ? <button onClick={() => void bulkDelete()} className="inline-flex items-center gap-2 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-2 text-[10px] font-black text-rose-700"><Trash2 size={13} />Supprimer {selected.length}</button> : undefined}>
          {items.length ? <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{items.map((row) => {
            const id = String(row.id)
            const href = hrefFor(row)
            const label = String(row.title || row.label || row.name || row.document_reference || id)
            return <article key={id} className={`rounded-[24px] border bg-white p-4 transition ${selected.includes(id) ? 'border-blue-500 ring-4 ring-blue-50' : 'border-slate-200 hover:border-blue-200'}`}>
              <div className="flex items-start justify-between gap-3"><button onClick={() => tab !== 'recent' && setSelected((ids) => ids.includes(id) ? ids.filter((item) => item !== id) : [...ids, id])} className="grid h-9 w-9 place-items-center rounded-xl bg-slate-950 text-white">{tab === 'drafts' ? <LayoutTemplate size={15} /> : tab === 'favorites' ? <Heart size={15} /> : tab === 'views' ? <Bookmark size={15} /> : tab === 'documents' ? <FileText size={15} /> : <Clock3 size={15} />}</button><span className="rounded-full bg-slate-100 px-2 py-1 text-[8px] font-black uppercase text-slate-500">{tab}</span></div>
              <h3 className="mt-4 text-lg font-black">{label}</h3><p className="mt-2 text-[10px] font-semibold text-slate-500">{String(row.updated_at || row.last_opened_at || row.generated_at || row.created_at || '')}</p>
              <div className="mt-4 flex items-center gap-2">{href !== '#' ? <Link href={href} className="flex-1 rounded-xl bg-blue-600 px-3 py-2 text-center text-[10px] font-black text-white">Ouvrir</Link> : null}{tab !== 'recent' ? <PermanentDeleteButton entityType={typeMap[tab]} entityId={id} label={label} compact onDeleted={() => void load()} /> : null}</div>
            </article>
          })}</div> : <p className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center text-sm font-semibold text-slate-500">Aucun élément dans cette vue.</p>}
        </StudioSurface>
      )}
      {message ? <div className="rounded-2xl bg-blue-50 p-4 text-xs font-bold text-blue-900">{message}</div> : null}
    </div>
  )
}
