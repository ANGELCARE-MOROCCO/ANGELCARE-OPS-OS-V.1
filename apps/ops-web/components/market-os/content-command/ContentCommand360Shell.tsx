"use client"

import Image from "next/image"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import * as React from "react"
import {
  FileSearch,
  Command,
  Focus,
  LayoutDashboard,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  X,
} from "lucide-react"
import { ContentCommandNavigation, contentCommandRoutes } from "./content-command-navigation"
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

export type ContentCommandExperienceMode = "executive" | "production" | "focus" | "audit"
export type ContentCommandDensity = "comfortable" | "compact"

const MODE_KEY = "angelcare:content-command-360:mode"
const DENSITY_KEY = "angelcare:content-command-360:density"

const MODE_OPTIONS: Array<{
  value: ContentCommandExperienceMode
  label: string
  description: string
  icon: React.ReactNode
}> = [
  { value: "executive", label: "Executive", description: "Décisions, risques et position globale", icon: <LayoutDashboard className="h-4 w-4" /> },
  { value: "production", label: "Production", description: "Travail, délais, assets et blocages", icon: <SlidersHorizontal className="h-4 w-4" /> },
  { value: "focus", label: "Focus", description: "Réduit le bruit et élargit le travail actif", icon: <Focus className="h-4 w-4" /> },
  { value: "audit", label: "Audit", description: "Provenance, historique et preuves", icon: <FileSearch className="h-4 w-4" /> },
]

type SearchResult = {
  id: string
  type: "Content" | "Task" | "Asset" | "Brief" | "Workspace"
  title: string
  detail: string
  href: string
}

function safelyRead<T>(key: string): T[] {
  if (typeof window === "undefined") return []
  try {
    const parsed = JSON.parse(window.localStorage.getItem(key) || "[]")
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function currentWorkspace(pathname: string) {
  const matching = [...contentCommandRoutes]
    .filter((route) => !route.disabled && route.href !== "#")
    .sort((a, b) => b.href.length - a.href.length)
    .find((route) => {
      const href = route.href.split("#")[0]
      return pathname === href || pathname.startsWith(`${href}/`)
    })

  return matching?.label || "Content Command"
}

function buildSearchIndex(): SearchResult[] {
  const items = safelyRead<ContentItem>(CONTENT_ITEMS_KEY)
  const tasks = safelyRead<ContentTask>(CONTENT_TASKS_KEY)
  const assets = safelyRead<ContentAsset>(CONTENT_ASSETS_KEY)
  const briefs = safelyRead<ContentBrief>(CONTENT_BRIEFS_KEY)

  const contentResults = items.map<SearchResult>((item) => ({
    id: item.id,
    type: "Content",
    title: item.title || "Contenu sans titre",
    detail: `${item.campaign || "Sans campagne"} · ${item.channel} · ${item.status}`,
    href: `/market-os/content-command-center/${item.id}`,
  }))

  const taskResults = tasks.map<SearchResult>((task) => ({
    id: task.id,
    type: "Task",
    title: task.title || "Tâche sans titre",
    detail: `${task.owner} · ${task.status} · ${task.dueDate || "Sans échéance"}`,
    href: `/market-os/content-command-center/tasks/${task.id}`,
  }))

  const assetResults = assets.map<SearchResult>((asset) => ({
    id: asset.id,
    type: "Asset",
    title: asset.name || "Asset sans nom",
    detail: `${asset.type} · ${asset.channel} · ${asset.status}`,
    href: "/market-os/content-command-center/assets",
  }))

  const briefResults = briefs.map<SearchResult>((brief) => ({
    id: brief.id,
    type: "Brief",
    title: brief.title || "Brief sans titre",
    detail: `${brief.campaign || "Sans campagne"} · ${brief.owner} · ${brief.status}`,
    href: "/market-os/content-command-center/briefs",
  }))

  const routeResults = contentCommandRoutes
    .filter((route) => !route.disabled && route.href !== "#")
    .map<SearchResult>((route) => ({
      id: route.key,
      type: "Workspace",
      title: route.label,
      detail: route.description,
      href: route.href,
    }))

  return [...contentResults, ...taskResults, ...assetResults, ...briefResults, ...routeResults]
}

export default function ContentCommand360Shell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const [mode, setMode] = React.useState<ContentCommandExperienceMode>("executive")
  const [density, setDensity] = React.useState<ContentCommandDensity>("comfortable")
  const [paletteOpen, setPaletteOpen] = React.useState(false)
  const [modeMenuOpen, setModeMenuOpen] = React.useState(false)
  const [query, setQuery] = React.useState("")
  const [searchIndex, setSearchIndex] = React.useState<SearchResult[]>([])
  const searchInputRef = React.useRef<HTMLInputElement>(null)

  React.useEffect(() => {
    const storedMode = window.localStorage.getItem(MODE_KEY) as ContentCommandExperienceMode | null
    const storedDensity = window.localStorage.getItem(DENSITY_KEY) as ContentCommandDensity | null
    if (storedMode && MODE_OPTIONS.some((option) => option.value === storedMode)) setMode(storedMode)
    if (storedDensity === "compact" || storedDensity === "comfortable") setDensity(storedDensity)
  }, [])

  React.useEffect(() => {
    document.body.classList.add("content-command-360-active")
    return () => document.body.classList.remove("content-command-360-active")
  }, [])

  React.useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const commandPressed = event.metaKey || event.ctrlKey
      if (commandPressed && event.key.toLowerCase() === "k") {
        event.preventDefault()
        setPaletteOpen(true)
      }
      if (event.key === "Escape") {
        setPaletteOpen(false)
        setModeMenuOpen(false)
      }
    }
    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [])

  React.useEffect(() => {
    if (!paletteOpen) return
    setSearchIndex(buildSearchIndex())
    window.setTimeout(() => searchInputRef.current?.focus(), 30)
  }, [paletteOpen])

  function updateMode(next: ContentCommandExperienceMode) {
    setMode(next)
    window.localStorage.setItem(MODE_KEY, next)
    setModeMenuOpen(false)
  }

  function toggleDensity() {
    const next = density === "comfortable" ? "compact" : "comfortable"
    setDensity(next)
    window.localStorage.setItem(DENSITY_KEY, next)
  }

  const normalizedQuery = query.trim().toLowerCase()
  const results = React.useMemo(() => {
    if (!normalizedQuery) return searchIndex.slice(0, 12)
    return searchIndex
      .filter((result) => `${result.type} ${result.title} ${result.detail}`.toLowerCase().includes(normalizedQuery))
      .slice(0, 18)
  }, [normalizedQuery, searchIndex])

  const activeMode = MODE_OPTIONS.find((option) => option.value === mode) || MODE_OPTIONS[0]

  return (
    <section
      data-content-command-360
      data-cc-mode={mode}
      data-cc-density={density}
      className="cc360-shell"
    >
      <header className="cc360-command-header" data-cc-dark>
        <div className="cc360-command-brand">
          <Link href="/market-os/marketing-home" className="cc360-logo-link" aria-label="Retour à Market OS">
            <span className="cc360-logo-frame">
              <Image src="/logo.png" alt="AngelCare" width={168} height={64} priority className="cc360-logo" />
            </span>
          </Link>
          <div className="cc360-command-brand-copy">
            <span className="cc360-eyebrow">SANILA MARKET OS</span>
            <strong>Content Command Headquarters</strong>
            <small>{currentWorkspace(pathname)} · intelligence, stratégie, missions, production, sources et diffusion</small>
          </div>
        </div>

        <div className="cc360-command-actions">
          <button type="button" className="cc360-command-button" onClick={() => setPaletteOpen(true)}>
            <Search className="h-4 w-4" />
            <span>Recherche globale</span>
            <kbd>⌘ K</kbd>
          </button>

          <div className="cc360-mode-control">
            <button type="button" className="cc360-command-button" onClick={() => setModeMenuOpen((open) => !open)} aria-expanded={modeMenuOpen}>
              {activeMode.icon}
              <span>Mode {activeMode.label}</span>
            </button>
            {modeMenuOpen ? (
              <div className="cc360-mode-menu" role="menu">
                {MODE_OPTIONS.map((option) => (
                  <button key={option.value} type="button" onClick={() => updateMode(option.value)} className={mode === option.value ? "is-active" : ""} role="menuitem">
                    <span>{option.icon}</span>
                    <span><strong>{option.label}</strong><small>{option.description}</small></span>
                  </button>
                ))}
              </div>
            ) : null}
          </div>

          <button type="button" className="cc360-command-button" onClick={toggleDensity}>
            <SlidersHorizontal className="h-4 w-4" />
            <span>{density === "comfortable" ? "Vue confortable" : "Vue compacte"}</span>
          </button>

          <Link href="/market-os/content-command-center/studio" className="cc360-primary-action">
            <Sparkles className="h-4 w-4" /> Créer un contenu
          </Link>
        </div>
      </header>

      <ContentCommandNavigation />

      <div className="cc360-operating-canvas">
        <div className="cc360-trust-strip">
          <span><ShieldCheck className="h-4 w-4" /> Backbone Content Command existant préservé</span>
          <span>Provenance locale, canonique, AI et Bridge toujours visible</span>
          <span>Phase 5 · département 360 sous autorité humaine</span>
        </div>
        {children}
      </div>

      {paletteOpen ? (
        <div className="cc360-palette-backdrop" role="presentation" onMouseDown={() => setPaletteOpen(false)}>
          <section className="cc360-palette" role="dialog" aria-modal="true" aria-label="Commande et recherche Content Command" onMouseDown={(event) => event.stopPropagation()}>
            <header data-cc-dark>
              <div><Command className="h-5 w-5" /><strong>Content Command Palette</strong></div>
              <button type="button" onClick={() => setPaletteOpen(false)} aria-label="Fermer"><X className="h-5 w-5" /></button>
            </header>
            <div className="cc360-palette-search">
              <Search className="h-5 w-5" />
              <input ref={searchInputRef} value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Rechercher signaux, stratégies, missions, dossiers, preuves, sources et workspaces…" />
            </div>
            <div className="cc360-palette-results">
              {results.map((result) => (
                <button
                  type="button"
                  key={`${result.type}-${result.id}`}
                  onClick={() => {
                    setPaletteOpen(false)
                    setQuery("")
                    router.push(result.href)
                  }}
                >
                  <span className="cc360-result-type">{result.type}</span>
                  <span className="cc360-result-copy"><strong>{result.title}</strong><small>{result.detail}</small></span>
                </button>
              ))}
              {!results.length ? <div className="cc360-palette-empty">Aucun résultat correspondant. Modifiez la recherche ou ouvrez un workspace depuis la navigation.</div> : null}
            </div>
          </section>
        </div>
      ) : null}
    </section>
  )
}
