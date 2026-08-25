'use client'

import { useMemo, useState, useTransition } from 'react'
import type { FormEvent, ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import type { TrustCase, TrustPersonRef } from '@/types/angelcare360/trust-resolution'
import styles from './TrustResolutionSovereign.module.css'

type Mode = 'create'|'assign'|'note'|'communication'|'update'|'resolve'

async function mutate(payload: Record<string,unknown>) {
  const response = await fetch('/api/angelcare360/trust-resolution', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(payload) })
  const data = await response.json().catch(() => ({}))
  if (!response.ok || data?.ok === false) throw new Error(data?.error || 'L’action n’a pas été enregistrée.')
  return data
}

function toIsoOrNull(value: string | undefined) {
  if (!value) return null
  const parsed = new Date(value)
  return Number.isFinite(parsed.getTime()) ? parsed.toISOString() : null
}

function toLocalDateTimeInput(value: string | null | undefined) {
  if (!value) return ''
  const parsed = new Date(value)
  if (!Number.isFinite(parsed.getTime())) return ''
  const local = new Date(parsed.getTime() - parsed.getTimezoneOffset() * 60000)
  return local.toISOString().slice(0,16)
}

function Field({ label, children, hint }: { label:string; children:ReactNode; hint?:string }) {
  return <label className={styles.field}><span>{label}</span>{children}{hint ? <small>{hint}</small> : null}</label>
}

export function TrustActionButton({ mode, label, item, staff = [], parents = [], students = [] }: { mode:Mode; label:string; item?:TrustCase; staff?:TrustPersonRef[]; parents?:TrustPersonRef[]; students?:TrustPersonRef[] }) {
  const [open,setOpen] = useState(false)
  return <><button type="button" className={styles.actionButton} onClick={() => setOpen(true)}>{label}</button>{open ? <TrustDrawer mode={mode} item={item} staff={staff} parents={parents} students={students} onClose={() => setOpen(false)} /> : null}</>
}

function TrustDrawer({ mode, item, staff, parents, students, onClose }: { mode:Mode; item?:TrustCase; staff:TrustPersonRef[]; parents:TrustPersonRef[]; students:TrustPersonRef[]; onClose:()=>void }) {
  const router = useRouter(); const [pending,startTransition] = useTransition(); const [error,setError] = useState<string|null>(null)
  const title = ({create:'Nouvelle réclamation',assign:'Responsabilité du dossier',note:'Note interne',communication:'Communication enregistrée',update:'Pilotage du dossier',resolve:'Résolution & clôture'} as Record<Mode,string>)[mode]
  const staffOptions = useMemo(() => staff.filter(Boolean), [staff])

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError(null)
    const data = Object.fromEntries(new FormData(event.currentTarget).entries()) as Record<string,string>
    let payload: Record<string,unknown> = { id:item?.id }
    if (mode === 'create') payload = { action:'case.create', subject:data.subject, description:data.description, category:data.category, priority:data.priority, parentId:data.parentId || null, studentId:data.studentId || null, assignedStaffId:data.assignedStaffId || null, nextAction:data.nextAction || null, dueAt:toIsoOrNull(data.dueAt), sourceChannel:data.sourceChannel || 'manual', reporterRole:'parent' }
    if (mode === 'assign') payload = { action:'case.assign', id:item?.id, assignedStaffId:data.assignedStaffId || null, note:data.note || null }
    if (mode === 'note') payload = { action:'case.note', id:item?.id, note:data.note }
    if (mode === 'communication') payload = { action:'case.communication', id:item?.id, channel:data.channel, direction:data.direction, recipientLabel:data.recipientLabel, purpose:data.purpose, note:data.note, deliveryTruth:data.deliveryTruth || 'recorded' }
    if (mode === 'update') payload = { action:'case.update', id:item?.id, status:data.status, priority:data.priority, category:data.category, nextAction:data.nextAction || null, dueAt:toIsoOrNull(data.dueAt), note:data.note || null }
    if (mode === 'resolve') payload = { action:'case.update', id:item?.id, status:data.status || 'resolved', priority:item?.priority, category:item?.category, resolutionSummary:data.resolutionSummary, note:data.resolutionSummary }
    startTransition(async () => { try { await mutate(payload); onClose(); router.refresh() } catch (reason) { setError(reason instanceof Error ? reason.message : 'Action impossible.') } })
  }

  return <div className={styles.drawerBackdrop} role="presentation" onMouseDown={event => { if (event.target === event.currentTarget) onClose() }}>
    <aside className={styles.drawer} role="dialog" aria-modal="true" aria-label={title}>
      <header className={styles.drawerHeader}><div><span className={styles.eyebrow}>Trust Resolution</span><h2>{title}</h2>{item ? <p>{item.code} · {item.subject}</p> : <p>Créer un dossier exploitable immédiatement.</p>}</div><button type="button" className={styles.closeButton} onClick={onClose} aria-label="Fermer">×</button></header>
      <form className={styles.drawerForm} onSubmit={submit}>
        {mode === 'create' ? <>
          <Field label="Objet"><input name="subject" required placeholder="Objet clair de la réclamation" /></Field>
          <Field label="Description"><textarea name="description" required rows={6} placeholder="Faits rapportés, contexte et attente de la famille." /></Field>
          <div className={styles.formGrid}><Field label="Catégorie"><select name="category" defaultValue="general"><option value="general">Général</option><option value="communication">Communication</option><option value="billing">Facturation</option><option value="attendance">Présence</option><option value="teacher">Équipe pédagogique</option><option value="safety">Sécurité</option><option value="transport">Transport</option><option value="quality">Qualité</option><option value="admissions">Admissions</option><option value="other">Autre</option></select></Field><Field label="Priorité"><select name="priority" defaultValue="medium"><option value="low">Faible</option><option value="medium">Moyenne</option><option value="high">Haute</option><option value="urgent">Urgente</option><option value="critical">Critique</option></select></Field></div>
          <div className={styles.formGrid}><Field label="Parent / tuteur"><select name="parentId" defaultValue=""><option value="">Non lié</option>{parents.map(person => <option value={person.id} key={person.id}>{person.label}</option>)}</select></Field><Field label="Élève"><select name="studentId" defaultValue=""><option value="">Non lié</option>{students.map(person => <option value={person.id} key={person.id}>{person.label}</option>)}</select></Field></div>
          <Field label="Responsable"><select name="assignedStaffId" defaultValue=""><option value="">À assigner</option>{staffOptions.map(person => <option value={person.id} key={person.id}>{person.label}</option>)}</select></Field>
          <div className={styles.formGrid}><Field label="Prochaine action"><input name="nextAction" placeholder="Ex. rappeler le parent" /></Field><Field label="Échéance"><input name="dueAt" type="datetime-local" /></Field></div>
          <Field label="Canal source"><select name="sourceChannel" defaultValue="manual"><option value="manual">Saisie interne</option><option value="portal">Portail</option><option value="phone">Téléphone</option><option value="email">Email</option><option value="whatsapp">WhatsApp</option><option value="in_person">En personne</option></select></Field>
        </> : null}
        {mode === 'assign' ? <><Field label="Responsable du dossier"><select name="assignedStaffId" defaultValue={item?.assignedStaff?.id || ''}><option value="">Non assigné</option>{staffOptions.map(person => <option value={person.id} key={person.id}>{person.label}</option>)}</select></Field><Field label="Note d’affectation"><textarea name="note" rows={4} placeholder="Pourquoi cette responsabilité est-elle attribuée ou modifiée ?" /></Field></> : null}
        {mode === 'note' ? <Field label="Note interne" hint="Interne — non visible par la famille"><textarea name="note" required rows={8} placeholder="Observation, coordination, fait vérifié, instruction interne…" /></Field> : null}
        {mode === 'communication' ? <><div className={styles.formGrid}><Field label="Canal"><select name="channel" defaultValue="phone"><option value="phone">Téléphone</option><option value="email">Email</option><option value="whatsapp">WhatsApp</option><option value="sms">SMS</option><option value="portal">Portail</option><option value="in_person">En personne</option><option value="manual">Autre / manuel</option></select></Field><Field label="Direction"><select name="direction" defaultValue="outbound"><option value="outbound">Établissement → famille</option><option value="inbound">Famille → établissement</option><option value="internal">Interne</option></select></Field></div><Field label="Destinataire / interlocuteur"><input name="recipientLabel" defaultValue={item?.reporter?.label || ''} /></Field><Field label="Objet"><input name="purpose" placeholder="Suivi, information, clarification…" /></Field><Field label="Compte rendu"><textarea name="note" rows={6} placeholder="Ce qui a réellement été communiqué ou convenu." /></Field><Field label="Vérité de livraison"><select name="deliveryTruth" defaultValue="recorded"><option value="prepared">Préparé — pas envoyé</option><option value="recorded">Communication enregistrée manuellement</option><option value="unknown">État inconnu / non vérifiable ici</option></select></Field></> : null}
        {mode === 'update' ? <><div className={styles.formGrid}><Field label="Statut"><select name="status" defaultValue={item?.status || 'open'}><option value="new">Nouvelle</option><option value="open">Ouverte</option><option value="in_review">En qualification</option><option value="in_progress">En traitement</option><option value="assigned">Assignée</option><option value="waiting_parent">Attente famille</option><option value="waiting_internal">Attente interne</option><option value="resolved">Résolue</option><option value="closed">Clôturée</option><option value="archived">Archivée</option></select></Field><Field label="Priorité"><select name="priority" defaultValue={item?.priority || 'medium'}><option value="low">Faible</option><option value="normal">Normale</option><option value="medium">Moyenne</option><option value="high">Haute</option><option value="urgent">Urgente</option><option value="critical">Critique</option></select></Field></div><Field label="Catégorie"><input name="category" defaultValue={item?.category || 'general'} /></Field><div className={styles.formGrid}><Field label="Prochaine action"><input name="nextAction" defaultValue={item?.nextAction || ''} /></Field><Field label="Échéance"><input name="dueAt" type="datetime-local" defaultValue={toLocalDateTimeInput(item?.dueAt)} /></Field></div><Field label="Motif / note de changement"><textarea name="note" rows={4} /></Field></> : null}
        {mode === 'resolve' ? <><Field label="État final"><select name="status" defaultValue={item?.status === 'closed' ? 'closed' : 'resolved'}><option value="resolved">Résolue — suivi encore possible</option><option value="closed">Clôturée — dossier finalisé</option><option value="in_progress">Réouvrir / remettre en traitement</option></select></Field><Field label="Synthèse de résolution"><textarea name="resolutionSummary" required rows={8} defaultValue={item?.resolutionSummary || ''} placeholder="Décision, actions réalisées, engagements restants et preuve de clôture." /></Field></> : null}
        {error ? <div className={styles.formError}>{error}</div> : null}
        <footer className={styles.drawerFooter}><button type="button" className={styles.secondaryButton} onClick={onClose}>Annuler</button><button type="submit" className={styles.primaryButton} disabled={pending}>{pending ? 'Enregistrement…' : 'Enregistrer'}</button></footer>
      </form>
    </aside>
  </div>
}
