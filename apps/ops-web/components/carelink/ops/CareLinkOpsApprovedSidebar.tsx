'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { usePathname } from 'next/navigation'
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CircleDot,
  PanelLeftClose,
  PanelLeftOpen,
  Pin,
  PinOff,
  Search,
  ShieldCheck,
  Sparkles,
  X,
} from 'lucide-react'
import {
  CARELINK_NAV_GROUPS,
  careLinkItemIsActive,
  type CareLinkNavGroup,
  type CareLinkNavItem,
} from './navigation/carelink-navigation'

const STORAGE_COLLAPSED = 'carelink-ops-sidebar-collapsed-v2'
const STORAGE_PINNED = 'carelink-ops-sidebar-pinned-v2'
const STORAGE_GROUPS = 'carelink-ops-sidebar-groups-v2'

function readJson<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback
  try {
    const value = window.localStorage.getItem(key)
    return value ? JSON.parse(value) as T : fallback
  } catch {
    return fallback
  }
}

function groupHasActive(pathname: string, group: CareLinkNavGroup) {
  return group.items.some((item) => careLinkItemIsActive(pathname, item) || (item.children || []).some((child) => careLinkItemIsActive(pathname, child)))
}

function accentClasses(item: CareLinkNavItem, active: boolean) {
  const accent = item.accent || 'blue'
  const activeMap = {
    blue: 'bg-blue-600 text-white shadow-[0_12px_28px_rgba(37,99,235,0.28)]',
    emerald: 'bg-emerald-600 text-white shadow-[0_12px_28px_rgba(5,150,105,0.24)]',
    amber: 'bg-amber-500 text-slate-950 shadow-[0_12px_28px_rgba(245,158,11,0.22)]',
    violet: 'bg-violet-600 text-white shadow-[0_12px_28px_rgba(124,58,237,0.24)]',
    rose: 'bg-rose-600 text-white shadow-[0_12px_28px_rgba(225,29,72,0.24)]',
    cyan: 'bg-cyan-600 text-white shadow-[0_12px_28px_rgba(8,145,178,0.24)]',
  } as const
  return active ? activeMap[accent] : 'text-slate-600 hover:bg-slate-100 hover:text-slate-950'
}

function ItemLink({ item, pathname, collapsed, depth = 0, pinned, onTogglePin, onNavigate }: {
  item: CareLinkNavItem
  pathname: string
  collapsed: boolean
  depth?: number
  pinned: boolean
  onTogglePin: () => void
  onNavigate?: () => void
}) {
  const active = careLinkItemIsActive(pathname, item)
  const Icon = item.icon
  return (
    <div className="group/nav relative">
      <Link
        href={item.href}
        onClick={onNavigate}
        title={collapsed ? `${item.label} — ${item.description}` : undefined}
        className={[
          'flex min-h-11 items-center rounded-2xl text-[13px] font-black transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2',
          collapsed ? 'mx-auto w-12 justify-center px-0' : depth ? 'gap-3 px-3 py-2.5' : 'gap-3.5 px-3.5 py-2.5',
          accentClasses(item, active),
        ].join(' ')}
        aria-current={active ? 'page' : undefined}
      >
        <Icon size={depth ? 16 : 18} className="shrink-0" strokeWidth={2.2} />
        {!collapsed ? <span className="min-w-0 flex-1 truncate">{item.label}</span> : null}
        {!collapsed && active ? <CircleDot size={13} className="shrink-0 opacity-80" /> : null}
      </Link>
      {!collapsed ? (
        <button
          type="button"
          onClick={onTogglePin}
          className="absolute right-8 top-1/2 hidden h-7 w-7 -translate-y-1/2 place-items-center rounded-xl bg-white/85 text-slate-400 shadow-sm backdrop-blur transition hover:text-blue-600 group-hover/nav:grid"
          aria-label={pinned ? `Retirer ${item.label} des favoris` : `Épingler ${item.label}`}
        >
          {pinned ? <PinOff size={12} /> : <Pin size={12} />}
        </button>
      ) : null}
    </div>
  )
}

export function CareLinkOpsApprovedSidebar({
  collapsed,
  onCollapsedChange,
  mobileOpen,
  onMobileOpenChange,
  onOpenPalette,
}: {
  collapsed: boolean
  onCollapsedChange: (value: boolean) => void
  mobileOpen: boolean
  onMobileOpenChange: (value: boolean) => void
  onOpenPalette: () => void
}) {
  const pathname = usePathname() || '/carelink-ops'
  const [hydrated, setHydrated] = useState(false)
  const [pinned, setPinned] = useState<string[]>([])
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({})
  const [serviceDesignOpen, setServiceDesignOpen] = useState(pathname.startsWith('/carelink-ops/service-design'))

  useEffect(() => {
    setPinned(readJson<string[]>(STORAGE_PINNED, ['/carelink-ops', '/carelink-ops/dispatch', '/carelink-ops/service-design']))
    setOpenGroups(readJson<Record<string, boolean>>(STORAGE_GROUPS, { command: true, operations: true }))
    setHydrated(true)
  }, [])

  useEffect(() => {
    if (!hydrated) return
    window.localStorage.setItem(STORAGE_PINNED, JSON.stringify(pinned))
  }, [hydrated, pinned])

  useEffect(() => {
    if (!hydrated) return
    window.localStorage.setItem(STORAGE_GROUPS, JSON.stringify(openGroups))
  }, [hydrated, openGroups])

  useEffect(() => {
    if (pathname.startsWith('/carelink-ops/service-design')) setServiceDesignOpen(true)
  }, [pathname])

  const pinnedItems = useMemo(() => {
    const items = CARELINK_NAV_GROUPS.flatMap((group) => group.items)
    return pinned.map((href) => items.find((item) => item.href === href)).filter(Boolean) as CareLinkNavItem[]
  }, [pinned])

  function togglePinned(item: CareLinkNavItem) {
    setPinned((current) => current.includes(item.href) ? current.filter((href) => href !== item.href) : [...current, item.href].slice(-6))
  }

  function toggleGroup(key: string) {
    setOpenGroups((current) => ({ ...current, [key]: !current[key] }))
  }

  const widthClass = collapsed ? 'w-[84px]' : 'w-[292px]'

  return (
    <>
      {mobileOpen ? <button type="button" aria-label="Fermer la navigation" className="fixed inset-0 z-[1090] bg-slate-950/50 backdrop-blur-sm lg:hidden" onClick={() => onMobileOpenChange(false)} /> : null}
      <aside
        data-carelink-global-sidebar
        data-collapsed={collapsed ? 'true' : 'false'}
        className={[
          'fixed inset-y-0 left-0 z-[1100] flex flex-col border-r border-slate-200/80 bg-white/95 shadow-[18px_0_60px_rgba(15,23,42,0.09)] backdrop-blur-xl transition-[width,transform] duration-300 ease-out',
          widthClass,
          mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
        ].join(' ')}
      >
        <div className={collapsed ? 'px-3 pb-3 pt-4' : 'px-4 pb-3 pt-4'}>
          <div className={[
            'relative overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-[0_18px_46px_rgba(15,23,42,0.08)]',
            collapsed ? 'p-2.5' : 'p-4',
          ].join(' ')}>
            <div className="pointer-events-none absolute -right-16 -top-16 h-36 w-36 rounded-full bg-blue-100 blur-3xl" />
            <Link href="/carelink-ops" onClick={() => onMobileOpenChange(false)} className={collapsed ? 'relative flex justify-center' : 'relative block'}>
              <div className={collapsed ? 'relative h-11 w-12' : 'relative h-12 w-full'}>
                <Image src="/b2b-plaquette-partenaires/assets/angelcare-original-logo.png" alt="AngelCare" fill priority className={collapsed ? 'object-contain' : 'object-contain object-left'} sizes={collapsed ? '48px' : '230px'} />
              </div>
              {!collapsed ? (
                <div className="mt-3 border-t border-slate-100 pt-3">
                  <div className="flex items-center justify-between gap-3"><div><div className="text-[9px] font-black uppercase tracking-[0.28em] text-blue-600">CARELINK Operations</div><div className="mt-1 text-[15px] font-black tracking-[-0.025em] text-slate-950">HomeService Command Network</div></div><div className="grid h-9 w-9 shrink-0 place-items-center rounded-2xl bg-slate-950 text-white"><ShieldCheck size={16} /></div></div>
                </div>
              ) : null}
            </Link>
            <button type="button" onClick={() => onMobileOpenChange(false)} className="absolute right-2 top-2 grid h-8 w-8 place-items-center rounded-xl bg-white/90 text-slate-500 shadow-sm lg:hidden" aria-label="Fermer"><X size={15} /></button>
          </div>
        </div>

        <div className={collapsed ? 'px-3 pb-2' : 'px-4 pb-2'}>
          <button type="button" onClick={onOpenPalette} className={[
            'flex h-11 w-full items-center rounded-2xl border border-slate-200 bg-slate-50 text-slate-500 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700',
            collapsed ? 'justify-center px-0' : 'gap-3 px-3.5',
          ].join(' ')} title={collapsed ? 'Rechercher et naviguer' : undefined}>
            <Search size={17} />
            {!collapsed ? <><span className="min-w-0 flex-1 text-left text-xs font-black">Rechercher & naviguer</span><kbd className="rounded-lg border border-slate-200 bg-white px-1.5 py-0.5 text-[9px] font-black text-slate-400">⌘K</kbd></> : null}
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-3 pb-5 pt-2 carelink-sidebar-scroll">
          {!collapsed && pinnedItems.length ? (
            <section className="mb-4">
              <div className="mb-2 flex items-center gap-2 px-2 text-[9px] font-black uppercase tracking-[0.24em] text-slate-400"><Pin size={11} /> Accès rapides</div>
              <div className="space-y-1">
                {pinnedItems.map((item) => <ItemLink key={`pinned-${item.href}`} item={item} pathname={pathname} collapsed={false} pinned onTogglePin={() => togglePinned(item)} onNavigate={() => onMobileOpenChange(false)} />)}
              </div>
            </section>
          ) : null}

          <nav className="space-y-3" aria-label="Navigation CARELINK Operations">
            {CARELINK_NAV_GROUPS.map((group) => {
              const GroupIcon = group.icon
              const activeGroup = groupHasActive(pathname, group)
              const groupOpen = collapsed || openGroups[group.key] || activeGroup
              return (
                <section key={group.key} className={collapsed ? 'space-y-1' : 'rounded-[22px]'}>
                  {!collapsed ? (
                    <button type="button" onClick={() => toggleGroup(group.key)} className="flex w-full items-center gap-2 rounded-xl px-2 py-2 text-left text-[9px] font-black uppercase tracking-[0.22em] text-slate-400 transition hover:bg-slate-50 hover:text-slate-700">
                      <GroupIcon size={12} /><span className="flex-1">{group.label}</span><ChevronDown size={13} className={`transition ${groupOpen ? 'rotate-180' : ''}`} />
                    </button>
                  ) : null}
                  {groupOpen ? (
                    <div className="space-y-1">
                      {group.items.map((item) => {
                        const isServiceDesign = item.href === '/carelink-ops/service-design'
                        const active = careLinkItemIsActive(pathname, item)
                        return (
                          <div key={item.href}>
                            <div className="relative">
                              <ItemLink item={item} pathname={pathname} collapsed={collapsed} pinned={pinned.includes(item.href)} onTogglePin={() => togglePinned(item)} onNavigate={() => onMobileOpenChange(false)} />
                              {isServiceDesign && !collapsed ? (
                                <button type="button" onClick={() => setServiceDesignOpen((value) => !value)} className={`absolute right-1 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-xl transition ${active ? 'text-white/80 hover:bg-white/10' : 'text-slate-400 hover:bg-slate-100 hover:text-slate-700'}`} aria-label="Déployer Service Design OS"><ChevronRight size={14} className={`transition ${serviceDesignOpen ? 'rotate-90' : ''}`} /></button>
                              ) : null}
                            </div>
                            {isServiceDesign && serviceDesignOpen && !collapsed ? (
                              <div className="ml-5 mt-1 space-y-1 border-l border-violet-100 pl-3">
                                {(item.children || []).map((child) => <ItemLink key={child.href} item={child} pathname={pathname} collapsed={false} depth={1} pinned={false} onTogglePin={() => undefined} onNavigate={() => onMobileOpenChange(false)} />)}
                              </div>
                            ) : null}
                          </div>
                        )
                      })}
                    </div>
                  ) : null}
                </section>
              )
            })}
          </nav>
        </div>

        <div className={collapsed ? 'border-t border-slate-200 p-3' : 'border-t border-slate-200 p-4'}>
          {!collapsed ? (
            <div className="mb-3 rounded-[22px] border border-emerald-200 bg-emerald-50/80 p-3.5">
              <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.18em] text-emerald-700"><span className="relative flex h-2 w-2"><span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" /><span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" /></span> Operational sync</div>
              <div className="mt-2 text-xs font-black text-slate-700">CARELINK API connectée</div>
              <div className="mt-1 text-[11px] font-semibold text-slate-500">Navigation et flux live préservés</div>
            </div>
          ) : null}
          <button type="button" onClick={() => { const next = !collapsed; onCollapsedChange(next); if (typeof window !== 'undefined') window.localStorage.setItem(STORAGE_COLLAPSED, JSON.stringify(next)) }} className="flex h-11 w-full items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white text-xs font-black text-slate-600 shadow-sm transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700" aria-label={collapsed ? 'Déployer le menu' : 'Réduire le menu'}>
            {collapsed ? <PanelLeftOpen size={17} /> : <><PanelLeftClose size={17} /><span>Réduire le menu</span></>}
          </button>
        </div>
      </aside>
    </>
  )
}

export function initialCareLinkSidebarCollapsed() {
  return readJson<boolean>(STORAGE_COLLAPSED, false)
}

export default CareLinkOpsApprovedSidebar
