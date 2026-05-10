"use client"

import Link from "next/link"
import * as React from "react"

export type ContentCommandRouteKey =
  | "dashboard"
  | "create"
  | "briefs"
  | "tasks"
  | "assets"
  | "calendar"
  | "review"
  | "publishing"
  | "brandGovernance"

export type ContentCommandRoute = {
  key: ContentCommandRouteKey
  href: string
  label: string
  description: string
  section: "Command" | "Production" | "Governance"
}

export const contentCommandRoutes: readonly ContentCommandRoute[] = [
  { key: "dashboard", href: "/market-os/content-command-center", label: "Dashboard", description: "Main operating surface", section: "Command" },
  { key: "create", href: "/market-os/content-command-center/create", label: "Create", description: "Create a content item", section: "Production" },
  { key: "briefs", href: "/market-os/content-command-center/briefs", label: "Briefs", description: "Build briefs and convert to work", section: "Production" },
  { key: "tasks", href: "/market-os/content-command-center/tasks", label: "Tasks", description: "Assign production work", section: "Production" },
  { key: "assets", href: "/market-os/content-command-center/assets", label: "Assets", description: "Register and link assets", section: "Production" },
  { key: "calendar", href: "/market-os/content-command-center/calendar", label: "Calendar", description: "Plan publishing dates", section: "Production" },
  { key: "review", href: "/market-os/content-command-center/review", label: "Review", description: "Approve or request revision", section: "Governance" },
  { key: "publishing", href: "/market-os/content-command-center/publishing", label: "Publishing", description: "Schedule and publish ready work", section: "Governance" },
  { key: "brandGovernance", href: "/market-os/content-command-center/brand-governance", label: "Brand", description: "Manage brand rules", section: "Governance" },
] as const

export function ContentCommandNavigation() {
  return (
    <nav className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 px-4 py-3 shadow-sm backdrop-blur lg:px-8" aria-label="Content Command Center navigation">
      <div className="mx-auto flex max-w-[1600px] flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.25em] text-rose-600">Market-OS submodule</p>
          <h2 className="text-lg font-black tracking-tight text-slate-950">Content Command Center</h2>
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1 xl:flex-wrap xl:justify-end xl:overflow-visible xl:pb-0">
          {contentCommandRoutes.map((route) => (
            <Link
              key={route.key}
              href={route.href}
              className="whitespace-nowrap rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-black text-slate-700 transition hover:border-slate-300 hover:bg-slate-950 hover:text-white"
              title={route.description}
            >
              {route.label}
            </Link>
          ))}
        </div>
      </div>
    </nav>
  )
}
