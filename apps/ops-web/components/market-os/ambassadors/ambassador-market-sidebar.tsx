"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState, type ComponentType } from "react"
import {
  BarChart3,
  BookOpenCheck,
  BriefcaseBusiness,
  ChevronLeft,
  ChevronRight,
  CircleGauge,
  FileText,
  GraduationCap,
  Landmark,
  LayoutDashboard,
  Map,
  MapPinned,
  Menu,
  Settings,
  ShieldCheck,
  Target,
  Trash2,
  UserPlus,
  Users,
  WalletCards,
  X,
} from "lucide-react"

type NavigationIcon = ComponentType<{
  size?: number
  className?: string
  strokeWidth?: number
}>

type NavigationItem = {
  label: string
  shortLabel: string
  href: string
  icon: NavigationIcon
}

type NavigationGroup = {
  label: string
  items: NavigationItem[]
}

const groups: NavigationGroup[] = [
  {
    label: "Pilotage",
    items: [
      {
        label: "Vue d’ensemble",
        shortLabel: "Vue d’ensemble",
        href: "/market-os/ambassadors",
        icon: LayoutDashboard,
      },
      {
        label: "Répertoire ambassadeurs",
        shortLabel: "Répertoire",
        href: "/market-os/ambassadors/directory",
        icon: Users,
      },
      {
        label: "Territoires",
        shortLabel: "Territoires",
        href: "/market-os/ambassadors/territories",
        icon: Map,
      },
      {
        label: "Performance",
        shortLabel: "Performance",
        href: "/market-os/ambassadors/performance",
        icon: BarChart3,
      },
      {
        label: "Rapports",
        shortLabel: "Rapports",
        href: "/market-os/ambassadors/reports",
        icon: FileText,
      },
    ],
  },
  {
    label: "Gestion du réseau",
    items: [
      {
        label: "Recrutement",
        shortLabel: "Recrutement",
        href: "/market-os/ambassadors/recruitment",
        icon: UserPlus,
      },
      {
        label: "Activation & onboarding",
        shortLabel: "Activation",
        href: "/market-os/ambassadors/onboarding",
        icon: BookOpenCheck,
      },
      {
        label: "Formation & certification",
        shortLabel: "Formation",
        href: "/market-os/ambassadors/training-academy",
        icon: GraduationCap,
      },
      {
        label: "Objectifs & KPIs",
        shortLabel: "Objectifs",
        href: "/market-os/ambassadors/goals-kpis",
        icon: Target,
      },
      {
        label: "Incentives & paiements",
        shortLabel: "Paiements",
        href: "/market-os/ambassadors/payouts",
        icon: WalletCards,
      },
    ],
  },
  {
    label: "Opérations terrain",
    items: [
      {
        label: "Missions",
        shortLabel: "Missions",
        href: "/market-os/ambassadors/missions",
        icon: MapPinned,
      },
      {
        label: "Leads",
        shortLabel: "Leads",
        href: "/market-os/ambassadors/leads",
        icon: BriefcaseBusiness,
      },
    ],
  },
  {
    label: "Gouvernance",
    items: [
      {
        label: "Cycle de vie des données",
        shortLabel: "Cycle de vie",
        href: "/market-os/ambassadors/data-lifecycle",
        icon: Trash2,
      },
      {
        label: "Paramètres",
        shortLabel: "Paramètres",
        href: "/market-os/ambassadors/settings",
        icon: Settings,
      },
    ],
  },
]

function isItemActive(pathname: string, href: string) {
  if (href === "/market-os/ambassadors") {
    return pathname === href
  }

  return pathname === href || pathname.startsWith(`${href}/`)
}

export default function AmbassadorMarketSidebar() {
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  const sidebarWidth = collapsed ? "lg:w-[88px]" : "lg:w-[286px]"

  return (
    <>
      <button
        type="button"
        aria-label="Ouvrir la navigation Ambassador OS"
        onClick={() => setMobileOpen(true)}
        className="fixed left-4 top-4 z-[170] grid h-11 w-11 place-items-center rounded-2xl border border-slate-200 bg-white text-[#0b1f3a] shadow-[0_14px_35px_rgba(15,23,42,0.14)] lg:hidden"
      >
        <Menu size={20} />
      </button>

      {mobileOpen ? (
        <button
          type="button"
          aria-label="Fermer la navigation Ambassador OS"
          onClick={() => setMobileOpen(false)}
          className="fixed inset-0 z-[175] bg-[#071426]/55 backdrop-blur-[2px] lg:hidden"
        />
      ) : null}

      <aside
        data-ambassador-premium-sidebar="true"
        className={[
          "fixed inset-y-0 left-0 z-[180] flex h-screen w-[286px] shrink-0 flex-col border-r border-slate-200/80 bg-white shadow-[18px_0_48px_rgba(15,23,42,0.065)] transition-[width,transform] duration-200 ease-out lg:sticky lg:top-0 lg:z-50 lg:translate-x-0",
          sidebarWidth,
          mobileOpen ? "translate-x-0" : "-translate-x-full",
        ].join(" ")}
      >
        <div className="relative border-b border-slate-100 px-5 pb-5 pt-6">
          <button
            type="button"
            aria-label="Fermer la navigation"
            onClick={() => setMobileOpen(false)}
            className="absolute right-4 top-4 grid h-9 w-9 place-items-center rounded-xl border border-slate-200 bg-white text-slate-600 lg:hidden"
          >
            <X size={16} />
          </button>

          <Link
            href="/market-os/ambassadors"
            onClick={() => setMobileOpen(false)}
            className="block"
          >
            <div className={collapsed ? "flex justify-center" : ""}>
              <div className="flex items-center gap-3">
                <div className="grid h-11 w-11 shrink-0 place-items-center overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                  <img
                    src="/b2b-plaquette-partenaires/assets/angelcare-original-logo.png"
                    alt="AngelCare"
                    className="h-full w-full object-contain p-1.5"
                  />
                </div>

                {!collapsed ? (
                  <div className="min-w-0">
                    <p className="truncate text-[10px] font-black uppercase tracking-[0.2em] text-[#b4232f]">
                      AngelCare Systems
                    </p>
                    <p className="mt-0.5 truncate text-[17px] font-black tracking-[-0.025em] text-[#081b33]">
                      Market OS
                    </p>
                  </div>
                ) : null}
              </div>
            </div>

            {!collapsed ? (
              <div className="mt-4 rounded-2xl border border-[#dce8f6] bg-[#f5f9fe] px-3.5 py-3">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-[9px] font-black uppercase tracking-[0.18em] text-[#406185]">
                      Operating workspace
                    </p>
                    <p className="mt-1 text-sm font-black text-[#0a2445]">
                      Ambassador Network
                    </p>
                  </div>
                  <CircleGauge size={18} className="text-[#1e63b6]" />
                </div>
              </div>
            ) : null}
          </Link>
        </div>

        <nav className="min-h-0 flex-1 overflow-y-auto px-3 py-5 [scrollbar-width:thin] [scrollbar-color:#cbd5e1_transparent]">
          <div className="space-y-6">
            {groups.map((group) => (
              <section key={group.label}>
                {!collapsed ? (
                  <div className="mb-2 px-3 text-[9px] font-black uppercase tracking-[0.19em] text-slate-400">
                    {group.label}
                  </div>
                ) : (
                  <div className="mx-auto mb-2 h-px w-8 bg-slate-200" />
                )}

                <div className="space-y-1">
                  {group.items.map((item) => {
                    const Icon = item.icon
                    const active = isItemActive(pathname, item.href)

                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        title={collapsed ? item.label : undefined}
                        onClick={() => setMobileOpen(false)}
                        aria-current={active ? "page" : undefined}
                        className={[
                          "group relative flex min-h-11 items-center rounded-xl text-[12px] font-extrabold transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2f70bd] focus-visible:ring-offset-2",
                          collapsed ? "justify-center px-2" : "gap-3 px-3.5",
                          active
                            ? "bg-[#0c2b4f] !text-white shadow-[0_9px_24px_rgba(12,43,79,0.18)] [&_svg]:!text-white"
                            : "text-slate-600 hover:bg-[#f2f6fb] hover:text-[#0c2b4f]",
                        ].join(" ")}
                      >
                        {active ? (
                          <span className="absolute -left-3 h-7 w-1 rounded-r-full bg-[#c32634]" />
                        ) : null}

                        <span
                          className={[
                            "grid h-8 w-8 shrink-0 place-items-center rounded-lg transition-colors",
                            active
                              ? "bg-white/15 !text-white [&_svg]:!text-white"
                              : "bg-slate-50 text-[#244d78] group-hover:bg-white",
                          ].join(" ")}
                        >
                          <Icon size={16} strokeWidth={2.1} />
                        </span>

                        {!collapsed ? (
                          <span
                            className={
                              active
                                ? "min-w-0 flex-1 truncate !text-white"
                                : "min-w-0 flex-1 truncate"
                            }
                          >
                            {item.shortLabel}
                          </span>
                        ) : null}
                      </Link>
                    )
                  })}
                </div>
              </section>
            ))}
          </div>
        </nav>

        <div className="border-t border-slate-100 p-3">
          {!collapsed ? (
            <div className="rounded-2xl border border-slate-200 bg-[#f8fafc] p-3.5">
              <div className="flex items-center gap-3">
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-[#e8f1fb] text-[#1c5fa9]">
                  <ShieldCheck size={17} />
                </span>
                <div className="min-w-0">
                  <p className="truncate text-xs font-black text-[#102a49]">
                    Espace opérationnel protégé
                  </p>
                  <p className="mt-0.5 truncate text-[10px] font-semibold text-slate-500">
                    Gouvernance et accès contrôlés
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="mx-auto grid h-10 w-10 place-items-center rounded-xl bg-[#eef4fb] text-[#1e63b6]" title="Espace opérationnel protégé">
              <ShieldCheck size={18} />
            </div>
          )}

          <button
            type="button"
            aria-label={collapsed ? "Déployer la navigation" : "Réduire la navigation"}
            onClick={() => setCollapsed((value) => !value)}
            className="mt-3 hidden h-10 w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white text-[11px] font-black text-slate-600 transition hover:bg-slate-50 hover:text-[#0c2b4f] lg:flex"
          >
            {collapsed ? <ChevronRight size={15} /> : <ChevronLeft size={15} />}
            {!collapsed ? "Réduire" : null}
          </button>
        </div>
      </aside>
    </>
  )
}
