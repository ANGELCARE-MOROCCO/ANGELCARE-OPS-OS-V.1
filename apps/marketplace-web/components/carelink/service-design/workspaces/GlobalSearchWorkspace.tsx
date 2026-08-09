'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { ArrowUpRight, Loader2, Search, Sparkles } from 'lucide-react'
import type { SearchHit } from '@/types/homeservice-design'
import { Badge, EmptyState, Panel, WorkspaceTitle } from '../DesignSystem'

export function GlobalSearchWorkspace({ initialQuery = '' }: { initialQuery?: string }) {
  const [query, setQuery] = useState(initialQuery)
  const [hits, setHits] = useState<SearchHit[]>([])
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  useEffect(() => {
    if (query.trim().length < 2) { setHits([]); setBusy(false); return }
    const timer = setTimeout(async () => {
      setBusy(true); setError(null)
      try {
        const response = await fetch(`/api/carelink-ops/service-design/search?q=${encodeURIComponent(query)}`, { cache: 'no-store' })
        const payload = await response.json()
        if (!response.ok || !payload.ok) throw new Error(payload.error || 'Recherche indisponible.')
        setHits(payload.data || [])
      } catch (cause) { setError(cause instanceof Error ? cause.message : 'Recherche indisponible.') }
      finally { setBusy(false) }
    }, 280)
    return () => clearTimeout(timer)
  }, [query])
  const groups = hits.reduce<Record<string, SearchHit[]>>((acc, item) => { (acc[item.recordType] ||= []).push(item); return acc }, {})
  return <div className="space-y-6"><WorkspaceTitle eyebrow="Recherche opérationnelle" title="HomeService Global Search" description="Recherche les catégories, règles, activités, compétences et risques avec leur contexte métier. Les résultats ne mélangent pas les missions CARELINK avec la vérité produit." />
    <Panel title="Search Command" subtitle="Au moins deux caractères; aucune donnée artificielle n’est produite."><label className="relative block"><Search className="absolute left-5 top-1/2 -translate-y-1/2 text-blue-600" size={22} /><input autoFocus value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Ex: garde, transport, flashcards, allergie, first aid…" className="w-full rounded-[24px] border border-slate-200 bg-slate-50 py-5 pl-14 pr-14 text-lg font-black text-slate-950 outline-none transition focus:border-blue-300 focus:bg-white focus:ring-4 focus:ring-blue-100" />{busy ? <Loader2 className="absolute right-5 top-1/2 -translate-y-1/2 animate-spin text-blue-600" size={20} /> : null}</label>{error ? <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm font-bold text-rose-800">{error}</div> : null}</Panel>
    {Object.keys(groups).length ? <div className="grid gap-6 xl:grid-cols-2">{Object.entries(groups).map(([type, items]) => <Panel key={type} title={type} subtitle={`${items.length} résultat(s) dans la configuration réelle.`}><div className="space-y-3">{items.map((item) => <Link key={`${item.recordType}-${item.id}`} href={item.href} className="group flex items-start gap-4 rounded-[22px] border border-slate-200 bg-white p-4 transition hover:border-blue-200 hover:bg-blue-50/40"><div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-slate-950 text-white"><Sparkles size={17} /></div><div className="min-w-0 flex-1"><div className="flex items-start justify-between gap-3"><div><p className="text-[9px] font-black uppercase tracking-[0.18em] text-blue-600">{item.code}</p><h3 className="mt-1 text-sm font-black text-slate-950">{item.title}</h3></div><ArrowUpRight size={15} className="shrink-0 text-slate-300 group-hover:text-blue-600" /></div><p className="mt-1 text-xs font-semibold text-slate-500">{item.subtitle}</p><div className="mt-3 flex flex-wrap gap-1.5"><Badge tone="slate">{item.status}</Badge>{item.context.map((context) => <Badge key={context} tone="blue">{context}</Badge>)}</div></div></Link>)}</div></Panel>)}</div> : query.trim().length >= 2 && !busy ? <EmptyState title="Aucun résultat" detail="La configuration actuelle ne contient aucun élément correspondant. Le système ne remplace pas l’absence de données par des suggestions inventées." /> : <EmptyState title="Recherche prête" detail="Saisissez un service, un code, une activité, une compétence ou un risque pour interroger le domaine HomeService Design." />}
  </div>
}
