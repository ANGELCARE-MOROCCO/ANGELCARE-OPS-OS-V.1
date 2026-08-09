'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { CheckCircle2, CircleAlert, ExternalLink, FileSearch, GitMerge, Network, ShieldX } from 'lucide-react'
import type { EvidenceClaim, ResearchMission, ResearchSource } from '@/lib/flashcards-os/intelligence/types'
import styles from '../flashcards-os.module.css'
import { EmptyIntelligenceState, StatusPill } from './IntelligencePrimitives'

export default function EvidenceObservatory({ missions, sources, claims }: { missions: ResearchMission[]; sources: ResearchSource[]; claims: EvidenceClaim[] }) {
  const router = useRouter()
  const [selected, setSelected] = useState(sources[0]?.id || '')
  const [note, setNote] = useState('')
  const [busy, setBusy] = useState(false)
  const source = sources.find((item) => item.id === selected)
  const relatedClaims = claims.filter((claim) => claim.sourceIds.includes(selected))
  const contradictions = claims.filter((claim) => claim.contradictionIds.length > 0)
  const clusters = useMemo(() => Object.entries(sources.reduce<Record<string, ResearchSource[]>>((acc, item) => { const key = item.duplicateGroup || `unique-${item.id}`; (acc[key] ||= []).push(item); return acc }, {})).filter(([,items]) => items.length > 1), [sources])

  async function review(status: 'accepted' | 'rejected' | 'needs_verification') {
    if (!source) return
    setBusy(true)
    try {
      const response = await fetch(`/api/flashcards-os/intelligence/research/evidence/${source.id}/review`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ status, note }) })
      const payload = await response.json()
      if (!response.ok) throw new Error(payload.error || 'Review failed.')
      setNote(''); router.refresh()
    } finally { setBusy(false) }
  }

  return (
    <div className={styles.evidenceObservatoryPage}>
      <header className={styles.evidenceObservatoryHeader}><div><span className={styles.intelKicker}><Network size={16} /> EVIDENCE OBSERVATORY</span><h1>Une source n’est pas une vérité avant arbitrage.</h1><p>Visualisez la lignée, les claims, les duplications et les contradictions avant toute synthèse OpenRouter.</p></div><div className={styles.evidenceHeaderMetrics}><strong>{sources.length}<span>sources</span></strong><strong>{claims.length}<span>claims</span></strong><strong>{contradictions.length}<span>contradictions</span></strong></div></header>
      <section className={styles.evidenceWorkspace}>
        <aside className={styles.evidenceSourceRail}><header><span>SOURCE CONSTELLATION</span><strong>{sources.length}</strong></header><div>{sources.map((item) => <button type="button" onClick={() => setSelected(item.id)} className={item.id === selected ? styles.evidenceSourceActive : ''} key={item.id}><span className={styles.evidenceSourceScore}>{Math.round(item.qualityScore)}</span><div><strong>{item.title}</strong><small>{item.domain}</small></div><StatusPill value={item.reviewStatus} /></button>)}</div>{!sources.length ? <EmptyIntelligenceState title="Aucune source" detail="Exécutez une mission approuvée pour alimenter l’observatoire." /> : null}</aside>
        <main className={styles.evidenceClaimLedger}>{source ? <><header><div><span>{source.domain}</span><h2>{source.title}</h2></div><a href={source.url} target="_blank" rel="noreferrer">Source originale <ExternalLink size={14} /></a></header><p className={styles.evidencePreview}>{source.contentPreview}</p><div className={styles.evidenceScoreGrid}>{[['Relevance',source.relevanceScore],['Freshness',source.freshnessScore],['Authority',source.authorityScore],['Quality',source.qualityScore]].map(([label,value]) => <div key={String(label)}><span>{label}</span><strong>{Math.round(Number(value))}</strong><i style={{ width: `${Math.min(100, Number(value))}%` }} /></div>)}</div><section className={styles.claimLedgerSection}><header><span>CLAIM LEDGER</span><strong>{relatedClaims.length}</strong></header>{relatedClaims.map((claim) => <article key={claim.id}><div><StatusPill value={claim.kind} /><StatusPill value={claim.directness} /><strong>{Math.round(claim.confidence)}%</strong></div><h3>{claim.statement}</h3><blockquote>{claim.supportingExtract}</blockquote>{claim.contradictionIds.length ? <span className={styles.contradictionFlag}><CircleAlert size={14} /> Contradiction liée</span> : null}</article>)}{!relatedClaims.length ? <p className={styles.quietNotice}>Claim extraction non encore exécutée.</p> : null}</section><section className={styles.evidenceArbitration}><header><span>HUMAN ARBITRATION</span><StatusPill value={source.reviewStatus} /></header><textarea value={note} onChange={(e: any) => setNote(e.target.value)} rows={3} placeholder="Justification, limite géographique, contexte, réserve…" /><div><button type="button" disabled={busy} onClick={() => review('accepted')}><CheckCircle2 size={15} /> Accepter</button><button type="button" disabled={busy} onClick={() => review('needs_verification')}><FileSearch size={15} /> Vérifier</button><button type="button" disabled={busy} onClick={() => review('rejected')} className={styles.rejectEvidence}><ShieldX size={15} /> Rejeter</button></div></section></> : <EmptyIntelligenceState title="Sélectionnez une source" detail="La lignée complète et les claims associés apparaîtront ici." />}</main>
        <aside className={styles.contradictionChamber}><header><GitMerge size={18} /><div><span>CONTRADICTION CHAMBER</span><h2>Ce qui ne concorde pas</h2></div></header><div>{contradictions.map((claim) => <article key={claim.id}><StatusPill value={claim.reviewStatus} /><strong>{claim.statement}</strong><p>{claim.reviewerNote || 'Décision humaine encore requise.'}</p></article>)}{!contradictions.length ? <p className={styles.quietNotice}>Aucune contradiction structurée à ce stade.</p> : null}</div><footer><span>Duplicate clusters</span><strong>{clusters.length}</strong><small>Les duplications ne comptent pas comme confirmations indépendantes.</small></footer></aside>
      </section>
    </div>
  )
}
