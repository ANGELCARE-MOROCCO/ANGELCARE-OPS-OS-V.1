'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import styles from './MaterialCommand.module.css'
import type { MaterialCategory } from '@/types/angelcare360/material-control'

async function command(entity:string,operation:string,payload:Record<string,unknown>) {
  const response=await fetch('/api/angelcare360/inventory-command',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({entity,operation,payload})})
  return response.json() as Promise<{ok:boolean;error?:string}>
}

export function CategoryTaxonomyStudio({ schoolId, category }: { schoolId:string; category?:MaterialCategory | null }) {
  const router=useRouter(); const editing=Boolean(category)
  const [code,setCode]=useState(category?.code||''); const [label,setLabel]=useState(category?.label||''); const [description,setDescription]=useState(category?.description||''); const [status,setStatus]=useState(category?.status||'active'); const [feedback,setFeedback]=useState(''); const [busy,setBusy]=useState(false)
  async function submit(e:React.FormEvent){e.preventDefault();setBusy(true);setFeedback('');try{const result=await command('category',editing?'update':'create',{schoolId,id:category?.id,code,label,description,status});if(!result.ok){setFeedback(result.error||'Enregistrement impossible.');return}setFeedback(editing?'Catégorie mise à jour.':'Catégorie créée.');if(!editing){setCode('');setLabel('');setDescription('');setStatus('active')}router.refresh()}finally{setBusy(false)}}
  return <form className={styles.studio} onSubmit={submit}>
    <div className={styles.studioHead}><div><h3>{editing?'Classification & cycle de vie':'Nouvelle catégorie matérielle'}</h3><p>La catégorie structure le registre sans inventer de localisation physique ou de dépôt.</p></div></div>
    <div className={styles.studioBody}><div className={styles.formGrid}><label className={styles.field}><span className={styles.label}>Code catégorie</span><input className={styles.input} value={code} onChange={e=>setCode(e.target.value)} required maxLength={80}/></label><label className={styles.field}><span className={styles.label}>Libellé</span><input className={styles.input} value={label} onChange={e=>setLabel(e.target.value)} required maxLength={160}/></label><label className={styles.fieldFull}><span className={styles.label}>Description</span><textarea className={styles.textarea} value={description} onChange={e=>setDescription(e.target.value)} maxLength={1000}/></label><label className={styles.field}><span className={styles.label}>État</span><select className={styles.select} value={status} onChange={e=>setStatus(e.target.value)}><option value="active">Active</option><option value="inactive">Inactive</option><option value="archived">Archivée</option></select></label></div></div>
    <div className={styles.studioFooter}><button className={styles.button} disabled={busy}>{busy?'Enregistrement…':editing?'Mettre à jour la classification':'Créer la catégorie'}</button>{feedback?<span className={styles.feedback} data-error={String(!feedback.includes('mise à jour')&&!feedback.includes('créée'))}>{feedback}</span>:null}</div>
  </form>
}
