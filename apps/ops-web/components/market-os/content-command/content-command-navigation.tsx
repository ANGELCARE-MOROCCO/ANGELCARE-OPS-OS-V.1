"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import * as React from "react"
import {
  Archive,
  BarChart3,
  BookOpenCheck,
  BrainCircuit,
  CalendarDays,
  ClipboardList,
  FileStack,
  FolderKanban,
  Gauge,
  Layers3,
  Send,
  ShieldCheck,
  Sparkles,
  Workflow,
} from "lucide-react"

export type ContentCommandRoute = {
  key: string
  href: string
  label: string
  description: string
  icon: React.ReactNode
  external?: boolean
  disabled?: boolean
  exact?: boolean
}

export const contentCommandRoutes: readonly ContentCommandRoute[] = [
  { key: "command", href: "/market-os/content-command-center", label: "Commandement", description: "Pilotage exécutif et files d’action", icon: <Gauge className="h-4 w-4" />, exact: true },
  { key: "portfolio", href: "/market-os/content-command-center#portfolio", label: "Portefeuille", description: "Inventaire opérationnel des contenus", icon: <Layers3 className="h-4 w-4" />, exact: true },
  { key: "briefs", href: "/market-os/content-command-center/briefs", label: "Briefs", description: "Briefs stratégiques et planification", icon: <FileStack className="h-4 w-4" /> },
  { key: "production", href: "/market-os/content-command-center/tasks/execution", label: "Production", description: "Exécution concentrée et preuves", icon: <Workflow className="h-4 w-4" /> },
  { key: "tasks", href: "/market-os/content-command-center/tasks", label: "Tâches", description: "Assignations, délais et blocages", icon: <ClipboardList className="h-4 w-4" /> },
  { key: "assets", href: "/market-os/content-command-center/assets", label: "Assets", description: "Bibliothèque créative et versions", icon: <FolderKanban className="h-4 w-4" /> },
  { key: "active-assets", href: "/market-os/content-command-center/active-assets", label: "Assets actifs", description: "Éléments approuvés et utilisables", icon: <Archive className="h-4 w-4" /> },
  { key: "review", href: "/market-os/content-command-center/review", label: "Révision", description: "Révision éditoriale et validation", icon: <ShieldCheck className="h-4 w-4" /> },
  { key: "calendar", href: "/market-os/content-command-center/calendar", label: "Calendrier", description: "Planification éditoriale", icon: <CalendarDays className="h-4 w-4" /> },
  { key: "publishing", href: "/market-os/content-command-center/publishing", label: "Publication", description: "Préflight et contrôle de publication", icon: <Send className="h-4 w-4" /> },
  { key: "performance", href: "/market-os/content-command-center#performance", label: "Performance", description: "Résultats et apprentissage", icon: <BarChart3 className="h-4 w-4" />, exact: true },
  { key: "governance", href: "/market-os/content-command-center/brand-governance", label: "Gouvernance", description: "Doctrine marque et conformité", icon: <BookOpenCheck className="h-4 w-4" /> },
  { key: "legacy", href: "/market-os/content-command-center/legacy-operations", label: "Cockpit existant", description: "Cockpit complet déjà construit, préservé", icon: <Sparkles className="h-4 w-4" /> },
  { key: "ai", href: "/market-os/content-command-center/ai-director", label: "Directeur IA", description: "3 000 commandes, 60 compétences et orchestration Gemini", icon: <BrainCircuit className="h-4 w-4" /> },
] as const

function routeIsActive(pathname: string, route: ContentCommandRoute) {
  if (route.disabled || route.external || route.href.includes("#")) return false
  const cleanHref = route.href.split("#")[0]
  if (route.exact) return pathname === cleanHref
  return pathname === cleanHref || pathname.startsWith(`${cleanHref}/`)
}

export function ContentCommandNavigation() {
  const pathname = usePathname()

  return (
    <nav className="cc360-workspace-nav" aria-label="Navigation Content Command 360">
      <div className="cc360-workspace-nav-scroll">
        {contentCommandRoutes.map((route) => {
          const active = routeIsActive(pathname, route)
          const content = (
            <>
              <span className="cc360-workspace-nav-icon" aria-hidden="true">{route.icon}</span>
              <span className="cc360-workspace-nav-copy">
                <strong>{route.label}</strong>
                <small>{route.description}</small>
              </span>
            </>
          )

          if (route.disabled) {
            return (
              <span key={route.key} className="cc360-workspace-nav-link is-disabled" aria-disabled="true" title={route.description}>
                {content}
              </span>
            )
          }

          return (
            <Link
              key={route.key}
              href={route.href}
              className={`cc360-workspace-nav-link${active ? " is-active" : ""}`}
              aria-current={active ? "page" : undefined}
              title={route.description}
            >
              {content}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
