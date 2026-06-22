"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import * as React from "react"
import {
  Archive,
  BookOpenCheck,
  CalendarDays,
  ClipboardList,
  FileStack,
  FolderKanban,
  Layers3,
  Sparkles,
  Zap,
} from "lucide-react"

export type ContentCommandRouteKey =
  | "contentsManagement"
  | "tasks"
  | "assets"
  | "calendar"
  | "activeAssets"
  | "briefings"
  | "academy"

export type ContentCommandRoute = {
  key: ContentCommandRouteKey
  href: string
  label: string
  description: string
  section: "Command" | "Execution" | "Knowledge"
  icon: React.ReactNode
  external?: boolean
}

export const contentCommandRoutes: readonly ContentCommandRoute[] = [
  { key: "contentsManagement", href: "/market-os/content-command-center", label: "Contents management", description: "Master command surface for all content operations", section: "Command", icon: <Layers3 className="h-5 w-5" /> },
  { key: "tasks", href: "/market-os/content-command-center/tasks", label: "Tasks", description: "Production execution, assignments and blockers", section: "Execution", icon: <ClipboardList className="h-5 w-5" /> },
  { key: "assets", href: "/market-os/content-command-center/assets", label: "assets", description: "Creative, scripts, PDFs and production references", section: "Execution", icon: <FolderKanban className="h-5 w-5" /> },
  { key: "calendar", href: "/market-os/content-command-center/calendar", label: "Callendar", description: "Publishing schedule, launch timing and calendar control", section: "Execution", icon: <CalendarDays className="h-5 w-5" /> },
  { key: "activeAssets", href: "/market-os/content-command-center/active-assets", label: "Active assets", description: "Approved assets ready for campaign use", section: "Execution", icon: <Archive className="h-5 w-5" /> },
  { key: "briefings", href: "/market-os/content-command-center/briefs", label: "briefings", description: "Strategic briefs, message angles and production instructions", section: "Knowledge", icon: <FileStack className="h-5 w-5" /> },
  { key: "academy", href: "/training/content-command-center-training.html", label: "academie interne formation complète", description: "Internal training academy and complete operating guide", section: "Knowledge", icon: <BookOpenCheck className="h-5 w-5" />, external: true },
] as const

function groupedRoutes() {
  return contentCommandRoutes.reduce<Record<ContentCommandRoute["section"], ContentCommandRoute[]>>((acc, route) => {
    acc[route.section].push(route)
    return acc
  }, { Command: [], Execution: [], Knowledge: [] })
}

export function ContentCommandNavigation() {
  const pathname = usePathname()
  const groups = groupedRoutes()

  return (
    <aside className="z-40 border-b border-slate-200 bg-[radial-gradient(circle_at_12%_0%,rgba(34,211,238,.10),transparent_28%),radial-gradient(circle_at_86%_0%,rgba(168,85,247,.10),transparent_32%),linear-gradient(180deg,#ffffff,#f8fafc)]/95 text-slate-950 shadow-[0_28px_80px_rgba(15,23,42,.10)] backdrop-blur-2xl xl:fixed xl:inset-y-0 xl:left-0 xl:w-[330px] xl:border-b-0 xl:border-r xl:border-slate-200">
      <div className="flex h-full flex-col overflow-y-auto px-4 py-5 xl:px-5 xl:py-6">
        <Link href="/market-os/marketing-home" className="group mb-5 flex items-center gap-4 rounded-[28px] border border-amber-300/20 bg-gradient-to-br from-white/10 via-white/[.04] to-amber-300/10 p-4 shadow-[0_18px_50px_rgba(245,158,11,.12)]">
          <div className="grid h-14 w-14 place-items-center rounded-[22px] bg-gradient-to-br from-amber-200 via-yellow-400 to-orange-600 text-slate-950 shadow-lg shadow-amber-500/25 transition group-hover:scale-105">
            <Sparkles className="h-7 w-7" />
          </div>
          <div className="min-w-0">
            <div className="truncate text-[11px] font-black uppercase tracking-[.22em] text-amber-800">Market OS</div>
            <div className="truncate text-xl font-black tracking-tight text-slate-950">Content Command</div>
            <div className="mt-1 truncate text-xs font-bold text-slate-700">Brand · Content · Execution</div>
          </div>
        </Link>

        <div className="mb-5 rounded-[26px] border border-cyan-300/15 bg-cyan-400/[.07] p-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[.18em] text-cyan-800">Submodule mode</p>
              <p className="mt-1 text-sm font-black text-slate-950">Futuristic workspace</p>
            </div>
            <div className="grid h-10 w-10 place-items-center rounded-2xl bg-cyan-50 text-cyan-800"><Zap className="h-5 w-5" /></div>
          </div>
          <div className="mt-4 grid grid-cols-3 gap-2 text-center text-[10px] font-black uppercase tracking-[.08em] text-slate-800">
            <span className="rounded-xl bg-slate-100 px-2 py-2">Live</span><span className="rounded-xl bg-slate-100 px-2 py-2">Brand</span><span className="rounded-xl bg-slate-100 px-2 py-2">Ops</span>
          </div>
        </div>

        <nav className="space-y-5" aria-label="Content Command Center sidebar">
          {(Object.keys(groups) as Array<keyof typeof groups>).map((section) => (
            <div key={section}>
              <div className="mb-2 px-2 text-[10px] font-black uppercase tracking-[.2em] text-slate-600">{section}</div>
              <div className="space-y-2">
                {groups[section].map((route) => {
                  const active = !route.external && (pathname === route.href || pathname.startsWith(`${route.href}/`))
                  const className = active ? "border-violet-300/40 bg-gradient-to-r from-violet-600/80 via-fuchsia-600/50 to-cyan-500/30 text-slate-950 shadow-[0_14px_42px_rgba(124,58,237,.28)]" : "border-slate-200 bg-white text-slate-800 hover:border-cyan-300/30 hover:bg-white/[.08] hover:text-slate-950"
                  const content = <><span className={`grid h-10 w-10 shrink-0 place-items-center rounded-2xl ${active ? "bg-slate-100 text-slate-950" : "bg-slate-100 text-cyan-800"}`}>{route.icon}</span><span className="min-w-0 flex-1"><span className="block truncate text-sm font-black">{route.label}</span><span className="mt-0.5 block truncate text-[11px] font-semibold text-slate-950/48">{route.description}</span></span><span className={`h-2.5 w-2.5 rounded-full ${active ? "bg-emerald-300 shadow-[0_0_16px_rgba(110,231,183,.75)]" : "bg-slate-100"}`} /></>
                  return route.external ? <Link key={route.key} href={route.href} target="_blank" rel="noopener noreferrer" className={`flex items-center gap-3 rounded-[22px] border px-3 py-3 transition ${className}`} title={route.description}>{content}</Link> : <Link key={route.key} href={route.href} className={`flex items-center gap-3 rounded-[22px] border px-3 py-3 transition ${className}`} title={route.description}>{content}</Link>
                })}
              </div>
            </div>
          ))}
        </nav>

        <div className="mt-6 rounded-[26px] border border-slate-200 bg-[radial-gradient(circle_at_top_right,rgba(34,211,238,.18),transparent_35%),rgba(255,255,255,.045)] p-4">
          <p className="text-[10px] font-black uppercase tracking-[.18em] text-slate-600">Operating doctrine</p>
          <p className="mt-2 text-sm font-bold leading-6 text-slate-800">Every content action must connect to assets, tasks, briefings, calendar timing and internal training quality.</p>
        </div>
      </div>
    </aside>
  )
}
