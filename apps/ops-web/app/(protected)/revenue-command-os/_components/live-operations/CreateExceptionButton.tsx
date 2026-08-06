'use client'
import { useState } from 'react'
import { Loader2, Wrench } from 'lucide-react'
export default function CreateExceptionButton({title,detail,severity='high',sourceId}:{title:string;detail:string;severity?:string;sourceId?:string}){
 const[busy,setBusy]=useState(false);const[message,setMessage]=useState('')
 async function create(){setBusy(true);setMessage('');try{const response=await fetch('/api/revenue-command-os/live-operations',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({entityType:'exception',operation:'create',reason:'Dossier de remédiation créé depuis la tour des exceptions',changes:{title,description:detail,severity,sourceType:'revenue-os-diagnostic',sourceId,status:'active'}})});const body=await response.json();if(!response.ok||!body.ok)throw new Error(body?.error?.message||'Création impossible');setMessage('Dossier créé');window.dispatchEvent(new CustomEvent('revenue-os:operation-completed',{detail:body.data}))}catch(error){setMessage(error instanceof Error?error.message:String(error))}finally{setBusy(false)}}
 return <div className="mt-3"><button type="button" onClick={()=>void create()} disabled={busy} className="inline-flex items-center gap-2 rounded-xl bg-slate-950 px-3 py-2 text-[10px] font-black uppercase tracking-[.08em] text-white disabled:opacity-50">{busy?<Loader2 size={13} className="animate-spin"/>:<Wrench size={13}/>} Créer le dossier de résolution</button>{message?<p className="mt-2 text-[10px] font-bold text-blue-700">{message}</p>:null}</div>
}
