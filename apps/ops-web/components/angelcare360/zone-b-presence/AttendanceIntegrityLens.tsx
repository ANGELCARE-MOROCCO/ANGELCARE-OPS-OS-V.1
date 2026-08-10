'use client'
import { useMemo, useState } from 'react'
import type { Angelcare360AuditRecord } from '@/types/angelcare360/audit'
import styles from './PresenceZoneBFrame.module.css'
import { dateFr } from './presence-ui'
import { AttendanceHistoryChamber } from './PresenceCommandSurfaces'

export default function AttendanceIntegrityLens({events}:{events:Angelcare360AuditRecord[]}){
 const [query,setQuery]=useState(''); const [history,setHistory]=useState(false)
 const rows=useMemo(()=>events.filter(e=>!query||`${e.action||''} ${e.entity_type||''} ${e.actor_role||''}`.toLowerCase().includes(query.toLowerCase())),[events,query])
 const timeline=rows.slice(0,30).map(e=>({id:e.id,time:dateFr(e.created_at),label:e.action||'Événement de présence',detail:[e.entity_type,e.severity].filter(Boolean).join(' · ')}))
 return <div className={styles.page} data-zone-b-page="audit"><section className={styles.crown}><div className={styles.crownTop}><div><h2 className={styles.crownTitle}>Attendance Integrity Lens</h2><p className={styles.crownSub}>Qui a changé quoi, quand et sur quel objet de présence — sans transformer l’audit en tableau technique illisible.</p></div><div className={styles.contextPills}><span className={styles.pillBlue}>{events.length} événement(s)</span><button className={styles.secondaryButton} onClick={()=>setHistory(true)}>Vue chronologique</button></div></div></section>
 <div className={styles.filters}><input className={styles.input} value={query} onChange={(e)=>setQuery(e.target.value)} placeholder="Rechercher une action ou un type d’événement…"/></div><section className={styles.panel}><div className={styles.panelHeader}><div><div className={styles.panelEyebrow}>Historique</div><h3 className={styles.panelTitle}>Événements de présence</h3></div></div><div className={styles.timeline}>{rows.length?rows.slice(0,100).map(e=><div className={styles.timelineRow} key={e.id}><span className={styles.timelineDot}/><div className={styles.timelineCard}><strong>{e.action||'Événement'}</strong><span>{[e.entity_type,e.actor_role,e.severity].filter(Boolean).join(' · ')||'Contexte audité'}</span></div><span className={styles.timelineTime}>{dateFr(e.created_at)}</span></div>):<div className={styles.empty}><strong className={styles.emptyTitle}>Aucun événement historique</strong><p className={styles.emptyText}>Les opérations auditées apparaîtront ici lorsqu’elles existent.</p></div>}</div></section><AttendanceHistoryChamber open={history} onClose={()=>setHistory(false)} title="Historique Présences" events={timeline}/></div>
}
