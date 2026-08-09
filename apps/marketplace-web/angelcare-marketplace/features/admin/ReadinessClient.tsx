"use client"

import { useMemo, useState, useTransition, type FormEvent } from 'react'
import {
  CheckCircle2,
  ClipboardCheck,
  ShieldCheck,
  X,
} from 'lucide-react'
import type {
  MarketplaceReadinessCheck,
  MarketplaceReadinessStatus,
} from '../../domain/types'
import styles from '../../design-system/marketplace.module.css'
import { Button, StatusChip } from '../../design-system/ui'

async function responseData<T>(response: Response): Promise<T> {
  const payload = await response.json() as { data?: T; error?: { message?: string } }
  if (!response.ok || !payload.data) throw new Error(payload.error?.message || 'L’opération n’a pas abouti.')
  return payload.data
}

export function ReadinessClient({
  initialChecks,
  canUpdate,
  canSignOff,
}: {
  initialChecks: MarketplaceReadinessCheck[]
  canUpdate: boolean
  canSignOff: boolean
}) {
  const [checks, setChecks] = useState(initialChecks)
  const [editing, setEditing] = useState<MarketplaceReadinessCheck | null>(null)
  const [status, setStatus] = useState<MarketplaceReadinessStatus>('in_progress')
  const [notes, setNotes] = useState('')
  const [nextAction, setNextAction] = useState('')
  const [blocker, setBlocker] = useState('')
  const [evidence, setEvidence] = useState('')
  const [reason, setReason] = useState('')
  const [signOffOpen, setSignOffOpen] = useState(false)
  const [signOffReason, setSignOffReason] = useState('')
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null)
  const [isPending, startTransition] = useTransition()

  const summary = useMemo(() => ({
    ready: checks.filter((check) => check.status === 'ready').length,
    blocked: checks.filter((check) => check.status === 'blocked').length,
    requiredPending: checks.filter((check) => check.required_for_release && check.status !== 'ready').length,
  }), [checks])

  function openEdit(check: MarketplaceReadinessCheck) {
    setEditing(check)
    setStatus(check.status === 'ready' ? 'in_progress' : check.status)
    setNotes(check.notes || '')
    setNextAction(check.next_action || '')
    setBlocker(check.blocker || '')
    setEvidence(String((check.evidence as { reference?: string } | null)?.reference || ''))
    setReason('')
    setFeedback(null)
  }

  function submitUpdate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!editing) return
    startTransition(async () => {
      try {
        const response = await fetch(
          `/api/angelcare-marketplace/foundation/readiness/${encodeURIComponent(editing.check_key)}`,
          {
            method: 'PATCH',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({
              status,
              notes,
              nextAction,
              blocker: status === 'blocked' ? blocker : '',
              evidence: evidence ? { reference: evidence } : editing.evidence,
              reason,
              ownerRole: editing.owner_role,
            }),
          },
        )
        const updated = await responseData<MarketplaceReadinessCheck>(response)
        setChecks((current) => current.map((check) => check.id === updated.id ? updated : check))
        setEditing(null)
        setFeedback({ type: 'success', message: `${updated.name} a été mis à jour et audité.` })
      } catch (error) {
        setFeedback({ type: 'error', message: error instanceof Error ? error.message : 'Mise à jour impossible.' })
      }
    })
  }

  function submitSignOff(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    startTransition(async () => {
      try {
        const response = await fetch('/api/angelcare-marketplace/foundation/readiness/sign-off', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ reason: signOffReason }),
        })
        const result = await responseData<{ releaseId: string; status: string }>(response)
        setSignOffOpen(false)
        setFeedback({
          type: result.status === 'accepted' ? 'success' : 'error',
          message:
            result.status === 'accepted'
              ? `Sign-off enregistré. Référence de release : ${result.releaseId}.`
              : `Sign-off conditionnel enregistré : des contrôles obligatoires restent ouverts.`,
        })
      } catch (error) {
        setFeedback({ type: 'error', message: error instanceof Error ? error.message : 'Signature impossible.' })
      }
    })
  }

  const percentage = checks.length ? Math.round((summary.ready / checks.length) * 100) : 0

  return (
    <>
      {feedback ? (
        <div className={`${styles.feedback} ${feedback.type === 'success' ? styles.noticeSuccess : styles.noticeWarning}`}>
          {feedback.type === 'success' ? <CheckCircle2 size={18} /> : <ShieldCheck size={18} />}
          <div>{feedback.message}</div>
        </div>
      ) : null}

      <section className={styles.card}>
        <header className={styles.cardHeader}>
          <div>
            <h2 className={styles.cardTitle}>Score de préparation Mega ZIP 01</h2>
            <p className={styles.cardSubtitle}>
              {summary.ready} prêt(s) · {summary.blocked} bloqué(s) · {summary.requiredPending} obligatoire(s) restant(s)
            </p>
          </div>
          {canSignOff ? (
            <Button type="button" onClick={() => { setSignOffOpen(true); setSignOffReason('') }}>
              <ShieldCheck size={15} /> Sign-off
            </Button>
          ) : null}
        </header>
        <div className={styles.cardBody}>
          <div className={styles.inline}>
            <div className={styles.progressTrack} style={{ flex: '1 1 320px' }}>
              <div className={styles.progressFill} style={{ width: `${percentage}%` }} />
            </div>
            <strong>{percentage}%</strong>
          </div>
        </div>
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Contrôle</th>
                <th>Catégorie</th>
                <th>Statut</th>
                <th>Propriétaire</th>
                <th>Preuve</th>
                <th>Prochaine action</th>
                <th>Obligatoire</th>
                <th aria-label="Actions" />
              </tr>
            </thead>
            <tbody>
              {checks.map((check) => (
                <tr key={check.id}>
                  <td>
                    <div className={styles.tablePrimary}>{check.name}</div>
                    <div className={styles.tableSecondary}>{check.description}</div>
                  </td>
                  <td>{check.category}</td>
                  <td><StatusChip status={check.status} /></td>
                  <td>{check.owner_role || 'À assigner'}</td>
                  <td>
                    {Object.keys(check.evidence || {}).length ? (
                      <span className={styles.code}>Preuve liée</span>
                    ) : (
                      <span className={styles.muted}>Absente</span>
                    )}
                  </td>
                  <td>{check.next_action || check.blocker || 'À définir'}</td>
                  <td><StatusChip status={check.required_for_release ? 'registered' : 'not_applicable'} /></td>
                  <td>
                    {canUpdate ? (
                      <Button type="button" variant="secondary" onClick={() => openEdit(check)}>
                        Mettre à jour
                      </Button>
                    ) : null}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {editing ? (
        <div className={styles.modalBackdrop}>
          <form className={styles.modalPanel} onSubmit={submitUpdate} role="dialog" aria-modal="true">
            <header className={styles.modalHeader}>
              <div><h2>{editing.name}</h2><p>{editing.description}</p></div>
              <button className={styles.iconButton} type="button" onClick={() => setEditing(null)} aria-label="Fermer"><X size={16} /></button>
            </header>
            <div className={styles.modalBody}>
              <label className={styles.fieldGroup}>
                <span className={styles.fieldLabel}>Statut *</span>
                <select className={styles.selectField} value={status} onChange={(event: { target: { value: string } }) => setStatus(event.target.value as MarketplaceReadinessStatus)}>
                  <option value="not_started">Non démarré</option>
                  <option value="in_progress">En cours</option>
                  <option value="ready">Prêt</option>
                  <option value="blocked">Bloqué</option>
                  <option value="not_applicable">Non applicable</option>
                </select>
              </label>
              <label className={styles.fieldGroup}>
                <span className={styles.fieldLabel}>Référence de preuve</span>
                <input className={styles.textField} value={evidence} onChange={(event: { target: { value: string } }) => setEvidence(event.target.value)} placeholder="Fichier, résultat, capture ou référence de test" />
              </label>
              <label className={styles.fieldGroup}>
                <span className={styles.fieldLabel}>Notes</span>
                <textarea className={styles.textArea} value={notes} onChange={(event: { target: { value: string } }) => setNotes(event.target.value)} />
              </label>
              {status === 'blocked' ? (
                <label className={styles.fieldGroup}>
                  <span className={styles.fieldLabel}>Blocage *</span>
                  <textarea className={styles.textArea} value={blocker} onChange={(event: { target: { value: string } }) => setBlocker(event.target.value)} required />
                </label>
              ) : null}
              <label className={styles.fieldGroup}>
                <span className={styles.fieldLabel}>Prochaine action</span>
                <textarea className={styles.textArea} value={nextAction} onChange={(event: { target: { value: string } }) => setNextAction(event.target.value)} />
              </label>
              <label className={styles.fieldGroup}>
                <span className={styles.fieldLabel}>Raison du changement *</span>
                <textarea className={styles.textArea} value={reason} onChange={(event: { target: { value: string } }) => setReason(event.target.value)} required />
              </label>
            </div>
            <footer className={styles.modalFooter}>
              <Button type="button" variant="quiet" onClick={() => setEditing(null)}>Annuler</Button>
              <Button type="submit" disabled={isPending || !reason.trim()}>{isPending ? 'Contrôle…' : 'Mettre à jour et auditer'}</Button>
            </footer>
          </form>
        </div>
      ) : null}

      {signOffOpen ? (
        <div className={styles.modalBackdrop}>
          <form className={styles.modalPanel} onSubmit={submitSignOff} role="dialog" aria-modal="true">
            <header className={styles.modalHeader}>
              <div><h2>Signer l’état de préparation</h2><p>La signature sera acceptée ou conditionnelle selon les contrôles obligatoires réellement prêts.</p></div>
              <button className={styles.iconButton} type="button" onClick={() => setSignOffOpen(false)} aria-label="Fermer"><X size={16} /></button>
            </header>
            <div className={styles.modalBody}>
              <div className={summary.requiredPending ? styles.noticeWarning : styles.noticeSuccess}>
                <ClipboardCheck size={18} />
                <div>
                  {summary.requiredPending
                    ? `${summary.requiredPending} contrôle(s) obligatoire(s) restent non prêts. Le système n’émettra pas une fausse acceptation complète.`
                    : 'Tous les contrôles obligatoires sont prêts pour une acceptation complète.'}
                </div>
              </div>
              <label className={styles.fieldGroup}>
                <span className={styles.fieldLabel}>Note exécutive de sign-off *</span>
                <textarea className={styles.textArea} value={signOffReason} onChange={(event: { target: { value: string } }) => setSignOffReason(event.target.value)} required />
              </label>
            </div>
            <footer className={styles.modalFooter}>
              <Button type="button" variant="quiet" onClick={() => setSignOffOpen(false)}>Annuler</Button>
              <Button type="submit" disabled={isPending || !signOffReason.trim()}>
                {isPending ? 'Enregistrement…' : 'Signer avec le statut réel'}
              </Button>
            </footer>
          </form>
        </div>
      ) : null}
    </>
  )
}
