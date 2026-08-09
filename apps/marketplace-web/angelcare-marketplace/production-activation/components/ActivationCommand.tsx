'use client'

import Link from 'next/link'
import { useState } from 'react'
import { Activity, BadgeCheck, CircleAlert, ExternalLink, Gauge, Play, Rocket, ShieldCheck } from 'lucide-react'
import type { ActivationCommandData, ActivationRun } from '../types'
import styles from '../production-activation.module.css'

async function runScan(): Promise<ActivationRun> {
  const response = await fetch('/api/angelcare-marketplace/admin/activation/run', { method: 'POST' })
  const payload = await response.json() as { data?: ActivationRun; error?: { message?: string } }
  if (!response.ok || !payload.data) throw new Error(payload.error?.message || 'Le contrôle n’a pas pu être exécuté.')
  return payload.data
}

export function ActivationCommand({ initialData }: { initialData: ActivationCommandData }) {
  const [run, setRun] = useState(initialData.latestRun)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
  const readiness = initialData.readiness
  const score = run?.score ?? 0

  async function execute() {
    setBusy(true)
    setMessage('')
    try {
      const next = await runScan()
      setRun(next)
      setMessage(next.status === 'passed' ? 'Readiness content & commerce validée.' : 'Des blocages réels restent visibles ci-dessous.')
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Échec du contrôle.')
    } finally {
      setBusy(false)
    }
  }

  return <main className={styles.shell}>
    <section className={styles.hero}>
      <div>
        <span>REAL CONTENT ACTIVATION · END-TO-END ACCEPTANCE</span>
        <h1>Production Activation Command</h1>
        <p>Le dernier cockpit avant go-live : contenu réel, synchronisation publique, runtime, sécurité, UIX et preuve de lancement. Aucun résultat n’est fabriqué.</p>
        <div className={styles.heroActions}>
          <button type="button" onClick={() => void execute()} disabled={busy}><Play size={17}/>{busy ? 'Contrôle en cours…' : 'Exécuter le readiness scan'}</button>
          <Link href="/angelcare-marketplace/admin/catalog/items/new"><Rocket size={17}/> Créer la première offre réelle</Link>
        </div>
        {message ? <div className={styles.notice}>{message}</div> : null}
      </div>
      <div className={styles.score} data-ready={run?.status === 'passed'}>
        <Gauge size={30}/><strong>{score}%</strong><span>{run?.status || 'not_run'}</span>
      </div>
    </section>

    <section className={styles.metricRail}>
      <article><strong>{readiness.published_items}</strong><span>Offres publiées</span></article>
      <article><strong>{readiness.items_with_media}</strong><span>Avec médias</span></article>
      <article><strong>{readiness.published_categories}</strong><span>Catégories live</span></article>
      <article><strong>{readiness.active_homepage_sections}</strong><span>Sections Homepage</span></article>
      <article><strong>{readiness.active_navigation_items}</strong><span>Liens navigation</span></article>
      <article><strong>{readiness.active_merchandising_placements}</strong><span>Placements actifs</span></article>
    </section>

    <section className={styles.commandGrid}>
      <div className={styles.panel}>
        <header><div><span>ACTIVATION PATH</span><h2>Admin creates → publishes → sees live</h2></div><BadgeCheck size={24}/></header>
        <div className={styles.links}>{initialData.adminRoutes.map((route, index) => <Link key={route.href} href={route.href}><b>{String(index + 1).padStart(2, '0')}</b><span><strong>{route.label}</strong><small>{route.purpose}</small></span><ExternalLink size={16}/></Link>)}</div>
      </div>
      <div className={styles.panel}>
        <header><div><span>PUBLIC PROOF</span><h2>Surfaces à vérifier immédiatement</h2></div><Activity size={24}/></header>
        <div className={styles.links}>{initialData.publicRoutes.map((route) => <Link key={route.href} href={route.href} target="_blank"><ShieldCheck size={18}/><span><strong>{route.label}</strong><small>{route.purpose}</small></span><ExternalLink size={16}/></Link>)}</div>
      </div>
    </section>

    <section className={styles.checks}>
      <header><div><span>EVIDENCE REGISTER</span><h2>Dernier contrôle persistant</h2></div><small>{run?.public_reference || 'Aucun run'}</small></header>
      <div className={styles.checkList}>
        {run?.checks?.length ? run.checks.map((check) => <article key={check.id} data-status={check.status}><div>{check.status === 'passed' ? <BadgeCheck size={19}/> : <CircleAlert size={19}/>}<span><strong>{check.label_fr}</strong><small>{check.message}</small></span></div><b>{check.measured_value ?? '—'} / {check.expected_value ?? '—'}</b></article>) : <div className={styles.empty}>Exécutez le readiness scan. Aucun statut vert n’est supposé sans mesure persistante.</div>}
      </div>
    </section>
  </main>
}
