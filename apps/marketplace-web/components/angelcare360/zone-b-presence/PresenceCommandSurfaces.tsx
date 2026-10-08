'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useMemo, useState, useTransition } from 'react'
import type { Angelcare360AttendanceJustificationListRecord, Angelcare360AttendanceRecordListRecord, Angelcare360AttendanceSheetRecord } from '@/types/angelcare360/attendance'
import PresenceOverlay from './PresenceOverlay'
import styles from './PresenceZoneBFrame.module.css'
import { attendanceLabel, dateFr, initials, justificationLabel, statusTone, timeFr } from './presence-ui'

type MutationResult = { ok?: boolean; error?: string | null; warning?: string | null }

async function mutate(entity: string, operation: string, payload: Record<string, unknown>, id?: string) {
  const response = await fetch('/api/angelcare360/attendance', { method:'POST', headers:{'content-type':'application/json'}, body:JSON.stringify({entity,operation,id,payload}) })
  const json = await response.json().catch(() => ({ ok:false, error:'Réponse serveur illisible.' })) as MutationResult
  if (!response.ok || !json.ok) throw new Error(json.error || 'L’opération n’a pas pu être enregistrée.')
  return json
}

function TonePill({ value, label }: { value?: string | null; label?: string }) {
  const tone = statusTone(value)
  const cls = tone === 'green' ? styles.pillGreen : tone === 'red' ? styles.pillRed : tone === 'amber' ? styles.pillAmber : styles.pillBlue
  return <span className={cls}>{label || attendanceLabel(value)}</span>
}

function Definition({ label, children }: { label:string; children:React.ReactNode }) {
  return <dl className={styles.definition}><dt>{label}</dt><dd>{children}</dd></dl>
}

function MutationFooter({ busy, error, success, children }: { busy:boolean; error:string; success:string; children:React.ReactNode }) {
  return <><div>{error ? <span className={styles.error}>{error}</span> : success ? <span className={styles.success}>{success}</span> : null}</div><div style={{display:'flex',gap:8,justifyContent:'flex-end',flexWrap:'wrap',opacity:busy ? .65 : 1}}>{children}</div></>
}

export function StudentAttendanceQuickPeek({ open, onClose, record }: { open:boolean; onClose:()=>void; record: Angelcare360AttendanceRecordListRecord | Angelcare360AttendanceSheetRecord | null }) {
  if (!record) return null
  const isSheet = 'studentFullName' in record
  const name = isSheet ? record.studentFullName : record.student_full_name
  const studentId = isSheet ? record.studentId : record.student_id
  const className = isSheet ? record.className : record.class_name
  const sectionName = isSheet ? record.sectionName : record.section_name
  const status = isSheet ? record.attendanceStatus : record.attendance_status
  const late = isSheet ? record.minutesLate : record.minutes_late
  return <PresenceOverlay open={open} onClose={onClose} eyebrow="Élève · Présence" title={name || 'Élève'} description="Contexte opérationnel de présence, sans dupliquer le Dossier Élève 360.">
    <div className={styles.section}><div style={{display:'flex',gap:12,alignItems:'center'}}><div className={styles.avatar}>{initials(name)}</div><div><strong>{name || 'Élève'}</strong><div className={styles.cellMuted}>{[className,sectionName].filter(Boolean).join(' · ') || 'Classe non renseignée'}</div></div><TonePill value={String(status || '')}/></div></div>
    <div className={styles.definitionGrid}><Definition label="État aujourd’hui">{attendanceLabel(String(status || ''))}</Definition><Definition label="Retard">{late ? `${late} min` : 'Aucun'}</Definition></div>
    <div className={styles.section}><h3 className={styles.sectionTitle}>Continuer dans le bon dossier</h3><Link className={styles.primaryButton} href={`/angelcare-360-command-center/eleves/${studentId}?source=presences`}>Ouvrir Élève 360</Link></div>
  </PresenceOverlay>
}

export function ClassPresenceQuickCommand({ open, onClose, className, classId, date, expected, present, absent, late }: { open:boolean; onClose:()=>void; className:string; classId:string; date:string; expected:number; present:number; absent:number; late:number }) {
  return <PresenceOverlay open={open} onClose={onClose} eyebrow="Classe · Commande rapide" title={className} description="Lecture rapide de la réalité de présence avant d’ouvrir le dossier complet.">
    <div className={styles.metricGrid} style={{gridTemplateColumns:'repeat(4,minmax(100px,1fr))'}}><div className={styles.metric}><span className={styles.metricLabel}>Attendus</span><strong className={styles.metricValue}>{expected}</strong></div><div className={styles.metric}><span className={styles.metricLabel}>Présents</span><strong className={styles.metricValue}>{present}</strong></div><div className={styles.metric}><span className={styles.metricLabel}>Absents</span><strong className={styles.metricValue}>{absent}</strong></div><div className={styles.metric}><span className={styles.metricLabel}>Retards</span><strong className={styles.metricValue}>{late}</strong></div></div>
    <Link className={styles.primaryButton} href={`/angelcare-360-command-center/presences/classes/${classId}?date=${date}`}>Ouvrir le dossier de classe</Link>
  </PresenceOverlay>
}

export function ArrivalDetailDrawer({ open, onClose, record }: { open:boolean; onClose:()=>void; record:Angelcare360AttendanceRecordListRecord|null }) {
  if (!record) return null
  return <PresenceOverlay open={open} onClose={onClose} eyebrow="Arrivée" title={record.student_full_name || 'Arrivée enregistrée'} description="Heure d’arrivée et état associé dans le registre canonique."><div className={styles.definitionGrid}><Definition label="Arrivée">{timeFr(record.check_in_at || record.recorded_at)}</Definition><Definition label="État">{attendanceLabel(record.attendance_status)}</Definition><Definition label="Classe">{record.class_name || '—'}</Definition><Definition label="Retard">{record.minutes_late ? `${record.minutes_late} min` : 'Non'}</Definition></div>{record.note ? <div className={styles.section}><h3 className={styles.sectionTitle}>Note</h3><p>{record.note}</p></div> : null}</PresenceOverlay>
}

export function DepartureDetailDrawer({ open, onClose, record }: { open:boolean; onClose:()=>void; record:Angelcare360AttendanceRecordListRecord|null }) {
  if (!record) return null
  return <PresenceOverlay open={open} onClose={onClose} eyebrow="Départ" title={record.student_full_name || 'Départ'} description="Lecture du départ enregistré. Les autorisations de récupération restent sous l’autorité Famille 360."><div className={styles.definitionGrid}><Definition label="Départ">{timeFr(record.check_out_at)}</Definition><Definition label="État">{attendanceLabel(record.attendance_status)}</Definition><Definition label="Classe">{record.class_name || '—'}</Definition><Definition label="Date">{dateFr(record.session_date)}</Definition></div><Link className={styles.secondaryButton} href={`/angelcare-360-command-center/familles?student=${record.student_id}&source=presences`}>Voir l’autorité familiale</Link></PresenceOverlay>
}

export function AbsenceVerificationDrawer({ open, onClose, record, schoolId, canUpdate }: { open:boolean; onClose:()=>void; record:Angelcare360AttendanceRecordListRecord|null; schoolId:string; canUpdate:boolean }) {
  const router = useRouter(); const [pending,start]=useTransition(); const [reason,setReason]=useState(''); const [category,setCategory]=useState('absence'); const [error,setError]=useState(''); const [success,setSuccess]=useState('')
  if (!record) return null
  const create = () => { if (!record.id || !reason.trim()) { setError('Ajoutez l’explication reçue avant de créer la justification.'); return } ; setError(''); start(async()=>{ try { await mutate('justification','create',{schoolId,attendanceRecordId:record.id,justificationCode:`JUS-${Date.now().toString(36).toUpperCase()}`,reasonCategory:category,description:reason.trim(),status:'pending'}); setSuccess('Justification créée et placée à l’examen.'); router.refresh() } catch(e){setError(e instanceof Error?e.message:'Échec de l’opération.')} }) }
  return <PresenceOverlay open={open} onClose={onClose} dirty={Boolean(reason)} eyebrow="Absence · Vérification" title={record.student_full_name || 'Absence'} description="Séparer le fait d’absence, l’explication de la famille et la décision de l’établissement." footer={<MutationFooter busy={pending} error={error} success={success}>{canUpdate ? <button className={styles.primaryButton} disabled={pending} onClick={create}>Créer la justification à examiner</button> : null}</MutationFooter>}>
    <div className={styles.definitionGrid}><Definition label="Date">{dateFr(record.session_date)}</Definition><Definition label="Classe">{record.class_name || '—'}</Definition><Definition label="État enregistré">{attendanceLabel(record.attendance_status)}</Definition><Definition label="Justification">{justificationLabel(record.justification_status)}</Definition></div>
    {canUpdate ? <div className={styles.section}><h3 className={styles.sectionTitle}>Explication reçue</h3><select className={styles.select} value={category} onChange={(e)=>setCategory(e.target.value)}><option value="absence">Absence</option><option value="medical">Santé / médical</option><option value="family">Motif familial</option><option value="transport">Transport</option><option value="administrative">Administratif</option><option value="other">Autre</option></select><textarea className={styles.input} style={{minHeight:110,marginTop:8,width:'100%'}} value={reason} onChange={(e)=>setReason(e.target.value)} placeholder="Décrire fidèlement l’explication fournie…" /></div> : <div className={styles.warning}>Vous pouvez consulter cette absence, mais vous n’avez pas l’autorisation de créer une justification.</div>}
    <div className={styles.section}><Link className={styles.secondaryButton} href={`/angelcare-360-command-center/relation-parents?student=${record.student_id}&source=presence-absence`}>Créer / ouvrir le suivi famille</Link></div>
  </PresenceOverlay>
}

export function LateArrivalDrawer({ open, onClose, record }: { open:boolean; onClose:()=>void; record:Angelcare360AttendanceRecordListRecord|null }) {
  if (!record) return null
  return <PresenceOverlay open={open} onClose={onClose} eyebrow="Arrivée tardive" title={record.student_full_name || 'Retard'} description="Le retard est présenté comme un fait horaire, jamais comme une étiquette comportementale."><div className={styles.definitionGrid}><Definition label="Date">{dateFr(record.session_date)}</Definition><Definition label="Retard">{record.minutes_late ? `${record.minutes_late} min` : 'Durée non renseignée'}</Definition><Definition label="Classe">{record.class_name || '—'}</Definition><Definition label="Justification">{justificationLabel(record.justification_status)}</Definition></div>{record.note ? <div className={styles.section}><h3 className={styles.sectionTitle}>Motif enregistré</h3><p>{record.note}</p></div>:null}<div className={styles.section}><Link className={styles.secondaryButton} href={`/angelcare-360-command-center/transport/affectations?student=${record.student_id}&source=presences`}>Vérifier Transport</Link> <Link className={styles.secondaryButton} href={`/angelcare-360-command-center/relation-parents?student=${record.student_id}&source=presence-retard`}>Suivi famille</Link></div></PresenceOverlay>
}

export function EarlyDepartureDrawer({ open,onClose,record }: {open:boolean;onClose:()=>void;record:Angelcare360AttendanceRecordListRecord|null}) {
  if(!record)return null
  return <PresenceOverlay open={open} onClose={onClose} eyebrow="Sortie anticipée" title={record.student_full_name||'Sortie anticipée'} description="Le départ anticipé reste lié au relevé de présence ; l’autorité de récupération reste dans Famille 360."><div className={styles.definitionGrid}><Definition label="Date">{dateFr(record.session_date)}</Definition><Definition label="Départ">{timeFr(record.check_out_at)}</Definition><Definition label="Classe">{record.class_name||'—'}</Definition><Definition label="État">{attendanceLabel(record.attendance_status)}</Definition></div><div className={styles.section}><Link className={styles.secondaryButton} href={`/angelcare-360-command-center/familles?student=${record.student_id}&source=early-departure`}>Vérifier responsable autorisé</Link></div></PresenceOverlay>
}

export function MissingCheckoutResolutionDrawer({open,onClose,record}:{open:boolean;onClose:()=>void;record:Angelcare360AttendanceRecordListRecord|null}){
  if(!record)return null
  return <PresenceOverlay open={open} onClose={onClose} kind="chamber" eyebrow="Intégrité de journée" title="Départ à confirmer" description="L’absence d’un checkout ne prouve pas que l’enfant est encore dans l’établissement."><div className={styles.warning}>Aucun départ canonique n’est enregistré pour ce relevé. Vérifiez la réalité avant toute correction.</div><div className={styles.definitionGrid}><Definition label="Élève">{record.student_full_name||'—'}</Definition><Definition label="Classe">{record.class_name||'—'}</Definition><Definition label="Arrivée">{timeFr(record.check_in_at||record.recorded_at)}</Definition><Definition label="Dernier état">{attendanceLabel(record.attendance_status)}</Definition></div><div className={styles.section}><Link className={styles.secondaryButton} href={`/angelcare-360-command-center/transport/affectations?student=${record.student_id}&source=missing-checkout`}>Vérifier Transport</Link> <Link className={styles.secondaryButton} href={`/angelcare-360-command-center/familles?student=${record.student_id}&source=missing-checkout`}>Vérifier récupération</Link></div></PresenceOverlay>
}

export function JustificationDecisionChamber({open,onClose,item,schoolId,canApprove}:{open:boolean;onClose:()=>void;item:Angelcare360AttendanceJustificationListRecord|null;schoolId:string;canApprove:boolean}){
  const router=useRouter(); const [pending,start]=useTransition(); const [reason,setReason]=useState(''); const [error,setError]=useState(''); const [success,setSuccess]=useState('')
  if(!item)return null
  const decide=(decision:'accepted'|'rejected')=>{ if(decision==='rejected'&&!reason.trim()){setError('Le motif du refus est obligatoire.');return} setError(''); start(async()=>{try{await mutate('justification','decision',{schoolId,id:item.id,decision,decisionReason:reason.trim()||null},item.id);setSuccess(decision==='accepted'?'Justification validée.':'Justification refusée avec motif.');router.refresh()}catch(e){setError(e instanceof Error?e.message:'Échec de la décision.')}})}
  return <PresenceOverlay open={open} onClose={onClose} kind="chamber" dirty={Boolean(reason)} eyebrow="Justification · Décision" title={item.student_full_name||'Justification'} description="L’explication de la famille, la preuve et la décision école restent distinctes." footer={<MutationFooter busy={pending} error={error} success={success}>{canApprove?<><button className={styles.secondaryButton} disabled={pending} onClick={()=>decide('rejected')}>Refuser avec motif</button><button className={styles.primaryButton} disabled={pending} onClick={()=>decide('accepted')}>Valider la justification</button></>:null}</MutationFooter>}>
    <div className={styles.definitionGrid}><Definition label="Date d’absence">{dateFr(item.session_date)}</Definition><Definition label="État de présence">{attendanceLabel(item.attendance_status)}</Definition><Definition label="Catégorie">{item.reason_category}</Definition><Definition label="Décision actuelle">{justificationLabel(item.decision)}</Definition></div><div className={styles.section}><h3 className={styles.sectionTitle}>Explication fournie</h3><p>{item.description}</p></div>{item.evidence_document_id?<div className={styles.success}>Une référence de preuve est liée à cette justification.</div>:<div className={styles.warning}>Aucune preuve documentaire n’est liée à cette justification.</div>}{canApprove?<div className={styles.section}><h3 className={styles.sectionTitle}>Motif / commentaire de décision</h3><textarea className={styles.input} style={{minHeight:100,width:'100%'}} value={reason} onChange={(e)=>setReason(e.target.value)} placeholder="Préciser si nécessaire, obligatoire en cas de refus…" /></div>:null}
  </PresenceOverlay>
}

export function AttendanceCorrectionChamber({open,onClose,record,schoolId,canUpdate}:{open:boolean;onClose:()=>void;record:Angelcare360AttendanceRecordListRecord|null;schoolId:string;canUpdate:boolean}){
  const router=useRouter(); const [status,setStatus]=useState('present'); const [note,setNote]=useState(''); const [minutes,setMinutes]=useState(''); const [pending,start]=useTransition(); const [error,setError]=useState(''); const [success,setSuccess]=useState('')
  if(!record)return null
  const submit=()=>{setError('');start(async()=>{try{await mutate('record','update',{schoolId,attendanceSessionId:record.attendance_session_id,studentId:record.student_id,attendanceStatus:status,minutesLate:status==='late'?Number(minutes||0):null,note:note.trim()||null,justificationRequired:status==='absent'||status==='late'});setSuccess('Correction enregistrée dans le registre avec traçabilité.');router.refresh()}catch(e){setError(e instanceof Error?e.message:'Correction impossible.')}})}
  return <PresenceOverlay open={open} onClose={onClose} kind="chamber" dirty={Boolean(note)||status!==record.attendance_status} eyebrow="Correction de présence" title={record.student_full_name||'Relevé'} description="La correction modifie l’état canonique sans effacer la trace précédente." footer={<MutationFooter busy={pending} error={error} success={success}>{canUpdate?<button className={styles.primaryButton} disabled={pending} onClick={submit}>Enregistrer la correction</button>:null}</MutationFooter>}><div className={styles.definitionGrid}><Definition label="État actuel">{attendanceLabel(record.attendance_status)}</Definition><Definition label="Date">{dateFr(record.session_date)}</Definition></div>{canUpdate?<div className={styles.section}><h3 className={styles.sectionTitle}>État proposé</h3><select className={styles.select} value={status} onChange={(e)=>setStatus(e.target.value)}><option value="present">Présent</option><option value="absent">Absent</option><option value="late">Retard</option><option value="excused">Absence autorisée</option><option value="left_early">Sortie anticipée</option><option value="unknown">À vérifier</option></select>{status==='late'?<input className={styles.input} type="number" min="1" value={minutes} onChange={(e)=>setMinutes(e.target.value)} placeholder="Minutes de retard" />:null}<textarea className={styles.input} style={{minHeight:90,width:'100%',marginTop:8}} value={note} onChange={(e)=>setNote(e.target.value)} placeholder="Motif factuel de correction…" /></div>:null}</PresenceOverlay>
}

export function DayClosureChamber({open,onClose,date,expected,marked,unresolved,missingCheckout}:{open:boolean;onClose:()=>void;date:string;expected:number;marked:number;unresolved:number;missingCheckout:number}){
 const ready=expected===marked&&unresolved===0&&missingCheckout===0
 return <PresenceOverlay open={open} onClose={onClose} kind="chamber" eyebrow="Clôture journée" title={ready?'Journée prête à clôturer':'Clôture incomplète'} description="La clôture n’est déclarée prête que lorsque les bloqueurs observables sont résolus."><div className={ready?styles.success:styles.warning}>{ready?'Les relevés affichés ne présentent plus de bloqueur de clôture.':'Résolvez les éléments ci-dessous avant de considérer la journée complète.'}</div><div className={styles.definitionGrid}><Definition label="Date">{dateFr(date)}</Definition><Definition label="Pointages">{marked} / {expected}</Definition><Definition label="Absences à vérifier">{unresolved}</Definition><Definition label="Départs à confirmer">{missingCheckout}</Definition></div>{!ready?<div className={styles.section}><Link className={styles.secondaryButton} href={`/angelcare-360-command-center/presences/absences?from=${date}&to=${date}`}>Ouvrir les absences</Link></div>:null}</PresenceOverlay>
}

export function FamilyContactHandoffDrawer({open,onClose,studentId,studentName,matter}:{open:boolean;onClose:()=>void;studentId:string;studentName:string;matter:string}){return <PresenceOverlay open={open} onClose={onClose} eyebrow="Handoff famille" title={`Suivi · ${studentName}`} description="Zone B transporte le contexte ; Area 12 reste l’autorité de relation parent."><div className={styles.section}><p>{matter}</p><Link className={styles.primaryButton} href={`/angelcare-360-command-center/relation-parents?student=${studentId}&source=presences&matter=${encodeURIComponent(matter)}`}>Ouvrir le suivi parent contextualisé</Link></div></PresenceOverlay>}

export function TransportAttendanceConflictDrawer({open,onClose,record}:{open:boolean;onClose:()=>void;record:Angelcare360AttendanceRecordListRecord|null}){if(!record)return null;return <PresenceOverlay open={open} onClose={onClose} eyebrow="Présence × Transport" title="Vérification croisée" description="Cette surface n’invente aucune présence à partir du transport ; elle ouvre la source exacte à contrôler."><div className={styles.definitionGrid}><Definition label="Élève">{record.student_full_name||'—'}</Definition><Definition label="Présence">{attendanceLabel(record.attendance_status)}</Definition></div><Link className={styles.primaryButton} href={`/angelcare-360-command-center/transport/affectations?student=${record.student_id}&source=presences`}>Ouvrir l’affectation Transport</Link></PresenceOverlay>}

export function AttendanceEvidenceDrawer({open,onClose,item}:{open:boolean;onClose:()=>void;item:Angelcare360AttendanceJustificationListRecord|null}){if(!item)return null;return <PresenceOverlay open={open} onClose={onClose} eyebrow="Preuve" title="Preuve de justification" description="La preuve est une source ; elle ne vaut pas automatiquement décision."><div className={styles.definitionGrid}><Definition label="Justification">{item.justification_code}</Definition><Definition label="Preuve liée">{item.evidence_document_id?'Oui':'Non'}</Definition><Definition label="Décision">{justificationLabel(item.decision)}</Definition></div>{item.evidence_document_id?<div className={styles.success}>Référence documentaire disponible dans le registre canonique.</div>:<div className={styles.warning}>Aucune preuve documentaire liée.</div>}</PresenceOverlay>}

export function AttendanceHistoryChamber({open,onClose,title,events}:{open:boolean;onClose:()=>void;title:string;events:Array<{id:string;time:string;label:string;detail?:string}>}){return <PresenceOverlay open={open} onClose={onClose} kind="chamber" eyebrow="Historique présence" title={title} description="Chronologie des faits disponibles, sans réécriture du passé."><div className={styles.timeline}>{events.length?events.map((event)=><div className={styles.timelineRow} key={event.id}><span className={styles.timelineDot}/><div className={styles.timelineCard}><strong>{event.label}</strong>{event.detail?<span>{event.detail}</span>:null}</div><span className={styles.timelineTime}>{event.time}</span></div>):<div className={styles.empty}><strong className={styles.emptyTitle}>Aucun événement historique disponible</strong><span className={styles.emptyText}>Les changements apparaîtront ici lorsqu’ils existent dans le registre.</span></div>}</div></PresenceOverlay>}

export function PresenceExceptionAssignmentDrawer({open,onClose,title,detail}:{open:boolean;onClose:()=>void;title:string;detail:string}){return <PresenceOverlay open={open} onClose={onClose} eyebrow="Exception · Responsabilité" title={title} description="Préparer la prise en charge sans fabriquer un système de tâches parallèle."><div className={styles.section}><p>{detail}</p><div className={styles.warning}>L’attribution formelle reste disponible uniquement lorsqu’un registre de tâches canonique est exposé à Zone B. Cette surface reste donc informative plutôt que de créer un faux propriétaire.</div></div></PresenceOverlay>}

export { TonePill, Definition }
