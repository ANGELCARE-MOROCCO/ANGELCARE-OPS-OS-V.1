'use client'
import {useState} from 'react'
import {useRouter} from 'next/navigation'
import styles from '../final-vertical.module.css'
async function post(url:string,body:Record<string,unknown>){const res=await fetch(url,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(body)});const json=await res.json().catch(()=>({}));if(!res.ok)throw new Error(json?.error?.message||'Commande refusée');return json.data}
export function CreateFinalCase({workspaceKey,entityType,mission,sourceId,sourceTitle}:{workspaceKey:string;entityType:string;mission:string;sourceId?:string;sourceTitle?:string}){
 const router=useRouter();const[busy,setBusy]=useState(false);const[msg,setMsg]=useState('')
 async function run(){setBusy(true);setMsg('');try{const entityId=sourceId||crypto.randomUUID();const data=await post('/api/angelcare-marketplace/admin/operating/cases',{workspaceKey,entityType,entityId,title:sourceTitle||`Nouveau dossier ${workspaceKey}`,mission,priority:'normal',riskLevel:'normal',nextAction:'Qualifier et affecter le dossier.'});setMsg('Dossier créé.');const id=data?.id||data?.record?.id;if(id)router.push(`/angelcare-marketplace/admin/operating/${id}`);else router.refresh()}catch(e){setMsg(e instanceof Error?e.message:'Échec')}finally{setBusy(false)}}
 return <div className={styles.actionInline}><button type="button" disabled={busy} onClick={()=>void run()}>{busy?'Création…':sourceId?'Ouvrir dossier':'Créer dossier'}</button>{msg?<small>{msg}</small>:null}</div>
}
