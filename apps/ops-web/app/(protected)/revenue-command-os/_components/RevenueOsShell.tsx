'use client'

import { fetchRevenueOsJson } from '@/lib/revenue-command-os/client-http'
import Image from 'next/image'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useMemo, useRef, useState } from 'react'
import {
  Bell,
  ChevronRight,
  Command,
  Menu,
  PanelLeftClose,
  PanelLeftOpen,
  Plus,
  Search,
  ShieldCheck,
  X,
} from 'lucide-react'
import type { RevenueOsSearchResult } from '@/lib/revenue-command-os/types'
import { useRevenueOs } from './RevenueOsContext'
import RevenueOsIcon from './RevenueOsIcon'
import ObjectiveComposer from './ObjectiveComposer'
import { sovereigntyStyles } from './visual-sovereignty/SovereignPrimitives'

function activePath(pathname: string, href: string) {
  if (href === '/revenue-command-os') return pathname === href
  return pathname === href || pathname.startsWith(`${href}/`)
}

function groupFor(href: string) {
  if (href.includes('cockpit') || href.includes('mega-production') || href.includes('digital-twin') || href.includes('revenue-objectives') || href.includes('signals')) return 'Commandement'
  if (href.includes('strategy') || href.includes('validation-council') || href.includes('command-kernel')) return 'Intelligence & décision'
  if (href.includes('mission-compiler') || href.includes('execution-autopilot') || href.includes('active-programs') || href.includes('compiled-missions') || href.includes('email-studio')) return 'Orchestration'
  if (href.includes('approvals') || href.includes('exceptions') || href.includes('memory-learning')) return 'Contrôle'
  return 'Gouvernance'
}

export default function RevenueOsShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const { bootstrap } = useRevenueOs()
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [objectiveOpen, setObjectiveOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<RevenueOsSearchResult[]>([])
  const [searchBusy, setSearchBusy] = useState(false)
  const searchRef = useRef<HTMLInputElement>(null)

  const groups = useMemo(() => {
    const order = ['Commandement', 'Intelligence & décision', 'Orchestration', 'Contrôle', 'Gouvernance']
    return order.map((label) => ({ label, items: bootstrap.workspaces.filter((item) => groupFor(item.href) === label) })).filter((group) => group.items.length)
  }, [bootstrap.workspaces])

  useEffect(() => {
    const onKeydown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        setSearchOpen(true)
      }
      if (event.key === 'Escape') {
        setSearchOpen(false)
        setObjectiveOpen(false)
      }
    }
    const openObjective = () => setObjectiveOpen(true)
    window.addEventListener('keydown', onKeydown)
    window.addEventListener('revenue-os:open-objective', openObjective)
    return () => {
      window.removeEventListener('keydown', onKeydown)
      window.removeEventListener('revenue-os:open-objective', openObjective)
    }
  }, [])

  useEffect(() => {
    if (!searchOpen) return
    const timer = window.setTimeout(() => searchRef.current?.focus(), 80)
    return () => window.clearTimeout(timer)
  }, [searchOpen])

  useEffect(() => {
    if (!searchOpen) return
    let cancelled = false
    const timer = window.setTimeout(async () => {
      setSearchBusy(true)
      try {
        const payload = await fetchRevenueOsJson<any[]>(`/api/revenue-command-os/search?q=${encodeURIComponent(query)}`, { cache: 'no-store' }, {
          timeoutMs: 12000,
          fallbackMessage: 'Recherche Revenue OS indisponible.',
        })
        if (!cancelled) setResults(payload.data ?? [])
      } catch {
        if (!cancelled) setResults([])
      } finally {
        if (!cancelled) setSearchBusy(false)
      }
    }, query ? 180 : 0)
    return () => {
      cancelled = true
      window.clearTimeout(timer)
    }
  }, [query, searchOpen])

  const sidebarWidth = collapsed ? 'lg:w-[92px]' : 'lg:w-[292px]'

  return (
    <div className={`${sovereigntyStyles.canvas} min-h-[calc(100vh-86px)] text-slate-950`}>
      <div className="flex min-h-[calc(100vh-86px)]">
        {mobileOpen ? <button className="fixed inset-0 z-40 bg-slate-950/25 backdrop-blur-sm lg:hidden" onClick={() => setMobileOpen(false)} aria-label="Fermer la navigation" /> : null}

        <aside className={`fixed inset-y-[86px] left-0 z-50 flex w-[292px] flex-col border-r border-slate-200/80 bg-white/94 shadow-[20px_0_70px_rgba(15,23,42,.055)] backdrop-blur-2xl transition-all duration-300 lg:sticky lg:top-[86px] lg:z-20 lg:h-[calc(100vh-86px)] ${sidebarWidth} ${mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
          <div className={`flex min-h-[102px] items-center border-b border-slate-100 ${collapsed ? 'justify-center px-3' : 'justify-between px-5'}`}>
            <Link href="/revenue-command-os/cockpit" className="flex min-w-0 items-center gap-3" onClick={() => setMobileOpen(false)}>
              <span className="grid h-12 w-12 shrink-0 place-items-center overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-[0_8px_24px_rgba(15,23,42,.08)]"><Image src="/logo.png" alt="AngelCare" width={92} height={36} className="h-auto w-[88px] max-w-none" priority /></span>
              {!collapsed ? <span className="min-w-0"><span className="block truncate text-[13px] font-black tracking-[-.02em] text-slate-950">REVENUE COMMAND OS</span><span className="mt-1 block text-[9px] font-black uppercase tracking-[.2em] text-blue-700">Sovereign Revenue Intelligence</span></span> : null}
            </Link>
            {!collapsed ? <button className="hidden rounded-xl border border-slate-200 p-2 text-slate-500 transition hover:bg-slate-50 lg:block" onClick={() => setCollapsed(true)} aria-label="Réduire la navigation"><PanelLeftClose size={17} /></button> : null}
          </div>

          {collapsed ? <button className="mx-auto mt-4 hidden rounded-xl border border-slate-200 p-2 text-slate-500 hover:bg-slate-50 lg:block" onClick={() => setCollapsed(false)} aria-label="Déployer la navigation"><PanelLeftOpen size={17} /></button> : null}

          <div className={`mx-3 mt-4 grid gap-2 ${collapsed ? 'grid-cols-1' : 'grid-cols-2'}`}>
            <button onClick={() => setSearchOpen(true)} title="Recherche globale" className={`flex items-center rounded-2xl border border-slate-200 bg-white text-slate-700 shadow-sm transition hover:border-blue-200 hover:text-blue-700 ${collapsed ? 'justify-center p-3' : 'gap-2 px-3 py-2.5'}`}><Search size={16} />{!collapsed ? <span className="text-[10px] font-black uppercase tracking-[.08em]">Recherche</span> : null}</button>
            <button onClick={() => setObjectiveOpen(true)} title="Nouvel objectif" className={`flex items-center rounded-2xl bg-slate-950 text-white shadow-lg shadow-slate-900/10 transition hover:bg-blue-700 ${collapsed ? 'justify-center p-3' : 'gap-2 px-3 py-2.5'}`}><Plus size={16} />{!collapsed ? <span className="text-[10px] font-black uppercase tracking-[.08em]">Objectif</span> : null}</button>
          </div>

          <nav className="mt-4 flex-1 overflow-y-auto px-3 pb-6">
            {groups.map((group) => <div key={group.label} className="mb-5">
              {!collapsed ? <p className="px-3 pb-2 text-[9px] font-black uppercase tracking-[.19em] text-slate-400">{group.label}</p> : <div className="mx-auto mb-2 h-px w-8 bg-slate-200" />}
              <div className="space-y-1">
                {group.items.map((item) => {
                  const active = activePath(pathname, item.href)
                  return <Link key={item.key} href={item.href} title={collapsed ? item.label : undefined} onClick={() => setMobileOpen(false)} className={`group relative flex min-h-11 items-center rounded-2xl transition ${collapsed ? 'justify-center px-2' : 'gap-3 px-3'} ${active ? 'bg-slate-950 text-white shadow-[0_12px_28px_rgba(15,23,42,.16)]' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-950'}`}>
                    {active ? <span className="absolute -left-3 h-7 w-1 rounded-r-full bg-blue-500" /> : null}
                    <RevenueOsIcon name={item.icon} size={18} strokeWidth={active ? 2.35 : 1.9} className="shrink-0" />
                    {!collapsed ? <><span className="min-w-0 flex-1 truncate text-[12px] font-extrabold">{item.shortLabel}</span><span className={`h-2 w-2 rounded-full ${active ? 'bg-emerald-300' : item.status === 'ready' ? 'bg-emerald-500' : 'bg-amber-400'}`} /></> : null}
                  </Link>
                })}
              </div>
            </div>)}
          </nav>

          <div className="border-t border-slate-100 p-3">
            <div className={`rounded-2xl border border-slate-200 bg-gradient-to-br from-slate-50 to-white ${collapsed ? 'p-2' : 'p-3'}`}>
              <div className={`flex items-center ${collapsed ? 'justify-center' : 'gap-3'}`}>
                <span className="relative grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-slate-950 text-white"><ShieldCheck size={17} /><span className="absolute -right-1 -top-1 h-2.5 w-2.5 rounded-full border-2 border-white bg-emerald-500" /></span>
                {!collapsed ? <div className="min-w-0 flex-1"><p className="truncate text-[11px] font-black text-slate-900">Production gouvernée</p><p className="mt-0.5 truncate text-[9px] font-semibold uppercase tracking-[.1em] text-slate-400">Effets externes sur approbation</p></div> : null}
              </div>
            </div>
          </div>
        </aside>

        <main className="min-w-0 flex-1">
          <button className="fixed left-4 top-[102px] z-30 rounded-2xl border border-slate-200 bg-white/90 p-3 text-slate-700 shadow-lg backdrop-blur lg:hidden" onClick={() => setMobileOpen(true)} aria-label="Ouvrir la navigation"><Menu size={19} /></button>
          {children}
        </main>
      </div>

      {searchOpen ? <div className="fixed inset-0 z-[80] flex items-start justify-center bg-slate-950/35 px-4 pt-[12vh] backdrop-blur-md" onMouseDown={() => setSearchOpen(false)}>
        <section className={`w-full max-w-3xl overflow-hidden rounded-[30px] border border-white/60 bg-white ${sovereigntyStyles.raised}`} onMouseDown={(event) => event.stopPropagation()}>
          <div className="flex items-center gap-3 border-b border-slate-100 px-5 py-4"><Command size={18} className="text-blue-700" /><input ref={searchRef} value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Chercher objectifs, signaux, stratégies, programmes, missions…" className="min-w-0 flex-1 bg-transparent text-base font-semibold outline-none placeholder:text-slate-400" /><span className="rounded-lg bg-slate-100 px-2 py-1 text-[9px] font-black uppercase text-slate-500">⌘ K</span><button onClick={() => setSearchOpen(false)} className="rounded-xl p-2 text-slate-400 hover:bg-slate-50 hover:text-slate-900"><X size={18} /></button></div>
          <div className="max-h-[56vh] overflow-y-auto p-3">
            {searchBusy ? <div className="p-8 text-center text-sm font-semibold text-slate-500">Recherche dans le système de revenus…</div> : results.length ? results.map((result) => <button key={`${result.type}-${result.id}`} onClick={() => { setSearchOpen(false); setQuery(''); router.push(result.href) }} className="flex w-full items-center gap-4 rounded-2xl px-4 py-3 text-left transition hover:bg-blue-50"><span className="grid h-10 w-10 place-items-center rounded-xl bg-slate-950 text-white"><Search size={16} /></span><span className="min-w-0 flex-1"><span className="block truncate text-sm font-black text-slate-900">{result.title}</span><span className="mt-1 block truncate text-[11px] text-slate-500">{result.subtitle}</span></span><ChevronRight size={17} className="text-slate-300" /></button>) : <div className="p-8 text-center"><Bell className="mx-auto text-slate-300" /><p className="mt-3 text-sm font-black text-slate-700">{query ? 'Aucun résultat correspondant' : 'Recherche souveraine Revenue OS'}</p><p className="mt-1 text-xs text-slate-500">Les résultats respectent vos permissions et le tenant actif.</p></div>}
          </div>
        </section>
      </div> : null}

      <ObjectiveComposer open={objectiveOpen} onClose={() => setObjectiveOpen(false)} />
    </div>
  )
}
