'use client'
import { useState } from 'react'
import { AlertTriangle, LifeBuoy, Loader2, ShieldCheck } from 'lucide-react'
import type { JourneyRecoveryCase } from '../types'
import styles from '../journey.module.css'

export function RecoveryPanel({ journeyId, cases }: { journeyId: string; cases: JourneyRecoveryCase[] }) {
  const [open, setOpen] = useState(false)
  const [busy, setBusy] = useState(false)
  const [summary, setSummary] = useState('')
  const [issueType, setIssueType] = useState('service_quality')
  const active = cases.filter((entry) => !['resolved','closed'].includes(entry.status))
  async function submit() {
    if (!summary.trim()) return
    setBusy(true)
    const response = await fetch(`/api/angelcare-marketplace/journeys/${journeyId}/recovery`, {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ issueType, urgency: 'high', summary, evidence: { channel: 'customer-command' } }),
    })
    setBusy(false)
    if (response.ok) window.location.reload()
  }
  return <section className={styles.recoveryPanel} aria-labelledby="recovery-title">
    <div className={styles.recoveryHeader}><div><span>ANGELCARE RECOVERY</span><h2 id="recovery-title">Un problème ? Nous le pilotons jusqu’à la résolution.</h2><p>Chaque signalement est rattaché au parcours, à une autorité, à un SLA et à une preuve de clôture.</p></div><button className={styles.secondaryButton} type="button" onClick={() => setOpen(!open)}><LifeBuoy size={17}/> Demander de l’aide</button></div>
    {active.map((entry) => <article className={styles.recoveryCase} key={entry.id}><AlertTriangle size={20}/><div><strong>{entry.issue_type}</strong><p>{entry.summary}</p><span>{entry.status} · SLA {entry.sla_due_at ? new Date(entry.sla_due_at).toLocaleString('fr') : 'à définir'}</span></div></article>)}
    {open ? <div className={styles.recoveryForm}><label>Type de problème<select value={issueType} onChange={(event) => setIssueType(event.target.value)}><option value="service_quality">Qualité du service</option><option value="schedule_conflict">Conflit de planning</option><option value="delivery_issue">Livraison</option><option value="document_rejection">Document refusé</option><option value="billing_concern">Facturation</option></select></label><label>Expliquez la situation<textarea value={summary} onChange={(event) => setSummary(event.target.value)} rows={4}/></label><button className={styles.primaryButton} type="button" onClick={() => void submit()} disabled={busy || !summary.trim()}>{busy ? <Loader2 size={16} className={styles.spin}/> : <ShieldCheck size={16}/>} Ouvrir un dossier de récupération</button></div> : null}
  </section>
}
