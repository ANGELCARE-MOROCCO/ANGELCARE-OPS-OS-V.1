'use client'

import { useCallback, useEffect, useState } from 'react'
import { CheckCircle2, CircleDashed, RefreshCw, Rocket, ShieldCheck, X } from 'lucide-react'
import styles from './studio-workspace.module.css'

type Readiness={
  source:{pass:boolean;hardFailures:string[];audit:{total:number;pass:number;partial:number;pending:number;fail:number}}
  runtime:{status:string;pending:string[];acceptance:{total:number;runtimeRequired:number;releaseRequired:number;controls:Array<{id:string;label:string;state:string;evidence:string}>}}
  release:{status:string;pending:string[];contract:{workflowName:string;image:string;imageTag:string;deploymentAuthority:string;deployWithoutCache:boolean;forbiddenWorkflow:string};chain:readonly string[]}
  productionReady:boolean
}
type Envelope<T>={data?:T;error?:{message?:string};requestId?:string}

async function fetchReadiness(signal?:AbortSignal){
  const response=await fetch('/api/angelcare-marketplace/cms/studio/release-readiness',{cache:'no-store',signal})
  const body=await response.json() as Envelope<Readiness>
  if(!response.ok||body.error||!body.data)throw new Error(body.error?.message||'État release indisponible.')
  return body.data
}

export function StudioReleasePanel({onClose}:{onClose:()=>void}){
  const [data,setData]=useState<Readiness|null>(null),[loading,setLoading]=useState(true),[error,setError]=useState('')
  const load=useCallback(async()=>{setLoading(true);setError('');try{setData(await fetchReadiness())}catch(value){setError(value instanceof Error?value.message:'État release indisponible.')}finally{setLoading(false)}},[])
  useEffect(()=>{
    const controller=new AbortController()
    void fetchReadiness(controller.signal).then(value=>{setData(value);setError('')}).catch(value=>{if(!controller.signal.aborted)setError(value instanceof Error?value.message:'État release indisponible.')}).finally(()=>{if(!controller.signal.aborted)setLoading(false)})
    return ()=>controller.abort()
  },[])
  return <div className={styles.governanceBackdrop} role="presentation" onMouseDown={onClose}><aside className={styles.governancePanel} role="dialog" aria-modal="true" aria-label="Préparation release" onMouseDown={event=>event.stopPropagation()}>
    <header className={styles.governanceHead}><div><span className={styles.panelKicker}>RELEASE · MARKETPLACE AUTHORITY</span><strong>Acceptance & mise en production</strong></div><div><button className={styles.iconButton} onClick={()=>void load()} aria-label="Actualiser"><RefreshCw size={15}/></button><button className={styles.iconButton} onClick={onClose} aria-label="Fermer"><X size={16}/></button></div></header>
    {loading?<div className={styles.governanceLoading}>Calcul des gates source, runtime et release…</div>:error?<div className={styles.governanceError}>{error}</div>:data?<div className={styles.governanceBody}>
      <div className={styles.releaseHero} data-ready={String(data.productionReady)}><Rocket size={20}/><div><strong>{data.productionReady?'Prêt production':'Pré-release contrôlée'}</strong><span>{data.productionReady?'Tous les gates sont exécutés.':'Aucun PASS de production n’est simulé : les gates runtime/release restent visibles jusqu’à exécution.'}</span></div></div>
      <div className={styles.auditCards}><article><ShieldCheck size={15}/><span>Source</span><strong>{data.source.pass?'PASS':'FAIL'}</strong><small>{data.source.audit.pass}/{data.source.audit.total} PASS/NO · {data.source.audit.partial} partiels</small></article><article><CircleDashed size={15}/><span>Runtime</span><strong>{data.runtime.pending.length?'PENDING':'PASS'}</strong><small>{data.runtime.pending.join(' · ')||'Aucun gate navigateur restant'}</small></article><article><CircleDashed size={15}/><span>Release</span><strong>{data.release.pending.length?'PENDING':'PASS'}</strong><small>{data.release.pending.join(' · ')||'Aucun gate release restant'}</small></article><article><CheckCircle2 size={15}/><span>Acceptance</span><strong>{data.runtime.acceptance.total}</strong><small>{data.runtime.acceptance.runtimeRequired} runtime · {data.runtime.acceptance.releaseRequired} release</small></article></div>
      <section className={styles.governanceSection}><h3>Chaîne Marketplace verrouillée</h3><div className={styles.releaseChain}>{data.release.chain.map((step,index)=><div key={`${index}-${step}`}><b>{index+1}</b><span>{step}</span></div>)}</div><p className={styles.releaseWarning}>Workflow interdit pour ce produit : <code>{data.release.contract.forbiddenWorkflow}</code></p></section>
      <section className={styles.governanceSection}><h3>Acceptance opérateur</h3><div className={styles.acceptanceRows}>{data.runtime.acceptance.controls.map(row=><div key={row.id} data-state={row.state}><code>{row.id}</code><div><strong>{row.label}</strong><span>{row.evidence}</span></div><em>{row.state==='runtime-required'?'RUNTIME':row.state==='release-required'?'RELEASE':'SOURCE'}</em></div>)}</div></section>
      <section className={styles.governanceSection}><h3>Image immuable</h3><p><strong>{data.release.contract.image}</strong></p><p>Tag: <code>{data.release.contract.imageTag}</code> · Déploiement: <strong>{data.release.contract.deploymentAuthority}</strong> · sans cache: <strong>{data.release.contract.deployWithoutCache?'OUI':'NON'}</strong></p></section>
    </div>:null}
  </aside></div>
}
