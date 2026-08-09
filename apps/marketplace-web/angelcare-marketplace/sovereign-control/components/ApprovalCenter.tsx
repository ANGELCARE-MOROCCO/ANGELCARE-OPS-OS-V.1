'use client'

import { useMemo, useState } from 'react'
import type { ApiSuccess } from '../../domain/types'
import type { ApprovalRecord } from '../types'
import styles from '../sovereign.module.css'

export function ApprovalCenter({ initialApprovals }: { initialApprovals: ApprovalRecord[] }) {
  const [approvals, setApprovals] = useState(initialApprovals)
  const [focus, setFocus] = useState(initialApprovals[0]?.id || '')
  const [reason, setReason] = useState('')
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
  const active = useMemo(() => approvals.find((item) => item.id === focus) || null, [approvals, focus])

  async function decide(decision: 'approved' | 'rejected') {
    if (!active || reason.trim().length < 4) {
      setMessage('Un motif explicite est requis.')
      return
    }
    setBusy(true)
    setMessage('')
    try {
      const response = await fetch(`/api/angelcare-marketplace/backoffice/approvals/${active.id}/decision`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ decision, reason }),
      })
      const payload = await response.json() as ApiSuccess<ApprovalRecord> | { error?: { message?: string } }
      if (!response.ok || !('data' in payload)) {
        throw new Error('error' in payload ? payload.error?.message : 'Décision impossible.')
      }
      setApprovals((items) => items.map((item) => item.id === payload.data.id ? payload.data : item))
      setReason('')
      setMessage(`Décision enregistrée : ${decision}.`)
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Décision impossible.')
    } finally {
      setBusy(false)
    }
  }

  return <div className={styles.dossier}>
    <section className={styles.panel}>
      <header className={styles.panelHeader}><div><h2>File de décision</h2><p>{approvals.length} demande(s) visibles dans votre périmètre.</p></div></header>
      <div className={styles.list}>{approvals.length ? approvals.map((item) => <button type="button" className={styles.listRow} key={item.id} onClick={() => setFocus(item.id)}><span><span className={styles.listTitle}>{item.title}</span><span className={styles.listMeta}><span>{item.public_reference}</span><span>{item.object_type}</span><span>{item.status}</span></span></span><span className={styles.priority} data-priority={item.priority}>{item.priority}</span></button>) : <div className={styles.empty}>Aucune demande d’approbation.</div>}</div>
    </section>
    <aside className={styles.dossierRail}>
      <section className={styles.panel}>{active ? <><header className={styles.panelHeader}><div><h2>{active.title}</h2><p>{active.summary || 'Aucun résumé fourni.'}</p></div></header><div className={styles.riskStack}><textarea className={styles.textarea} value={reason} onChange={(event) => setReason(event.target.value)} placeholder="Motif, conditions ou raison du refus" /><button type="button" className={styles.primaryButton} disabled={busy || !['submitted','in_review'].includes(active.status)} onClick={() => void decide('approved')}>Approuver avec preuve</button><button type="button" className={styles.dangerButton} disabled={busy || !['submitted','in_review'].includes(active.status)} onClick={() => void decide('rejected')}>Rejeter et retourner</button>{message ? <p>{message}</p> : null}</div></> : <div className={styles.empty}>Sélectionnez une demande.</div>}</section>
    </aside>
  </div>
}
