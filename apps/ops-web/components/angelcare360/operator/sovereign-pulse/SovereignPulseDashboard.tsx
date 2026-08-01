'use client'

import dynamic from 'next/dynamic'
import Link from 'next/link'
import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { ChangeEvent, CSSProperties, MouseEvent, ReactNode } from 'react'
import { createPortal } from 'react-dom'
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  Building2,
  CalendarClock,
  CheckCircle2,
  CircleDollarSign,
  Clock3,
  Command,
  Eye,
  EyeOff,
  Gauge,
  Mail,
  Maximize2,
  Minimize2,
  Network,
  Pause,
  Play,
  RefreshCw,
  Server,
  ShieldCheck,
  Sparkles,
  Target,
  Users,
  Wifi,
  X,
  Zap,
} from 'lucide-react'
import AngelCareLogo from '@/components/brand/AngelCareLogo'
import type {
  SovereignPulseMode,
  SovereignPulsePrivacy,
  SovereignPulseSceneKey,
  SovereignPulseSnapshot,
  SovereignPulseTone,
} from '@/types/angelcare360/operator/sovereign-pulse'
import styles from './SovereignPulseDashboard.module.css'

const SovereignPulseCustomerMap = dynamic(
  () => import('./SovereignPulseCustomerMap'),
  {
    ssr: false,
    loading: () => (
      <div className={styles.customerMapLoading}>
        <span />
        <strong>Initialisation du réseau géographique client</strong>
        <small>OpenStreetMap · positions · renouvellements · santé relationnelle</small>
      </div>
    ),
  },
)

const SCENES: Array<{ key: SovereignPulseSceneKey; number: string; label: string; short: string }> = [
  { key: 'overview', number: '01', label: 'Vue souveraine', short: 'Pulse' },
  { key: 'revenue', number: '02', label: 'Revenus & contrats', short: 'Revenue' },
  { key: 'customers', number: '03', label: 'Clients & renouvellements', short: 'Clients' },
  { key: 'tenants', number: '04', label: 'Fleet tenants & produit', short: 'Tenants' },
  { key: 'experience', number: '05', label: 'Service & recovery', short: 'Recovery' },
  { key: 'communications', number: '06', label: 'Email & correspondance', short: 'Email' },
  { key: 'platform', number: '07', label: 'Plateforme & sécurité', short: 'Platform' },
  { key: 'missions', number: '08', label: 'Missions prochaines 24 h', short: 'Missions' },
]

const PRIVACY_LABELS: Record<SovereignPulsePrivacy, string> = {
  executive: 'Exécutif complet',
  operations: 'Opérationnel',
  team_safe: 'Équipe — confidentialité',
  visitor_safe: 'Visiteur',
}

const TONE_LABELS: Record<SovereignPulseTone, string> = {
  good: 'Sous contrôle',
  info: 'En mouvement',
  warning: 'Attention',
  critical: 'Critique',
  neutral: 'En attente',
}

function toneClass(tone: SovereignPulseTone) {
  return styles[`tone_${tone}`] || styles.tone_neutral
}

function pressureTone(value: number): SovereignPulseTone {
  if (value >= 75) return 'critical'
  if (value >= 45) return 'warning'
  if (value >= 20) return 'info'
  return 'good'
}

function safeLabel(label: string, privacy: SovereignPulsePrivacy, fallback: string) {
  if (privacy === 'visitor_safe') return fallback
  if (privacy === 'team_safe' && label.length > 24) return fallback
  return label
}

const CLOCK_FORMATTER = new Intl.DateTimeFormat('fr-FR', {
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
})

const DATE_FORMATTER = new Intl.DateTimeFormat('fr-FR', {
  weekday: 'long',
  day: '2-digit',
  month: 'long',
  year: 'numeric',
})

const PULSE_REFRESH_EVENT = 'angelcare:sovereign-pulse-refreshed'

function formatClock(date: Date) {
  return CLOCK_FORMATTER.format(date)
}

function formatDate(date: Date) {
  return DATE_FORMATTER.format(date)
}

function relativeFreshness(iso: string, now: Date) {
  const delta = Math.max(0, now.getTime() - new Date(iso).getTime())
  const seconds = Math.round(delta / 1000)
  if (seconds < 8) return 'à l’instant'
  if (seconds < 60) return `il y a ${seconds} s`
  const minutes = Math.round(seconds / 60)
  return `il y a ${minutes} min`
}

type InspectorPayload = {
  title: string
  eyebrow: string
  description: string
  evidence: Array<{ label: string; value: string }>
  href?: string
}

type Props = {
  initialSnapshot: SovereignPulseSnapshot
  initialMode: SovereignPulseMode
  initialScene?: SovereignPulseSceneKey
  initialPrivacy?: SovereignPulsePrivacy
  operatorName: string
}

type RefreshButtonProps = {
  mode: SovereignPulseMode
  initialSnapshot: SovereignPulseSnapshot
  onSnapshot: (next: SovereignPulseSnapshot) => void
  onHeartbeat: () => void
}

function stableSnapshotFingerprint(snapshot: SovereignPulseSnapshot) {
  const { generatedAt: _generatedAt, ...stableSnapshot } = snapshot
  return JSON.stringify(stableSnapshot)
}

const LiveClockBlock = memo(function LiveClockBlock({ generatedAt }: { generatedAt: string }) {
  const [now, setNow] = useState(() => new Date())
  const [synchronizedAt, setSynchronizedAt] = useState(generatedAt)

  useEffect(() => {
    let timer: number | null = null

    const stop = () => {
      if (timer !== null) {
        window.clearInterval(timer)
        timer = null
      }
    }

    const start = () => {
      stop()
      if (document.hidden) return
      setNow(new Date())
      timer = window.setInterval(() => setNow(new Date()), 1000)
    }

    const onVisibility = () => {
      if (document.hidden) stop()
      else start()
    }

    const onRefresh = (event: Event) => {
      const detail = (event as CustomEvent<{ generatedAt?: string }>).detail
      if (detail?.generatedAt) setSynchronizedAt(detail.generatedAt)
    }

    start()
    document.addEventListener('visibilitychange', onVisibility)
    window.addEventListener(PULSE_REFRESH_EVENT, onRefresh)

    return () => {
      stop()
      document.removeEventListener('visibilitychange', onVisibility)
      window.removeEventListener(PULSE_REFRESH_EVENT, onRefresh)
    }
  }, [])

  useEffect(() => {
    setSynchronizedAt(generatedAt)
  }, [generatedAt])

  return (
    <div className={styles.clockBlock}>
      <div className={styles.clock}>{formatClock(now)}</div>
      <div className={styles.date}>{formatDate(now)}</div>
      <div className={styles.freshness}>Synchronisé {relativeFreshness(synchronizedAt, now)}</div>
    </div>
  )
})

const PulseRefreshButton = memo(function PulseRefreshButton({ mode, initialSnapshot, onSnapshot, onHeartbeat }: RefreshButtonProps) {
  const [refreshing, setRefreshing] = useState(false)
  const controllerRef = useRef<AbortController | null>(null)
  const inFlightRef = useRef(false)
  const fingerprintRef = useRef(stableSnapshotFingerprint(initialSnapshot))
  const mountedRef = useRef(true)

  useEffect(() => {
    fingerprintRef.current = stableSnapshotFingerprint(initialSnapshot)
  }, [initialSnapshot])

  const refresh = useCallback(async () => {
    if (inFlightRef.current || document.hidden) return

    inFlightRef.current = true
    setRefreshing(true)
    const controller = new AbortController()
    controllerRef.current = controller

    try {
      const response = await fetch('/api/angelcare360/operator/sovereign-pulse', {
        cache: 'no-store',
        signal: controller.signal,
      })
      if (!response.ok) throw new Error('Pulse refresh failed')

      const next = await response.json() as SovereignPulseSnapshot
      const nextFingerprint = stableSnapshotFingerprint(next)

      window.dispatchEvent(new CustomEvent(PULSE_REFRESH_EVENT, {
        detail: { generatedAt: next.generatedAt },
      }))
      onHeartbeat()

      if (nextFingerprint !== fingerprintRef.current) {
        fingerprintRef.current = nextFingerprint
        onSnapshot(next)
      }
    } catch (error) {
      if (!(error instanceof DOMException && error.name === 'AbortError')) {
        // Keep the last verified snapshot visible when a refresh fails.
      }
    } finally {
      if (controllerRef.current === controller) controllerRef.current = null
      inFlightRef.current = false
      if (mountedRef.current) setRefreshing(false)
    }
  }, [onHeartbeat, onSnapshot])

  useEffect(() => {
    const intervalMs = mode === 'wall' ? 30_000 : 45_000
    const interval = window.setInterval(() => void refresh(), intervalMs)

    const onVisibility = () => {
      if (!document.hidden) void refresh()
    }

    document.addEventListener('visibilitychange', onVisibility)
    return () => {
      window.clearInterval(interval)
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [mode, refresh])

  useEffect(() => {
    mountedRef.current = true
    return () => {
      mountedRef.current = false
      controllerRef.current?.abort()
      controllerRef.current = null
    }
  }, [])

  return (
    <button type="button" className={styles.iconButton} onClick={() => void refresh()} aria-label="Actualiser" title="Actualiser">
      <RefreshCw size={17} className={refreshing ? styles.spin : ''} />
    </button>
  )
})

export default function SovereignPulseDashboard({ initialSnapshot, initialMode, initialScene, initialPrivacy, operatorName }: Props) {
  const [snapshot, setSnapshot] = useState(initialSnapshot)
  const [mode, setMode] = useState<SovereignPulseMode>(initialMode)
  const [scene, setScene] = useState<SovereignPulseSceneKey>(SCENES.some((item) => item.key === initialScene) ? initialScene! : 'overview')
  const [privacy, setPrivacy] = useState<SovereignPulsePrivacy>(initialPrivacy || initialSnapshot.privacyDefault)
  const [autoRotate, setAutoRotate] = useState(initialMode === 'wall')
  const [mounted, setMounted] = useState(false)
  const [fullscreen, setFullscreen] = useState(false)
  const [reducedMotion, setReducedMotion] = useState(false)
  const [inspector, setInspector] = useState<InspectorPayload | null>(null)
  const [criticalDismissed, setCriticalDismissed] = useState(false)
  const sceneIndex = Math.max(0, SCENES.findIndex((item) => item.key === scene))

  useEffect(() => {
    setMounted(true)
    const media = window.matchMedia('(prefers-reduced-motion: reduce)')
    const updateMotion = () => setReducedMotion(media.matches)
    updateMotion()
    media.addEventListener('change', updateMotion)
    return () => media.removeEventListener('change', updateMotion)
  }, [])

  const persistPreference = useCallback((nextMode: SovereignPulseMode, nextPrivacy: SovereignPulsePrivacy, nextScene: SovereignPulseSceneKey) => {
    void fetch('/api/angelcare360/operator/sovereign-pulse', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        operation: 'preference.save',
        payload: {
          displayMode: nextMode,
          privacyMode: nextPrivacy,
          activeScene: nextScene,
          rotationSeconds: snapshot.rotationSeconds,
          reducedMotion,
        },
      }),
    }).catch(() => undefined)
  }, [reducedMotion, snapshot.rotationSeconds])

  const updateUrl = useCallback((nextMode: SovereignPulseMode, nextScene: SovereignPulseSceneKey, nextPrivacy: SovereignPulsePrivacy) => {
    if (typeof window === 'undefined') return
    const url = new URL(window.location.href)
    url.searchParams.set('mode', nextMode)
    url.searchParams.set('scene', nextScene)
    url.searchParams.set('privacy', nextPrivacy)
    window.history.replaceState({}, '', url)
  }, [])

  const changeScene = useCallback((nextScene: SovereignPulseSceneKey) => {
    setScene(nextScene)
    updateUrl(mode, nextScene, privacy)
    persistPreference(mode, privacy, nextScene)
  }, [mode, persistPreference, privacy, updateUrl])

  useEffect(() => {
    if (!autoRotate || reducedMotion) return
    const interval = window.setInterval(() => {
      if (document.hidden) return
      setScene((current) => {
        const currentIndex = SCENES.findIndex((item) => item.key === current)
        const next = SCENES[(currentIndex + 1) % SCENES.length].key
        updateUrl(mode, next, privacy)
        return next
      })
    }, snapshot.rotationSeconds * 1000)
    return () => window.clearInterval(interval)
  }, [autoRotate, mode, privacy, reducedMotion, snapshot.rotationSeconds, updateUrl])

  useEffect(() => {
    const onFullscreen = () => setFullscreen(Boolean(document.fullscreenElement))
    document.addEventListener('fullscreenchange', onFullscreen)
    return () => document.removeEventListener('fullscreenchange', onFullscreen)
  }, [])

  const acceptSnapshot = useCallback((next: SovereignPulseSnapshot) => {
    setSnapshot(next)
  }, [])

  const acceptHeartbeat = useCallback(() => {
    setCriticalDismissed(false)
  }, [])

  const toggleMode = useCallback(() => {
    const nextMode: SovereignPulseMode = mode === 'wall' ? 'desk' : 'wall'
    const nextPrivacy = nextMode === 'wall' && privacy === 'executive' ? 'team_safe' : privacy
    setMode(nextMode)
    setPrivacy(nextPrivacy)
    setAutoRotate(nextMode === 'wall')
    updateUrl(nextMode, scene, nextPrivacy)
    persistPreference(nextMode, nextPrivacy, scene)
  }, [mode, persistPreference, privacy, scene, updateUrl])

  const toggleFullscreen = useCallback(async () => {
    if (!document.fullscreenElement) {
      await document.documentElement.requestFullscreen().catch(() => undefined)
    } else {
      await document.exitFullscreen().catch(() => undefined)
    }
  }, [])

  const changePrivacy = useCallback((next: SovereignPulsePrivacy) => {
    setPrivacy(next)
    updateUrl(mode, scene, next)
    persistPreference(mode, next, scene)
  }, [mode, persistPreference, scene, updateUrl])

  const acknowledgeCritical = useCallback(() => {
    if (!snapshot.criticalEvent) return
    setCriticalDismissed(true)
    void fetch('/api/angelcare360/operator/sovereign-pulse', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        operation: 'alert.acknowledge',
        payload: {
          alertKey: snapshot.criticalEvent.id,
          alertTitle: snapshot.criticalEvent.title,
          note: `Acknowledged by ${operatorName}`,
        },
      }),
    }).catch(() => undefined)
  }, [operatorName, snapshot.criticalEvent])

  const activeScene = SCENES[sceneIndex]
  const rootClass = [
    styles.root,
    mode === 'wall' ? styles.wallRoot : styles.deskRoot,
    reducedMotion ? styles.reduceMotion : '',
  ].filter(Boolean).join(' ')

  const sceneContent = useMemo(() => {
    if (scene === 'revenue') return <RevenueScene snapshot={snapshot} mode={mode} setInspector={setInspector} />
    if (scene === 'customers') return <CustomersScene snapshot={snapshot} privacy={privacy} mode={mode} setInspector={setInspector} />
    if (scene === 'tenants') return <TenantsScene snapshot={snapshot} mode={mode} setInspector={setInspector} />
    if (scene === 'experience') return <ExperienceScene snapshot={snapshot} mode={mode} setInspector={setInspector} />
    if (scene === 'communications') return <CommunicationsScene snapshot={snapshot} mode={mode} setInspector={setInspector} />
    if (scene === 'platform') return <PlatformScene snapshot={snapshot} mode={mode} setInspector={setInspector} />
    if (scene === 'missions') return <MissionsScene snapshot={snapshot} privacy={privacy} mode={mode} setInspector={setInspector} />
    return <OverviewScene snapshot={snapshot} privacy={privacy} mode={mode} setInspector={setInspector} />
  }, [mode, privacy, scene, snapshot])

  const footerMissions = useMemo(() => [...snapshot.missions, ...snapshot.missions], [snapshot.missions])

  return (
    <section className={rootClass} data-scene={scene} data-mode={mode}>
      <div className={styles.ambientGrid} aria-hidden="true" />
      <div className={styles.ambientOrbOne} aria-hidden="true" />
      <div className={styles.ambientOrbTwo} aria-hidden="true" />

      <header className={styles.crown}>
        <div className={styles.brandLockup}>
          <div className={styles.logoHalo}><AngelCareLogo size={mode === 'wall' ? 'md' : 'sm'} /></div>
          <div className={styles.brandCopy}>
            <div className={styles.eyebrow}>ANGELCARE 360 · LIVE EXECUTIVE COMMAND</div>
            <div className={styles.crownTitle}>SOVEREIGN PULSE</div>
            <div className={styles.crownSubtitle}>{snapshot.headline}</div>
          </div>
        </div>

        <div className={styles.liveStatus}>
          <span className={`${styles.liveDot} ${snapshot.sourceState === 'live' ? styles.liveDotHealthy : styles.liveDotPartial}`} />
          <div>
            <strong>{snapshot.sourceState === 'live' ? 'LIVE' : snapshot.sourceState === 'partial' ? 'PARTIAL LIVE' : 'DEGRADED'}</strong>
            <span>{snapshot.environmentLabel}</span>
          </div>
          <div className={styles.healthDial} style={{ '--health': `${snapshot.globalHealth * 3.6}deg` } as CSSProperties}>
            <div><strong>{snapshot.globalHealth}%</strong><span>santé</span></div>
          </div>
        </div>

        <LiveClockBlock generatedAt={snapshot.generatedAt} />

        <div className={styles.crownControls}>
          <PulseRefreshButton mode={mode} initialSnapshot={snapshot} onSnapshot={acceptSnapshot} onHeartbeat={acceptHeartbeat} />
          <button type="button" className={styles.iconButton} onClick={() => setAutoRotate((value) => !value)} aria-label={autoRotate ? 'Mettre en pause' : 'Activer la rotation'} title={autoRotate ? 'Pause rotation' : 'Rotation automatique'}>
            {autoRotate ? <Pause size={17} /> : <Play size={17} />}
          </button>
          <button type="button" className={styles.iconButton} onClick={toggleMode} aria-label="Changer de mode" title={mode === 'wall' ? 'Mode bureau' : 'Mode TV'}>
            {mode === 'wall' ? <Minimize2 size={17} /> : <Eye size={17} />}
          </button>
          <button type="button" className={styles.iconButton} onClick={() => void toggleFullscreen()} aria-label="Plein écran" title="Plein écran">
            {fullscreen ? <Minimize2 size={17} /> : <Maximize2 size={17} />}
          </button>
          <label className={styles.privacyControl}>
            {privacy === 'visitor_safe' ? <EyeOff size={15} /> : <ShieldCheck size={15} />}
            <select value={privacy} onChange={(event: ChangeEvent<HTMLSelectElement>) => changePrivacy(event.target.value as SovereignPulsePrivacy)} aria-label="Niveau de confidentialité">
              {Object.entries(PRIVACY_LABELS).map(([key, label]) => <option key={key} value={key}>{label}</option>)}
            </select>
          </label>
        </div>
      </header>

      <div className={styles.sceneRail} aria-label="Scènes du wallboard">
        {SCENES.map((item, index) => (
          <button
            key={item.key}
            type="button"
            className={`${styles.sceneButton} ${item.key === scene ? styles.sceneButtonActive : ''}`}
            onClick={() => changeScene(item.key)}
            aria-current={item.key === scene ? 'page' : undefined}
          >
            <span>{item.number}</span>
            <strong>{mode === 'wall' ? item.short : item.label}</strong>
            {autoRotate && item.key === scene ? <i className={styles.sceneProgress} style={{ animationDuration: `${snapshot.rotationSeconds}s` }} /> : null}
          </button>
        ))}
      </div>

      <div className={styles.metricRibbon}>
        {snapshot.metrics.map((metric) => (
          <Link key={metric.key} href={metric.href} className={`${styles.metricCell} ${toneClass(metric.tone)}`}>
            <span>{metric.label}</span>
            <strong>{metric.value}</strong>
            <small>{metric.deltaLabel}</small>
            <i />
          </Link>
        ))}
      </div>

      <div className={styles.sceneIdentity}>
        <div>
          <span>{activeScene.number} · {activeScene.label}</span>
          <strong>{snapshot.subheadline}</strong>
        </div>
        <div className={styles.sceneMeta}>
          <span><Wifi size={13} /> {snapshot.sources.filter((item) => item.state === 'live').length}/{snapshot.sources.length} sources</span>
          <span><Clock3 size={13} /> rotation {snapshot.rotationSeconds}s</span>
          <span><Eye size={13} /> {PRIVACY_LABELS[privacy]}</span>
        </div>
      </div>

      <main key={scene} className={styles.sceneCanvas}>
        {sceneContent}
      </main>

      <footer className={styles.commandFooter}>
        <div className={styles.nextEvent}>
          <Sparkles size={16} />
          <span>Prochain événement décisif</span>
          <strong>{snapshot.nextDecisiveEvent}</strong>
        </div>
        <div className={styles.footerMarquee}>
          <div className={styles.footerTrack}>
            {footerMissions.map((mission, index) => (
              <Link key={`${mission.id}-${index}`} href={mission.href} className={styles.footerMission}>
                <span>{mission.timeLabel}</span>
                <strong>{safeLabel(mission.title, privacy, 'Mission opérationnelle')}</strong>
                <i data-state={mission.state}>{mission.readiness}%</i>
              </Link>
            ))}
          </div>
        </div>
        <div className={styles.operatorBadge}><Command size={15} /><span>{mode === 'wall' ? 'WALLBOARD' : operatorName}</span></div>
      </footer>

      {mounted && inspector ? createPortal(
        <div className={styles.inspectorBackdrop} role="presentation" onMouseDown={() => setInspector(null)}>
          <aside className={styles.inspector} role="dialog" aria-modal="true" aria-label={inspector.title} onMouseDown={(event: MouseEvent<HTMLElement>) => event.stopPropagation()}>
            <div className={styles.inspectorCrown}>
              <div><span>{inspector.eyebrow}</span><h2>{inspector.title}</h2></div>
              <button type="button" onClick={() => setInspector(null)} aria-label="Fermer"><X size={18} /></button>
            </div>
            <p className={styles.inspectorDescription}>{inspector.description}</p>
            <div className={styles.inspectorEvidence}>
              {inspector.evidence.map((item) => <div key={`${item.label}-${item.value}`}><span>{item.label}</span><strong>{item.value}</strong></div>)}
            </div>
            <div className={styles.inspectorTruth}>
              <ShieldCheck size={18} />
              <div><strong>Signal explicable</strong><span>Calculé depuis les sources opérationnelles disponibles au moment de la capture.</span></div>
            </div>
            {inspector.href ? <Link href={inspector.href} className={styles.primaryAction}>Ouvrir le workspace <ArrowRight size={17} /></Link> : null}
          </aside>
        </div>, document.body) : null}

      {mounted && snapshot.criticalEvent && !criticalDismissed ? createPortal(
        <div className={styles.criticalTakeover} role="alertdialog" aria-modal="true" aria-label="Événement critique">
          <div className={styles.criticalScanner} aria-hidden="true" />
          <div className={styles.criticalCard}>
            <div className={styles.criticalIcon}><AlertTriangle size={34} /></div>
            <div className={styles.criticalCopy}>
              <span>CRITICAL EVENT TAKEOVER</span>
              <h2>{snapshot.criticalEvent.title}</h2>
              <p>{snapshot.criticalEvent.summary}</p>
            </div>
            <div className={styles.criticalImpact}>
              {snapshot.criticalEvent.impact.map((item) => <div key={item}><Zap size={15} /><span>{item}</span></div>)}
            </div>
            <div className={styles.criticalCommand}>
              <div><span>Responsable</span><strong>{snapshot.criticalEvent.owner}</strong></div>
              <div><span>Action actuelle</span><strong>{snapshot.criticalEvent.currentAction}</strong></div>
            </div>
            <div className={styles.criticalActions}>
              <button type="button" onClick={acknowledgeCritical}>Accuser réception</button>
              <Link href={snapshot.criticalEvent.href}>Ouvrir le commandement <ArrowRight size={16} /></Link>
            </div>
          </div>
        </div>, document.body) : null}
    </section>
  )
}

function SectionHead({ eyebrow, title, detail, icon }: { eyebrow: string; title: string; detail: string; icon: ReactNode }) {
  return <div className={styles.sectionHead}><div className={styles.sectionIcon}>{icon}</div><div><span>{eyebrow}</span><h2>{title}</h2><p>{detail}</p></div></div>
}

function OverviewScene({ snapshot, privacy, mode, setInspector }: { snapshot: SovereignPulseSnapshot; privacy: SovereignPulsePrivacy; mode: SovereignPulseMode; setInspector: (value: InspectorPayload | null) => void }) {
  return (
    <div className={styles.overviewGrid}>
      <section className={styles.priorityRail}>
        <SectionHead eyebrow="Command Queue" title="Priorités exécutives" detail="Ce qui exige une action maintenant." icon={<Target size={20} />} />
        <div className={styles.priorityStack}>
          {snapshot.priorities.slice(0, mode === 'wall' ? 4 : 6).map((item) => (
            <button key={item.id} type="button" className={`${styles.priorityCard} ${toneClass(item.tone)}`} onClick={() => setInspector({ title: item.title, eyebrow: item.category, description: item.impact, evidence: [{ label: 'Contexte', value: item.context }, { label: 'Preuve', value: item.evidence }, { label: 'Responsable', value: item.owner }, { label: 'Échéance', value: item.deadlineLabel }], href: item.href })}>
              <div className={styles.priorityRank}>{String(item.rank).padStart(2, '0')}</div>
              <div className={styles.priorityContent}><span>{item.category}</span><strong>{safeLabel(item.title, privacy, 'Signal opérationnel')}</strong><small>{item.context}</small></div>
              <div className={styles.priorityDeadline}>{item.deadlineLabel}</div>
            </button>
          ))}
        </div>
      </section>

      <section className={styles.topologyPanel}>
        <div className={styles.topologyHeader}>
          <SectionHead eyebrow="Operational Network" title="Sovereign Operational Pulse" detail="Le mouvement vivant de l’entreprise, du marché jusqu’à la rétention." icon={<Network size={20} />} />
          <div className={styles.topologyLegend}><span><i data-tone="good" />stable</span><span><i data-tone="warning" />attention</span><span><i data-tone="critical" />intervention</span></div>
        </div>
        <div className={styles.topologyStage}>
          <svg className={styles.topologyLines} viewBox="0 0 1000 650" preserveAspectRatio="none" aria-hidden="true">
            <path d="M500,325 C360,180 245,170 125,116" />
            <path d="M500,325 C620,175 750,170 875,116" />
            <path d="M500,325 C320,320 220,320 105,325" />
            <path d="M500,325 C680,320 790,320 900,325" />
            <path d="M500,325 C365,480 245,500 130,535" />
            <path d="M500,325 C635,480 755,500 875,535" />
            <circle cx="500" cy="325" r="178" />
            <circle cx="500" cy="325" r="244" />
          </svg>
          <div className={styles.coreNode}>
            <div className={styles.coreOrbit}><i /><i /><i /></div>
            <div className={styles.coreInner}>
              <AngelCareLogo size={mode === 'wall' ? 'lg' : 'md'} />
              <span>ANGELCARE 360</span>
              <strong>{snapshot.globalHealth}%</strong>
              <small>NETWORK HEALTH</small>
            </div>
          </div>
          {snapshot.towers.map((tower, index) => (
            <Link key={tower.key} href={tower.href} className={`${styles.towerNode} ${toneClass(tower.tone)} ${styles[`tower_${index + 1}`]}`}>
              <span>{tower.number}</span>
              <strong>{tower.shortLabel}</strong>
              <small>{tower.primarySignal}</small>
              <div><b style={{ width: `${tower.health}%` }} /></div>
              <em>{tower.valueLabel}</em>
            </Link>
          ))}
          <div className={styles.flowParticle} data-flow="one" /><div className={styles.flowParticle} data-flow="two" /><div className={styles.flowParticle} data-flow="three" />
        </div>
      </section>

      <section className={styles.intelligenceRail}>
        <SectionHead eyebrow="Live Intelligence" title="Mouvements récents" detail="Business, clients et plateforme." icon={<Activity size={20} />} />
        <div className={styles.eventLens}><span>Business</span><span>Customer</span><span>Platform</span></div>
        <div className={styles.eventStream}>
          {snapshot.events.slice(0, mode === 'wall' ? 6 : 9).map((event) => (
            <Link key={event.id} href={event.href} className={`${styles.eventItem} ${toneClass(event.tone)}`}>
              <time>{new Date(event.occurredAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</time>
              <i />
              <div><span>{event.domain}</span><strong>{safeLabel(event.title, privacy, 'Événement opérationnel')}</strong><small>{event.context}</small></div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  )
}

function RevenueScene({ snapshot, mode, setInspector }: { snapshot: SovereignPulseSnapshot; mode: SovereignPulseMode; setInspector: (value: InspectorPayload | null) => void }) {
  const max = Math.max(1, ...snapshot.revenueFlow.map((item) => item.value))
  return (
    <div className={styles.fullScene}>
      <SectionHead eyebrow="Revenue Movement River" title="De l’opportunité au revenu retenu" detail="Chaque valeur garde son stade économique exact. Aucun chiffre n’est mélangé." icon={<CircleDollarSign size={21} />} />
      <div className={styles.revenueRiver}>
        <div className={styles.riverSpine} />
        {snapshot.revenueFlow.map((stage, index) => {
          const width = Math.max(12, Math.round(stage.value / max * 100))
          return (
            <button key={stage.key} type="button" className={styles.riverStage} onClick={() => setInspector({ title: stage.label, eyebrow: 'Revenue stage', description: `Valeur actuelle ${stage.displayValue}.`, evidence: [{ label: 'Conversion', value: `${stage.conversion}%` }, { label: 'Bloqué', value: `${Math.round(stage.blocked).toLocaleString('fr-FR')} Dh` }, { label: 'À risque', value: `${Math.round(stage.atRisk).toLocaleString('fr-FR')} Dh` }, { label: 'Target index', value: `${Math.round(stage.value / Math.max(1, stage.target) * 100)}%` }], href: stage.href })}>
              <div className={styles.riverIndex}>{String(index + 1).padStart(2, '0')}</div>
              <div className={styles.riverLabel}><span>{stage.label}</span><strong>{stage.displayValue}</strong><small>{stage.conversion}% conversion</small></div>
              <div className={styles.riverChannel}><i style={{ width: `${width}%` }}><b /></i></div>
              <div className={styles.riverRisk}>{stage.atRisk > 0 ? `${Math.round(stage.atRisk / 1000)}K à risque` : 'Sous contrôle'}</div>
            </button>
          )
        })}
      </div>
      <div className={styles.revenueBottomGrid}>
        <div className={styles.forecastField}>
          <span>FORECAST CONFIDENCE FIELD</span>
          <div className={styles.forecastArc} style={{ '--forecast': `${Math.min(100, snapshot.revenueFlow[1]?.conversion || 0) * 3.6}deg` } as CSSProperties}>
            <div><strong>{snapshot.revenueFlow[1]?.conversion || 0}%</strong><small>pipeline pondéré</small></div>
          </div>
          <p>La confiance combine la valeur, la probabilité et la maturité de chaque opportunité.</p>
        </div>
        <div className={styles.valueGuard}>
          <span>VALUE PROTECTION</span>
          {snapshot.revenueFlow.slice(-4).map((stage) => <div key={stage.key}><strong>{stage.label}</strong><i><b style={{ width: `${Math.min(100, stage.conversion)}%` }} /></i><em>{stage.displayValue}</em></div>)}
        </div>
        <div className={styles.revenueSignalBoard}>
          <span>DECISIVE SIGNALS</span>
          <div><AlertTriangle size={17} /><strong>{snapshot.revenueFlow.reduce((sum, item) => sum + item.atRisk, 0).toLocaleString('fr-FR')} Dh</strong><small>valeur exposée</small></div>
          <div><CheckCircle2 size={17} /><strong>{snapshot.revenueFlow.find((item) => item.key === 'collected')?.displayValue}</strong><small>collecté</small></div>
          <div><Target size={17} /><strong>{snapshot.priorities.filter((item) => item.category === 'opportunity').length}</strong><small>opportunités décisives</small></div>
        </div>
      </div>
    </div>
  )
}

function CustomersScene({ snapshot, privacy, mode, setInspector }: { snapshot: SovereignPulseSnapshot; privacy: SovereignPulsePrivacy; mode: SovereignPulseMode; setInspector: (value: InspectorPayload | null) => void }) {
  const inspectCustomer = useCallback((node: SovereignPulseSnapshot['customerNodes'][number]) => {
    setInspector({
      title: safeLabel(node.label, privacy, node.code),
      eyebrow: 'OpenStreetMap customer command',
      description: `${node.segment} · ${node.city} · ${node.addressLabel}`,
      evidence: [
        { label: 'Santé', value: `${node.health}/100` },
        { label: 'État', value: node.state },
        { label: 'Renouvellement', value: typeof node.renewalDays === 'number' ? `${node.renewalDays} jour(s)` : 'Horizon non renseigné' },
        { label: 'Cases ouverts', value: String(node.openCases) },
        { label: 'Position', value: node.locationPrecision === 'exact' ? 'Coordonnées exactes' : `Résolution ${node.locationPrecision}` },
        { label: 'Référence', value: node.code },
      ],
      href: node.href,
    })
  }, [privacy, setInspector])

  return (
    <div className={styles.customerScene}>
      <div className={styles.customerSceneHead}>
        <SectionHead
          eyebrow="OpenStreetMap Customer Network"
          title="Implantations clients & horizon renouvellement"
          detail="Carte opérationnelle réelle : santé, valeur, échéances, cases et précision géographique."
          icon={<Building2 size={21} />}
        />
        <div className={styles.customerLegend}>
          <span data-state="healthy">Healthy</span>
          <span data-state="onboarding">Onboarding</span>
          <span data-state="attention">Attention</span>
          <span data-state="intervention">Recovery</span>
        </div>
      </div>

      <SovereignPulseCustomerMap
        nodes={snapshot.customerNodes}
        privacy={privacy}
        mode={mode}
        onInspect={inspectCustomer}
      />

      <div className={styles.customerPulseRail}>
        <div><span>Healthy</span><strong>{snapshot.customerNodes.filter((item) => item.state === 'healthy').length}</strong><i data-state="healthy" /></div>
        <div><span>Onboarding</span><strong>{snapshot.customerNodes.filter((item) => item.state === 'onboarding').length}</strong><i data-state="onboarding" /></div>
        <div><span>Attention</span><strong>{snapshot.customerNodes.filter((item) => item.state === 'attention').length}</strong><i data-state="attention" /></div>
        <div><span>Recovery</span><strong>{snapshot.customerNodes.filter((item) => item.state === 'intervention').length}</strong><i data-state="intervention" /></div>
        <div><span>Inactive</span><strong>{snapshot.customerNodes.filter((item) => item.state === 'inactive').length}</strong><i data-state="inactive" /></div>
      </div>
    </div>
  )
}

function TenantsScene({ snapshot, mode, setInspector }: { snapshot: SovereignPulseSnapshot; mode: SovereignPulseMode; setInspector: (value: InspectorPayload | null) => void }) {
  const total = snapshot.tenantStages.reduce((sum, stage) => sum + stage.count, 0)
  return (
    <div className={styles.fullScene}>
      <SectionHead eyebrow="Tenant Fleet Command" title="Déploiement, activation et runtime produit" detail="Chaque tenant conserve son stade réel et son blocage explicable." icon={<Gauge size={21} />} />
      <div className={styles.tenantRunway}>
        <div className={styles.runwayLine} />
        {snapshot.tenantStages.map((stage, index) => (
          <button key={stage.key} type="button" className={`${styles.tenantStage} ${toneClass(stage.tone)}`} onClick={() => setInspector({ title: stage.label, eyebrow: 'Tenant deployment stage', description: `${stage.count} tenant(s) dans ce stade.`, evidence: [{ label: 'Volume', value: String(stage.count) }, { label: 'Bloqués', value: String(stage.blocked) }, { label: 'Part du fleet', value: `${total ? Math.round(stage.count / total * 100) : 0}%` }, { label: 'Position', value: `${index + 1}/8` }], href: stage.href })}>
            <span>{String(index + 1).padStart(2, '0')}</span>
            <div className={styles.tenantNode}><strong>{stage.count}</strong><i /></div>
            <h3>{stage.label}</h3>
            <small>{stage.blocked ? `${stage.blocked} bloqué(s)` : 'Flux normal'}</small>
          </button>
        ))}
        <div className={styles.runwayPulse} />
      </div>
      <div className={styles.tenantCommandGrid}>
        <div className={styles.tenantRadar}>
          <span>FLEET READINESS</span>
          <div className={styles.tenantRadarCore}><strong>{snapshot.metrics.find((item) => item.key === 'tenants')?.numericValue || 0}</strong><small>actifs</small></div>
          <i data-ring="one" /><i data-ring="two" /><i data-ring="three" />
          {snapshot.tenantStages.filter((stage) => stage.blocked > 0).map((stage, index) => <b key={stage.key} style={{ transform: `rotate(${index * 82}deg) translateY(-72px)` }} />)}
        </div>
        <div className={styles.tenantSignals}>
          <span>BLOCKER CLASSIFICATION</span>
          {[
            ['Commercial', snapshot.revenueFlow.filter((item) => item.blocked > 0).length],
            ['Access', snapshot.emailFlow.find((item) => item.key === 'approval')?.count || 0],
            ['Product', snapshot.tenantStages.find((item) => item.key === 'entitlement')?.blocked || 0],
            ['Deployment', snapshot.tenantStages.reduce((sum, item) => sum + item.blocked, 0)],
            ['Service', snapshot.experience.find((item) => item.key === 'support')?.criticalCount || 0],
            ['Security', snapshot.platformServices.filter((item) => item.status !== 'healthy').length],
          ].map(([label, value]) => <div key={String(label)}><span>{label}</span><i><b style={{ width: `${Math.min(100, Number(value) * 14)}%` }} /></i><strong>{value}</strong></div>)}
        </div>
        <div className={styles.entitlementTruth}>
          <span>CONTRACTED → EFFECTIVE → RUNTIME</span>
          <div><strong>Contracted</strong><i /><em>{snapshot.revenueFlow.find((item) => item.key === 'contracted')?.displayValue}</em></div>
          <div><strong>Entitlements</strong><i /><em>{snapshot.tenantStages.find((item) => item.key === 'entitlement')?.count || 0} compiled</em></div>
          <div><strong>Runtime</strong><i /><em>{snapshot.tenantStages.find((item) => item.key === 'operational')?.count || 0} operational</em></div>
        </div>
      </div>
    </div>
  )
}

function ExperienceScene({ snapshot, mode, setInspector }: { snapshot: SovereignPulseSnapshot; mode: SovereignPulseMode; setInspector: (value: InspectorPayload | null) => void }) {
  const overall = Math.round(snapshot.experience.reduce((sum, item) => sum + item.pressure, 0) / Math.max(1, snapshot.experience.length))
  return (
    <div className={styles.experienceScene}>
      <SectionHead eyebrow="Customer Experience & Recovery Radar" title="Pression client, SLA et interventions" detail="Les secteurs s’ouvrent à mesure que la pression opérationnelle augmente." icon={<ShieldCheck size={21} />} />
      <div className={styles.recoveryRadarWrap}>
        <div className={styles.recoveryRadar} style={{ '--pressure': `${overall * 3.6}deg` } as CSSProperties}>
          <div className={styles.recoveryRadarCore}><strong>{overall}</strong><span>pressure</span><small>{TONE_LABELS[pressureTone(overall)]}</small></div>
          <i data-ring="1" /><i data-ring="2" /><i data-ring="3" />
          <div className={styles.radarSweep} />
          {snapshot.experience.map((sector, index) => {
            const angle = index * 45
            return <button key={sector.key} type="button" className={`${styles.radarSector} ${toneClass(sector.tone)}`} style={{ transform: `rotate(${angle}deg) translateY(-${118 + sector.pressure * 0.32}px) rotate(-${angle}deg)`, width: 52 + sector.pressure * 0.34, height: 52 + sector.pressure * 0.34 }} onClick={() => setInspector({ title: sector.label, eyebrow: 'Recovery pressure sector', description: `Pression ${sector.pressure}/100`, evidence: [{ label: 'Ouverts', value: String(sector.openCount) }, { label: 'Critiques', value: String(sector.criticalCount) }, { label: 'Tendance', value: sector.trend }, { label: 'Pression', value: `${sector.pressure}%` }], href: sector.href })}><strong>{sector.pressure}</strong><span>{sector.label}</span></button>
          })}
        </div>
      </div>
      <div className={styles.recoveryBoard}>
        {snapshot.experience.map((sector) => <Link key={sector.key} href={sector.href} className={`${styles.recoveryRow} ${toneClass(sector.tone)}`}><div><span>{sector.label}</span><strong>{sector.openCount} ouvert(s)</strong></div><i><b style={{ width: `${sector.pressure}%` }} /></i><em>{sector.criticalCount} critiques</em><small>{sector.trend === 'up' ? '↗' : sector.trend === 'down' ? '↘' : '→'}</small></Link>)}
      </div>
      <div className={styles.recoveryCommand}>
        <span>RECOVERY COMMAND</span>
        <strong>{snapshot.priorities.filter((item) => item.category === 'intervention').length}</strong>
        <p>intervention(s) exigent une coordination active.</p>
        <Link href="/angelcare-360-operator/growth?view=health">Ouvrir le commandement <ArrowRight size={16} /></Link>
      </div>
    </div>
  )
}

function CommunicationsScene({ snapshot, mode, setInspector }: { snapshot: SovereignPulseSnapshot; mode: SovereignPulseMode; setInspector: (value: InspectorPayload | null) => void }) {
  const max = Math.max(1, ...snapshot.emailFlow.map((item) => item.count))
  return (
    <div className={styles.fullScene}>
      <SectionHead eyebrow="Email & Correspondence Flight Control" title="Automations, delivery et réponses clients" detail="SMTP accepté, réponse reçue et outcome business restent des états distincts." icon={<Mail size={21} />} />
      <div className={styles.emailFlightPath}>
        <div className={styles.flightLine} />
        {snapshot.emailFlow.map((stage, index) => (
          <button key={stage.key} type="button" className={`${styles.flightStage} ${toneClass(stage.tone)}`} onClick={() => setInspector({ title: stage.label, eyebrow: 'Email delivery state', description: `${stage.count} message(s) dans cet état.`, evidence: [{ label: 'Volume', value: String(stage.count) }, { label: 'Part du flux', value: `${Math.round(stage.count / max * 100)}%` }, { label: 'État', value: TONE_LABELS[stage.tone] }, { label: 'Vérité', value: stage.key === 'accepted' ? 'Accepté par le transport, pas nécessairement livré.' : 'État Email OS.' }], href: stage.href })}>
            <div className={styles.flightBeacon}><Mail size={17} /><i /></div>
            <span>{String(index + 1).padStart(2, '0')}</span>
            <strong>{stage.count}</strong>
            <small>{stage.label}</small>
          </button>
        ))}
        <div className={styles.flightPacket} />
      </div>
      <div className={styles.communicationGrid}>
        <div className={styles.mailboxHealth}>
          <span>MAILBOX & BRIDGE HEALTH</span>
          {snapshot.platformServices.filter((item) => ['email_bridge', 'smtp', 'pop3', 'automation'].includes(item.key)).map((service) => <Link key={service.key} href={service.href}><i data-status={service.status} /><div><strong>{service.label}</strong><small>{service.freshnessLabel}</small></div><em>{service.status}</em></Link>)}
        </div>
        <div className={styles.replyOrbit}>
          <span>CUSTOMER REPLY ORBIT</span>
          <div><Mail size={22} /><strong>{snapshot.emailFlow.find((item) => item.key === 'replied')?.count || 0}</strong><small>réponses</small></div>
          <i data-orbit="1" /><i data-orbit="2" /><b /><b /><b />
        </div>
        <div className={styles.emailDecisions}>
          <span>ACTIONABLE COMMUNICATIONS</span>
          <div><strong>{snapshot.emailFlow.find((item) => item.key === 'approval')?.count || 0}</strong><small>approbations</small></div>
          <div><strong>{snapshot.emailFlow.find((item) => item.key === 'failed')?.count || 0}</strong><small>échecs</small></div>
          <div><strong>{snapshot.emailFlow.find((item) => item.key === 'queued')?.count || 0}</strong><small>en file</small></div>
          <Link href="/angelcare-360-operator/email-command">Email Command OS <ArrowRight size={16} /></Link>
        </div>
      </div>
    </div>
  )
}

function PlatformScene({ snapshot, mode, setInspector }: { snapshot: SovereignPulseSnapshot; mode: SovereignPulseMode; setInspector: (value: InspectorPayload | null) => void }) {
  const healthy = snapshot.platformServices.filter((item) => item.status === 'healthy').length
  return (
    <div className={styles.platformScene}>
      <SectionHead eyebrow="Platform Integrity Field" title="Infrastructure, sécurité et continuité" detail="Chaque service expose son état, sa fraîcheur et son impact métier." icon={<Server size={21} />} />
      <div className={styles.platformCircuit}>
        <svg viewBox="0 0 1100 620" preserveAspectRatio="none" aria-hidden="true"><path d="M110,120 H550 V310 H990" /><path d="M110,310 H550 V500 H990" /><path d="M280,120 V500" /><path d="M820,120 V500" /></svg>
        <div className={styles.platformCore}><ShieldCheck size={27} /><strong>{healthy}/{snapshot.platformServices.length}</strong><span>services healthy</span><i /></div>
        {snapshot.platformServices.map((service, index) => {
          const positions = [[9,13],[41,9],[75,13],[8,46],[76,46],[9,78],[41,80],[76,78],[42,46]]
          const [left, top] = positions[index] || [50, 50]
          return <button key={service.key} type="button" className={styles.serviceNode} data-status={service.status} style={{ left: `${left}%`, top: `${top}%` }} onClick={() => setInspector({ title: service.label, eyebrow: 'Platform service', description: service.impact, evidence: [{ label: 'État', value: service.status }, { label: 'Latence', value: service.latencyLabel }, { label: 'Fraîcheur', value: service.freshnessLabel }, { label: 'Impact', value: service.impact }], href: service.href })}><i /><div><strong>{service.label}</strong><span>{service.status}</span><small>{service.freshnessLabel}</small></div></button>
        })}
        <div className={styles.circuitPacket} data-packet="1" /><div className={styles.circuitPacket} data-packet="2" />
      </div>
      <div className={styles.sourceTruthRail}>
        {snapshot.sources.map((source) => <div key={source.key} data-state={source.state}><i /><span>{source.label}</span><strong>{source.count}</strong><small>{source.state}</small></div>)}
      </div>
    </div>
  )
}

function MissionsScene({ snapshot, privacy, mode, setInspector }: { snapshot: SovereignPulseSnapshot; privacy: SovereignPulsePrivacy; mode: SovereignPulseMode; setInspector: (value: InspectorPayload | null) => void }) {
  return (
    <div className={styles.fullScene}>
      <SectionHead eyebrow="24-Hour Mission Runway" title="Engagements, readiness et outcomes" detail="Les missions en retard restent visibles jusqu’à résolution ou replanification." icon={<CalendarClock size={21} />} />
      <div className={styles.missionRunway}>
        <div className={styles.missionTimeLine}><i /></div>
        {snapshot.missions.map((mission, index) => (
          <button key={mission.id} type="button" className={styles.missionCard} data-state={mission.state} onClick={() => setInspector({ title: safeLabel(mission.title, privacy, 'Mission opérationnelle'), eyebrow: 'Mission runway', description: safeLabel(mission.context, privacy, 'Contexte protégé'), evidence: [{ label: 'Heure', value: mission.timeLabel }, { label: 'Owner', value: mission.owner }, { label: 'Readiness', value: `${mission.readiness}%` }, { label: 'État', value: mission.state }], href: mission.href })}>
            <time>{mission.timeLabel}</time>
            <div className={styles.missionBeacon}><i /></div>
            <div className={styles.missionCopy}><span>{mission.state}</span><strong>{safeLabel(mission.title, privacy, 'Mission opérationnelle')}</strong><small>{safeLabel(mission.context, privacy, 'Contexte protégé')}</small></div>
            <div className={styles.missionReadiness}><strong>{mission.readiness}%</strong><i><b style={{ width: `${mission.readiness}%` }} /></i></div>
            <em>{mission.owner}</em>
          </button>
        ))}
      </div>
      <div className={styles.accountabilityGrid}>
        <div className={styles.accountabilityCard}><span>UNOWNED WORK</span><strong>{snapshot.priorities.filter((item) => !item.owner).length}</strong><small>éléments sans propriétaire</small></div>
        <div className={styles.accountabilityCard}><span>AT RISK</span><strong>{snapshot.missions.filter((item) => item.state === 'blocked' || item.state === 'overdue').length}</strong><small>missions à sécuriser</small></div>
        <div className={styles.accountabilityCard}><span>READY</span><strong>{snapshot.missions.filter((item) => item.readiness >= 80).length}</strong><small>missions prêtes</small></div>
        <div className={styles.accountabilityCard}><span>DECISIONS</span><strong>{snapshot.priorities.filter((item) => item.category === 'decision').length}</strong><small>autorités attendues</small></div>
      </div>
    </div>
  )
}
