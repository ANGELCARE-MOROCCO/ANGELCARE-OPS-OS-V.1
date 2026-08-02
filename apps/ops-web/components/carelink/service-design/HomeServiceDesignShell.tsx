'use client'

import Image from 'next/image'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { BellRing, Bot, ChevronDown, Command, Database, Search, ShieldCheck, Sparkles, X } from 'lucide-react'
import { HSD_CONTEXT_NAV, HSD_MASTER_UNIVERSES, HSD_ROUTE_ROOT } from '@/lib/homeservice-design/constants'
import { cx } from './DesignSystem'

function masterKey(pathname: string) {
  if (pathname === HSD_ROUTE_ROOT || pathname.startsWith(`${HSD_ROUTE_ROOT}/factory`)) return 'factory'
  if (pathname.startsWith(`${HSD_ROUTE_ROOT}/catalogue`) || pathname.startsWith(`${HSD_ROUTE_ROOT}/standards`)) return 'catalogue'
  if (pathname.startsWith(`${HSD_ROUTE_ROOT}/planning`) || pathname.startsWith(`${HSD_ROUTE_ROOT}/offers`) || pathname.startsWith(`${HSD_ROUTE_ROOT}/bundles`)) return 'results'
  if (pathname.startsWith(`${HSD_ROUTE_ROOT}/vitrine`)) return 'vitrine'
  if (pathname.startsWith(`${HSD_ROUTE_ROOT}/handoffs`)) return 'carelink'
  return 'advanced'
}

export function HomeServiceDesignShell({ children, databaseReady = true, pendingApprovals = 0 }: { children: ReactNode; databaseReady?: boolean; pendingApprovals?: number }) {
  const pathname = usePathname() || HSD_ROUTE_ROOT
  const router = useRouter()
  const [paletteOpen, setPaletteOpen] = useState(false)
  const [query, setQuery] = useState('')
  const activeMaster = masterKey(pathname)
  const contextNav = HSD_CONTEXT_NAV[activeMaster as keyof typeof HSD_CONTEXT_NAV] || []

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') { event.preventDefault(); setPaletteOpen((value) => !value) }
      if (event.key === 'Escape') setPaletteOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const commands = useMemo(() => [
    ...HSD_MASTER_UNIVERSES.map((item) => ({ label: `Ouvrir · ${item.label}`, href: item.href, description: item.description })),
    { label: 'Créer une mission HomeService', href: HSD_ROUTE_ROOT, description: 'Composer immédiatement depuis la catégorie locale.' },
    { label: 'Créer un programme multi-missions', href: `${HSD_ROUTE_ROOT}/planning/new`, description: 'Plusieurs journées avec déroulé exact.' },
    { label: 'Composer un package commercial', href: `${HSD_ROUTE_ROOT}/offers/new`, description: 'Service, options, prix et Vitrine.' },
    { label: 'Importer une ressource précise', href: `${HSD_ROUTE_ROOT}/factory/import`, description: 'Doctrine, activité, capacité, prix ou autre ressource ciblée.' },
    { label: 'Ouvrir la Vitrine B2C', href: `${HSD_ROUTE_ROOT}/vitrine`, description: 'Références publiées pour les familles.' },
    { label: 'Ouvrir la Vitrine B2B', href: `${HSD_ROUTE_ROOT}/vitrine/b2b`, description: 'Références publiées pour les institutions.' },
    { label: 'Créer un dossier CARELINK', href: `${HSD_ROUTE_ROOT}/handoffs/new`, description: 'Action finale volontaire vers l’exécution.' },
    { label: 'Ouvrir les opérations avancées', href: `${HSD_ROUTE_ROOT}/advanced`, description: 'Qualité, performance, readiness et audit hors du chemin principal.' },
  ].filter((item) => `${item.label} ${item.description}`.toLowerCase().includes(query.toLowerCase())), [query])

  return (
    <main className="min-h-screen bg-[#f4f7fb] text-slate-950">
      <header className="sticky top-0 z-[80] border-b border-slate-200 bg-white/95 backdrop-blur-xl">
        <div className="flex min-h-[74px] items-center gap-5 px-5 xl:px-8">
          <Link href={HSD_ROUTE_ROOT} className="flex min-w-fit items-center gap-3">
            <div className="relative h-10 w-36 overflow-hidden"><Image src="/b2b-plaquette-partenaires/assets/angelcare-original-logo.png" alt="AngelCare" fill className="object-contain object-left" sizes="144px" /></div>
            <div className="hidden h-9 w-px bg-slate-200 lg:block" />
            <div className="hidden lg:block"><p className="text-[9px] font-black uppercase tracking-[0.25em] text-blue-600">HomeService</p><p className="text-xs font-black text-slate-800">Experience & Mission Design OS</p></div>
          </Link>

          <nav className="hidden flex-1 items-center justify-center gap-1 xl:flex">
            {HSD_MASTER_UNIVERSES.map((item) => {
              const active = activeMaster === item.key
              return <Link key={item.key} href={item.href} className={cx('rounded-2xl px-3.5 py-2.5 text-[11px] font-black transition', active ? 'bg-slate-950 text-white shadow-lg' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-950')}>{item.label}</Link>
            })}
          </nav>

          <div className="ml-auto flex items-center gap-2">
            <button onClick={() => setPaletteOpen(true)} className="hidden items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-[11px] font-black text-slate-600 lg:flex"><Search size={14} /> Rechercher <kbd className="rounded-md bg-white px-1.5 py-0.5 text-[9px] text-slate-400">⌘K</kbd></button>
            <div title={databaseReady ? 'Données opérationnelles disponibles' : 'Configuration base requise'} className={cx('grid h-9 w-9 place-items-center rounded-xl border', databaseReady ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-rose-200 bg-rose-50 text-rose-700')}><Database size={16} /></div>
            <div title="OpenRouter Free · activation UMZ2" className="grid h-9 w-9 place-items-center rounded-xl border border-violet-200 bg-violet-50 text-violet-700"><Bot size={16} /></div>
            <Link href={`${HSD_ROUTE_ROOT}/command/approvals`} className="relative grid h-9 w-9 place-items-center rounded-xl border border-slate-200 bg-white text-slate-700"><BellRing size={16} />{pendingApprovals > 0 ? <span className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-rose-600 px-1 text-[9px] font-black text-white">{pendingApprovals}</span> : null}</Link>
          </div>
        </div>

        <div className="border-t border-slate-100 px-5 xl:px-8">
          <div className="flex items-center gap-2 overflow-x-auto py-2.5">
            <div className="mr-2 flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.18em] text-slate-400"><Command size={13} /> Contexte</div>
            {contextNav.map((item) => {
              const active = pathname === item.href
              return <Link key={item.href} href={item.href} className={cx('whitespace-nowrap rounded-xl px-3 py-2 text-[11px] font-black transition', active ? 'bg-blue-50 text-blue-700 ring-1 ring-blue-100' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900')}>{item.label}</Link>
            })}
            <button className="ml-auto hidden items-center gap-2 whitespace-nowrap rounded-xl px-3 py-2 text-[10px] font-black uppercase tracking-[0.14em] text-emerald-700 lg:flex"><ShieldCheck size={14} /> CARELINK préservé</button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-[1760px] px-4 py-5 sm:px-6 xl:px-8 xl:py-8">{children}</div>

      {paletteOpen ? (
        <div className="fixed inset-0 z-[200] bg-slate-950/45 p-4 backdrop-blur-sm" onMouseDown={() => setPaletteOpen(false)}>
          <section className="mx-auto mt-[8vh] max-w-2xl overflow-hidden rounded-[30px] border border-white/20 bg-white shadow-[0_40px_120px_rgba(15,23,42,0.35)]" onMouseDown={(event) => event.stopPropagation()}>
            <div className="flex items-center gap-3 border-b border-slate-100 px-5 py-4"><Search size={20} className="text-blue-600" /><input autoFocus value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Catégorie, action, règle, activité…" className="min-w-0 flex-1 bg-transparent text-base font-bold text-slate-950 outline-none placeholder:text-slate-400" /><button onClick={() => setPaletteOpen(false)} className="grid h-8 w-8 place-items-center rounded-xl bg-slate-100 text-slate-500"><X size={15} /></button></div>
            <div className="max-h-[60vh] overflow-y-auto p-3">
              {commands.map((item) => <button key={`${item.href}-${item.label}`} onClick={() => { setPaletteOpen(false); router.push(item.href) }} className="flex w-full items-start gap-4 rounded-2xl px-4 py-3 text-left transition hover:bg-blue-50"><div className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-slate-950 text-white"><Sparkles size={15} /></div><div><p className="text-sm font-black text-slate-900">{item.label}</p><p className="mt-1 text-xs font-semibold leading-5 text-slate-500">{item.description}</p></div></button>)}
              {!commands.length ? <div className="p-8 text-center text-sm font-bold text-slate-400">Aucune commande ne correspond.</div> : null}
            </div>
          </section>
        </div>
      ) : null}
    </main>
  )
}
