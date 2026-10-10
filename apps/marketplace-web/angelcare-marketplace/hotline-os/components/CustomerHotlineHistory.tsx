 'use client'
import {useEffect,useState} from 'react'
import Link from 'next/link'
import {Headphones,ArrowUpRight} from 'lucide-react'
import {hotlineRequest} from '../client'
import type {SupportCase} from '../types'
import styles from '../hotline.module.css'
export function CustomerHotlineHistory({customerId}:{customerId:string}){const[rows,setRows]=useState<SupportCase[]|null>(null),[error,setError]=useState('');useEffect(()=>{let active=true;hotlineRequest<SupportCase[]>(`cases?customer=${encodeURIComponent(customerId)}`,undefined,true).then(result=>{if(active)setRows(result)}).catch(e=>{if(active)setError(e.message)});return()=>{active=false}},[customerId]);return <section className={styles.adminRoot}><div className={styles.settingsPanel}><span className={styles.eyebrow}><Headphones size={17}/> HOTLINE · HISTORIQUE CLIENT</span><h2>La continuité de l’attention.</h2>{error?<div className={styles.error}>{error}</div>:rows===null?<p>Chargement des échanges…</p>:rows.length?<div className={styles.caseList}>{rows.map(c=><Link href={`/angelcare-marketplace/admin/hotline?customer=${customerId}`} key={c.id}><b>{c.public_reference} · {c.subject}</b><small>{c.status} · {c.created_at.slice(0,10)}</small></Link>)}</div>:<p>Aucun dossier Hotline lié à ce compte dans votre périmètre autorisé.</p>}<Link href={`/angelcare-marketplace/admin/hotline?customer=${customerId}`}>Ouvrir le workspace et son historique paginé <ArrowUpRight size={16}/></Link></div></section>}
