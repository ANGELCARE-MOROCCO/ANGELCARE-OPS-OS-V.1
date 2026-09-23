'use client'

import type { Data } from '@puckeditor/core'
import { CheckCircle2, ChevronDown, Layers3, ShieldCheck } from 'lucide-react'
import { useMemo,useState } from 'react'
import { buildHomepageProMaxWorld01Data,HOMEPAGE_PRO_MAX_SECTION_DEFINITIONS,HOMEPAGE_PRO_MAX_WORLD_01 } from '../recipe'
import styles from './homepage-pro-max-library.module.css'

export function HomepageProMaxLibrary({currentData,onApply}:{currentData:Data;onApply:(data:Data,summary:string)=>Promise<void>|void}){
 const [open,setOpen]=useState(true),[confirming,setConfirming]=useState(false),[busy,setBusy]=useState(false)
 const content=Array.isArray(currentData.content)?currentData.content:[]
 const count=content.length
 const status=useMemo(()=>{
  const byType=new Map(content.map((row:any)=>[String(row?.type||''),row]))
  return HOMEPAGE_PRO_MAX_SECTION_DEFINITIONS.map(def=>({def,row:byType.get(def.type) as any,present:byType.has(def.type)}))
 },[content])
 const installed=status.filter(row=>row.present).length
 const summary=useMemo(()=>`${HOMEPAGE_PRO_MAX_SECTION_DEFINITIONS.length} sections · Desktop + mobile · MAD/Dhs · données réelles`,[])
 const apply=async(mode:'replace'|'append')=>{setBusy(true);try{await onApply(buildHomepageProMaxWorld01Data(currentData,mode),mode==='replace'?'Homepage Pro Max World 01 · remplacement complet':'Homepage Pro Max World 01 · insertion complète');setConfirming(false)}finally{setBusy(false)}}
 return <section className={styles.shell} aria-label="11 · HOMEPAGE PRO MAX">
  <button className={styles.categoryHead} onClick={()=>setOpen(v=>!v)} aria-expanded={open}>
   <span><b>11</b><span><strong>HOMEPAGE PRO MAX</strong><em>{installed}/18 sections détectées</em></span></span><ChevronDown size={16} data-open={open}/>
  </button>
  {open?<div className={styles.world}>
   <div className={styles.worldHero}><img src={HOMEPAGE_PRO_MAX_WORLD_01.referenceImage} alt="Aperçu AngelCare Famille & Bébé — Hyper-Commerce 01"/><div className={styles.worldOverlay}><span>FULL PAGE WORLD</span><strong>Édition guidée</strong></div></div>
   <div className={styles.body}>
    <div className={styles.worldTitle}><div><span>MONDE HOMEPAGE · APPROUVÉ</span><h3>{HOMEPAGE_PRO_MAX_WORLD_01.label}</h3><p>{summary}</p></div><ShieldCheck size={20}/></div>
    <div className={styles.meta}><i>18 sections</i><i>Puck</i><i>Données réelles</i><i>Responsive</i></div>
    <div className={styles.sectionNavigator}>
     <header><div><Layers3 size={14}/><strong>Sections de la page</strong></div><span>{installed===18?'COMPLET':`${installed}/18`}</span></header>
     <div className={styles.sectionList}>{status.map(({def,row,present})=><article key={def.type} data-present={present||undefined} data-hidden={Boolean(row?.props?.hidden)||undefined}>
      <span className={styles.sectionIndex}>{def.id}</span>
      <span className={styles.sectionCopy}><strong>{def.label.replace(/^S\d+\s*·\s*/, '')}</strong><small>{def.purpose}</small></span>
      <span className={styles.sectionState}>{present?<CheckCircle2 size={14}/>:<span>—</span>}</span>
     </article>)}</div>
    </div>
    <details className={styles.installOptions}>
     <summary>Installation & options avancées</summary>
     <p>Ces actions modifient la structure du document courant. Elles ne sont pas nécessaires pour éditer une Homepage déjà installée.</p>
     {confirming?<div className={styles.confirm}><strong>Remplacer les {count} blocs actuels ?</strong><p>L’historique Puck conserve l’état précédent pour Undo.</p><div><button disabled={busy} onClick={()=>void apply('replace')}>{busy?'Application…':'Confirmer le remplacement'}</button><button disabled={busy} onClick={()=>setConfirming(false)}>Annuler</button></div></div>:<div className={styles.actions}><button disabled={busy} onClick={()=>count?setConfirming(true):void apply('replace')}>Remplacer la page</button><button disabled={busy} onClick={()=>void apply('append')}>Insérer ici</button></div>}
    </details>
   </div>
  </div>:null}
 </section>
}
