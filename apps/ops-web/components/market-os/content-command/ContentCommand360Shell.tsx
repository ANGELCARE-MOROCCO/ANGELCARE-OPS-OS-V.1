"use client"

import { usePathname, useRouter } from "next/navigation"
import * as React from "react"
import { ShieldCheck } from "lucide-react"
import {
  contentCommandRoutes,
  getContentCommandNavigationGroup,
  resolveContentCommandContextRoute,
  resolveContentCommandRoute,
  type ContentCommandNavigationGroup,
} from "./content-command-navigation"
import {
  CONTENT_ASSETS_KEY,
  CONTENT_BRIEFS_KEY,
  CONTENT_ITEMS_KEY,
  CONTENT_TASKS_KEY,
  type ContentAsset,
  type ContentBrief,
  type ContentItem,
  type ContentTask,
} from "./content-command-system"
import ContentCommandCommandPalette, {
  type ContentCommandSearchResult,
} from "./shell/ContentCommandCommandPalette"
import ContentCommandSidebar from "./shell/ContentCommandSidebar"
import ContentCommandTopbar from "./shell/ContentCommandTopbar"
import LifecycleControlDock from "./experience-bulk9/LifecycleControlDock"
import {
  DEFAULT_CONTENT_COMMAND_PREFERENCES,
  readContentCommandShellPreferences,
  writeContentCommandShellPreference,
} from "./shell/content-command-shell-storage"
import type {
  ContentCommandDensity,
  ContentCommandExperienceMode,
  ContentCommandRecentRoute,
  ContentCommandSidebarMode,
} from "./shell/content-command-shell-types"
import styles from "./shell/content-command-shell.module.css"

function safelyReadArray<T>(key: string): T[] {
  if (typeof window === "undefined") return []
  try {
    const parsed: unknown = JSON.parse(window.localStorage.getItem(key) || "[]")
    return Array.isArray(parsed) ? (parsed as T[]) : []
  } catch {
    return []
  }
}

function cleanText(value: unknown, fallback: string): string {
  return typeof value === "string" && value.trim() ? value.trim() : fallback
}

function buildDataSearchIndex(): ContentCommandSearchResult[] {
  const items = safelyReadArray<ContentItem>(CONTENT_ITEMS_KEY)
  const tasks = safelyReadArray<ContentTask>(CONTENT_TASKS_KEY)
  const assets = safelyReadArray<ContentAsset>(CONTENT_ASSETS_KEY)
  const briefs = safelyReadArray<ContentBrief>(CONTENT_BRIEFS_KEY)

  const contentResults = items.map<ContentCommandSearchResult>((item) => ({
    id: item.id,
    type: "Contenu",
    title: cleanText(item.title, "Contenu sans titre"),
    detail: `${cleanText(item.campaign, "Sans campagne")} · ${cleanText(item.channel, "Canal non défini")} · ${cleanText(item.status, "État non défini")}`,
    href: `/market-os/content-command-center/${item.id}`,
    provenance: "Données locales",
  }))

  const taskResults = tasks.map<ContentCommandSearchResult>((task) => ({
    id: task.id,
    type: "Tâche",
    title: cleanText(task.title, "Tâche sans titre"),
    detail: `${cleanText(task.owner, "Responsable non défini")} · ${cleanText(task.status, "État non défini")} · ${cleanText(task.dueDate, "Sans échéance")}`,
    href: `/market-os/content-command-center/tasks/${task.id}`,
    provenance: "Données locales",
  }))

  const assetResults = assets.map<ContentCommandSearchResult>((asset) => ({
    id: asset.id,
    type: "Asset",
    title: cleanText(asset.name, "Asset sans nom"),
    detail: `${cleanText(asset.type, "Type non défini")} · ${cleanText(asset.channel, "Canal non défini")} · ${cleanText(asset.status, "État non défini")}`,
    href: "/market-os/content-command-center/assets",
    provenance: "Données locales",
  }))

  const briefResults = briefs.map<ContentCommandSearchResult>((brief) => ({
    id: brief.id,
    type: "Brief",
    title: cleanText(brief.title, "Brief sans titre"),
    detail: `${cleanText(brief.campaign, "Sans campagne")} · ${cleanText(brief.owner, "Responsable non défini")} · ${cleanText(brief.status, "État non défini")}`,
    href: "/market-os/content-command-center/briefs",
    provenance: "Données locales",
  }))

  return [...contentResults, ...taskResults, ...assetResults, ...briefResults]
}

function buildRouteSearchIndex(): ContentCommandSearchResult[] {
  return contentCommandRoutes.map((route) => ({
    id: route.key,
    type: "Workspace",
    title: route.label,
    detail: route.description,
    href: route.href,
    provenance: "Workspace",
  }))
}

function resolveCurrentLabel(pathname: string): string {
  const context = resolveContentCommandContextRoute(pathname)
  if (context) return context.route.label
  return resolveContentCommandRoute(pathname)?.label || "Content Command"
}

export default function ContentCommand360Shell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const [sidebarMode, setSidebarMode] = React.useState<ContentCommandSidebarMode>(
    DEFAULT_CONTENT_COMMAND_PREFERENCES.sidebarMode,
  )
  const [expandedGroups, setExpandedGroups] = React.useState<ContentCommandNavigationGroup[]>(
    DEFAULT_CONTENT_COMMAND_PREFERENCES.expandedGroups,
  )
  const [favorites, setFavorites] = React.useState<string[]>(
    DEFAULT_CONTENT_COMMAND_PREFERENCES.favorites,
  )
  const [recentRoutes, setRecentRoutes] = React.useState<ContentCommandRecentRoute[]>(
    DEFAULT_CONTENT_COMMAND_PREFERENCES.recentRoutes,
  )
  const [mode, setMode] = React.useState<ContentCommandExperienceMode>(
    DEFAULT_CONTENT_COMMAND_PREFERENCES.mode,
  )
  const [density, setDensity] = React.useState<ContentCommandDensity>(
    DEFAULT_CONTENT_COMMAND_PREFERENCES.density,
  )
  const [mobileOpen, setMobileOpen] = React.useState(false)
  const [paletteOpen, setPaletteOpen] = React.useState(false)
  const [query, setQuery] = React.useState("")
  const [dataSearchIndex, setDataSearchIndex] = React.useState<ContentCommandSearchResult[]>([])
  const previousSidebarMode = React.useRef<Exclude<ContentCommandSidebarMode, "focus-hidden">>("expanded")

  React.useEffect(() => {
    const preferences = readContentCommandShellPreferences()
    setSidebarMode(preferences.sidebarMode)
    setExpandedGroups(preferences.expandedGroups)
    setFavorites(preferences.favorites)
    setRecentRoutes(preferences.recentRoutes)
    setMode(preferences.mode)
    setDensity(preferences.density)
    if (preferences.sidebarMode !== "focus-hidden") {
      previousSidebarMode.current = preferences.sidebarMode
    }
  }, [])

  React.useEffect(() => {
    document.body.classList.add("content-command-360-active")
    return () => document.body.classList.remove("content-command-360-active")
  }, [])

  React.useEffect(() => {
    const handleGlobalKey = (event: KeyboardEvent) => {
      const commandPressed = event.metaKey || event.ctrlKey
      if (commandPressed && event.key.toLowerCase() === "k") {
        event.preventDefault()
        setPaletteOpen(true)
        return
      }
      if (event.key === "/" && document.activeElement?.tagName !== "INPUT" && document.activeElement?.tagName !== "TEXTAREA") {
        event.preventDefault()
        setPaletteOpen(true)
      }
    }
    window.addEventListener("keydown", handleGlobalKey)
    return () => window.removeEventListener("keydown", handleGlobalKey)
  }, [])

  React.useEffect(() => {
    if (!paletteOpen) return
    setDataSearchIndex(buildDataSearchIndex())
  }, [paletteOpen])

  React.useEffect(() => {
    setMobileOpen(false)

    const route = resolveContentCommandRoute(pathname)
    if (route) {
      const group = getContentCommandNavigationGroup(route.group)
      if (group) {
        setExpandedGroups((current) => {
          if (current.includes(group.key)) return current
          const next = [...current, group.key]
          writeContentCommandShellPreference("expandedGroups", next)
          return next
        })
      }

      if (!pathname.endsWith("/delete")) {
        setRecentRoutes((current) => {
          const next: ContentCommandRecentRoute[] = [
            { href: route.href, label: route.label, visitedAt: Date.now() },
            ...current.filter((entry) => entry.href !== route.href),
          ].slice(0, 8)
          writeContentCommandShellPreference("recentRoutes", next)
          return next
        })
      }
    }
  }, [pathname])

  const updateSidebarMode = React.useCallback((next: ContentCommandSidebarMode) => {
    setSidebarMode(next)
    writeContentCommandShellPreference("sidebarMode", next)
    if (next !== "focus-hidden") previousSidebarMode.current = next
  }, [])

  const updateMode = React.useCallback(
    (next: ContentCommandExperienceMode) => {
      setMode(next)
      writeContentCommandShellPreference("mode", next)

      if (next === "focus") {
        if (sidebarMode !== "focus-hidden") {
          previousSidebarMode.current = sidebarMode
          setSidebarMode("focus-hidden")
          writeContentCommandShellPreference("sidebarMode", "focus-hidden")
        }
      } else if (mode === "focus" && sidebarMode === "focus-hidden") {
        setSidebarMode(previousSidebarMode.current)
        writeContentCommandShellPreference("sidebarMode", previousSidebarMode.current)
      }
    },
    [mode, sidebarMode],
  )

  const toggleDensity = React.useCallback(() => {
    setDensity((current) => {
      const next: ContentCommandDensity = current === "comfortable" ? "compact" : "comfortable"
      writeContentCommandShellPreference("density", next)
      return next
    })
  }, [])

  const toggleGroup = React.useCallback((group: ContentCommandNavigationGroup) => {
    setExpandedGroups((current) => {
      const next = current.includes(group)
        ? current.filter((item) => item !== group)
        : [...current, group]
      writeContentCommandShellPreference("expandedGroups", next)
      return next
    })
  }, [])

  const toggleFavorite = React.useCallback((routeKey: string) => {
    setFavorites((current) => {
      const next = current.includes(routeKey)
        ? current.filter((key) => key !== routeKey)
        : [...current, routeKey].slice(-8)
      writeContentCommandShellPreference("favorites", next)
      return next
    })
  }, [])

  const shellActions = React.useMemo<ContentCommandSearchResult[]>(
    () => [
      {
        id: "action-toggle-sidebar",
        type: "Action",
        title: sidebarMode === "expanded" ? "Réduire la sidebar" : "Déployer la sidebar",
        detail: "Modifier immédiatement la largeur du menu souverain",
        action: () => updateSidebarMode(sidebarMode === "expanded" ? "compact" : "expanded"),
        provenance: "Action shell",
      },
      {
        id: "action-focus",
        type: "Action",
        title: sidebarMode === "focus-hidden" ? "Restaurer le menu" : "Entrer en mode canvas",
        detail: "Masquer ou restaurer la navigation sans quitter le workspace",
        action: () => updateSidebarMode(sidebarMode === "focus-hidden" ? previousSidebarMode.current : "focus-hidden"),
        provenance: "Action shell",
      },
      {
        id: "action-density",
        type: "Action",
        title: density === "comfortable" ? "Activer la densité compacte" : "Activer la densité confortable",
        detail: "Adapter l’espacement du canvas et des données",
        action: toggleDensity,
        provenance: "Action shell",
      },
      {
        id: "action-executive-mode",
        type: "Action",
        title: "Passer en mode Exécutif",
        detail: "Prioriser décisions, risques et position globale",
        action: () => updateMode("executive"),
        provenance: "Action shell",
      },
      {
        id: "action-production-mode",
        type: "Action",
        title: "Passer en mode Production",
        detail: "Prioriser travail, délais, assets et blocages",
        action: () => updateMode("production"),
        provenance: "Action shell",
      },
      {
        id: "action-audit-mode",
        type: "Action",
        title: "Passer en mode Audit",
        detail: "Prioriser provenance, historique et preuves",
        action: () => updateMode("audit"),
        provenance: "Action shell",
      },
    ],
    [density, sidebarMode, toggleDensity, updateMode, updateSidebarMode],
  )

  const allSearchResults = React.useMemo(
    () => [...buildRouteSearchIndex(), ...shellActions, ...dataSearchIndex],
    [dataSearchIndex, shellActions],
  )

  const filteredResults = React.useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase("fr-FR")
    if (!normalized) return allSearchResults.slice(0, 16)
    return allSearchResults
      .filter((result) =>
        `${result.type} ${result.title} ${result.detail} ${result.provenance}`
          .toLocaleLowerCase("fr-FR")
          .includes(normalized),
      )
      .slice(0, 24)
  }, [allSearchResults, query])

  const selectSearchResult = React.useCallback(
    (result: ContentCommandSearchResult) => {
      setPaletteOpen(false)
      setQuery("")
      if (result.action) {
        result.action()
        return
      }
      if (result.href) router.push(result.href)
    },
    [router],
  )

  return (
    <section
      data-content-command-360
      data-sidebar-mode={sidebarMode}
      data-experience-mode={mode}
      data-density={density}
      className={styles.shell}
    >
      <div className={styles.layout}>
        <ContentCommandSidebar
          pathname={pathname}
          sidebarMode={sidebarMode}
          mobileOpen={mobileOpen}
          expandedGroups={expandedGroups}
          favorites={favorites}
          recentRoutes={recentRoutes}
          onSidebarModeChange={updateSidebarMode}
          onMobileOpenChange={setMobileOpen}
          onGroupToggle={toggleGroup}
          onFavoriteToggle={toggleFavorite}
        />

        <div className={styles.mainRegion}>
          <ContentCommandTopbar
            pathname={pathname}
            mode={mode}
            density={density}
            sidebarMode={sidebarMode}
            onModeChange={updateMode}
            onDensityToggle={toggleDensity}
            onPaletteOpen={() => setPaletteOpen(true)}
            onMobileMenuOpen={() => setMobileOpen(true)}
            onSidebarRestore={() => updateSidebarMode(previousSidebarMode.current)}
          />

          <main className={styles.contentFrame}>
            <div className={styles.trustRail} aria-label="État de gouvernance du shell">
              <span><ShieldCheck aria-hidden="true" /> Identité officielle ANGELCARE active</span>
              <span>Autorité humaine et permissions plateforme préservées</span>
              <span>39 workspaces permanents · 6 routes contextuelles</span>
              <span>{resolveCurrentLabel(pathname)}</span>
            </div>
            <LifecycleControlDock pathname={pathname} />
            {children}
          </main>
        </div>
      </div>

      <ContentCommandCommandPalette
        open={paletteOpen}
        results={filteredResults}
        query={query}
        onQueryChange={setQuery}
        onClose={() => {
          setPaletteOpen(false)
          setQuery("")
        }}
        onSelect={selectSearchResult}
      />
    </section>
  )
}
