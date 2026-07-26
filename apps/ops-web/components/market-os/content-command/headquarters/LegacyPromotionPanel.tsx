"use client"
import * as React from "react"
import { ArrowRight, Database, ShieldCheck, Sparkles } from "lucide-react"
import { CONTENT_ASSETS_KEY, CONTENT_BRIEFS_KEY, CONTENT_ITEMS_KEY, CONTENT_TASKS_KEY, type ContentAsset, type ContentBrief, type ContentItem, type ContentTask } from "../content-command-system"
import { headquartersAction } from "./client"
import { Empty, SectionHeader } from "./primitives"
import styles from "./content-command-headquarters.module.css"

function read<T>(key:string):T[]{try{const value=JSON.parse(window.localStorage.getItem(key)||"[]");return Array.isArray(value)?value:[]}catch{return []}}
export default function LegacyPromotionPanel({onPromoted}:{onPromoted:()=>void}){
 const [inventory,setInventory]=React.useState({items:0,tasks:0,assets:0,briefs:0});const [busy,setBusy]=React.useState(false);const [message,setMessage]=React.useState("")
 React.useEffect(()=>{setInventory({items:read<ContentItem>(CONTENT_ITEMS_KEY).length,tasks:read<ContentTask>(CONTENT_TASKS_KEY).length,assets:read<ContentAsset>(CONTENT_ASSETS_KEY).length,briefs:read<ContentBrief>(CONTENT_BRIEFS_KEY).length})},[])
 async function promote(){setBusy(true);setMessage("");try{const items=read<ContentItem>(CONTENT_ITEMS_KEY);const tasks=read<ContentTask>(CONTENT_TASKS_KEY);const assets=read<ContentAsset>(CONTENT_ASSETS_KEY);const briefs=read<ContentBrief>(CONTENT_BRIEFS_KEY);const records=items.map((item)=>({...item,tasks:tasks.filter((task)=>task.contentId===item.id),assets:assets.filter((asset)=>asset.linkedContentId===item.id),briefs:briefs.filter((brief)=>brief.title===item.title||brief.campaign===item.campaign)}));const result=await headquartersAction("promote_legacy_content",{records}) as {created?:unknown[];skipped?:unknown[]};setMessage(`${result.created?.length||0} dossier(s) promu(s), ${result.skipped?.length||0} déjà présent(s).`);onPromoted()}catch(error){setMessage(error instanceof Error?error.message:"PROMOTION_FAILED")}finally{setBusy(false)}}
 return <section className={styles.legacyPromotion}><SectionHeader eyebrow="PROVENANCE BRIDGE" title="Relier le workflow historique au nouveau Headquarters" description="La promotion crée des dossiers canoniques sans supprimer ni réécrire les enregistrements navigateur existants."/><div className={styles.legacyInventory}><span><Database/><strong>{inventory.items}</strong><small>Contenus navigateur</small></span><span><ShieldCheck/><strong>{inventory.tasks}</strong><small>Tâches liées</small></span><span><Sparkles/><strong>{inventory.assets}</strong><small>Références assets</small></span><span><ArrowRight/><strong>{inventory.briefs}</strong><small>Briefs historiques</small></span></div>{inventory.items?<button disabled={busy} onClick={()=>void promote()}><ShieldCheck/> Promouvoir avec provenance</button>:<Empty title="Aucun record navigateur détecté" detail="Le panneau ne fabrique aucun contenu; il attend les vrais records Phase 1 de ce navigateur."/>}{message?<p>{message}</p>:null}</section>
}
