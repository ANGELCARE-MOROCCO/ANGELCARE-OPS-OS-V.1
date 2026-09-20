'use client'
import type { Data } from '@puckeditor/core'
import { useMemo,useState } from 'react'
import { buildHomepageProMaxWorld01Data,HOMEPAGE_PRO_MAX_SECTION_DEFINITIONS,HOMEPAGE_PRO_MAX_WORLD_01 } from '../recipe'
import styles from './homepage-pro-max-library.module.css'

export function HomepageProMaxLibrary({currentData,onApply}:{currentData:Data;onApply:(data:Data,summary:string)=>Promise<void>|void}){
 const [open,setOpen]=useState(true),[confirming,setConfirming]=useState(false),[busy,setBusy]=useState(false)
 const count=Array.isArray(currentData.content)?currentData.content.length:0
 const summary=useMemo(()=>`${HOMEPAGE_PRO_MAX_SECTION_DEFINITIONS.length} sections · Desktop + mobile · MAD/Dhs · données réelles`,[])
 const apply=async(mode:'replace'|'append')=>{setBusy(true);try{await onApply(buildHomepageProMaxWorld01Data(currentData,mode),mode==='replace'?'Homepage Pro Max World 01 · remplacement complet':'Homepage Pro Max World 01 · insertion complète');setConfirming(false)}finally{setBusy(false)}}
 return <section className={styles.shell} aria-label="11 · HOMEPAGE PRO MAX"><button className={styles.categoryHead} onClick={()=>setOpen(v=>!v)} aria-expanded={open}><span><b>11</b><strong>HOMEPAGE PRO MAX</strong></span><small>{open?'−':'+'}</small></button>{open?<div className={styles.world}><img src={HOMEPAGE_PRO_MAX_WORLD_01.referenceImage} alt="Aperçu AngelCare Famille & Bébé — Hyper-Commerce 01"/><div className={styles.body}><span>FULL PAGE WORLD · APPROUVÉ</span><h3>{HOMEPAGE_PRO_MAX_WORLD_01.label}</h3><p>{summary}</p><div className={styles.meta}><i>18 sections</i><i>Editable</i><i>Real data</i><i>MAD</i></div>{confirming?<div className={styles.confirm}><strong>Remplacer les {count} blocs actuels ?</strong><p>L’historique Puck garde l’état précédent pour Undo.</p><div><button disabled={busy} onClick={()=>void apply('replace')}>{busy?'Application…':'Confirmer le remplacement'}</button><button disabled={busy} onClick={()=>setConfirming(false)}>Annuler</button></div></div>:<div className={styles.actions}><button disabled={busy} onClick={()=>count?setConfirming(true):void apply('replace')}>Remplacer la page</button><button disabled={busy} onClick={()=>void apply('append')}>Insérer ici</button></div>}</div></div>:null}</section>
}
