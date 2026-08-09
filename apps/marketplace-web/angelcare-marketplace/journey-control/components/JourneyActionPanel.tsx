'use client'
import { useState } from 'react'
import { ArrowRight, CheckCircle2, Clock3, FileUp, Loader2 } from 'lucide-react'
import type { JourneyAction } from '../types'
import styles from '../journey.module.css'

export function JourneyActionPanel({ journeyId, actions }: { journeyId: string; actions: JourneyAction[] }) {
  const [busy, setBusy] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  async function complete(action: JourneyAction) {
    setBusy(action.id); setMessage(null)
    try {
      const response = await fetch(`/api/angelcare-marketplace/journeys/${journeyId}/actions/${action.id}/complete`, {
        method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ evidence: { channel: 'customer-command' } }),
      })
      const payload = await response.json() as { ok?: boolean; error?: { message?: string } }
      if (!response.ok) throw new Error(payload.error?.message || 'Action impossible')
      setMessage('Action enregistrée avec preuve. Actualisation du parcours…')
      window.location.reload()
    } catch (error) { setMessage(error instanceof Error ? error.message : 'Action impossible') }
    finally { setBusy(null) }
  }
  const open = actions.filter((action) => action.status === 'open')
  return <section className={styles.actionPanel} aria-labelledby="journey-actions-title">
    <div className={styles.sectionHeading}><div><span>NEXT ACTION COMMAND</span><h2 id="journey-actions-title">Ce que vous devez faire maintenant</h2></div><strong>{open.length}</strong></div>
    {open.length ? <div className={styles.actionList}>{open.map((action) => <article className={styles.actionCard} key={action.id}>
      <div className={styles.actionIcon}>{action.action_key.includes('document') ? <FileUp size={20}/> : <Clock3 size={20}/>}</div>
      <div className={styles.actionCopy}><h3>{action.title}</h3>{action.description ? <p>{action.description}</p> : null}
        <div className={styles.actionMeta}>{action.due_at ? <span>Échéance {new Date(action.due_at).toLocaleDateString('fr')}</span> : <span>Sans échéance imposée</span>}{action.consequence ? <span>{action.consequence}</span> : null}</div>
      </div>
      <button className={styles.primaryButton} type="button" disabled={busy === action.id} onClick={() => void complete(action)}>
        {busy === action.id ? <Loader2 size={16} className={styles.spin}/> : <CheckCircle2 size={16}/>} Confirmer <ArrowRight size={16}/>
      </button>
    </article>)}</div> : <div className={styles.successState}><CheckCircle2 size={22}/><div><strong>Vous êtes à jour.</strong><p>Aucune action client n’est actuellement requise.</p></div></div>}
    {message ? <p className={styles.feedback}>{message}</p> : null}
  </section>
}
