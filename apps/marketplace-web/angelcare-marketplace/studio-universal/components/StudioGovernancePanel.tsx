'use client'

import { useCallback, useEffect, useState } from 'react'
import { Activity, Braces, FileStack, Gauge, Link2, RefreshCw, SearchCheck, ShieldCheck, X } from 'lucide-react'
import styles from './studio-workspace.module.css'

type Governance={
  page:{id:string;title:string;slug:string;locale:string;status:string;currentVersion:number;publishedVersion:number|null;seoTitle:string;seoDescription:string}
  templates:Array<{id:string;name:string;status:string;category:string}>
  symbols:Array<{id:string;name:string;status:string;policy:string}>
  dependencies:Array<{id:string;targetType:string;targetId:string;dependencyType:string}>
  previews:Array<{id:string;expiresAt:string;revokedAt:string|null;version:number}>
  performance:{blocks:number;importedBlocks:number;interactiveBlocks:number;controlledIslands:number;reviewRequiredBlocks:number;itemRows:number;importedRuleCount:number;serializedBytes:number;score:number;warnings:string[]}
  parity:{contractBlocks:number;publicRuntimeCovered:number;editorRuntimeCovered:number;unsupported:string[];pass:boolean}
  publicationGate:{pass:boolean;reviewRequiredBlocks:string[];controlledIslands:string[];blockers:string[]};blockers:string[];healthy:boolean
}
type Envelope<T>={data?:T;error?:{message?:string};requestId?:string}

export function StudioGovernancePanel({pageId,onClose}:{pageId:string;onClose:()=>void}){
  const [data,setData]=useState<Governance|null>(null),[loading,setLoading]=useState(true),[message,setMessage]=useState(''),[seoTitle,setSeoTitle]=useState(''),[seoDescription,setSeoDescription]=useState('')
  const load=useCallback(async()=>{setLoading(true);setMessage('');try{const response=await fetch(`/api/angelcare-marketplace/cms/studio/governance?pageId=${encodeURIComponent(pageId)}`,{cache:'no-store'});const body=await response.json() as Envelope<Governance>;if(!response.ok||body.error||!body.data)throw new Error(body.error?.message||'Gouvernance indisponible.');setData(body.data);setSeoTitle(body.data.page.seoTitle||'');setSeoDescription(body.data.page.seoDescription||'')}catch(error){setMessage(error instanceof Error?error.message:'Gouvernance indisponible.')}finally{setLoading(false)}},[pageId])
  useEffect(()=>{void load()},[load])
  async function saveSeo(){setMessage('Enregistrement SEO…');const response=await fetch(`/api/angelcare-marketplace/cms/studio/pages/${pageId}/seo`,{method:'PATCH',headers:{'content-type':'application/json'},body:JSON.stringify({seoTitle,seoDescription})});const body=await response.json() as Envelope<unknown>;if(!response.ok||body.error){setMessage(body.error?.message||'SEO non enregistré.');return}setMessage('SEO page enregistré.');void load()}
  return <div className={styles.governanceBackdrop} role="presentation" onMouseDown={onClose}><aside className={styles.governancePanel} role="dialog" aria-modal="true" aria-label="Gouvernance de la page" onMouseDown={event=>event.stopPropagation()}>
    <header className={styles.governanceHead}><div><span className={styles.panelKicker}>GOUVERNANCE · EXPERIENCE CORE</span><strong>Autorité, santé & dépendances</strong></div><div><button className={styles.iconButton} onClick={()=>void load()} aria-label="Actualiser"><RefreshCw size={15}/></button><button className={styles.iconButton} onClick={onClose} aria-label="Fermer"><X size={16}/></button></div></header>
    {loading?<div className={styles.governanceLoading}>Chargement de l’autorité réelle…</div>:message&&!data?<div className={styles.governanceError}>{message}</div>:data?<div className={styles.governanceBody}>
      <div className={styles.healthBanner} data-healthy={String(data.healthy)}><ShieldCheck size={18}/><div><strong>{data.healthy?'Page saine':'Revue requise'}</strong><span>{data.blockers.length?data.blockers.join(' · '):'Aucun bloqueur de gouvernance détecté.'}</span></div></div>
      <div className={styles.governanceStats}>
        <article><Gauge size={15}/><span>Performance</span><strong>{data.performance.score}/100</strong><small>{data.performance.blocks} blocs · {Math.round(data.performance.serializedBytes/1024)} Ko</small></article>
        <article><Activity size={15}/><span>Runtime parity</span><strong>{data.parity.pass?'PASS':'REVIEW'}</strong><small>{data.parity.publicRuntimeCovered}/{data.parity.contractBlocks} contrats</small></article>
        <article><Link2 size={15}/><span>Dépendances</span><strong>{data.dependencies.length}</strong><small>Where Used / provenance</small></article>
        <article><FileStack size={15}/><span>Bibliothèques</span><strong>{data.templates.length+data.symbols.length}</strong><small>{data.templates.length} templates · {data.symbols.length} symboles</small></article>
      </div>
      {data.performance.warnings.length?<section className={styles.governanceSection}><h3>Performance & risques</h3>{data.performance.warnings.map(row=><p key={row} className={styles.warningRow}>{row}</p>)}</section>:null}
      <section className={styles.governanceSection}><div className={styles.sectionHeading}><div><SearchCheck size={15}/><h3>SEO de cette page</h3></div><a href="/angelcare-marketplace/admin/configuration/web-presence">Autorité Web Presence</a></div><label>Titre SEO<input value={seoTitle} onChange={e=>setSeoTitle(e.target.value)} maxLength={240}/></label><label>Description SEO<textarea value={seoDescription} onChange={e=>setSeoDescription(e.target.value)} maxLength={500}/></label><button className={styles.secondary} onClick={()=>void saveSeo()}>Enregistrer le SEO page</button>{message?<p className={styles.inlineMessage}>{message}</p>:null}</section>
      <section className={styles.governanceSection}><div className={styles.sectionHeading}><div><Braces size={15}/><h3>Dépendances</h3></div><a href="/angelcare-marketplace/admin/experience/dependencies">Ouvrir Where Used</a></div>{data.dependencies.length?<div className={styles.compactRows}>{data.dependencies.slice(0,20).map(row=><div key={row.id}><strong>{row.targetType}</strong><span>{row.dependencyType}</span><code>{row.targetId}</code></div>)}</div>:<p className={styles.governanceEmpty}>Aucune dépendance enregistrée pour cette page.</p>}</section>
      <section className={styles.governanceSection}><h3>Versions & preview</h3><p>Version courante <strong>v{data.page.currentVersion}</strong> · publiée <strong>{data.page.publishedVersion?`v${data.page.publishedVersion}`:'—'}</strong> · previews actives <strong>{data.previews.length}</strong></p><div className={styles.governanceLinks}><a href="/angelcare-marketplace/admin/experience/templates">Templates</a><a href="/angelcare-marketplace/admin/experience/symbols">Symboles</a><a href="/angelcare-marketplace/admin/experience/pages">Pages & versions</a></div></section>
    </div>:null}
  </aside></div>
}
