'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { usePathname } from 'next/navigation'
import { BellRing, ChevronRight, Command, Menu, Search, ShieldCheck } from 'lucide-react'
import { CareLinkOpsApprovedSidebar, initialCareLinkSidebarCollapsed } from './CareLinkOpsApprovedSidebar'
import { CareLinkOpsCommandPalette } from './navigation/CareLinkOpsCommandPalette'
import { CareLinkOpsLivePulseBar } from './navigation/CareLinkOpsLivePulseBar'
import { activeCareLinkItem } from './navigation/carelink-navigation'

function breadcrumbLabel(segment: string) {
  const map: Record<string, string> = {
    'carelink-ops': 'CARELINK',
    'service-design': 'Service Design OS',
    'service-config': 'Configuration services',
    'control-room': 'Command Center',
    'customer-experience': 'Expérience client',
    'multi-mission': 'Multi-missions',
    'price-books': 'Price Books',
    'production-readiness': 'Readiness',
  }
  return map[segment] || segment.replaceAll('-', ' ').replace(/\b\w/g, (char) => char.toUpperCase())
}

export function CareLinkOpsFrame({ children }: { children: ReactNode }) {
  const pathname = usePathname() || '/carelink-ops'
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [paletteOpen, setPaletteOpen] = useState(false)
  const [clock, setClock] = useState('')
  const active = activeCareLinkItem(pathname)

  useEffect(() => { setCollapsed(initialCareLinkSidebarCollapsed()) }, [])
  useEffect(() => { setMobileOpen(false) }, [pathname])
  useEffect(() => {
    function update() { setClock(new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })) }
    update(); const timer = setInterval(update, 30000); return () => clearInterval(timer)
  }, [])
  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') { event.preventDefault(); setPaletteOpen((value) => !value) }
      if (event.key === 'Escape') { setPaletteOpen(false); setMobileOpen(false) }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const crumbs = useMemo(() => {
    const segments = pathname.split('/').filter(Boolean)
    return segments.map((segment, index) => ({
      label: breadcrumbLabel(segment),
      href: `/${segments.slice(0, index + 1).join('/')}`,
      current: index === segments.length - 1,
    })).slice(1)
  }, [pathname])

  return (
    <main className="min-h-screen bg-[#f4f7fb] text-slate-950">
      <CareLinkOpsApprovedSidebar collapsed={collapsed} onCollapsedChange={setCollapsed} mobileOpen={mobileOpen} onMobileOpenChange={setMobileOpen} onOpenPalette={() => setPaletteOpen(true)} />

      <section className={`min-h-screen transition-[padding] duration-300 ${collapsed ? 'lg:pl-[84px]' : 'lg:pl-[292px]'}`}>
        <div className="sticky top-0 z-[900]">
          <header className="border-b border-slate-200 bg-white/95 px-4 py-3 shadow-[0_8px_30px_rgba(15,23,42,0.05)] backdrop-blur-xl sm:px-6 xl:px-8">
            <div className="flex min-h-14 items-center gap-3">
              <button type="button" onClick={() => setMobileOpen(true)} className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl border border-slate-200 bg-white text-slate-700 shadow-sm lg:hidden" aria-label="Ouvrir le menu"><Menu size={18} /></button>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1 overflow-hidden text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">
                  <Link href="/carelink-ops" className="transition hover:text-blue-600">CARELINK OPS</Link>
                  {crumbs.slice(0, 3).map((crumb) => <span key={crumb.href} className="flex min-w-0 items-center gap-1"><ChevronRight size={11} className="shrink-0" /><Link href={crumb.href} className={`truncate transition hover:text-blue-600 ${crumb.current ? 'text-blue-600' : ''}`}>{crumb.label}</Link></span>)}
                </div>
                <div className="mt-1 flex items-center gap-3"><h1 className="truncate text-lg font-black tracking-[-0.035em] text-slate-950 sm:text-xl">{active.label}</h1><span className="hidden truncate text-xs font-semibold text-slate-500 xl:inline">{active.description}</span></div>
              </div>

              <button type="button" onClick={() => setPaletteOpen(true)} className="hidden h-10 items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-3.5 text-xs font-black text-slate-600 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700 md:flex"><Search size={15} /> Rechercher <kbd className="rounded-lg border border-slate-200 bg-white px-1.5 py-0.5 text-[9px] text-slate-400">⌘K</kbd></button>
              <div className="hidden items-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-[10px] font-black uppercase tracking-[0.15em] text-emerald-700 xl:flex"><ShieldCheck size={14} /> CARELINK préservé</div>
              <Link href="/carelink-ops/notifications" className="relative grid h-10 w-10 place-items-center rounded-2xl border border-slate-200 bg-white text-slate-700 shadow-sm transition hover:border-blue-200 hover:text-blue-700" aria-label="Notifications"><BellRing size={17} /></Link>
              <div className="hidden min-w-16 rounded-2xl bg-slate-950 px-3 py-2 text-center text-[11px] font-black text-white sm:block">{clock || '—:—'}</div>
            </div>
          </header>
          <CareLinkOpsLivePulseBar />
        </div>

        <div className="carelink-ops-page-host min-h-[calc(100vh-100px)] w-full">{children}</div>
      </section>

      <CareLinkOpsCommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} />

      <style>{`
        .carelink-ops-page-host > aside,
        .carelink-ops-page-host > main > aside,
        .carelink-ops-page-host > div > aside { display: none !important; }
        .carelink-ops-page-host > main,
        .carelink-ops-page-host > div { margin-left: 0 !important; padding-left: 0 !important; width: 100% !important; max-width: none !important; }
        .carelink-ops-page-host .pl-72,
        .carelink-ops-page-host .pl-\[220px\],
        .carelink-ops-page-host .pl-\[240px\],
        .carelink-ops-page-host .pl-\[260px\],
        .carelink-ops-page-host .pl-\[280px\],
        .carelink-ops-page-host .pl-\[300px\],
        .carelink-ops-page-host .ml-72,
        .carelink-ops-page-host .ml-\[220px\],
        .carelink-ops-page-host .ml-\[240px\],
        .carelink-ops-page-host .ml-\[260px\],
        .carelink-ops-page-host .ml-\[280px\],
        .carelink-ops-page-host .ml-\[300px\] { padding-left: 0 !important; margin-left: 0 !important; }
        .carelink-ops-page-host [class*="max-w-"] { max-width: none; }
        .carelink-ops-page-host header.sticky { position: relative !important; top: auto !important; }
        .carelink-sidebar-scroll { scrollbar-width: thin; scrollbar-color: rgb(203 213 225) transparent; }
        .carelink-sidebar-scroll::-webkit-scrollbar { width: 6px; }
        .carelink-sidebar-scroll::-webkit-scrollbar-thumb { background: rgb(203 213 225); border-radius: 999px; }
      `}</style>
    </main>
  )
}
