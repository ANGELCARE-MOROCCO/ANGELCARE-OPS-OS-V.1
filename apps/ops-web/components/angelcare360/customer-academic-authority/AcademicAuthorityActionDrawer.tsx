'use client'
import { useState, type ChangeEvent, type MouseEvent } from 'react'
import { Plus, X } from 'lucide-react'
import { useRouter } from 'next/navigation'
import CustomerOverlayPortal from '@/components/angelcare360/customer-experience/CustomerOverlayPortal'
import type { AcademicAuthorityEntity } from '@/types/angelcare360/customer-academic-authority'
import styles from './AcademicAuthorityActionDrawer.module.css'

export default function AcademicAuthorityActionDrawer({entity,label,defaultTitle}:{entity:AcademicAuthorityEntity;label:string;defaultTitle:string}){
 const [open,setOpen]=useState(false);const [busy,setBusy]=useState(false);const [title,setTitle]=useState(defaultTitle);const [detail,setDetail]=useState('');const router=useRouter()
 async function submit(){if(!title.trim()||busy)return;setBusy(true);try{const response=await fetch('/api/angelcare360/customer-academic-authority',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({entity,operation:'create',payload:{title,detail}})});if(!response.ok)throw new Error((await response.json().catch(()=>null))?.error||'Action impossible.');setOpen(false);router.refresh()}catch{}finally{setBusy(false)}}
 return <><button type="button" className={styles.trigger} onClick={()=>setOpen(true)}><Plus size={16}/>{label}</button>{open?<CustomerOverlayPortal><div className={styles.backdrop} onMouseDown={()=>setOpen(false)}><section className={styles.drawer} role="dialog" aria-modal="true" aria-label={label} onMouseDown={(event:MouseEvent<HTMLElement>)=>event.stopPropagation()}><header><div><small>Autorité académique</small><h2>{label}</h2><p>Créer une demande gouvernée, traçable et liée au contexte actif.</p></div><button type="button" onClick={()=>setOpen(false)} aria-label="Fermer"><X size={18}/></button></header><div className={styles.body}><label>Titre<input value={title} onChange={(event:ChangeEvent<HTMLInputElement>)=>setTitle(event.target.value)}/></label><label>Détail<textarea rows={7} value={detail} onChange={(event:ChangeEvent<HTMLTextAreaElement>)=>setDetail(event.target.value)} placeholder="Motif, impact, preuve et résultat attendu"/></label></div><footer><button type="button" className={styles.secondary} onClick={()=>setOpen(false)}>Annuler</button><button type="button" className={styles.primary} onClick={submit} disabled={busy||!title.trim()}>{busy?'Enregistrement…':'Enregistrer'}</button></footer></section></div></CustomerOverlayPortal>:null}</>
}
