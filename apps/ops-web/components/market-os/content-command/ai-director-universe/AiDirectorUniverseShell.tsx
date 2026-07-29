'use client'

import Image from 'next/image'
import Link from 'next/link'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import * as React from 'react'
import {
  Activity,
  Archive,
  ArrowRight,
  BookOpenCheck,
  Bot,
  BrainCircuit,
  CalendarClock,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  CircleAlert,
  Command,
  Database,
  Gauge,
  GraduationCap,
  History,
  Layers3,
  LayoutGrid,
  LockKeyhole,
  Menu,
  Network,
  PanelRightClose,
  PanelRightOpen,
  Play,
  Radar,
  RefreshCw,
  RotateCcw,
  Search,
  Settings2,
  ShieldCheck,
  Sparkles,
  Workflow,
  X,
  Zap,
} from 'lucide-react'
import styles from './ai-director-universe.module.css'

export type AiDirectorUniverseView =
  | 'command'
  | 'research-control'
  | 'commands'
  | 'skills'
  | 'schedules'
  | 'missions'
  | 'runs'
  | 'learning'
  | 'doctrine'
  | 'settings'
  | 'autopilot'
  | 'compiler'
  | 'queue'
  | 'decisions'
  | 'integrations'
  | 'repository'
  | 'recovery'

interface DirectorRecord {
  id: string
  code?: string | null
  name?: string | null
  director_type?: string | null
  status?: string | null
  authority_mode?: string | null
  provider_module_key?: string | null
  preferred_model?: string | null
  grounding_enabled?: boolean | null
  image_generation_enabled?: boolean | null
}

interface HeadquartersSnapshot {
  aiDirectors?: DirectorRecord[]
  provider?: { available?: boolean; message?: string }
  rollups?: {
    aiReviewsPending?: number
    humanDecisionsPending?: number
    activeMissions?: number
    activeSignals?: number
  }
}

interface RouteItem {
  key: AiDirectorUniverseView
  label: string
  shortLabel: string
  purpose: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  stage: string
  dominantAction: string
}

const BASE = '/market-os/content-command-center/ai-director'

const routeItems: RouteItem[] = [
  { key: 'command', label: 'Commandement IA', shortLabel: 'Commandement', purpose: 'Situation exécutive, flotte des directeurs, autorité et interventions prioritaires.', href: BASE, icon: Gauge, stage: 'Constitution', dominantAction: 'Traiter les interventions' },
  { key: 'decisions', label: 'Décisions', shortLabel: 'Décisions', purpose: 'Rendre les décisions humaines, conditions et conséquences institutionnelles.', href: `${BASE}/decisions`, icon: ShieldCheck, stage: 'Décision', dominantAction: 'Examiner les décisions' },
  { key: 'doctrine', label: 'Doctrine', shortLabel: 'Doctrine', purpose: 'Gouverner la constitution, les limites et les versions doctrinales applicables.', href: `${BASE}/doctrine`, icon: BookOpenCheck, stage: 'Doctrine', dominantAction: 'Inspecter la doctrine active' },
  { key: 'settings', label: 'Configuration', shortLabel: 'Configuration', purpose: 'Contrôler la disponibilité runtime, les limites globales et la sécurité.', href: `${BASE}/settings`, icon: Settings2, stage: 'Constitution', dominantAction: 'Vérifier la disponibilité' },

  { key: 'research-control', label: 'Contrôle Recherche IA', shortLabel: 'Recherche IA', purpose: 'Gouverner Tavily, OpenRouter, les agents Content Command, leurs fréquences et leurs quotas.', href: `${BASE}/research-control`, icon: Radar, stage: 'Capacités', dominantAction: 'Exécuter une recherche gouvernée' },
  { key: 'skills', label: 'Compétences', shortLabel: 'Compétences', purpose: 'Constituer les capacités, niveaux, compatibilités et restrictions des directeurs.', href: `${BASE}/skills`, icon: GraduationCap, stage: 'Capacités', dominantAction: 'Inspecter les capacités' },
  { key: 'commands', label: 'Commandes', shortLabel: 'Commandes', purpose: 'Gouverner le catalogue de commandes, leurs entrées, sorties et frontières.', href: `${BASE}/commands`, icon: BrainCircuit, stage: 'Commandes', dominantAction: 'Choisir une commande' },
  { key: 'compiler', label: 'Compiler', shortLabel: 'Compiler', purpose: 'Assembler doctrine, compétences, commandes, contexte et schéma exécutable.', href: `${BASE}/compiler`, icon: Layers3, stage: 'Commandes', dominantAction: 'Compiler une mission' },
  { key: 'repository', label: 'Repository', shortLabel: 'Repository', purpose: 'Explorer les ressources, versions, snapshots et paquets institutionnels.', href: `${BASE}/repository`, icon: Archive, stage: 'Capacités', dominantAction: 'Inspecter les versions' },
  { key: 'integrations', label: 'Intégrations', shortLabel: 'Intégrations', purpose: 'Comprendre les connexions, leur direction, leur autorité et leur santé.', href: `${BASE}/integrations`, icon: Network, stage: 'Capacités', dominantAction: 'Tester les connexions' },

  { key: 'missions', label: 'Missions IA', shortLabel: 'Missions', purpose: 'Constituer et superviser les mandats multidimensionnels confiés aux directeurs.', href: `${BASE}/missions`, icon: Workflow, stage: 'Missions', dominantAction: 'Ouvrir la mission prioritaire' },
  { key: 'autopilot', label: 'Autopilot', shortLabel: 'Autopilot', purpose: 'Orchestrer les travaux internes autorisés et rendre visible la frontière humaine.', href: `${BASE}/autopilot`, icon: Zap, stage: 'Exécution', dominantAction: 'Superviser l’autonomie interne' },
  { key: 'schedules', label: 'Planifications', shortLabel: 'Planifications', purpose: 'Gouverner les cadences, fenêtres, conflits, quotas et prochaines exécutions.', href: `${BASE}/schedules`, icon: CalendarClock, stage: 'Missions', dominantAction: 'Résoudre les conflits temporels' },
  { key: 'queue', label: 'File d’exécution', shortLabel: 'File', purpose: 'Contrôler les jobs prêts, actifs, en reprise, bloqués ou en dead-letter.', href: `${BASE}/queue`, icon: Activity, stage: 'Exécution', dominantAction: 'Traiter la file active' },
  { key: 'runs', label: 'Runs', shortLabel: 'Runs', purpose: 'Inspecter la chronologie, les modèles, sources, sorties, erreurs et matérialisations.', href: `${BASE}/runs`, icon: Play, stage: 'Exécution', dominantAction: 'Inspecter le dernier run' },

  { key: 'learning', label: 'Learning', shortLabel: 'Learning', purpose: 'Qualifier les apprentissages proposés avant leur promotion institutionnelle.', href: `${BASE}/learning`, icon: Sparkles, stage: 'Learning', dominantAction: 'Examiner les apprentissages' },
  { key: 'recovery', label: 'Recovery', shortLabel: 'Recovery', purpose: 'Reprendre les exécutions depuis leur dernier état sûr sans double matérialisation.', href: `${BASE}/recovery`, icon: RotateCcw, stage: 'Exécution', dominantAction: 'Récupérer les échecs' },
]

const navGroups: Array<{ label: string; caption: string; items: AiDirectorUniverseView[] }> = [
  { label: 'Direction & autorité', caption: 'Position, doctrine et décisions', items: ['command', 'decisions', 'doctrine', 'settings'] },
  { label: 'Intelligence & capacités', caption: 'Recherche, skills et commandes', items: ['research-control', 'skills', 'commands', 'compiler', 'repository', 'integrations'] },
  { label: 'Exécution & autonomie', caption: 'Missions, cadence et opérations', items: ['missions', 'autopilot', 'schedules', 'queue', 'runs'] },
  { label: 'Apprentissage & résilience', caption: 'Mémoire et reprise sûre', items: ['learning', 'recovery'] },
]

const lifecycle = [
  { label: 'Constitution', href: BASE, views: ['command', 'settings'] },
  { label: 'Doctrine', href: `${BASE}/doctrine`, views: ['doctrine'] },
  { label: 'Capacités', href: `${BASE}/skills`, views: ['skills', 'research-control', 'repository', 'integrations'] },
  { label: 'Commandes', href: `${BASE}/commands`, views: ['commands', 'compiler'] },
  { label: 'Missions', href: `${BASE}/missions`, views: ['missions', 'schedules'] },
  { label: 'Exécution', href: `${BASE}/runs`, views: ['autopilot', 'queue', 'runs', 'recovery'] },
  { label: 'Décision', href: `${BASE}/decisions`, views: ['decisions'] },
  { label: 'Learning', href: `${BASE}/learning`, views: ['learning'] },
]

function statusLabel(value: string | null | undefined) {
  if (value === 'active') return 'Actif'
  if (value === 'approved') return 'Approuvé'
  if (value === 'suspended') return 'Suspendu'
  if (value === 'draft') return 'Brouillon'
  return value || 'État non exposé'
}

function authorityLabel(value: string | null | undefined) {
  if (value === 'internal_autopilot') return 'Autopilot interne'
  if (value === 'human_governed') return 'Gouvernance humaine'
  if (value === 'advisory') return 'Conseil uniquement'
  return value || 'Autorité non exposée'
}

function AiStatus({ tone, children }: { tone: 'success' | 'warning' | 'danger' | 'neutral'; children: React.ReactNode }) {
  return <span className={`${styles.status} ${styles[`status_${tone}`]}`}>{children}</span>
}

export default function AiDirectorUniverseShell({ active, children }: { active: AiDirectorUniverseView; children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const searchParams = useSearchParams()
  const current = routeItems.find((item) => item.key === active) || routeItems[0]
  const [snapshot, setSnapshot] = React.useState<HeadquartersSnapshot | null>(null)
  const [researchRuntime, setResearchRuntime] = React.useState({ available: false, label: 'Tavily + OpenRouter' })
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState('')
  const [directorId, setDirectorId] = React.useState('')
  const [navigationOpen, setNavigationOpen] = React.useState(false)
  const [inspectorOpen, setInspectorOpen] = React.useState(true)
  const [paletteOpen, setPaletteOpen] = React.useState(false)
  const [paletteQuery, setPaletteQuery] = React.useState('')

  const load = React.useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const response = await fetch('/api/market-os/content-command-headquarters/snapshot', { credentials: 'include', cache: 'no-store' })
      const payload = await response.json().catch(() => ({}))
      if (!response.ok || payload.ok === false) throw new Error(payload.error || `HTTP_${response.status}`)
      setSnapshot(payload.snapshot || null)

      if (active === 'research-control') {
        const researchResponse = await fetch('/api/market-os/content-command/research-control/snapshot', { credentials: 'include', cache: 'no-store' })
        const researchPayload = await researchResponse.json().catch(() => ({}))
        const researchSnapshot = researchPayload.snapshot || null
        const providers = Array.isArray(researchSnapshot?.providers) ? researchSnapshot.providers : []
        const tavily = providers.find((provider: { provider_key?: string }) => provider.provider_key === 'tavily')
        const openrouter = providers.find((provider: { provider_key?: string }) => provider.provider_key === 'openrouter')
        const credentials = researchSnapshot?.credentials || {}
        const available = Boolean(
          researchResponse.ok &&
          researchPayload.ok !== false &&
          tavily?.enabled && tavily?.status === 'active' && credentials.tavilyPresent &&
          openrouter?.enabled && openrouter?.status === 'active' && credentials.openrouterPresent
        )
        setResearchRuntime({
          available,
          label: available ? 'Tavily + OpenRouter actifs' : 'Chaîne recherche à vérifier',
        })
      }
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'État global indisponible')
    } finally {
      setLoading(false)
    }
  }, [active])

  React.useEffect(() => { void load() }, [load])

  React.useEffect(() => {
    const requested = searchParams.get('director') || ''
    const remembered = typeof window !== 'undefined' ? window.localStorage.getItem('angelcare.ai-director.focus') || '' : ''
    const available = snapshot?.aiDirectors || []
    const resolved = available.find((director) => director.id === requested)?.id || available.find((director) => director.id === remembered)?.id || available.find((director) => ['active', 'approved'].includes(director.status || ''))?.id || available[0]?.id || ''
    if (resolved && resolved !== directorId) setDirectorId(resolved)
  }, [directorId, searchParams, snapshot])

  React.useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        setPaletteOpen((value) => !value)
      }
      if (event.key === 'Escape') {
        setPaletteOpen(false)
        setNavigationOpen(false)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  React.useEffect(() => {
    if (!pathname || typeof window === 'undefined') return
    const previous = JSON.parse(window.sessionStorage.getItem('angelcare.ai-director.recent') || '[]') as string[]
    const next = [pathname, ...previous.filter((value) => value !== pathname)].slice(0, 5)
    window.sessionStorage.setItem('angelcare.ai-director.recent', JSON.stringify(next))
  }, [pathname])

  const directors = snapshot?.aiDirectors || []
  const selectedDirector = directors.find((director) => director.id === directorId) || null
  const providerAvailable = active === 'research-control' ? researchRuntime.available : Boolean(snapshot?.provider?.available)
  const providerLabel = active === 'research-control'
    ? researchRuntime.label
    : selectedDirector?.preferred_model || snapshot?.provider?.message || 'Provider Control'

  function hrefWithContext(href: string) {
    if (!directorId) return href
    const separator = href.includes('?') ? '&' : '?'
    return `${href}${separator}director=${encodeURIComponent(directorId)}`
  }

  function selectDirector(value: string) {
    setDirectorId(value)
    if (typeof window !== 'undefined') window.localStorage.setItem('angelcare.ai-director.focus', value)
    const params = new URLSearchParams(searchParams.toString())
    if (value) params.set('director', value)
    else params.delete('director')
    router.replace(`${pathname}${params.size ? `?${params.toString()}` : ''}`, { scroll: false })
  }

  const filteredRoutes = routeItems.filter((item) => `${item.label} ${item.purpose}`.toLowerCase().includes(paletteQuery.toLowerCase()))
  const currentLifecycleIndex = lifecycle.findIndex((step) => step.views.includes(active))

  return (
    <section className={styles.shell} data-view={active} data-ai-universe-shell="true">
      <header className={styles.commandHeader}>
        <div className={styles.brandBlock}>
          <div className={styles.logoPlate}><Image src="/logo.png" alt="AngelCare" width={54} height={54} priority /></div>
          <div className={styles.brandCopy}>
            <span>SANILA MARKET OS · CONTENT COMMAND CENTER 360</span>
            <div><h1>{current.label}</h1><AiStatus tone={active === 'recovery' ? 'warning' : 'success'}>Espace protégé</AiStatus></div>
            <p>{current.purpose}</p>
          </div>
        </div>
        <div className={styles.headerTelemetry}>
          <div><span>Directeur actif</span><strong>{selectedDirector?.name || selectedDirector?.code || (directors.length ? 'Sélection requise' : 'Aucun directeur exposé')}</strong></div>
          <div><span>Runtime</span><strong>{providerLabel}</strong></div>
          <div><span>Autorité externe</span><strong className={styles.locked}><LockKeyhole /> Approbation humaine</strong></div>
        </div>
        <div className={styles.headerActions}>
          <button type="button" className={styles.iconButton} onClick={() => setPaletteOpen(true)} aria-label="Ouvrir la palette de commandement"><Command /></button>
          <button type="button" className={styles.iconButton} onClick={() => void load()} aria-label="Actualiser l’état global"><RefreshCw className={loading ? styles.spinning : ''} /></button>
          <button type="button" className={styles.iconButton} onClick={() => setInspectorOpen((value) => !value)} aria-label={inspectorOpen ? 'Masquer l’inspecteur' : 'Afficher l’inspecteur'}>{inspectorOpen ? <PanelRightClose /> : <PanelRightOpen />}</button>
          <button type="button" className={styles.mobileMenuButton} onClick={() => setNavigationOpen(true)}><Menu /> Navigation IA</button>
        </div>
      </header>

      <div className={`${styles.universeGrid} ${inspectorOpen ? styles.withInspector : styles.withoutInspector}`}>
        <aside className={`${styles.navigationRail} ${navigationOpen ? styles.navigationRailOpen : ''}`}>
          <div className={styles.railTop}>
            <div><span>AI DIRECTOR UNIVERSE</span><strong>Navigation souveraine</strong></div>
            <button type="button" onClick={() => setNavigationOpen(false)} aria-label="Fermer la navigation"><X /></button>
          </div>
          <div className={styles.directorSelector}>
            <label htmlFor="ai-director-focus">Directeur en contexte</label>
            <div><Bot /><select id="ai-director-focus" value={directorId} onChange={(event: { target: { value: string } }) => selectDirector(event.target.value)}><option value="">Contexte global</option>{directors.map((director) => <option key={director.id} value={director.id}>{director.name || director.code || director.id}</option>)}</select><ChevronDown /></div>
            <small>{selectedDirector ? `${statusLabel(selectedDirector.status)} · ${authorityLabel(selectedDirector.authority_mode)}` : 'Le contexte global agrège l’ensemble de la direction IA.'}</small>
          </div>
          <nav aria-label="Navigation AI Director" className={styles.groupedNavigation}>
            {navGroups.map((group) => <section key={group.label}>
              <header><span>{group.label}</span><small>{group.caption}</small></header>
              <div>{group.items.map((key) => {
                const item = routeItems.find((candidate) => candidate.key === key)
                if (!item) return null
                const Icon = item.icon
                const selected = item.key === active
                return <Link key={item.key} href={hrefWithContext(item.href)} className={selected ? styles.navigationActive : styles.navigationItem} onClick={() => setNavigationOpen(false)}><span><Icon /></span><div><strong>{item.shortLabel}</strong><small>{item.purpose}</small></div>{selected ? <span className={styles.activePulse} /> : <ChevronRight />}</Link>
              })}</div>
            </section>)}
          </nav>
          <div className={styles.railBoundary}><ShieldCheck /><div><strong>Autonomie interne</strong><p>Recherche, analyse et création interne peuvent être automatisées. Toute action externe reste sous décision humaine.</p></div></div>
        </aside>

        <div className={styles.operatingStage}>
          <section className={styles.focusBar}>
            <div className={styles.focusIdentity}>
              <span className={styles.routeGlyph}>{React.createElement(current.icon)}</span>
              <div><small>ESPACE ACTIF · {current.stage.toUpperCase()}</small><strong>{current.label}</strong><p>{selectedDirector?.name || 'Direction IA globale'} · {authorityLabel(selectedDirector?.authority_mode)}</p></div>
            </div>
            <div className={styles.focusFacts}>
              <span><small>Statut</small><strong>{loading ? 'Synchronisation…' : error ? 'État partiel' : statusLabel(selectedDirector?.status || 'active')}</strong></span>
              <span><small>Provider</small><strong>{providerAvailable ? 'Disponible' : 'Affectation requise'}</strong></span>
              <span><small>Décisions</small><strong>{snapshot?.rollups?.humanDecisionsPending ?? 0} en attente</strong></span>
            </div>
            <Link className={styles.dominantAction} href={hrefWithContext(current.href)}><Play /> {current.dominantAction}</Link>
          </section>

          <nav className={styles.lifecycleRunway} aria-label="Cycle de vie AI Director">
            {lifecycle.map((step, index) => {
              const isCurrent = step.views.includes(active)
              const completed = currentLifecycleIndex >= 0 && index < currentLifecycleIndex
              return <Link key={step.label} href={hrefWithContext(step.href)} className={isCurrent ? styles.lifecycleCurrent : completed ? styles.lifecycleComplete : styles.lifecycleUpcoming}><span>{completed ? <CheckCircle2 /> : index + 1}</span><strong>{step.label}</strong><small>{isCurrent ? 'Espace actif' : completed ? 'Constitué' : 'À gouverner'}</small></Link>
            })}
          </nav>

          <div className={styles.routeViewport}>{children}</div>
        </div>

        {inspectorOpen ? <aside className={styles.contextInspector}>
          <header><span>CONTEXTE CONTINU</span><h2>{selectedDirector?.name || 'Direction IA globale'}</h2><p>{current.purpose}</p></header>
          <section className={styles.inspectorState}>
            <div><span className={styles.inspectorIcon}><Bot /></span><div><small>Type de directeur</small><strong>{selectedDirector?.director_type || 'Global command'}</strong></div></div>
            <div><span className={styles.inspectorIcon}><ShieldCheck /></span><div><small>Autorité</small><strong>{authorityLabel(selectedDirector?.authority_mode)}</strong></div></div>
            <div><span className={styles.inspectorIcon}><Database /></span><div><small>Provider module</small><strong>{selectedDirector?.provider_module_key || (active === 'research-control' ? 'content_research' : 'marketing_ai')}</strong></div></div>
            <div><span className={styles.inspectorIcon}><BrainCircuit /></span><div><small>Modèle / chaîne</small><strong>{providerLabel}</strong></div></div>
          </section>
          <section className={styles.interventionPanel}>
            <span>PROCHAINE ACTION GOUVERNÉE</span>
            <h3>{current.dominantAction}</h3>
            <p>Le système conserve le directeur, la route et le dossier d’exécution pendant les passages entre capacités, missions, runs et décisions.</p>
            <Link href={hrefWithContext(current.href)}>{current.dominantAction}<ArrowRight /></Link>
          </section>
          <section className={styles.boundaryPanel}>
            <LockKeyhole />
            <div><strong>Frontière humaine</strong><p>Email, WhatsApp, publication, publicité, contact tiers et soumission formelle ne peuvent pas être exécutés automatiquement.</p></div>
          </section>
          {error ? <section className={styles.inspectorError}><CircleAlert /><div><strong>Synchronisation partielle</strong><p>{error}</p></div></section> : null}
          <footer><button type="button" onClick={() => setPaletteOpen(true)}><Command /> Palette <kbd>⌘ K</kbd></button><Link href="/market-os/content-command-center"><LayoutGrid /> Content Command</Link></footer>
        </aside> : null}
      </div>

      {navigationOpen ? <button className={styles.navigationBackdrop} type="button" aria-label="Fermer" onClick={() => setNavigationOpen(false)} /> : null}

      {paletteOpen ? <div className={styles.paletteBackdrop} role="presentation" onMouseDown={() => setPaletteOpen(false)}><section className={styles.commandPalette} role="dialog" aria-modal="true" aria-label="Palette AI Director" onMouseDown={(event: { stopPropagation: () => void }) => event.stopPropagation()}>
        <header><Search /><input autoFocus value={paletteQuery} onChange={(event: { target: { value: string } }) => setPaletteQuery(event.target.value)} placeholder="Rechercher un espace, une capacité ou une action…" /><button type="button" onClick={() => setPaletteOpen(false)}><X /></button></header>
        <div>{filteredRoutes.map((item) => { const Icon = item.icon; return <Link key={item.key} href={hrefWithContext(item.href)} onClick={() => setPaletteOpen(false)}><span><Icon /></span><div><strong>{item.label}</strong><small>{item.purpose}</small></div><kbd>↵</kbd></Link> })}{!filteredRoutes.length ? <div className={styles.paletteEmpty}><Search /><strong>Aucun espace correspondant</strong><p>Essayez une autre formulation.</p></div> : null}</div>
        <footer><span><kbd>⌘ K</kbd> ouvrir</span><span><kbd>ESC</kbd> fermer</span><span>{routeItems.length} espaces gouvernés</span></footer>
      </section></div> : null}
    </section>
  )
}
