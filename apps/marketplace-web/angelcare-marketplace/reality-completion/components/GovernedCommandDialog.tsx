'use client'
import {useMemo,useRef,useState} from 'react'
import styles from '../reality.module.css'

export interface CommandField {
  key:string
  label:string
  type?:'text'|'textarea'|'number'|'datetime-local'|'select'
  required?:boolean
  placeholder?:string
  options?:Array<{value:string;label:string}>
  defaultValue?:string|number|null
}

export function GovernedCommandDialog({title,triggerLabel,fields,reasonLabel='Raison / justification',danger=false,disabled=false,onSubmit}:{title:string;triggerLabel:string;fields:CommandField[];reasonLabel?:string;danger?:boolean;disabled?:boolean;onSubmit:(values:Record<string,unknown>,reason:string)=>Promise<void>}){
 const ref=useRef<HTMLDialogElement>(null)
 const initial=useMemo(()=>Object.fromEntries(fields.map(f=>[f.key,f.defaultValue??''])),[fields])
 const[values,setValues]=useState<Record<string,string|number>>(initial)
 const[reason,setReason]=useState('')
 const[busy,setBusy]=useState(false)
 const[error,setError]=useState('')
 const ready=fields.every(f=>!f.required||String(values[f.key]??'').trim())&&reason.trim().length>2
 function close(){if(!busy)ref.current?.close()}
 async function submit(){if(!ready)return;setBusy(true);setError('');try{await onSubmit(values,reason);ref.current?.close();setReason('');setValues(initial)}catch(e){setError(e instanceof Error?e.message:'Commande impossible.')}finally{setBusy(false)}}
 return <>
  <button type="button" className={danger?styles.danger:styles.secondary} disabled={disabled} onClick={()=>ref.current?.showModal()}>{triggerLabel}</button>
  <dialog className={styles.dialog} ref={ref} onCancel={e=>{if(busy)e.preventDefault()}}>
   <div className={styles.dialogHeader}><div><span className={styles.kicker}>GOVERNED COMMAND</span><h3>{title}</h3></div><button type="button" className={styles.close} aria-label="Fermer" onClick={close}>×</button></div>
   <div className={styles.dialogBody}>
    <div className={styles.notice}>Cette commande persiste l’état métier et son audit. Les champs requis et la justification sont enregistrés avec l’acteur.</div>
    <div className={styles.formGrid}>{fields.map(field=><div className={styles.field} key={field.key} style={field.type==='textarea'?{gridColumn:'1 / -1'}:undefined}><label>{field.label}{field.required?' *':''}</label>{field.type==='textarea'?<textarea className={styles.textarea} value={String(values[field.key]??'')} placeholder={field.placeholder} onChange={e=>setValues(v=>({...v,[field.key]:e.target.value}))}/>:field.type==='select'?<select className={styles.select} value={String(values[field.key]??'')} onChange={e=>setValues(v=>({...v,[field.key]:e.target.value}))}><option value="">Sélectionner…</option>{field.options?.map(o=><option value={o.value} key={o.value}>{o.label}</option>)}</select>:<input className={styles.input} type={field.type==='number'?'number':field.type==='datetime-local'?'datetime-local':'text'} value={String(values[field.key]??'')} placeholder={field.placeholder} onChange={e=>setValues(v=>({...v,[field.key]:field.type==='number'?e.target.valueAsNumber||'':e.target.value}))}/>}</div>)}</div>
    <div className={styles.field}><label>{reasonLabel} *</label><textarea className={styles.textarea} value={reason} onChange={e=>setReason(e.target.value)} placeholder="Pourquoi cette décision est-elle autorisée maintenant ?"/></div>
    {error?<div className={`${styles.message} ${styles.error}`}>{error}</div>:null}
   </div>
   <div className={styles.dialogFooter}><button type="button" className={styles.secondary} disabled={busy} onClick={close}>Annuler</button><button type="button" className={danger?styles.danger:styles.button} disabled={busy||!ready} onClick={()=>void submit()}>{busy?'Exécution…':'Confirmer et auditer'}</button></div>
  </dialog>
 </>
}

export async function realityPost(domain:string,body:Record<string,unknown>){
 const response=await fetch(`/api/angelcare-marketplace/admin/reality/${domain}`,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(body)})
 const payload=await response.json().catch(()=>({}))
 if(!response.ok)throw new Error(payload?.error?.message||'Création refusée.')
 return payload.data
}
export async function realityPatch(domain:string,id:string,body:Record<string,unknown>){
 const response=await fetch(`/api/angelcare-marketplace/admin/reality/${domain}/${id}`,{method:'PATCH',headers:{'content-type':'application/json'},body:JSON.stringify(body)})
 const payload=await response.json().catch(()=>({}))
 if(!response.ok)throw new Error(payload?.error?.message||'Commande refusée.')
 return payload.data
}
