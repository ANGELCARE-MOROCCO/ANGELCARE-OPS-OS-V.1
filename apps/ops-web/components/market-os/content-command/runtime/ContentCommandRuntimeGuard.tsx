"use client"

import Link from 'next/link'
import * as React from 'react'
import { AlertTriangle, ArrowRight, CircleX, RefreshCw, ShieldCheck, X } from 'lucide-react'
import {
  emitContentCommandBlocker,
  isExpectedContentCommandError,
  toContentCommandBlocker,
  type ContentCommandBlockerPayload,
} from './content-command-runtime'
import styles from './content-command-runtime-guard.module.css'

type DependencyExample = { id?: string; label?: string; status?: string; href?: string }
type Dependency = { label?: string; table?: string; count?: number; activeCount?: number; examples?: DependencyExample[] }
type InspectionDetails = { inspection?: { consequence?: { summary?: string }; dependencies?: Dependency[] } }

function inspectionOf(blocker: ContentCommandBlockerPayload) {
  const details = blocker.details as InspectionDetails | undefined
  return details?.inspection
}

export default function ContentCommandRuntimeGuard() {
  const [blocker, setBlocker] = React.useState<ContentCommandBlockerPayload | null>(null)

  React.useEffect(() => {
    const onBlocker = (event: Event) => {
      const custom = event as CustomEvent<ContentCommandBlockerPayload>
      if (custom.detail) setBlocker(custom.detail)
    }
    const onUnhandled = (event: PromiseRejectionEvent) => {
      if (!isExpectedContentCommandError(event.reason)) return
      event.preventDefault()
      setBlocker(toContentCommandBlocker(event.reason, 'Promesse utilisateur non gérée'))
    }
    window.addEventListener('content-command:blocker', onBlocker as EventListener)
    window.addEventListener('unhandledrejection', onUnhandled)
    return () => {
      window.removeEventListener('content-command:blocker', onBlocker as EventListener)
      window.removeEventListener('unhandledrejection', onUnhandled)
    }
  }, [])

  if (!blocker) return null
  const dependency = blocker.kind === 'dependency' || blocker.code === 'DEPENDENCY_BLOCKED'
  const inspection = inspectionOf(blocker)
  const dependencies = (inspection?.dependencies || []).filter((entry) => Number(entry.count || 0) > 0)

  return <aside className={styles.guard} data-kind={blocker.kind} role="alertdialog" aria-live="assertive" aria-label={blocker.title}>
    <header>
      <span>{dependency ? <ShieldCheck /> : blocker.kind === 'system' ? <CircleX /> : <AlertTriangle />}</span>
      <div><small>{blocker.code}</small><strong>{blocker.title}</strong></div>
      <button type="button" onClick={() => setBlocker(null)} aria-label="Fermer"><X /></button>
    </header>
    <p>{blocker.message}</p>
    {inspection?.consequence?.summary ? <div className={styles.summary}>{inspection.consequence.summary}</div> : null}
    {dependencies.length ? <section className={styles.dependencies} aria-label="Dépendances bloquantes">
      {dependencies.slice(0, 4).map((entry) => <article key={`${entry.table || entry.label}`}>
        <div><strong>{entry.label || 'Dépendance'}</strong><small>{Number(entry.activeCount || 0)} active(s) · {Number(entry.count || 0)} total</small></div>
        {(entry.examples || []).slice(0, 3).map((example) => example.href
          ? <Link key={example.id || example.href} href={example.href} onClick={() => setBlocker(null)}><span>{example.label || example.id}<small>{example.status || 'recorded'}</small></span><ArrowRight /></Link>
          : <span className={styles.example} key={example.id || example.label}><span>{example.label || example.id}<small>{example.status || 'recorded'}</small></span></span>)}
      </article>)}
    </section> : null}
    {blocker.context ? <code>{blocker.context}</code> : null}
    <footer>
      {blocker.recovery.filter((item) => item.href).slice(0, 3).map((item) => <Link key={item.key} href={item.href!} onClick={() => setBlocker(null)}>{item.label}<ArrowRight /></Link>)}
      <button type="button" onClick={() => window.location.reload()}><RefreshCw />Actualiser</button>
      <button type="button" onClick={() => setBlocker(null)}>Revenir sans modifier</button>
    </footer>
  </aside>
}

export function reportContentCommandBlocker(error: unknown, context?: string) {
  emitContentCommandBlocker(error, context)
}
