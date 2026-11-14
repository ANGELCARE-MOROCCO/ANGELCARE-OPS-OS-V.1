"use client";
import {useCallback,useState} from "react";
import {Activity,Archive,ArrowRight,CheckCircle2,CloudUpload,Download,FileCheck2,FolderOpen,History,Image as ImageIcon,Layers3,RefreshCw,ShieldCheck,UploadCloud,AlertTriangle} from "lucide-react";
import type {CatalogAdminItem,MediaAsset,MediaFolder} from "../commerce-studio/types";
import {MediaLibraryStudio} from "../commerce-studio/components/MediaLibraryStudio";
import {MediaVault360} from "./MediaVault360";
import s from "./media-vault-r6.module.css";
type Stats={total:number;ready:number;uploading:number;success:number;failed:number;progress:number};
type Inventory={assets:number|null;folders:number|null;matched:number|null};
const fmt=(n:number|null)=>n===null?"—":new Intl.NumberFormat("fr-FR").format(n);
function jump(target:string){document.getElementById(target)?.scrollIntoView({behavior:"smooth",block:"start"})}
export function MediaImport360({initialMedia,initialFolders,catalogItems,canManage}:{initialMedia:MediaAsset[];initialFolders:MediaFolder[];catalogItems:CatalogAdminItem[];canManage:boolean}){
 const [queue,setQueue]=useState<Stats>({total:0,ready:0,uploading:0,success:0,failed:0,progress:0});
 const [inventory,setInventory]=useState<Inventory>({assets:null,folders:null,matched:null});
 const [refreshKey,setRefreshKey]=useState(0);
 const onQueue=useCallback((v:Stats)=>setQueue(v),[]);
 const onInventory=useCallback((v:Inventory)=>setInventory(v),[]);
 const onMediaChange=useCallback(()=>setRefreshKey(k=>k+1),[]);
 const exportQueue=()=>{
  const blob=new Blob([JSON.stringify({generatedAt:new Date().toISOString(),queue,inventory},null,2)],{type:"application/json"});
  const link=document.createElement("a"),url=URL.createObjectURL(blob);link.href=url;link.download="angelcare-media-import-summary.json";link.click();setTimeout(()=>URL.revokeObjectURL(url),1500);
 };
 return <div className={s.command360} data-media-vault-360="approved">
  <header className={s.commandHead}><div className={s.commandCopy}><span className={s.commandEyebrow}><ShieldCheck size={14}/> ANGELCARE OPS OS / IMPORT COMMAND</span><h1>MEDIA IMPORT <em>& VAULT 360</em></h1><p>Ingestion gouvernée · Bibliothèque native · Contrôle total · Gestion professionnelle des actifs</p></div>
   <div className={s.commandActions}><button onClick={exportQueue}><Download size={16}/> Exporter le récapitulatif</button><button className={s.primary} disabled={!canManage} onClick={()=>jump("media-import-r6")}><CloudUpload size={18}/> Nouvel import</button></div></header>
  <nav className={s.commandNav} aria-label="Modules de Media Import & Vault 360">
   <button onClick={()=>jump("media-import-r6")} className={s.activeNav}><UploadCloud size={16}/> Import Studio</button>
   <button onClick={()=>jump("media-r6-preflight")}><Layers3 size={16}/> Lots & exécutions</button>
   <button onClick={()=>jump("media-r6-preflight")}><FileCheck2 size={16}/> Mappings</button>
   <button onClick={()=>jump("media-r6-history")}><History size={16}/> Historique de session</button>
   <button onClick={()=>jump("media-vault-r6")}><FolderOpen size={16}/> Media Vault</button>
  </nav>
  <section className={s.kpis} aria-label="Indicateurs réels des médias">
   {[
    {key:"assets",label:"ACTIFS NATIFS",value:inventory.assets,foot:"Inventaire canonique",Icon:ImageIcon,tone:"green"},
    {key:"folders",label:"DOSSIERS",value:inventory.folders,foot:"Arborescence serveur",Icon:FolderOpen,tone:"amber"},
    {key:"total",label:"FICHIERS DANS LE LOT",value:queue.total,foot:"Sélection de cette session",Icon:UploadCloud,tone:"green"},
    {key:"ready",label:"PRÊTS À TRAITER",value:queue.ready,foot:"Préflight validé",Icon:CheckCircle2,tone:"green"},
    {key:"failed",label:"ANOMALIES DU LOT",value:queue.failed,foot:"Erreurs de cette session",Icon:AlertTriangle,tone:"red"}
   ].map(item=><article className={s.kpi} data-tone={item.tone} key={item.key}><span className={s.kpiIcon}><item.Icon size={23}/></span><div><small>{item.label}</small><strong>{fmt(item.value)}</strong><em>{item.foot}</em></div></article>)}
  </section>
  <section id="media-import-r6" className={s.ingestion} aria-label="Studio d'import média">
   <div className={s.sectionHeader}><div><span className={s.sectionEyebrow}>INGESTION STUDIO · CONTRÔLE DE SOURCE</span><h2>Import de médias & préflight professionnel</h2><p>Sélectionnez fichiers, dossier complet ou manifeste. Les contrôles de doublons précèdent toute modification.</p></div><div className={s.batchPulse}><span>{queue.total?queue.progress+" %":"Aucun lot"}</span><div><i style={{width:queue.progress+"%"}}/></div><small>{queue.success} importés · {queue.uploading} en cours · {queue.failed} anomalies</small></div></div>
   <MediaLibraryStudio initialMedia={initialMedia} initialFolders={initialFolders} catalogItems={catalogItems} mode="command360" canManage={canManage} onQueueChange={onQueue} onMediaChange={onMediaChange}/>
  </section>
  <section id="media-r6-history" className={s.sessionNote}><div><Activity size={18}/><span><strong>Traçabilité de la session d'import</strong><small>{queue.total?queue.total+" fichiers sélectionnés · "+queue.success+" terminés · "+queue.failed+" en échec":"Aucune sélection active. L'historique serveur des actifs reste accessible dans le Vault."}</small></span></div><button onClick={()=>setRefreshKey(k=>k+1)}><RefreshCw size={14}/> Actualiser le vault</button></section>
  <MediaVault360 canManage={canManage} refreshKey={refreshKey} onInventory={onInventory} onChanged={onMediaChange}/>
  <footer className={s.footer}><ShieldCheck size={16}/> Actifs canoniques · Contrôles de droits · Aucune publication automatique · Identités et références préservées</footer>
 </div>;
}
