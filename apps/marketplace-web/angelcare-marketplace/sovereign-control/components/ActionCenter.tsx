'use client'

import { useState } from 'react'
import type { ApiSuccess } from '../../domain/types'
import type { ActionItem } from '../types'
import styles from '../sovereign.module.css'

export function ActionCenter({ initialActions }: { initialActions: ActionItem[] }) {
  const [actions, setActions] = useState(initialActions)
  const [busyId, setBusyId] = useState('')
  async function transition(item: ActionItem, status: ActionItem['status']) {
    setBusyId(item.id)
    try {
      const response = await fetch(`/api/angelcare-marketplace/backoffice/actions/${item.id}`, { method: 'PATCH', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ status }) })
      const payload = await response.json() as ApiSuccess<ActionItem> | { error?: { message?: string } }
      if (response.ok && 'data' in payload) setActions((rows) => rows.map((row) => row.id === item.id ? payload.data : row))
    } finally { setBusyId('') }
  }
  return <div className={styles.tableWrap}><table className={styles.table}><thead><tr><th>Action</th><th>Objet</th><th>Priorité</th><th>Statut</th><th>Échéance</th><th>Prochaine étape</th><th>Commande</th></tr></thead><tbody>{actions.map((item) => <tr key={item.id}><td><strong>{item.title}</strong><br /><small>{item.public_reference}</small></td><td>{item.object_type || 'Interne'}</td><td><span className={styles.priority} data-priority={item.priority}>{item.priority}</span></td><td><span className={styles.status} data-status={item.status}>{item.status}</span></td><td>{item.due_at ? new Date(item.due_at).toLocaleDateString('fr-FR') : 'Non définie'}</td><td>{item.blocker || item.next_action || 'À préciser'}</td><td>{item.status !== 'completed' ? <button className={styles.secondaryButton} disabled={busyId === item.id} onClick={() => void transition(item, item.status === 'open' ? 'in_progress' : 'completed')}>{item.status === 'open' ? 'Prendre' : 'Clôturer'}</button> : 'Terminé'}</td></tr>)}</tbody></table></div>
}
