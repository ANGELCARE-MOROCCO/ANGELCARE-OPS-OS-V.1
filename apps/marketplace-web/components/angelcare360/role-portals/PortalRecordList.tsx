'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'
import type { Angelcare360PortalRecord } from '@/types/angelcare360/role-portals'
import styles from './PortalExperience.module.css'

function haystack(row: Angelcare360PortalRecord) {
  return [row.title,row.subtitle,row.detail,row.status,row.statusLabel,row.date,Object.values(row.meta||{}).join(' ')]
    .filter(Boolean).join(' ').toLocaleLowerCase('fr')
}

function RowContent({row}:{row:Angelcare360PortalRecord}) {
  return <>
    <div>
      <div className={styles.rowTitle}>{row.title}</div>
      {row.subtitle?<div className={styles.rowSubtitle}>{row.subtitle}</div>:null}
      {row.detail?<div className={styles.rowDetail}>{row.detail}</div>:null}
    </div>
    <div className={styles.rowAside}>
      {row.statusLabel||row.status?<span className={`${styles.status} ${styles[`status_${row.tone||'slate'}` as keyof typeof styles]||''}`}>{row.statusLabel||row.status}</span>:null}
      {row.href?<span className={styles.rowAction}>Ouvrir</span>:null}
    </div>
  </>
}

export default function PortalRecordList({rows,emptyLabel='Aucune donnée dans ce périmètre. SANILA n’invente pas de contenu lorsque la source est vide.'}:{rows:Angelcare360PortalRecord[];emptyLabel?:string}) {
  const [query,setQuery]=useState('')
  const [status,setStatus]=useState('all')
  const statuses=useMemo(()=>[...new Set(rows.map(row=>String(row.statusLabel||row.status||'').trim()).filter(Boolean))].sort((a,b)=>a.localeCompare(b,'fr')),[rows])
  const visible=useMemo(()=>{
    const q=query.trim().toLocaleLowerCase('fr')
    return rows.filter(row=>(status==='all'||String(row.statusLabel||row.status||'')===status)&&(!q||haystack(row).includes(q)))
  },[rows,query,status])
  if(!rows.length)return <div className={styles.empty}>{emptyLabel}</div>
  return <>
    {rows.length>12?<div className={styles.recordTools}>
      <label className={styles.searchLabel}>Rechercher<input className={styles.searchInput} value={query} onChange={event=>setQuery(event.target.value)} placeholder="Nom, statut, matière, référence…"/></label>
      {statuses.length>1?<label className={styles.searchLabel}>Statut<select className={styles.searchInput} value={status} onChange={event=>setStatus(event.target.value)}><option value="all">Tous</option>{statuses.map(item=><option key={item} value={item}>{item}</option>)}</select></label>:null}
      <span className={styles.filterCount}>{visible.length} / {rows.length}</span>
    </div>:null}
    <div className={styles.rows}>
      {visible.length?visible.map(row=>row.href?<Link className={`${styles.row} ${styles.rowLink}`} href={row.href} key={row.id}><RowContent row={row}/></Link>:<div className={styles.row} key={row.id}><RowContent row={row}/></div>):<div className={styles.empty}>Aucun résultat ne correspond aux filtres actifs.</div>}
    </div>
  </>
}
