'use client'
import { useMemo,useState } from 'react'
import Link from 'next/link'
import styles from './MaterialCommand.module.css'
import type { MaterialIntegrityStatus,MaterialItem,MaterialMovement } from '@/types/angelcare360/material-control'
import { formatDate } from './MaterialCommandShell'
import { MovementStudio } from './MovementStudio'

export function MovementCommand({schoolId,items,movements,integrity}:{schoolId:string;items:MaterialItem[];movements:MaterialMovement[];integrity:MaterialIntegrityStatus}){
 const [search,setSearch]=useState('');const[type,setType]=useState('all');const filtered=useMemo(()=>movements.filter(m=>{const q=search.toLowerCase().trim();return(!q||[m.movementCode,m.itemCode||'',m.itemLabel||'',m.notes||'',m.referenceType||''].some(v=>v.toLowerCase().includes(q)))&&(type==='all'||m.movementType===type)}),[movements,search,type])
 return <div className={styles.split}><section className={styles.sectionPanel}><div className={styles.toolbar}><div className={styles.search}><input aria-label="Rechercher les mouvements" value={search} onChange={e=>setSearch(e.target.value)} placeholder="Mouvement, article, référence, note…"/></div><select className={styles.filterSelect} value={type} onChange={e=>setType(e.target.value)}><option value="all">Tous mouvements</option><option value="in">Entrées</option><option value="out">Sorties</option><option value="adjust">Ajustements</option><option value="transfer">Transferts</option><option value="loss">Pertes</option><option value="damage">Dommages</option></select></div><div className={styles.timeline}>{filtered.map(m=><Link href={`/angelcare-360-command-center/inventaire/mouvements/${m.id}`} className={styles.timelineItem} key={m.id} style={{textDecoration:'none',color:'inherit'}}><div className={styles.timelineTime}>{formatDate(m.createdAt)}<br/>{m.movementCode}</div><div className={styles.timelineBody}><span className={styles.movementType} data-type={m.movementType}>{m.movementType}</span><strong style={{display:'block',marginTop:6}}>{m.itemLabel||m.itemCode||'Article'}</strong><p>{m.quantity} · {m.notes||'Aucune note'} · {m.performerName||'Acteur identifié par UUID/audit'}</p></div></Link>)}</div></section><MovementStudio schoolId={schoolId} items={items} integrity={integrity}/></div>
}
