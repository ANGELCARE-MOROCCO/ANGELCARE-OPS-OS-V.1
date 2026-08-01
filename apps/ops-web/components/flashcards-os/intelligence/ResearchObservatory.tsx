'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Activity, ArrowLeft, CheckCircle2, CircleDollarSign, FileSearch, Globe2, Play, ShieldAlert, XCircle } from 'lucide-react'
import Link from 'next/link'
import type { EvidenceClaim, ResearchMission, ResearchSource } from '@/lib/flashcards-os/intelligence/types'
import styles from '../flashcards-os.module.css'
import { EmptyIntelligenceState, StatusPill, formatDate } from './IntelligencePrimitives'

export default function ResearchObservatory({ mission, sources, claims }: { mission: ResearchMission; sources: ResearchSource[]; claims: EvidenceClaim[] }) {
  const router = useRouter()
  const [busy, setBusy] = useState('')
  const [error, setError] = useState('')
  async function action(kind: 'approve' | 'execute' | 'cancel' | 'synthesise') {
    setBusy(kind); setError('')
    try {
      const endpoint = kind === 'synthesise' ? '/api/flashcards-os/intelligence/research/syntheses' : `/api/flashcards-os/intelligence/research/missions/${mission.id}/${kind}`
      const response = await fetch(endpoint, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(kind === 'synthesise' ? { missionId: mission.id } : { note: `${kind} via Research Observatory` }) })
      const payload = await response.json()
      if (!response.ok) throw new Error(payload.error || 'Action impossible.')
      router.refresh()
    } catch (caught) { setError(caught instanceof Error ? caught.message : 'Action impossible.') } finally { setBusy('') }
  }
  const domains = Array.from(new Set(sources.map((source) => source.domain).filter(Boolean)))
  const accepted = sources.filter((source) => source.reviewStatus === 'accepted').length
  return (
    <div className={styles.researchObservatoryPage}>
      <header className={styles.researchObservatoryHeader}>
        <div className={styles.observatoryIdentity}><span className={styles.intelKicker}>RESEARCH OBSERVATORY</span><Link href="/flashcards-os/intelligence/research"><ArrowLeft size={15} /> Mission Control</Link><span>{mission.code}</span><h1>{mission.title}</h1><p>{mission.strategicQuestion}</p></div>
        <div className={styles.observatoryActions}><StatusPill value={mission.status} />{['draft','submitted'].includes(mission.status) ? <button type="button" onClick={() => action('approve')} disabled={!!busy}><CheckCircle2 size={15} /> Approuver</button> : null}{['approved','failed'].includes(mission.status) ? <button type="button" onClick={() => action('execute')} disabled={!!busy}><Play size={15} /> Exécuter</button> : null}{['evidence_review','ready_for_synthesis'].includes(mission.status) ? <button type="button" onClick={() => action('synthesise')} disabled={!!busy}><Activity size={15} /> Synthétiser</button> : null}{!['completed','cancelled','archived'].includes(mission.status) ? <button type="button" className={styles.observatoryCancel} onClick={() => action('cancel')} disabled={!!busy}><XCircle size={15} /> Annuler</button> : null}</div>
      </header>
      {error ? <div className={styles.intelErrorBanner}>{error}</div> : null}
      <section className={styles.observatoryTelemetry}>
        <article><FileSearch size={17} /><span>Sources acquises</span><strong>{sources.length}/{mission.sourceLimit}</strong></article>
        <article><CheckCircle2 size={17} /><span>Sources acceptées</span><strong>{accepted}</strong></article>
        <article><Globe2 size={17} /><span>Domaines uniques</span><strong>{domains.length}</strong></article>
        <article><ShieldAlert size={17} /><span>Contradictions</span><strong>{mission.contradictionCount}</strong></article>
        <article><CircleDollarSign size={17} /><span>Crédits</span><strong>{mission.usedCredits}/{mission.budgetCredits}</strong></article>
      </section>
      <section className={styles.observatoryGrid}>
        <aside className={styles.queryArchitecturePanel}><header><span>QUERY ARCHITECTURE</span><strong>{mission.plannedQueries.length}</strong></header>{mission.plannedQueries.map((query, index) => <div key={`${query}-${index}`}><i>{String(index + 1).padStart(2,'0')}</i><p>{query}</p></div>)}<footer><span>Mode</span><strong>{mission.mode.replaceAll('_',' ')}</strong><span>Depth</span><strong>{mission.searchDepth}</strong></footer></aside>
        <main className={styles.sourceStreamPanel}><header><div><span>LIVE SOURCE STREAM</span><h2>Preuves externes reçues</h2></div><Link href="/flashcards-os/intelligence/evidence">Ouvrir l’observatoire global</Link></header><div className={styles.sourceStreamList}>{sources.map((source) => <article key={source.id} className={styles.sourceStreamCard}><div className={styles.sourceQualityOrb}>{Math.round(source.qualityScore)}</div><div className={styles.sourceStreamBody}><div><span>{source.domain}</span><StatusPill value={source.reviewStatus} /></div><h3>{source.title}</h3><p>{source.contentPreview}</p><footer><span>{formatDate(source.publicationDate)}</span><span>Relevance {Math.round(source.relevanceScore)}</span><span>Authority {Math.round(source.authorityScore)}</span>{source.duplicateGroup ? <span>Duplicate group</span> : null}</footer></div></article>)}{!sources.length ? <EmptyIntelligenceState title="Acquisition non exécutée" detail="Aucune source n’est simulée. Après approbation et configuration Tavily, l’exécution alimentera ce flux." /> : null}</div></main>
        <aside className={styles.coverageMapPanel}><header><span>COVERAGE MAP</span><h2>Diversité de mission</h2></header><div className={styles.coverageDomainCloud}>{domains.map((domain, index) => <span style={{ '--weight': Math.max(1, 5 - index) } as React.CSSProperties} key={domain}>{domain}</span>)}</div><div className={styles.coverageFacts}><div><span>Territoires</span><strong>{mission.geographicScope.join(' · ') || 'Global'}</strong></div><div><span>Langues</span><strong>{mission.languages.join(' · ') || 'Non limité'}</strong></div><div><span>Claims</span><strong>{claims.length}</strong></div><div><span>Deadline</span><strong>{formatDate(mission.deadline)}</strong></div></div></aside>
      </section>
    </div>
  )
}
