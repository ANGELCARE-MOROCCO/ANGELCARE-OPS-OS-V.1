'use client'

import { useMemo, useState } from 'react'
import type { Angelcare360AuditRecord } from '@/types/angelcare360/audit'
import styles from './TrustResolutionOS.module.css'
import { formatClaimDate, humanizeClaimAction } from './claimPresentation'

export default function Angelcare360ClaimAuditDrawer({ events }: { events: Angelcare360AuditRecord[] }) {
  const [search, setSearch] = useState('')
  const [severity, setSeverity] = useState('all')
  const filtered = useMemo(() => events.filter((event) => {
    const haystack = [event.action, event.entity_type, event.entity_id, event.actor_role, event.severity].join(' ').toLowerCase()
    return (!search.trim() || haystack.includes(search.trim().toLowerCase())) && (severity === 'all' || event.severity === severity)
  }), [events, search, severity])

  return <section className={styles.auditPanel}>
    <div className={styles.panelHead}><div><div className={styles.eyebrow}>FORENSIC CHRONOLOGY</div><h2>Mémoire d’audit</h2><p>Attribution, transitions, résolution et clôture restent retraçables à partir du journal canonique de l’établissement.</p></div><div className={styles.panelMeta}>{filtered.length} événement(s)</div></div>
    <div className={styles.auditToolbar}><input className={styles.searchField} value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Action, entité, acteur…" /><select className={styles.selectField} value={severity} onChange={(e) => setSeverity(e.target.value)}><option value="all">Toutes gravités</option><option value="debug">Debug</option><option value="info">Information</option><option value="notice">Notice</option><option value="warning">Warning</option><option value="critical">Critical</option></select></div>
    <div className={styles.auditTimeline}>{filtered.length ? filtered.map((event) => <div className={styles.auditEvent} key={event.id}><div className={styles.auditDot} data-severity={event.severity} /><article className={styles.auditCard}><div className={styles.auditTop}><strong>{humanizeClaimAction(event.action)}</strong><span>{formatClaimDate(event.created_at)}</span></div><div className={styles.auditMeta}><span>{event.severity}</span><span>{event.entity_type || 'Entité non renseignée'}</span><span>{event.entity_id || 'Sans identifiant'}</span><span>{event.actor_role || 'Acteur protégé'}</span></div></article></div>) : <div className={styles.truthLock}>Aucun événement d’audit ne correspond à cette vue.</div>}</div>
  </section>
}
