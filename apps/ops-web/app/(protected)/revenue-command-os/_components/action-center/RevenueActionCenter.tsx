'use client'

import Link from 'next/link'
import {
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  CircleStop,
  Clock3,
  FileDown,
  Loader2,
  PanelTopOpen,
  X,
  Zap,
} from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import {
  REVENUE_ACTION_EVENT,
  emitRevenueAction,
  revenueActionId,
  type RevenueActionProgress,
  type RevenueActionState,
} from './action-events'
import styles from './RevenueActionCenter.module.css'

const STORAGE_KEY = 'angelcare:revenue-os:action-center:v1'
const MAX_ITEMS = 24

function isTerminal(state: RevenueActionState) {
  return ['success', 'partial', 'failure', 'cancelled'].includes(state)
}

function stateIcon(state: RevenueActionState) {
  if (state === 'success') return CheckCircle2
  if (state === 'failure' || state === 'partial') return AlertTriangle
  if (state === 'cancelled') return CircleStop
  if (state === 'queued') return Clock3
  return Loader2
}

function stateLabel(state: RevenueActionState) {
  return {
    queued: 'En attente',
    validating: 'Validation',
    running: 'En cours',
    success: 'Terminé',
    partial: 'Terminé avec réserves',
    failure: 'Échec',
    cancelled: 'Annulé',
  }[state]
}

function inferAction(url: string, init?: RequestInit) {
  let action = ''
  try {
    if (typeof init?.body === 'string') action = String(JSON.parse(init.body)?.action || '')
  } catch {}
  const route = url.split('/api/revenue-command-os/')[1]?.split('?')[0] || 'operation'
  const known: Record<string, string> = {
    launch_operation: 'Assemblage stratégique Gemini',
    simulate: 'Simulation de commande',
    validate: 'Validation technique',
    compile: 'Compilation stratégique',
    prepare: 'Préparation de propagation',
    activate: 'Activation live',
    approve: 'Exécution immédiate',
    reject: 'Annulation',
    retry: 'Nouvelle tentative',
    import: 'Import Revenue OS',
    run: 'Exécution live',
  }
  return {
    title: known[action] || action.replaceAll('_', ' ') || route.replaceAll('/', ' · ').replaceAll('-', ' '),
    workspace: route.split('/')[0] || 'Revenue OS',
  }
}

function loadStored(): RevenueActionProgress[] {
  if (typeof window === 'undefined') return []
  try {
    const parsed = JSON.parse(window.localStorage.getItem(STORAGE_KEY) || '[]')
    return Array.isArray(parsed) ? parsed.slice(0, MAX_ITEMS) : []
  } catch {
    return []
  }
}

export default function RevenueActionCenter() {
  const [items, setItems] = useState<RevenueActionProgress[]>([])
  const [open, setOpen] = useState(false)
  const [expanded, setExpanded] = useState<string>('')
  const originalFetch = useRef<typeof window.fetch | null>(null)

  useEffect(() => {
    const local = loadStored()
    setItems(local)
    void fetch('/api/revenue-command-os/action-center', { cache: 'no-store' }).then(response => response.json()).then(body => {
      if (!body?.ok || !Array.isArray(body.data?.rows)) return
      setItems(current => {
        const combined = [...current, ...body.data.rows].filter((item,index,array) => array.findIndex(candidate => candidate.id === item.id) === index).sort((a,b)=>b.updatedAt.localeCompare(a.updatedAt)).slice(0,MAX_ITEMS)
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(combined))
        return combined
      })
    }).catch(() => null)
  }, [])

  useEffect(() => {
    const receive = (event: Event) => {
      const item = (event as CustomEvent<RevenueActionProgress>).detail
      if (!item?.id) return
      setItems((current) => {
        const existing = current.find((candidate) => candidate.id === item.id)
        const merged = existing ? { ...existing, ...item, startedAt: existing.startedAt } : item
        const next = [merged, ...current.filter((candidate) => candidate.id !== item.id)]
          .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
          .slice(0, MAX_ITEMS)
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
        return next
      })
      setOpen(true)
    }
    window.addEventListener(REVENUE_ACTION_EVENT, receive)
    return () => window.removeEventListener(REVENUE_ACTION_EVENT, receive)
  }, [])

  useEffect(() => {
    if (originalFetch.current) return
    const nativeFetch = window.fetch.bind(window)
    originalFetch.current = nativeFetch

    window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url
      const method = String(init?.method || (input instanceof Request ? input.method : 'GET')).toUpperCase()
      const headers = new Headers(init?.headers || (input instanceof Request ? input.headers : undefined))
      const managed = headers.get('x-revenue-progress-managed') === '1'
      const shouldObserve = !managed && url.includes('/api/revenue-command-os/') && !['GET', 'HEAD', 'OPTIONS'].includes(method)

      if (!shouldObserve) return nativeFetch(input, init)

      const id = revenueActionId('api')
      const inferred = inferAction(url, init)
      emitRevenueAction({
        id,
        title: inferred.title,
        workspace: inferred.workspace,
        state: 'running',
        step: 'Requête sécurisée envoyée au service Revenue OS',
        indeterminate: true,
        detail: `${method} ${url.split('?')[0]}`,
        dismissible: false,
      })

      try {
        const response = await nativeFetch(input, init)
        let envelope: any = null
        try { envelope = await response.clone().json() } catch {}
        const ok = response.ok && envelope?.ok !== false
        emitRevenueAction({
          id,
          title: inferred.title,
          workspace: inferred.workspace,
          state: ok ? stateFrom(envelope?.data) : 'failure',
          step: ok ? truthfulStep(envelope?.data) : 'Le service a refusé ou interrompu l’action',
          progress: 100,
          indeterminate: false,
          completedAt: new Date().toISOString(),
          detail: ok ? messageFrom(envelope?.data) : undefined,
          error: ok ? undefined : String(envelope?.error?.message || `HTTP ${response.status}`),
          auditHref: '/revenue-command-os/audit',
          dismissible: true,
        })
        return response
      } catch (error) {
        emitRevenueAction({
          id,
          title: inferred.title,
          workspace: inferred.workspace,
          state: 'failure',
          step: 'Interruption réseau ou runtime',
          progress: 100,
          indeterminate: false,
          completedAt: new Date().toISOString(),
          error: error instanceof Error ? error.message : String(error),
          auditHref: '/revenue-command-os/audit',
          dismissible: true,
        })
        throw error
      }
    }

    return () => {
      if (originalFetch.current) window.fetch = originalFetch.current
      originalFetch.current = null
    }
  }, [])

  const active = useMemo(() => items.filter((item) => !isTerminal(item.state)).length, [items])
  const visible = open ? items.slice(0, 8) : []

  function remove(id: string) {
    setItems((current) => {
      const next = current.filter((item) => item.id !== id)
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
      return next
    })
  }

  return (
    <aside className={styles.center} data-revenue-action-center="v1" aria-live="polite">
      <button type="button" className={styles.launcher} onClick={() => setOpen((value) => !value)} aria-expanded={open}>
        <span className={styles.launcherPulse}><Zap size={17} /></span>
        <span className={styles.launcherText}>
          <strong>Centre d’actions Revenue OS</strong>
          <span>{active ? `${active} opération(s) active(s)` : items.length ? 'Historique opérationnel disponible' : 'Prêt à suivre les actions'}</span>
        </span>
        <span className={styles.count}>{active || items.length}</span>
        {open ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
      </button>

      {open ? (
        <div className={styles.stack}>
          {!visible.length ? <div className={styles.empty}>Aucune action récente. Les imports, runs Gemini, commandes, validations et compilations apparaîtront ici.</div> : null}
          {visible.map((item) => {
            const Icon = stateIcon(item.state)
            const isExpanded = expanded === item.id
            const percent = item.indeterminate ? 35 : Math.max(0, Math.min(100, item.progress ?? (isTerminal(item.state) ? 100 : 12)))
            return (
              <article key={item.id} className={styles.card} data-state={item.state}>
                <div className={styles.header}>
                  <span className={styles.icon}><Icon size={17} className={!isTerminal(item.state) ? 'animate-spin' : ''} /></span>
                  <div className={styles.copy}>
                    <p className={styles.eyebrow}>{item.workspace} · {stateLabel(item.state)}</p>
                    <h3 className={styles.title}>{item.title}</h3>
                    <p className={styles.step}>{item.step}</p>
                  </div>
                  <div className={styles.headerActions}>
                    <button type="button" className={styles.iconButton} onClick={() => setExpanded(isExpanded ? '' : item.id)} aria-label="Afficher le détail">
                      {isExpanded ? <ChevronUp size={15} /> : <PanelTopOpen size={15} />}
                    </button>
                    {item.dismissible || isTerminal(item.state) ? <button type="button" className={styles.iconButton} onClick={() => remove(item.id)} aria-label="Masquer"><X size={15} /></button> : null}
                  </div>
                </div>
                <div className={styles.progressTrack}><div className={`${styles.progressValue} ${item.indeterminate ? styles.indeterminate : ''}`} style={item.indeterminate ? undefined : { width: `${percent}%` }} /></div>
                {isExpanded ? (
                  <div className={styles.details}>
                    <div className={styles.detailGrid}>
                      <div className={styles.fact}><label>Progression</label><strong>{item.indeterminate ? 'Étape active' : `${percent}%`}</strong></div>
                      <div className={styles.fact}><label>Démarrée</label><strong>{new Date(item.startedAt).toLocaleTimeString('fr-FR')}</strong></div>
                      {item.totalItems != null ? <div className={styles.fact}><label>Éléments</label><strong>{item.completedItems || 0}/{item.totalItems}</strong></div> : null}
                      <div className={styles.fact}><label>Avertissements</label><strong>{item.warningCount || 0}</strong></div>
                    </div>
                    {item.detail ? <p className={styles.detailText}>{item.detail}</p> : null}
                    {item.error ? <p className={`${styles.detailText} ${styles.error}`}>{item.error}</p> : null}
                    <div className={styles.footer}>
                      {item.resultHref ? <Link className={styles.link} href={item.resultHref}>Ouvrir le résultat</Link> : null}
                      {item.auditHref ? <Link className={styles.link} href={item.auditHref}>Ouvrir l’audit</Link> : null}
                      {item.reportName ? <button type="button" className={styles.button} onClick={() => downloadReport(item)}><FileDown size={13} /> Télécharger le rapport</button> : null}
                    </div>
                  </div>
                ) : null}
              </article>
            )
          })}
        </div>
      ) : null}
    </aside>
  )
}

function statusFrom(data: unknown) {
  if (!data || typeof data !== 'object') return ''
  const record = data as Record<string, unknown>
  const nested = record.run && typeof record.run === 'object' ? record.run as Record<string, unknown> : null
  const action = record.action && typeof record.action === 'object' ? record.action as Record<string, unknown> : null
  return String(record.status || nested?.status || action?.status || '')
}
function stateFrom(data: unknown): RevenueActionState {
  const status = statusFrom(data).toLowerCase()
  if (/failed|dead_letter|error/.test(status)) return 'failure'
  if (/partial/.test(status)) return 'partial'
  if (/cancel/.test(status)) return 'cancelled'
  if (/queued|prepared|ready|scheduled/.test(status)) return 'queued'
  if (/running|active|executing|leased|activating/.test(status)) return 'running'
  return 'success'
}
function truthfulStep(data: unknown) {
  const status = statusFrom(data)
  if (/queued|prepared|ready|scheduled/i.test(status)) return `État technique enregistré: ${status}`
  if (/running|active|executing|leased|activating/i.test(status)) return `Exécution active: ${status}`
  if (/succeeded|completed|sent|delivered/i.test(status)) return `Opération terminée: ${status}`
  return status ? `Réponse Revenue OS: ${status}` : 'Réponse technique reçue; le résultat détaillé reste consultable dans l’audit'
}

function messageFrom(data: unknown) {
  if (!data || typeof data !== 'object') return undefined
  const record = data as Record<string, unknown>
  const summary = record.summary || record.message || record.status
  return typeof summary === 'string' ? summary : undefined
}

function downloadReport(item: RevenueActionProgress) {
  const blob = new Blob([JSON.stringify(item, null, 2)], { type: 'application/json;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = item.reportName || `revenue-action-${item.id}.json`
  anchor.click()
  URL.revokeObjectURL(url)
}
