'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowRight, Command, Search, X } from 'lucide-react'
import { CARELINK_ALL_NAV_ITEMS } from './carelink-navigation'

export function CareLinkOpsCommandPalette({ open, onClose }: { open: boolean; onClose: () => void }) {
  const router = useRouter()
  const [query, setQuery] = useState('')

  useEffect(() => {
    if (!open) setQuery('')
  }, [open])

  const results = useMemo(() => {
    const q = query.trim().toLowerCase()
    return CARELINK_ALL_NAV_ITEMS.filter((item, index, rows) => rows.findIndex((row) => row.href === item.href) === index)
      .filter((item) => !q || `${item.label} ${item.description}`.toLowerCase().includes(q))
      .slice(0, 16)
  }, [query])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[1400] bg-slate-950/55 p-4 backdrop-blur-md" role="dialog" aria-modal="true" aria-label="Palette de commandes CARELINK" onMouseDown={onClose}>
      <section className="mx-auto mt-[8vh] max-w-3xl overflow-hidden rounded-[32px] border border-white/20 bg-white shadow-[0_42px_140px_rgba(2,6,23,0.5)]" onMouseDown={(event: any) => event.stopPropagation()}>
        <div className="flex items-center gap-3 border-b border-slate-100 px-5 py-4">
          <div className="grid h-11 w-11 place-items-center rounded-2xl bg-slate-950 text-white"><Command size={18} /></div>
          <div className="min-w-0 flex-1">
            <div className="text-[10px] font-black uppercase tracking-[0.24em] text-blue-600">Navigation commandée</div>
            <div className="mt-1 flex items-center gap-2"><Search size={17} className="text-slate-400" /><input autoFocus value={query} onChange={(event: any) => setQuery(event.target.value)} placeholder="Mission, agent, qualité, doctrine, vitrine…" className="min-w-0 flex-1 bg-transparent text-base font-bold text-slate-950 outline-none placeholder:text-slate-400" /></div>
          </div>
          <button type="button" onClick={onClose} className="grid h-10 w-10 place-items-center rounded-2xl bg-slate-100 text-slate-500 transition hover:bg-slate-200" aria-label="Fermer"><X size={17} /></button>
        </div>
        <div className="max-h-[64vh] overflow-y-auto p-3">
          {results.map((item) => {
            const Icon = item.icon
            return (
              <button key={item.href} type="button" onClick={() => { onClose(); router.push(item.href) }} className="group flex w-full items-center gap-4 rounded-2xl px-4 py-3 text-left transition hover:bg-blue-50">
                <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl border border-slate-200 bg-white text-slate-700 shadow-sm transition group-hover:border-blue-200 group-hover:text-blue-700"><Icon size={18} /></div>
                <div className="min-w-0 flex-1"><div className="text-sm font-black text-slate-900">{item.label}</div><div className="mt-1 truncate text-xs font-semibold text-slate-500">{item.description}</div></div>
                <ArrowRight size={16} className="text-slate-300 transition group-hover:translate-x-1 group-hover:text-blue-600" />
              </button>
            )
          })}
          {!results.length ? <div className="px-6 py-14 text-center"><div className="text-sm font-black text-slate-700">Aucune destination correspondante</div><div className="mt-2 text-xs font-semibold text-slate-400">Essayez une catégorie, une mission ou un contrôle.</div></div> : null}
        </div>
      </section>
    </div>
  )
}
