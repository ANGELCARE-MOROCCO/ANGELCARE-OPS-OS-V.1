'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { usePathname } from 'next/navigation'
import {
  BookOpenCheck,
  Bot,
  BriefcaseBusiness,
  Boxes,
  ChevronLeft,
  ChevronRight,
  Focus,
  FileStack,
  Gauge,
  Handshake,
  Layers3,
  PackageCheck,
  Search,
  Sparkles,
  Store,
  WandSparkles,
  X,
} from 'lucide-react'
import { sd2030 } from './ServiceDesignStudio2030'

const dockItems = [
  { href: '/carelink-ops/service-design', label: 'Créer', detail: 'Mission, programme ou package', icon: Sparkles, match: ['/carelink-ops/service-design', '/carelink-ops/service-design/factory'] },
  { href: '/carelink-ops/service-design/my-work', label: 'Mon travail', detail: 'Drafts, favoris, vues et PDF', icon: BriefcaseBusiness, match: ['/carelink-ops/service-design/my-work', '/carelink-ops/service-design/workbench', '/carelink-ops/service-design/compare'] },
  { href: '/carelink-ops/service-design/catalogue', label: 'Catalogue', detail: 'Catégories et portefeuille', icon: Boxes, match: ['/carelink-ops/service-design/catalogue'] },
  { href: '/carelink-ops/service-design/standards/doctrine', label: 'Doctrine', detail: 'Règles, activités et capacités', icon: BookOpenCheck, match: ['/carelink-ops/service-design/standards'] },
  { href: '/carelink-ops/service-design/planning', label: 'Mission Studio', detail: 'Plans et timelines', icon: Layers3, match: ['/carelink-ops/service-design/planning'] },
  { href: '/carelink-ops/service-design/offers', label: 'Packages', detail: 'Prix, marge et bundles', icon: PackageCheck, match: ['/carelink-ops/service-design/offers', '/carelink-ops/service-design/bundles'] },
  { href: '/carelink-ops/service-design/vitrine', label: 'Vitrine', detail: 'B2C et B2B publiés', icon: Store, match: ['/carelink-ops/service-design/vitrine'] },
  { href: '/carelink-ops/service-design/handoffs', label: 'CARELINK Bridge', detail: 'Préparer la transmission', icon: Handshake, match: ['/carelink-ops/service-design/handoffs'] },
  { href: '/carelink-ops/service-design/documents', label: 'A4 & PDF', detail: 'Gabarits, preview et export', icon: FileStack, match: ['/carelink-ops/service-design/documents', '/carelink-ops/service-design/planning/documents', '/carelink-ops/service-design/operations/documents'] },
  { href: '/carelink-ops/service-design/advanced', label: 'Intelligence', detail: 'Qualité et performance', icon: Bot, match: ['/carelink-ops/service-design/advanced', '/carelink-ops/service-design/performance', '/carelink-ops/service-design/quality', '/carelink-ops/service-design/operations'] },
]

export function ServiceDesignDock({ contextLinks }: { contextLinks: ReadonlyArray<{ readonly href: string; readonly label: string }> }) {
  const pathname = usePathname() || '/carelink-ops/service-design'
  const [compact, setCompact] = useState(false)
  const [focus, setFocus] = useState(false)
  const [contextOpen, setContextOpen] = useState(false)

  useEffect(() => {
    try { setCompact(localStorage.getItem('angelcare.service-design.dock.compact') === '1') } catch {}
  }, [])
  useEffect(() => {
    document.documentElement.dataset.serviceDesignFocus = focus ? '1' : '0'
    return () => { delete document.documentElement.dataset.serviceDesignFocus }
  }, [focus])

  const activeItem = useMemo(() => dockItems.find((item) => item.match.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`))) || dockItems[0], [pathname])
  function toggleCompact() {
    setCompact((value) => {
      const next = !value
      try { localStorage.setItem('angelcare.service-design.dock.compact', next ? '1' : '0') } catch {}
      return next
    })
  }

  return <>
    <section className="sd2030-dock sticky top-[100px] z-[780] mb-5 rounded-[28px] border border-slate-200/90 bg-white/90 p-2 shadow-[0_18px_55px_rgba(15,23,42,.10)] backdrop-blur-xl">
      <div className="flex items-center gap-2 overflow-x-auto">
        <div className="flex shrink-0 items-center gap-2 rounded-[20px] bg-slate-950 px-3 py-2 text-white">
          <div className="grid h-9 w-9 place-items-center rounded-2xl bg-gradient-to-br from-blue-600 to-cyan-400 shadow-lg"><WandSparkles size={16} /></div>
          {!compact ? <div className="pr-2"><p className="text-[9px] font-black uppercase tracking-[.2em] text-blue-300">Service Intelligence</p><p className="text-xs font-black">Studio 2030</p></div> : null}
        </div>
        <nav className="flex min-w-0 flex-1 items-center gap-1" aria-label="Service Design Studio Dock">
          {dockItems.map((item) => { const active = item === activeItem; const Icon = item.icon; return <Link key={item.href} href={item.href} title={compact ? `${item.label} — ${item.detail}` : undefined} className={sd2030('group flex shrink-0 items-center gap-2 rounded-2xl border px-3 py-2.5 transition', active ? 'border-blue-200 bg-blue-50 text-blue-950 shadow-sm' : 'border-transparent text-slate-500 hover:border-slate-200 hover:bg-slate-50 hover:text-slate-900')}><Icon size={15} className={active ? 'text-blue-600' : 'text-slate-400 group-hover:text-blue-600'} />{!compact ? <span className="text-[10px] font-black uppercase tracking-[.1em]">{item.label}</span> : null}</Link> })}
        </nav>
        <button type="button" onClick={() => setContextOpen((value) => !value)} className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl border border-slate-200 bg-white text-slate-600" title="Navigation contextuelle"><Search size={15} /></button>
        <button type="button" onClick={() => setFocus((value) => !value)} className={sd2030('grid h-10 w-10 shrink-0 place-items-center rounded-2xl border', focus ? 'border-blue-600 bg-blue-600 text-white' : 'border-slate-200 bg-white text-slate-600')} title={focus ? 'Quitter le mode Focus' : 'Mode Focus Studio'}>{focus ? <X size={16} /> : <Focus size={16} />}</button>
        <button type="button" onClick={toggleCompact} className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl border border-slate-200 bg-white text-slate-600" title={compact ? 'Déployer le dock' : 'Compacter le dock'}>{compact ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}</button>
      </div>
      {contextOpen ? <div className="mt-2 flex flex-wrap gap-2 border-t border-slate-100 px-2 pt-2">{contextLinks.map((item) => <Link key={item.href} href={item.href} className={sd2030('rounded-xl border px-3 py-2 text-[10px] font-black transition', pathname === item.href ? 'border-slate-950 bg-slate-950 text-white' : 'border-slate-200 bg-white text-slate-600 hover:border-blue-200 hover:text-blue-700')}>{item.label}</Link>)}</div> : null}
    </section>
  </>
}

export function ServiceDesignPulseRail({ databaseReady, pendingApprovals }: { databaseReady: boolean; pendingApprovals: number }) {
  const items = [
    { label: databaseReady ? 'Catalogue opérationnel' : 'Configuration base requise', detail: databaseReady ? 'Source locale disponible' : 'Vérifier la connexion', tone: databaseReady ? 'emerald' : 'rose', href: '/carelink-ops/service-design/catalogue' },
    { label: `${pendingApprovals} élément${pendingApprovals === 1 ? '' : 's'} à traiter`, detail: pendingApprovals ? 'Ouvrir la file de travail' : 'Aucune action urgente', tone: pendingApprovals ? 'amber' : 'emerald', href: '/carelink-ops/service-design/my-work' },
    { label: 'OpenRouter Free', detail: 'Advisory only', tone: 'violet', href: '/carelink-ops/service-design/advanced' },
    { label: 'CARELINK souverain', detail: 'Exécution terrain préservée', tone: 'blue', href: '/carelink-ops/service-design/handoffs' },
  ]
  return <div className="sd2030-pulse mb-5 overflow-hidden rounded-[22px] border border-slate-200 bg-white shadow-[0_10px_30px_rgba(15,23,42,.045)]"><div className="flex min-w-max items-center gap-2 p-2">{items.map((item) => <Link key={item.label} href={item.href} className="flex items-center gap-3 rounded-2xl border border-slate-100 bg-slate-50/70 px-3 py-2 transition hover:border-blue-200 hover:bg-blue-50"><span className={sd2030('h-2.5 w-2.5 rounded-full', item.tone === 'emerald' ? 'bg-emerald-500' : item.tone === 'rose' ? 'bg-rose-500' : item.tone === 'amber' ? 'bg-amber-500' : item.tone === 'violet' ? 'bg-violet-500' : 'bg-blue-500')} /><div><p className="text-[10px] font-black text-slate-900">{item.label}</p><p className="text-[9px] font-semibold text-slate-500">{item.detail}</p></div></Link>)}</div></div>
}
