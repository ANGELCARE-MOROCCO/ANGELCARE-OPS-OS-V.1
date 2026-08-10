'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { ArrowUpRight } from 'lucide-react'

export function AnalyticsToIntelligence({sourceId,title,observation}:{sourceId:string;title:string;observation:string}){
  const router=useRouter()
  const [busy,setBusy]=useState(false)
  const [message,setMessage]=useState('')
  async function run(){
    setBusy(true);setMessage('')
    try{
      const response=await fetch('/api/angelcare-marketplace/admin/reality/intelligence',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({workspaceKey:'intelligence.executive',sourceId,title,values:{signalType:'analytics_exception',sourceName:'Marketplace Analytics',sourceReference:sourceId,observation,confidence:100,materiality:50,freshnessStatus:'current'}})})
      const payload=await response.json() as {data?:{id?:string};error?:{message?:string}}
      if(!response.ok||payload.error)throw new Error(payload.error?.message||'Création de l’investigation impossible.')
      setMessage('Signal Intelligence créé.')
      router.push('/angelcare-marketplace/admin/intelligence/executive')
    }catch(error){setMessage(error instanceof Error?error.message:'Création de l’investigation impossible.')}finally{setBusy(false)}
  }
  return <div style={{display:'grid',gap:4}}><button type="button" onClick={()=>void run()} disabled={busy}>{busy?'Création…':<>Investiguer <ArrowUpRight size={13}/></>}</button>{message?<small>{message}</small>:null}</div>
}
