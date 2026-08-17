'use client'

import Link from 'next/link'
import styles from './TrustResolutionOS.module.css'
import { claimAge, claimPriorityLabel, claimStatusLabel } from './claimPresentation'

type Row = Record<string, any>

const lanes = [
  { key: 'unassigned', label: 'À attribuer', match: (r: Row) => !r.assigned_staff_id && !['closed', 'archived'].includes(String(r.status)) },
  { key: 'owned', label: 'Responsabilité active', match: (r: Row) => Boolean(r.assigned_staff_id) && ['new', 'in_review', 'assigned'].includes(String(r.status)) },
  { key: 'waiting', label: 'En dépendance', match: (r: Row) => ['waiting_parent', 'waiting_internal'].includes(String(r.status)) },
  { key: 'recovery', label: 'Résolution / clôture', match: (r: Row) => ['resolved', 'closed', 'archived'].includes(String(r.status)) },
]

export default function Angelcare360ClaimAssignmentsWorkspace({ assignments }: { assignments: Row[] }) {
  return <section className={styles.workspacePanel}>
    <div className={styles.panelHead}><div><div className={styles.eyebrow}>RESPONSIBILITY COMMAND</div><h2>Carte de responsabilité</h2><p>Une lecture factuelle de la charge : non attribué, pris en charge, en dépendance et résolu. Aucun taux de performance individuel n’est inventé.</p></div><div className={styles.panelMeta}>{assignments.length} dossier(s)</div></div>
    <div className={styles.assignmentBoard}>
      {lanes.map((lane) => { const rows = assignments.filter(lane.match); return <div className={styles.assignmentLane} key={lane.key}><div className={styles.assignmentLaneHead}><span>{lane.label}</span><b>{rows.length}</b></div>{rows.map((row, index) => <Link href={`/angelcare-360-command-center/reclamations/tickets/${String(row.id)}`} className={styles.assignmentItem} key={String(row.id || index)} style={{ textDecoration: 'none' }}><strong>{String(row.subject || row.reclamation_code || 'Dossier')}</strong><span>{claimPriorityLabel(row.priority)} · {claimStatusLabel(row.status)}</span><span>{row.assigned_staff_id ? `Responsable ${String(row.assigned_staff_id).slice(0, 10)}…` : 'Responsabilité non attribuée'}</span><span>{claimAge(row.created_at).label}</span></Link>)}{!rows.length ? <div className={styles.truthLock}>Aucun dossier dans cette colonne.</div> : null}</div> })}
    </div>
  </section>
}
