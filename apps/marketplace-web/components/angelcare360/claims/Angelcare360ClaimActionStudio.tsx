'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { CheckCircle2, LockKeyhole, UserRoundCheck, Workflow, X } from 'lucide-react'
import type { Angelcare360ClaimTicketRecord } from '@/types/angelcare360/communications'
import styles from './TrustResolutionOS.module.css'
import { claimStatusLabel } from './claimPresentation'

export type ClaimStaffOption = { id: string; full_name: string; staff_code: string; department?: string | null }

type Mode = 'assign' | 'status' | 'resolve' | 'close'

type Props = {
  mode: Mode
  ticket: Angelcare360ClaimTicketRecord
  schoolId: string
  staff: ClaimStaffOption[]
  triggerClassName?: string
  triggerLabel?: string
}

const modeCopy: Record<Mode, { eyebrow: string; title: string; description: string; submit: string }> = {
  assign: { eyebrow: 'RESPONSIBILITY COMMAND', title: 'Engager une responsabilité', description: 'Attribuer le dossier à un membre du personnel autorisé. L’assignation est auditée.', submit: 'Confirmer la responsabilité' },
  status: { eyebrow: 'RECOVERY PROTOCOL', title: 'Faire avancer le dossier', description: 'Modifier l’étape canonique sans confondre progression opérationnelle et restauration de confiance.', submit: 'Enregistrer l’étape' },
  resolve: { eyebrow: 'RESOLUTION STUDIO', title: 'Clôturer avec intégrité', description: 'Documenter la correction et son résumé avant de déclarer le dossier résolu. La satisfaction famille n’est pas inventée.', submit: 'Certifier la résolution' },
  close: { eyebrow: 'CLOSURE CERTIFICATION', title: 'Certifier la fermeture', description: 'Fermer le dossier avec un résumé de résolution explicite. La fermeture reste distincte d’une satisfaction ou d’une confiance restaurée non documentée.', submit: 'Clôturer le dossier' },
}

export default function Angelcare360ClaimActionStudio({ mode, ticket, schoolId, staff, triggerClassName, triggerLabel }: Props) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState(false)
  const copy = modeCopy[mode]

  async function submit(formData: FormData) {
    setBusy(true); setMessage(null); setError(false)
    const payload: Record<string, unknown> = { schoolId, id: ticket.id }
    if (mode === 'assign') {
      payload.assignedStaffId = String(formData.get('assignedStaffId') || '')
      payload.note = String(formData.get('note') || '').trim() || null
    }
    if (mode === 'status') {
      payload.status = String(formData.get('status') || '')
      payload.note = String(formData.get('note') || '').trim() || null
    }
    if (mode === 'resolve' || mode === 'close') {
      payload.resolutionSummary = String(formData.get('resolutionSummary') || '').trim()
      payload.note = String(formData.get('note') || '').trim() || null
    }
    try {
      const response = await fetch('/api/angelcare360/claims', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ entity: 'claim', operation: mode, id: ticket.id, payload }) })
      const result = await response.json().catch(() => null)
      if (!response.ok || !result?.ok) throw new Error(result?.error || 'Action impossible.')
      setMessage('Action enregistrée dans l’autorité Réclamations.')
      router.refresh()
      setTimeout(() => setOpen(false), 550)
    } catch (cause) {
      setError(true); setMessage(cause instanceof Error ? cause.message : 'Action impossible.')
    } finally { setBusy(false) }
  }

  const Icon = mode === 'assign' ? UserRoundCheck : mode === 'status' ? Workflow : mode === 'resolve' ? CheckCircle2 : LockKeyhole
  return <>
    <button type="button" className={triggerClassName || styles.secondaryButton} onClick={() => setOpen(true)}><Icon size={14} />{triggerLabel || copy.submit}</button>
    {open ? <div className={styles.overlay} role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setOpen(false) }}>
      <section className={styles.sheet} role="dialog" aria-modal="true" aria-labelledby={`claim-${mode}-title`}>
        <header className={styles.sheetHero}><div><div className={styles.eyebrow}>{copy.eyebrow}</div><h2 id={`claim-${mode}-title`}>{copy.title}</h2><p>{copy.description}</p></div><button className={styles.closeButton} type="button" onClick={() => setOpen(false)} aria-label="Fermer"><X size={17} /></button></header>
        <form action={submit}>
          <div className={styles.sheetForm}>
            <section className={styles.formSection}><h3>{ticket.reclamation_code} · {ticket.subject}</h3><p>État actuel : {claimStatusLabel(ticket.status)} · Priorité : {ticket.priority}</p>
              {mode === 'assign' ? <div className={styles.formGrid}><label className={styles.field} data-span="2"><span>Responsable</span>{staff.length ? <select className={styles.select} name="assignedStaffId" required defaultValue={ticket.assigned_staff_id || ''}><option value="" disabled>Choisir un membre autorisé</option>{staff.map((person) => <option key={person.id} value={person.id}>{person.full_name} · {person.staff_code}{person.department ? ` · ${person.department}` : ''}</option>)}</select> : <input className={styles.input} name="assignedStaffId" required defaultValue={ticket.assigned_staff_id || ''} placeholder="Identifiant canonique du personnel" />}<small className={styles.helper}>{staff.length ? 'La liste provient de l’autorité Personnel accessible au rôle courant.' : 'La liste Personnel n’est pas accessible avec les permissions courantes ; le backend accepte toujours un identifiant canonique autorisé.'}</small></label><label className={styles.field} data-span="2"><span>Note de passation</span><textarea className={styles.textarea} name="note" placeholder="Contexte utile au responsable, jamais une conclusion non vérifiée." /></label></div> : null}
              {mode === 'status' ? <div className={styles.formGrid}><label className={styles.field} data-span="2"><span>Nouvelle étape</span><select className={styles.select} name="status" required defaultValue={String(ticket.status)}><option value="new">Signal reçu</option><option value="in_review">Compréhension</option><option value="assigned">Responsabilité engagée</option><option value="waiting_parent">En attente famille</option><option value="waiting_internal">En attente interne</option><option value="resolved">Résolution enregistrée</option><option value="closed">Dossier clos</option><option value="archived">Archivé</option></select></label><label className={styles.field} data-span="2"><span>Motif / note</span><textarea className={styles.textarea} name="note" placeholder="Pourquoi cette transition est-elle justifiée ?" /></label></div> : null}
              {mode === 'resolve' || mode === 'close' ? <div className={styles.formGrid}><label className={styles.field} data-span="2"><span>Résumé de résolution</span><textarea className={styles.textarea} name="resolutionSummary" required defaultValue={ticket.resolution_summary || ''} placeholder="Décrire ce qui a été établi, corrigé et vérifié opérationnellement." /></label><label className={styles.field} data-span="2"><span>Note protégée</span><textarea className={styles.textarea} name="note" defaultValue={ticket.resolution_notes || ''} placeholder="Contexte interne complémentaire." /></label></div> : null}
            </section>
            {(mode === 'resolve' || mode === 'close') ? <section className={styles.formSection}><h3>Vérité de clôture</h3><p>Le backend confirme une résolution ou une fermeture. Il ne contient pas, dans ce dossier, une preuve canonique de satisfaction famille ou de « confiance restaurée ».</p><div className={styles.truthLock}><LockKeyhole size={14} />La certification ne créera aucun score émotionnel, accusé de réception ou confirmation famille fictive.</div></section> : null}
            {message ? <div className={styles.formMessage} data-error={error}>{message}</div> : null}
          </div>
          <footer className={styles.formFooter}><button className={styles.secondaryButton} type="button" onClick={() => setOpen(false)}>Annuler</button><button className={mode === 'close' ? styles.dangerButton : styles.primaryButton} type="submit" disabled={busy}>{busy ? 'Enregistrement…' : copy.submit}</button></footer>
        </form>
      </section>
    </div> : null}
  </>
}
