'use client'
import { useState } from 'react'
import { ArrowLeft, CheckCircle2, Loader2, ShieldCheck } from 'lucide-react'
import Link from 'next/link'
import type { JourneyStatus, MarketplaceJourney } from '../types'
import { statusLabels } from '../content'
import { JourneyTimeline } from './JourneyTimeline'
import { DocumentVault } from './DocumentVault'
import styles from '../journey.module.css'

export function JourneyAdminDetail({ journey }: { journey: MarketplaceJourney }) {
  const [status, setStatus] = useState<JourneyStatus>(journey.status)
  const [reason, setReason] = useState('')
  const [busy, setBusy] = useState(false)
  async function apply() {
    setBusy(true)
    const response = await fetch(`/api/angelcare-marketplace/journeys/admin/${journey.id}`, {
      method: 'PATCH', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ status, reason }),
    })
    setBusy(false)
    if (response.ok) window.location.reload()
  }
  return <main className={styles.adminDetailShell}><Link className={styles.backLink} href="/angelcare-marketplace/admin/journeys"><ArrowLeft size={16}/> Journey Command</Link>
    <section className={styles.adminDetailHero}><div><span>{journey.public_reference}</span><h1>{journey.title}</h1><p>{journey.subtitle || `Autorité actuelle : ${journey.current_authority}`}</p></div><div><strong>{journey.completion_percent}%</strong><span>{statusLabels.fr[journey.status]}</span></div></section>
    <section className={styles.adminDetailGrid}><div><JourneyTimeline events={journey.events} locale="fr"/><DocumentVault documents={journey.documents}/></div><aside className={styles.operatorPanel}><span>OPERATOR DECISION</span><h2>Faire évoluer le parcours</h2><label>Statut<select value={status} onChange={(event) => setStatus(event.target.value as JourneyStatus)}>{Object.entries(statusLabels.fr).map(([value, label]) => <option value={value} key={value}>{label}</option>)}</select></label><label>Motif<textarea rows={5} value={reason} onChange={(event) => setReason(event.target.value)} placeholder="Justification obligatoire, fondée sur l’autorité source."/></label><button className={styles.primaryButton} type="button" onClick={() => void apply()} disabled={busy || !reason.trim()}>{busy ? <Loader2 size={16} className={styles.spin}/> : <ShieldCheck size={16}/>} Appliquer avec audit</button><div className={styles.operatorFacts}><p><CheckCircle2 size={16}/>Finance : projection liée</p><p><CheckCircle2 size={16}/>Territoire : périmètre isolé</p><p><CheckCircle2 size={16}/>Client : visibilité gouvernée</p></div></aside></section>
  </main>
}
