'use client'
import {useEffect,useMemo,useState} from 'react'
import styles from '../network-capacity-grid.module.css'

type R=Record<string,any>
type TerritoryOption={id:string;reference:string;code:string;name:string;status:string}
type ServiceOption={key:string;label:string}

async function call(url:string,method:string,body?:unknown){
 const r=await fetch(url,{method,headers:{'content-type':'application/json'},body:body===undefined?undefined:JSON.stringify(body)})
 const j=await r.json().catch(()=>null)
 if(!r.ok)throw new Error(j?.error?.message||'Operation failed')
 return j?.data||j
}

export function ProviderManagementPanel({
 providerId,onRefresh,territoryOptions,serviceOptions
}:{providerId:string;onRefresh:()=>Promise<void>;territoryOptions:TerritoryOption[];serviceOptions:ServiceOption[]}){
 const[dossier,setDossier]=useState<R|null>(null)
 const[busy,setBusy]=useState(false)
 const[message,setMessage]=useState('')
 const[name,setName]=useState('')
 const[email,setEmail]=useState('')
 const[phone,setPhone]=useState('')
 const[risk,setRisk]=useState('normal')
 const[territoryId,setTerritoryId]=useState('')
 const[service,setService]=useState('')
 const[documentType,setDocumentType]=useState('identity')

 async function load(){
  const r=await fetch(`/api/angelcare-marketplace/providers/${providerId}`,{cache:'no-store'})
  const j=await r.json().catch(()=>null)
  if(r.ok){
   const next=j?.data||j
   setDossier(next)
   const p=next?.provider||{}
   setName(String(p.display_name||''))
   setEmail(String(p.email||''))
   setPhone(String(p.phone||''))
   setRisk(String(p.risk_level||'normal'))
   setTerritoryId(String(p.territory_id||''))
  }else setMessage(j?.error?.message||'Provider dossier unavailable.')
 }

 useEffect(()=>{void load()},[providerId])

 async function act(url:string,method:string,body?:unknown){
  setBusy(true);setMessage('')
  try{
   await call(url,method,body)
   await Promise.all([load(),onRefresh()])
   setMessage('Saved to canonical provider authority.')
  }catch(e){setMessage(e instanceof Error?e.message:'Operation failed')}
  finally{setBusy(false)}
 }

 const serviceChoices=useMemo(()=>{
  const seen=new Map<string,string>()
  for(const x of serviceOptions)if(x.key)seen.set(x.key,x.label||x.key)
  for(const x of Array.isArray(dossier?.provider?.service_categories)?dossier.provider.service_categories:[])if(x&&!seen.has(String(x)))seen.set(String(x),String(x).replace(/_/g,' '))
  return [...seen.entries()].map(([key,label])=>({key,label})).sort((a,b)=>a.label.localeCompare(b.label))
 },[serviceOptions,dossier])

 if(!dossier)return <section className={styles.formCard}><h3>Provider Management</h3><p>{message||'Loading provider operating dossier…'}</p></section>

 const provider=dossier.provider||{}
 const quals=Array.isArray(dossier.qualifications)?dossier.qualifications:[]
 const rules=Array.isArray(dossier.availability)?dossier.availability:[]
 const docs=Array.isArray(dossier.documents)?dossier.documents:[]
 const eligibility=dossier.eligibility||null

 return <div className={styles.drawerStack}>
  <section className={styles.formCard}>
   <h3>Identity, territory & network profile</h3>
   <div className={styles.formGrid}>
    <label>Name<input value={name} onChange={e=>setName(e.target.value)}/></label>
    <label>Email<input value={email} onChange={e=>setEmail(e.target.value)}/></label>
    <label>Phone<input value={phone} onChange={e=>setPhone(e.target.value)}/></label>
    <label>Territory<select value={territoryId} onChange={e=>setTerritoryId(e.target.value)}><option value="">No primary territory</option>{territoryOptions.filter(t=>t.status!=='archived').map(t=><option value={t.id} key={t.id}>{t.reference||t.code} · {t.name}</option>)}</select></label>
    <label>Risk<select value={risk} onChange={e=>setRisk(e.target.value)}><option>low</option><option>normal</option><option>high</option><option>critical</option></select></label>
    <button disabled={busy||!name.trim()} onClick={()=>void act(`/api/angelcare-marketplace/providers/${providerId}`,'PATCH',{display_name:name.trim(),email:email.trim()||null,phone:phone.trim()||null,territory_id:territoryId||null,risk_level:risk})}>Save provider profile</button>
   </div>
   <p>Operational state: <b>{provider.operational_status}</b> · Eligibility: <b>{eligibility?.status||'not calculated'}</b>{eligibility?.score==null?'':` · ${eligibility.score}/100`}</p>
  </section>

  <section className={styles.formCard}>
   <h3>Service qualifications & deployable capability</h3>
   <div className={styles.formGrid}>
    <label>Service<select value={service} onChange={e=>setService(e.target.value)}><option value="">Choose service capability</option>{serviceChoices.map(x=><option value={x.key} key={x.key}>{x.label}</option>)}</select></label>
    <button disabled={busy||!service} onClick={()=>void act(`/api/angelcare-marketplace/providers/${providerId}/qualifications`,'POST',{serviceKey:service,status:'qualified',qualificationSource:'operator_review',territories:territoryId?[territoryId]:[]})}>Qualify service</button>
   </div>
   <div className={styles.candidateTable}>
    <header><span>Service</span><span>Status</span><span>Source</span><span>Expiry</span><span>Action</span></header>
    {quals.map((q:R)=><div key={q.id}>
     <strong>{q.service_key}</strong>
     <span>{q.status}</span>
     <span>{q.qualification_source}</span>
     <span>{q.expires_at||'—'}</span>
     <span>
      {q.status!=='revoked'?<button disabled={busy} onClick={()=>void act(`/api/angelcare-marketplace/providers/${providerId}/qualifications/${q.id}`,'PATCH',{serviceKey:q.service_key,status:q.status==='qualified'?'restricted':'qualified',qualificationSource:q.qualification_source,ageGroups:q.age_groups,territories:q.territories,expiresAt:q.expires_at})}>{q.status==='qualified'?'Restrict':'Qualify'}</button>:null}
      {q.status!=='revoked'?<button disabled={busy} onClick={()=>void act(`/api/angelcare-marketplace/providers/${providerId}/qualifications/${q.id}`,'DELETE')}>Revoke</button>:<span>revoked</span>}
     </span>
    </div>)}
   </div>
  </section>

  <section className={styles.formCard}>
   <h3>Recurring availability authority</h3>
   <div className={styles.candidateTable}>
    <header><span>Day</span><span>Hours</span><span>Services</span><span>Status</span><span>Action</span></header>
    {rules.map((r:R)=><div key={r.id}>
     <strong>Day {r.weekday}</strong>
     <span><input type="time" defaultValue={String(r.starts_at||'08:00').slice(0,5)} id={`avail-start-${r.id}`}/>–<input type="time" defaultValue={String(r.ends_at||'18:00').slice(0,5)} id={`avail-end-${r.id}`}/></span>
     <span>{Array.isArray(r.service_categories)&&r.service_categories.length?r.service_categories.join(', '):'all qualified services'}</span>
     <span>{r.active?'active':'archived'}</span>
     <span>
      <button disabled={busy} onClick={()=>void act(`/api/angelcare-marketplace/providers/${providerId}/availability/${r.id}`,'PATCH',{startsAt:(document.getElementById(`avail-start-${r.id}`) as HTMLInputElement)?.value,endsAt:(document.getElementById(`avail-end-${r.id}`) as HTMLInputElement)?.value})}>Save hours</button>
      <button disabled={busy} onClick={()=>void act(`/api/angelcare-marketplace/providers/${providerId}/availability/${r.id}`,'PATCH',{active:!r.active})}>{r.active?'Archive':'Restore'}</button>
     </span>
    </div>)}
   </div>
  </section>

  <section className={styles.formCard}>
   <h3>Document readiness</h3>
   <div className={styles.formGrid}>
    <label>Document type<select value={documentType} onChange={e=>setDocumentType(e.target.value)}><option value="identity">Identity</option><option value="contract">Contract</option><option value="insurance">Insurance</option><option value="certification">Certification</option><option value="training">Training</option><option value="compliance">Compliance</option></select></label>
    <button disabled={busy} onClick={()=>void act(`/api/angelcare-marketplace/providers/${providerId}/documents/request`,'POST',{documentType,sensitivity:'confidential'})}>Request document</button>
   </div>
   <p>{docs.filter((d:R)=>['requested','submitted','under_review','expiring','expired','rejected'].includes(d.status)).length} document(s) require attention.</p>
  </section>
  {message?<div className={styles.feedback}>{message}</div>:null}
 </div>
}
