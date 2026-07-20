'use client'

import Image from 'next/image'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useMemo, useRef, useState } from 'react'
import {
  Bell,
  ChevronDown,
  Command,
  Menu,
  PanelLeftClose,
  PanelLeftOpen,
  Plus,
  RefreshCw,
  Search,
  ShieldCheck,
  X,
} from 'lucide-react'
import type { RevenueOsSearchResult } from '@/lib/revenue-command-os/types'
import { useRevenueOs } from './RevenueOsContext'
import RevenueOsIcon from './RevenueOsIcon'
import ObjectiveComposer from './ObjectiveComposer'

function activePath(pathname: string, href: string) {
  if (href === '/revenue-command-os') return pathname === href
  return pathname === href || pathname.startsWith(`${href}/`)
}

function storageLabel(storageMode: 'supabase' | 'foundation-fallback') {
  return storageMode === 'supabase' ? 'Supabase connecté' : 'Mode fondation'
}

export default function RevenueOsShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const { bootstrap, busy, error, refresh } = useRevenueOs()
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [objectiveOpen, setObjectiveOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<RevenueOsSearchResult[]>([])
  const [searchBusy, setSearchBusy] = useState(false)
  const searchRef = useRef<HTMLInputElement>(null)

  const currentWorkspace = useMemo(
    () => bootstrap.workspaces.find((item) => activePath(pathname, item.href)) || bootstrap.workspaces[0],
    [bootstrap.workspaces, pathname],
  )

  useEffect(() => {
    function onKeydown(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        setSearchOpen(true)
      }
      if (event.key === 'Escape') {
        setSearchOpen(false)
        setObjectiveOpen(false)
      }
    }
    function openObjective() { setObjectiveOpen(true) }
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
        const response = await fetch(`/api/revenue-command-os/search?q=${encodeURIComponent(query)}`, { cache: 'no-store' })
        const payload = await response.json()
        if (!cancelled) setResults(response.ok ? payload.data : [])
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

  function openResult(result: RevenueOsSearchResult) {
    setSearchOpen(false)
    setQuery('')
    router.push(result.href)
  }

  const sidebarWidth = collapsed ? 'lg:w-[88px]' : 'lg:w-[286px]'

  return (
    <div className="min-h-[calc(100vh-86px)] bg-[#f4f7fb] text-slate-900">
      <div className="flex min-h-[calc(100vh-86px)]">
        {mobileOpen ? <button className="fixed inset-0 z-40 bg-slate-950/20 backdrop-blur-[2px] lg:hidden" onClick={() => setMobileOpen(false)} aria-label="Fermer la navigation" /> : null}

        <aside className={`fixed inset-y-[86px] left-0 z-50 flex w-[286px] flex-col border-r border-slate-200/90 bg-white shadow-[16px_0_40px_rgba(15,23,42,.04)] transition-all duration-300 lg:sticky lg:top-[86px] lg:z-20 lg:h-[calc(100vh-86px)] ${sidebarWidth} ${mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
          <div className={`flex min-h-[106px] items-center border-b border-slate-100 ${collapsed ? 'justify-center px-3' : 'justify-between px-5'}`}>
            <Link href="/revenue-command-os" className="flex min-w-0 items-center gap-3" onClick={() => setMobileOpen(false)}>
              <span className="grid h-12 w-12 shrink-0 place-items-center overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
                <Image src="/logo.png" alt="AngelCare" width={92} height={36} className="h-auto w-[88px] max-w-none" priority />
              </span>
              {!collapsed ? (
                <span className="min-w-0">
                  <span className="block truncate text-sm font-black tracking-tight text-slate-950">REVENUE COMMAND OS</span>
                  <span className="mt-0.5 block text-[10px] font-bold uppercase tracking-[.18em] text-slate-400">Strategy → Execution</span>
                </span>
              ) : null}
            </Link>
            {!collapsed ? <button className="hidden rounded-xl border border-slate-200 p-2 text-slate-500 transition hover:bg-slate-50 lg:block" onClick={() => setCollapsed(true)} aria-label="Réduire la navigation"><PanelLeftClose size={17} /></button> : null}
          </div>

          {collapsed ? (
            <button className="mx-auto mt-4 hidden rounded-xl border border-slate-200 p-2 text-slate-500 hover:bg-slate-50 lg:block" onClick={() => setCollapsed(false)} aria-label="Déployer la navigation"><PanelLeftOpen size={17} /></button>
          ) : null}

          <div className="mx-3 mt-4 rounded-2xl border border-blue-100 bg-gradient-to-br from-blue-50 to-white p-3">
            <div className={`flex items-center ${collapsed ? 'justify-center' : 'gap-3'}`}>
              <span className="relative grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-slate-950 text-white">
                <Command size={17} />
                <span className="absolute -right-1 -top-1 h-2.5 w-2.5 rounded-full border-2 border-white bg-emerald-500" />
              </span>
              {!collapsed ? (
                <div className="min-w-0">
                  <p className="truncate text-xs font-black text-slate-900">Phase 1 — Fondation</p>
                  <p className="mt-0.5 truncate text-[11px] font-semibold text-slate-500">Mode Shadow verrouillé</p>
                </div>
              ) : null}
            </div>
          </div>

          <nav className="mt-3 flex-1 overflow-y-auto px-3 pb-6">
            <p className={`px-3 py-3 text-[10px] font-black uppercase tracking-[.2em] text-slate-400 ${collapsed ? 'text-center' : ''}`}>{collapsed ? 'OS' : 'Système stratégique'}</p>
            <div className="space-y-1">
              {bootstrap.workspaces.map((item) => {
                const active = activePath(pathname, item.href)
                return (
                  <Link
                    key={item.key}
                    href={item.href}
                    title={collapsed ? item.label : undefined}
                    onClick={() => setMobileOpen(false)}
                    className={`group flex min-h-11 items-center rounded-xl transition ${collapsed ? 'justify-center px-2' : 'gap-3 px-3'} ${active ? 'bg-slate-950 text-white shadow-lg shadow-slate-900/10' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-950'}`}
                  >
                    <RevenueOsIcon name={item.icon} size={18} strokeWidth={active ? 2.35 : 1.9} className="shrink-0" />
                    {!collapsed ? (
                      <>
                        <span className="min-w-0 flex-1 truncate text-[13px] font-bold">{item.shortLabel}</span>
                        {item.status === 'ready' ? <span className={`h-2 w-2 rounded-full ${active ? 'bg-emerald-300' : 'bg-emerald-500'}`} /> : item.status === 'foundation' ? <span className={`rounded-md px-1.5 py-0.5 text-[9px] font-black uppercase ${active ? 'bg-white/12 text-blue-100' : 'bg-blue-50 text-blue-700'}`}>P1</span> : null}
                      </>
                    ) : null}
                  </Link>
                )
              })}
            </div>
          </nav>

          <div className="border-t border-slate-100 p-3">
            <div className={`rounded-2xl border border-slate-200 bg-slate-50 ${collapsed ? 'p-2' : 'p-3'}`}>
              <div className={`flex items-center ${collapsed ? 'justify-center' : 'gap-3'}`}>
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-white text-slate-800 shadow-sm"><ShieldCheck size={18} /></span>
                {!collapsed ? (
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-black text-slate-900">Contrat verrouillé</p>
                    <p className="truncate text-[10px] text-slate-500">{bootstrap.releaseCode}</p>
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        </aside>

        <div className={`min-w-0 flex-1 transition-all duration-300`}>
          <header className="sticky top-[86px] z-30 border-b border-slate-200/80 bg-white/92 px-4 py-3 backdrop-blur-xl sm:px-6 lg:px-8">
            <div className="mx-auto flex max-w-[1720px] items-center gap-3">
              <button className="rounded-xl border border-slate-200 p-2.5 text-slate-600 lg:hidden" onClick={() => setMobileOpen(true)} aria-label="Ouvrir la navigation"><Menu size={19} /></button>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[.17em] text-blue-700">
                  <span>Revenue Command OS</span><span className="text-slate-300">/</span><span className="truncate text-slate-400">{currentWorkspace.label}</span>
                </div>
                <h1 className="mt-0.5 truncate text-xl font-black tracking-tight text-slate-950 sm:text-2xl">{currentWorkspace.label}</h1>
              </div>

              <button onClick={() => setSearchOpen(true)} className="hidden min-w-[280px] items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-left text-sm text-slate-500 transition hover:border-slate-300 hover:bg-white md:flex">
                <Search size={17} /><span className="flex-1">Rechercher dans Revenue OS...</span><kbd className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-[10px] font-black text-slate-500">⌘K</kbd>
              </button>

              <button onClick={() => setObjectiveOpen(true)} className="hidden items-center gap-2 rounded-2xl bg-slate-950 px-4 py-2.5 text-sm font-black text-white shadow-lg shadow-slate-900/12 sm:flex"><Plus size={17} /> Nouvel objectif</button>
              <button onClick={refresh} disabled={busy} className="rounded-xl border border-slate-200 bg-white p-2.5 text-slate-600 transition hover:bg-slate-50 disabled:opacity-50" aria-label="Actualiser"><RefreshCw size={18} className={busy ? 'animate-spin' : ''} /></button>
              <button className="relative rounded-xl border border-slate-200 bg-white p-2.5 text-slate-600" aria-label="Notifications"><Bell size={18} /><span className="absolute -right-1 -top-1 grid h-4 min-w-4 place-items-center rounded-full bg-rose-500 px-1 text-[9px] font-black text-white">{bootstrap.counters.openExceptions}</span></button>
              <button className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white p-1.5 pr-3">
                <span className="grid h-8 w-8 place-items-center rounded-xl bg-blue-50 text-xs font-black text-blue-700">DG</span>
                <ChevronDown size={14} className="text-slate-400" />
              </button>
            </div>
            {error ? <div className="mx-auto mt-3 max-w-[1720px] rounded-xl border border-rose-200 bg-rose-50 px-4 py-2 text-xs font-semibold text-rose-700">{error}</div> : null}
          </header>

          <main className="px-4 py-5 sm:px-6 lg:px-8 lg:py-7">
            <div className="mx-auto max-w-[1720px]">{children}</div>
          </main>
        </div>
      </div>

      {searchOpen ? (
        <div className="fixed inset-0 z-[130] flex items-start justify-center bg-slate-950/28 px-4 pt-[12vh] backdrop-blur-sm" onMouseDown={(event) => { if (event.target === event.currentTarget) setSearchOpen(false) }}>
          <div className="w-full max-w-2xl overflow-hidden rounded-[26px] border border-slate-200 bg-white shadow-[0_32px_100px_rgba(15,23,42,.3)]">
            <div className="flex items-center gap-3 border-b border-slate-100 px-5 py-4">
              <Search size={20} className="text-blue-700" />
              <input ref={searchRef} value={query} onChange={(event) => setQuery(event.target.value)} onKeyDown={(event) => {
                if (event.key === 'Enter' && results[0]) openResult(results[0])
              }} className="min-w-0 flex-1 bg-transparent text-base font-semibold outline-none" placeholder="Objectif, workspace, event ID, flag, doctrine..." />
              {searchBusy ? <RefreshCw size={17} className="animate-spin text-slate-400" /> : null}
              <button onClick={() => setSearchOpen(false)} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-50"><X size={18} /></button>
            </div>
            <div className="max-h-[52vh] overflow-y-auto p-2">
              {results.length ? results.map((result) => (
                <button key={result.id} onClick={() => openResult(result)} className="flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left transition hover:bg-slate-50">
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-blue-50 text-blue-700"><Search size={17} /></span>
                  <span className="min-w-0 flex-1"><span className="block truncate text-sm font-black text-slate-900">{result.title}</span><span className="mt-0.5 block truncate text-xs text-slate-500">{result.subtitle}</span></span>
                  {result.badge ? <span className="rounded-lg bg-slate-100 px-2 py-1 text-[10px] font-black uppercase text-slate-500">{result.badge}</span> : null}
                </button>
              )) : <div className="px-5 py-10 text-center"><p className="text-sm font-black text-slate-700">Aucun résultat</p><p className="mt-1 text-xs text-slate-500">Essayez un workspace, un objectif, un event ID ou un feature flag.</p></div>}
            </div>
            <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50 px-5 py-3 text-[10px] font-bold uppercase tracking-[.12em] text-slate-400">
              <span>Entrée pour ouvrir</span><span>{storageLabel(bootstrap.storageMode)}</span>
            </div>
          </div>
        </div>
      ) : null}

      <ObjectiveComposer open={objectiveOpen} onClose={() => setObjectiveOpen(false)} />
    </div>
  )
}
