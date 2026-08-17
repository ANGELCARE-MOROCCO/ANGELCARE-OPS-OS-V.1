'use client'

import Link from 'next/link'
import styles from './TrustResolutionOS.module.css'
import { claimAge, claimPriorityLabel, claimStatusLabel } from './claimPresentation'

type Row = Record<string, any>
const priorities = ['urgent', 'high', 'normal', 'low'] as const
const buckets = [
  { key: 'today', label: '< 24 heures', match: (hours: number | null) => hours !== null && hours < 24 },
  { key: 'recent', label: '1 à 3 jours', match: (hours: number | null) => hours !== null && hours >= 24 && hours < 72 },
  { key: 'aged', label: '> 3 jours', match: (hours: number | null) => hours !== null && hours >= 72 },
  { key: 'unknown', label: 'Date non documentée', match: (hours: number | null) => hours === null },
]

export default function Angelcare360ClaimPriorityWorkspace({ tickets }: { tickets: Row[] }) {
  return <section className={styles.workspacePanel}>
    <div className={styles.panelHead}><div><div className={styles.eyebrow}>TIME HORIZON</div><h2>Priorité × ancienneté</h2><p>La matrice combine uniquement la priorité persistée et l’âge réel du dossier. Aucun SLA contractuel n’est affiché si aucune échéance canonique n’existe.</p></div><div className={styles.panelMeta}>{tickets.length} dossier(s)</div></div>
    <div className={styles.priorityMatrix}><div className={styles.priorityGrid}>
      <div className={styles.matrixCorner}>Priorité / âge</div>{buckets.map((bucket) => <div className={styles.matrixCol} key={bucket.key}>{bucket.label}</div>)}
      {priorities.flatMap((priority) => {
        const row: React.ReactNode[] = [<div key={`${priority}-label`} className={styles.matrixRowLabel} data-priority={priority}>{claimPriorityLabel(priority)}</div>]
        buckets.forEach((bucket) => {
          const cell = tickets.filter((ticket) => String(ticket.priority) === priority && bucket.match(claimAge(ticket.created_at).hours))
          row.push(<div className={styles.matrixCell} key={`${priority}-${bucket.key}`}>{cell.map((ticket, index) => <Link className={styles.matrixTicket} href={`/angelcare-360-command-center/reclamations/tickets/${String(ticket.id)}`} key={String(ticket.id || index)}><strong>{String(ticket.subject || ticket.reclamation_code || 'Dossier')}</strong><span>{claimStatusLabel(ticket.status)} · {claimAge(ticket.created_at).label}</span></Link>)}</div>)
        })
        return row
      })}
    </div></div>
  </section>
}
