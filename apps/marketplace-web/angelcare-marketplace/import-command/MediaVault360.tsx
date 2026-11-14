"use client";

import {useCallback,useEffect,useMemo,useRef,useState,type ChangeEvent,type FormEvent} from "react";
import {Archive,ArrowLeft,ArrowRight,Check,CheckCircle2,ChevronDown,ChevronRight,Clipboard,Download,ExternalLink,FileImage,Filter,Folder,FolderOpen,FolderPlus,Grid2X2,Image as ImageIcon,Info,List,Loader2,MoreHorizontal,Move,RefreshCw,RotateCcw,Search,ShieldCheck,SlidersHorizontal,Tags,Trash2,UploadCloud,X} from "lucide-react";
import {normalizeNativeAsset,type NativeMediaAsset} from "../kidflix/native-media-vault-contract";
import {formatMarketplaceFileSize} from "../components/MarketplaceFilePicker";
import {sha256File} from "../commerce-studio/media-library-operations";
import s from "./media-vault-r6.module.css";

const ROOT="/api/angelcare-marketplace/admin/imports/media/vault";
const COMMERCE="/api/angelcare-marketplace/admin/commerce";
type FolderRow={id:string;name:string;slug:string;parent_id:string|null;status:string;item_count:number|null};
type FolderResult={rows:FolderRow[];total:number;complete:boolean};
type MediaResult={rows:Record<string,unknown>[];total:number;inventoryTotal:number;page:number;pageSize:number};
type MediaDetail={id:string;file_name:string;asset_key:string;media_type:string;public_url:string;desktop_url:string;size_bytes:number;mime_type:string;folder_id:string|null;alt_text_fr:string;alt_text_en:string|null;alt_text_ar:string|null;rights_status:string;rights_expires_at:string|null;status:string;updated_at?:string;metadata:Record<string,unknown>};
type ActionResult={record:MediaDetail};
type Usage={source:string;object_id:string;slot_key:string;label:string;object_type:string};
type Props={canManage:boolean;refreshKey:number;onInventory:(stats:{assets:number|null;folders:number|null;matched:number|null})=>void;onChanged:()=>void};
type FilterState={q:string;folderId:string;mime:string;status:string;rights:string;used:string;recentMinutes:string;dateField:string;orientation:string;ratio:string;processing:string;category:string;collection:string;language:string;tag:string;uploader:string;minWidth:string;minHeight:string;minSize:string;maxSize:string;hasAlt:boolean;readyOnly:boolean;publishedSafe:boolean;includeChildren:boolean;sort:string};
const empty:FilterState={q:"",folderId:"",mime:"",status:"all",rights:"",used:"",recentMinutes:"",dateField:"created",orientation:"",ratio:"",processing:"",category:"",collection:"",language:"",tag:"",uploader:"",minWidth:"",minHeight:"",minSize:"",maxSize:"",hasAlt:false,readyOnly:false,publishedSafe:false,includeChildren:true,sort:"recent"};
const fmt=(n:number)=>new Intl.NumberFormat("fr-FR").format(n);
const date=(v:unknown)=>v&&!Number.isNaN(Date.parse(String(v)))?new Date(String(v)).toLocaleString("fr-FR"):"—";
function errorOf(e:unknown){return e instanceof Error?e.message:"Opération indisponible."}
async function get<T>(url:string,signal?:AbortSignal):Promise<T>{
 const response=await fetch(url,{cache:"no-store",credentials:"same-origin",signal});
 const json=await response.json().catch(()=>({})) as {data?:T;error?:{message?:string}};
 if(!response.ok||!json.data)throw Error(json.error?.message||"Media Vault inaccessible.");
 return json.data;
}
async function mutate<T>(url:string,method:string,body?:unknown):Promise<T>{
 const res=await fetch(url,{method,credentials:"same-origin",headers:body===undefined?undefined:{"Content-Type":"application/json"},body:body===undefined?undefined:JSON.stringify(body)});
 const json=await res.json().catch(()=>({})) as {data?:T;error?:{message?:string}};
 if(!res.ok||json.data===undefined)throw Error(json.error?.message||"Modification non confirmée.");
 return json.data;
}
function FolderItem({folder,depth,active,onChoose}:{folder:FolderRow;depth:number;active:boolean;onChoose:(v:string)=>void}){
 return <button type="button" className={s.folderItem} data-active={active} style={{paddingLeft:Math.min(7,depth)*13+10}} onClick={()=>onChoose(folder.id)}><Folder size={15}/><span>{folder.name}</span></button>
}
export function MediaVault360({canManage,refreshKey,onInventory,onChanged}:Props){
 const [filter,setFilter]=useState<FilterState>(empty);
 const [debounced,setDebounced]=useState("");
 const [page,setPage]=useState(1),[pageSize,setPageSize]=useState<20|100|500>(100);
 const [grid,setGrid]=useState(true),[advanced,setAdvanced]=useState(false),[folderOpen,setFolderOpen]=useState(true);
 const [folders,setFolders]=useState<FolderRow[]>([]),[folderTotal,setFolderTotal]=useState<number|null>(null);
 const [folderError,setFolderError]=useState(""),[folderLoading,setFolderLoading]=useState(true);
 const [data,setData]=useState<MediaResult|null>(null),[loading,setLoading]=useState(true);
 const [error,setError]=useState(""),[notice,setNotice]=useState(""),[tick,setTick]=useState(0);
 const [selected,setSelected]=useState<Record<string,NativeMediaAsset>>({});
 const [focused,setFocused]=useState<NativeMediaAsset|null>(null);
 const [detail,setDetail]=useState<MediaDetail|null>(null),[detailError,setDetailError]=useState("");
 const [usages,setUsages]=useState<Usage[]>([]),[usageLoading,setUsageLoading]=useState(false);
 const [tab,setTab]=useState<"detail"|"languages"|"rights"|"usages">("detail");
 const [busy,setBusy]=useState(false),[moveFolder,setMoveFolder]=useState(""),[creatingFolder,setCreatingFolder]=useState(false);
 const replaceInput=useRef<HTMLInputElement>(null),serial=useRef(0);
 const set=(key:keyof FilterState,value:string|boolean)=>{setFilter(f=>({...f,[key]:value}));setPage(1)};
 const refresh=()=>setTick(x=>x+1);
 const folderMap=useMemo(()=>new Map(folders.map(x=>[x.id,x])),[folders]);
 const folderPaths=useMemo(()=>{
  const cache=new Map<string,{depth:number;path:string}>();
  function walk(id:string,seen=new Set<string>()):{depth:number;path:string}{
   if(cache.has(id))return cache.get(id)!;
   const node=folderMap.get(id);
   if(!node||seen.has(id))return {depth:0,path:node?.name||"Dossier inconnu"};
   seen.add(id);
   const parent=node.parent_id&&folderMap.has(node.parent_id)?walk(node.parent_id,seen):null;
   seen.delete(id);
   const result={depth:Math.min(20,(parent?.depth??-1)+1),path:parent?.path?parent.path+" / "+node.name:node.name};
   cache.set(id,result);return result;
  }
  for(const f of folders)walk(f.id);
  return cache;
 },[folders,folderMap]);
 const sortedFolders=useMemo(()=>folders.slice().sort((a,b)=>(folderPaths.get(a.id)?.path||a.name).localeCompare(folderPaths.get(b.id)?.path||b.name)),[folders,folderPaths]);
 useEffect(()=>{const t=setTimeout(()=>setDebounced(filter.q.trim()),280);return()=>clearTimeout(t)},[filter.q]);
 useEffect(()=>{
  let cancelled=false;
  async function loadFolders(){
   setFolderLoading(true);setFolderError("");
   try{
    const result:FolderRow[]=[];let total=0;
    for(let p=1;p<=100;p++){
     const payload=await get<FolderResult>(ROOT+"?op=folders&page="+p);
     if(cancelled)return;
     result.push(...payload.rows);total=payload.total;
     if(payload.complete)break;
     if(p===100)throw Error("Le répertoire dépasse la limite de pagination. Réessayez.");
    }
    if(!cancelled){setFolders(result);setFolderTotal(total)}
   }catch(e){if(!cancelled)setFolderError(errorOf(e))}
   finally{if(!cancelled)setFolderLoading(false)}
  }
  void loadFolders();
  return()=>{cancelled=true};
 },[refreshKey,tick]);
 const filterParams=useMemo(()=>{
  const params=new URLSearchParams({op:"media",page:String(page),pageSize:String(pageSize),sort:filter.sort,includeChildren:String(filter.includeChildren)});
  const vals:{[key:string]:string}={
   q:debounced,folderId:filter.folderId,mime:filter.mime,status:filter.status,
   rights:filter.rights,used:filter.used,recentMinutes:filter.recentMinutes,dateField:filter.dateField,
   orientation:filter.orientation,ratio:filter.ratio,processing:filter.processing,category:filter.category,
   collection:filter.collection,language:filter.language,tag:filter.tag,uploader:filter.uploader,
   minWidth:filter.minWidth,minHeight:filter.minHeight,minSize:filter.minSize,maxSize:filter.maxSize,
   hasAlt:String(filter.hasAlt),readyOnly:String(filter.readyOnly),publishedSafe:String(filter.publishedSafe)
  };
  for(const [key,value] of Object.entries(vals))if(value&&value!=="false"&&value!=="all")params.set(key,value);
  return params.toString();
 },[page,pageSize,filter,debounced]);
 useEffect(()=>{
  const controller=new AbortController(),id=++serial.current;
  setLoading(true);setError("");
  get<MediaResult>(ROOT+"?"+filterParams,controller.signal).then(next=>{
   if(id!==serial.current)return;
   setData(next);onInventory({assets:next.inventoryTotal,folders:folderTotal,matched:next.total});
  }).catch(e=>{if(!controller.signal.aborted&&id===serial.current)setError(errorOf(e))}).finally(()=>{if(id===serial.current)setLoading(false)});
  return()=>controller.abort();
 },[filterParams,refreshKey,tick,onInventory,folderTotal]);
 const rows=useMemo(()=>data?.rows.map(normalizeNativeAsset)||[],[data]);
 const pages=Math.max(1,Math.ceil((data?.total||0)/pageSize));
 const selection=Object.values(selected);
 const select=(a:NativeMediaAsset,checked:boolean)=>setSelected(prev=>{const x={...prev};if(checked)x[a.id]=a;else delete x[a.id];return x});
 const setFocus=useCallback(async(a:NativeMediaAsset)=>{
  setFocused(a);setDetail(null);setDetailError("");setUsages([]);setTab("detail");setMoveFolder(a.folderId||"");
  try{setDetail(await get<MediaDetail>(COMMERCE+"/media/"+encodeURIComponent(a.id)))}catch(e){setDetailError(errorOf(e))}
 },[]);
 useEffect(()=>{if(!focused)return;let cancelled=false;setUsageLoading(true);
  get<Usage[]>("/api/angelcare-marketplace/admin/media/"+encodeURIComponent(focused.id)+"/usage")
  .then(v=>{if(!cancelled)setUsages(v)}).catch(e=>{if(!cancelled)setDetailError(errorOf(e))})
  .finally(()=>{if(!cancelled)setUsageLoading(false)});return()=>{cancelled=true}
 },[focused?.id]);
 async function operation(callback:()=>Promise<void>){
  setBusy(true);setError("");setNotice("");
  try{await callback();refresh();onChanged()}catch(e){setError(errorOf(e))}finally{setBusy(false)}
 }
 async function save(e:FormEvent<HTMLFormElement>){
  e.preventDefault();if(!canManage||!focused)return;
  const f=new FormData(e.currentTarget);
  await operation(async()=>{
   const payload={alt_text_fr:String(f.get("alt_text_fr")||""),alt_text_en:String(f.get("alt_text_en")||""),alt_text_ar:String(f.get("alt_text_ar")||""),
    folder_id:String(f.get("folder_id")||"")||null,rights_status:String(f.get("rights_status")||"owned")};
   const updated=await mutate<ActionResult>(COMMERCE+"/media/"+encodeURIComponent(focused.id),"PATCH",payload);
   setDetail(updated.record);setNotice("Métadonnées enregistrées, contrôlées et relues.");
  })
 }
 async function bulkMove(){
  if(!canManage||!selection.length)return;
  const destination=moveFolder||null;
  if(!window.confirm("Déplacer "+selection.length+" média(s) vers "+(folderMap.get(moveFolder)?.name||"la racine")+" ?"))return;
  await operation(async()=>{
   let success=0;const failed:string[]=[];
   // Bounded requests: avoid an unbounded Promise.all for large selections.
   for(let i=0;i<selection.length;i+=3){
    const outcomes=await Promise.allSettled(selection.slice(i,i+3).map(a=>mutate<ActionResult>(COMMERCE+"/media/"+encodeURIComponent(a.id),"PATCH",{folder_id:destination})));
    outcomes.forEach((out,j)=>{if(out.status==="fulfilled")success++;else failed.push(selection[i+j].fileName)});
   }
   if(failed.length)throw Error(success+" déplacements réussis, "+failed.length+" échecs: "+failed.slice(0,5).join(", "));
   setNotice(success+" médias déplacés.");setSelected({});
  })
 }
 async function archive(){
  if(!canManage||!selection.length||!window.confirm("Archiver "+selection.length+" média(s) ? Le serveur bloquera tous les médias référencés."))return;
  await operation(async()=>{
   let success=0,blocked=0,failed=0;const blockedIds:string[]=[];
   for(let i=0;i<selection.length;i+=50){
    const batch=await mutate<{archived:number;blocked:number;failed:number;results:{id:string;state:string;reason:string}[]}>(
      "/api/angelcare-marketplace/admin/imports/media/archive","POST",
      {ids:selection.slice(i,i+50).map(a=>a.id)});
    success+=batch.archived;blocked+=batch.blocked;failed+=batch.failed;
    blockedIds.push(...batch.results.filter(x=>x.state!=="archived").map(x=>x.id));
   }
   setNotice(success+" archivés · "+blocked+" protégés par des usages · "+failed+" erreurs.");
   setSelected(previous=>Object.fromEntries(Object.entries(previous).filter(([id])=>blockedIds.includes(id))));
  })
 }
 async function bulkMetadata(mode:"alt"|"tag"){
  if(!canManage||!selection.length)return;
  if(selection.length>100){setError("Sélectionnez au maximum 100 actifs par action de masse.");return;}
  const value=window.prompt(mode==="alt"?"Texte alternatif français commun (1–400 caractères) :":"Étiquette à ajouter (1–60 caractères) :");
  if(value===null)return;
  const text=value.trim();
  if(text.length<1||text.length>(mode==="alt"?400:60)) {setError("Texte de métadonnées invalide.");return;}
  if(!window.confirm("Appliquer la mise à jour à "+selection.length+" actif(s) ?"))return;
  await operation(async()=>{
   let updated=0;const errors:string[]=[];
   for(let i=0;i<selection.length;i+=3){
    const wave=await Promise.allSettled(selection.slice(i,i+3).map(async a=>{
      const original=await get<MediaDetail>(COMMERCE+"/media/"+encodeURIComponent(a.id));
      const payload=mode==="alt"
        ?{alt_text_fr:text}
        :{metadata:{...(original.metadata||{}),tags:[...new Set([...(Array.isArray(original.metadata?.tags)?original.metadata.tags.map(String):[]),text])]}};
      await mutate<ActionResult>(COMMERCE+"/media/"+encodeURIComponent(a.id),"PATCH",payload);
    }));
    wave.forEach((r,j)=>{if(r.status==="fulfilled")updated++;else errors.push(selection[i+j].fileName)});
   }
   setNotice(updated+" métadonnées mises à jour.");
   if(errors.length)setError(errors.length+" médias à réexaminer: "+errors.slice(0,6).join(", "));
   setSelected({});
  })
 }
 async function createFolder(e:FormEvent<HTMLFormElement>){
  e.preventDefault();if(!canManage)return;
  const data=new FormData(e.currentTarget);
  await operation(async()=>{
   const name=String(data.get("name")||"").trim();
   if(name.length<2||name.length>100)throw Error("Nom de dossier invalide.");
   await mutate<{record:FolderRow}>(COMMERCE+"/media-folders","POST",{name,parent_id:filter.folderId||null,status:"active"});
   setCreatingFolder(false);setNotice("Dossier natif créé.");refresh();
  })
 }
 async function replaceAsset(file:File){
  if(!focused||!detail||!canManage)return;
  if(file.size>40*1024*1024||file.size<=0)throw Error("Fichier vide ou supérieur à 40 Mo.");
  if(!window.confirm("Remplacer le binaire de "+detail.file_name+" en conservant les références natives ?"))return;
  await operation(async()=>{
   const sha=await sha256File(file);
   const session=await mutate<{assetId:string;uploadUrl:string;completionUrl:string;headers?:Record<string,string>;method?:string}>("/api/angelcare-marketplace/admin/media/upload-session","POST",
    {fileName:file.name,mimeType:file.type,sizeBytes:file.size,folderId:detail.folder_id,altTextFr:detail.alt_text_fr,replaceAssetId:detail.id});
   const upload=await fetch(session.uploadUrl,{method:session.method||"PUT",headers:session.headers||{"content-type":file.type},body:file});
   if(!upload.ok)throw Error("Transfert du fichier refusé : "+upload.status);
   const result=await mutate<MediaDetail>(session.completionUrl,"POST",
    {fileName:file.name,mimeType:file.type,sizeBytes:file.size,checksumSha256:sha,folderId:detail.folder_id,altTextFr:detail.alt_text_fr});
   setDetail(result);setNotice("Fichier remplacé. Vérifiez les usages et la livraison avant publication.");
  })
 }
 async function deletePermanently(){
  if(!focused||!canManage||!detail)return;
  if(usageLoading||usages.length){setError("Suppression refusée : références existantes ou vérification des usages non terminée.");return;}
  const reason=window.prompt("Motif d'audit obligatoire pour supprimer définitivement « "+focused.fileName+" » :");
  if(!reason||reason.trim().length<8){setError("Motif d'audit de 8 caractères minimum requis.");return;}
  if(!window.confirm("SUPPRIMER DÉFINITIVEMENT ce fichier ? Cette action ne peut pas être annulée."))return;
  await operation(async()=>{
   const response=await mutate<{deleted:boolean}>(
    "/api/angelcare-marketplace/admin/media/"+encodeURIComponent(focused.id)+"/permanent-delete",
    "POST",{confirmation:"SUPPRIMER DÉFINITIVEMENT",reason:reason.trim()});
   if(!response.deleted)throw Error("La suppression n'a pas été confirmée.");
   setFocused(null);setDetail(null);setSelected(prev=>{const updated={...prev};delete updated[focused.id];return updated});
   setNotice("Suppression définitive confirmée et journalisée.");
  })
 }
 const exportSelection=()=>{
  const payload=selection.map(x=>({id:x.id,fileName:x.fileName,assetKey:x.assetKey,folder:x.folderName,rights:x.rights,usageCount:x.usageCount,url:x.url}));
  const link=document.createElement("a"),url=URL.createObjectURL(new Blob([JSON.stringify(payload,null,2)],{type:"application/json"}));
  link.href=url;link.download="angelcare-media-selection.json";link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
 };
 return <section id="media-vault-r6" className={s.root}>
   <div className={s.heading}><div><div className={s.eyebrow}><FolderOpen size={17}/> BIBLIOTHÈQUE NATIVE · AUTHORITY MEDIA</div><h2>EXPLORATEUR DU MEDIA VAULT NATIF</h2><p>Toute la médiathèque · dossiers hiérarchiques · filtres globaux · actions gouvernées</p></div><div className={s.headingActions}><button type="button" onClick={refresh} disabled={loading}><RefreshCw size={15}/> Actualiser</button><span>{data?fmt(data.inventoryTotal)+" actifs inventoriés":"Inventaire en chargement"}</span></div></div>
   <div className={s.toolbar}>
    <label className={s.search}><Search size={18}/><input aria-label="Rechercher dans tout le vault" placeholder="Rechercher nom, asset_key, référence, alt..." value={filter.q} onChange={e=>set("q",e.target.value)}/></label>
    <select aria-label="Types de médias" value={filter.mime} onChange={e=>set("mime",e.target.value)}><option value="">Tous types</option><option value="image">Images</option><option value="video">Vidéos</option><option value="application">Documents</option><option value="audio">Audio</option></select>
    <select aria-label="Droits" value={filter.rights} onChange={e=>set("rights",e.target.value)}><option value="">Tous droits</option>{["owned","licensed","approved","restricted","expired"].map(x=><option key={x}>{x}</option>)}</select>
    <select aria-label="Période" value={filter.recentMinutes} onChange={e=>set("recentMinutes",e.target.value)}><option value="">Toutes dates</option><option value="2">2 minutes</option><option value="5">5 minutes</option><option value="60">1 heure</option><option value="1440">24 heures</option><option value="10080">7 jours</option><option value="43200">30 jours</option></select>
    <select aria-label="Statut" value={filter.status} onChange={e=>set("status",e.target.value)}><option value="all">Tous statuts</option><option value="active">Actif</option><option value="draft">Brouillon</option><option value="failed">Échec</option><option value="archived">Archivé</option></select>
    <select aria-label="Utilisation" value={filter.used} onChange={e=>set("used",e.target.value)}><option value="">Toute utilisation</option><option value="used">Utilisés</option><option value="unused">Inutilisés</option></select>
    <button type="button" data-active={advanced} onClick={()=>setAdvanced(v=>!v)}><SlidersHorizontal size={15}/> Filtres {advanced?"−":"+"}</button>
    <div className={s.pageSize}><span>Résultats</span>{([20,100,500] as const).map(n=><button key={n} data-active={pageSize===n} onClick={()=>{setPageSize(n);setPage(1)}}>{n}</button>)}</div>
    <div className={s.views}><button aria-label="Vue grille" data-active={grid} onClick={()=>setGrid(true)}><Grid2X2 size={17}/></button><button aria-label="Vue liste" data-active={!grid} onClick={()=>setGrid(false)}><List size={17}/></button></div>
   </div>
   {advanced?<div className={s.advanced}>
     <label>Orientation<select value={filter.orientation} onChange={e=>set("orientation",e.target.value)}><option value="">Toutes</option><option value="square">Carré</option><option value="landscape">Paysage</option><option value="portrait">Portrait</option></select></label>
     <label>Ratio<select value={filter.ratio} onChange={e=>set("ratio",e.target.value)}><option value="">Tous</option>{["1:1","16:9","4:3","3:4","9:16"].map(x=><option key={x}>{x}</option>)}</select></label>
     <label>Traitement<input value={filter.processing} onChange={e=>set("processing",e.target.value)} placeholder="ready / failed..."/></label>
     <label>Collection<input value={filter.collection} onChange={e=>set("collection",e.target.value)} placeholder="Collection"/></label>
     <label>Catégorie<input value={filter.category} onChange={e=>set("category",e.target.value)} placeholder="Catégorie"/></label>
     <label>Langue<input value={filter.language} onChange={e=>set("language",e.target.value)} placeholder="fr / en / ar"/></label>
     <label>Tag<input value={filter.tag} onChange={e=>set("tag",e.target.value)} placeholder="Tag"/></label>
     <label>Importateur<input value={filter.uploader} onChange={e=>set("uploader",e.target.value)} placeholder="Compte"/></label>
     <label>Min. largeur<input type="number" min="0" value={filter.minWidth} onChange={e=>set("minWidth",e.target.value)}/></label>
     <label>Min. hauteur<input type="number" min="0" value={filter.minHeight} onChange={e=>set("minHeight",e.target.value)}/></label>
     <label>Taille min. (octets)<input type="number" min="0" value={filter.minSize} onChange={e=>set("minSize",e.target.value)}/></label>
     <label>Taille max. (octets)<input type="number" min="0" value={filter.maxSize} onChange={e=>set("maxSize",e.target.value)}/></label>
     <label>Tri<select value={filter.sort} onChange={e=>set("sort",e.target.value)}><option value="recent">Plus récents</option><option value="updated">Modifiés récemment</option><option value="name-asc">Nom A–Z</option><option value="name-desc">Nom Z–A</option><option value="largest">Plus volumineux</option><option value="smallest">Moins volumineux</option></select></label>
     <label>Date sur<select value={filter.dateField} onChange={e=>set("dateField",e.target.value)}><option value="created">Importation</option><option value="updated">Modification</option></select></label>
     <label className={s.checkbox}><input type="checkbox" checked={filter.hasAlt} onChange={e=>set("hasAlt",e.target.checked)}/> Avec texte alternatif</label>
     <label className={s.checkbox}><input type="checkbox" checked={filter.readyOnly} onChange={e=>set("readyOnly",e.target.checked)}/> Prêts</label>
     <label className={s.checkbox}><input type="checkbox" checked={filter.publishedSafe} onChange={e=>set("publishedSafe",e.target.checked)}/> Éligibles publication</label>
     <button onClick={()=>{setFilter(empty);setPage(1)}}><X size={14}/> Réinitialiser</button>
    </div>:null}
   {error?<div className={s.error} role="alert">{error}<button onClick={()=>setError("")}><X size={14}/></button></div>:null}
   {notice?<div className={s.notice} role="status"><CheckCircle2 size={15}/>{notice}<button onClick={()=>setNotice("")}><X size={14}/></button></div>:null}
   <div className={s.columns}>
    <aside className={s.tree}><div className={s.treeTop}><button onClick={()=>setFolderOpen(v=>!v)} aria-expanded={folderOpen}>{folderOpen?<ChevronDown size={15}/>:<ChevronRight size={15}/>} DOSSIERS</button>{canManage?<button title="Créer un dossier" onClick={()=>setCreatingFolder(true)}><FolderPlus size={16}/></button>:null}</div>
     {folderOpen?<><button className={s.folderItem} data-active={!filter.folderId} onClick={()=>set("folderId","")}><FolderOpen size={15}/> <span>Tous les médias</span><b>{data?fmt(data.inventoryTotal):"—"}</b></button>
       {folderLoading?<div className={s.treeStatus}><Loader2 size={14}/> Chargement des dossiers…</div>:null}
       {folderError?<p className={s.error}>{folderError}</p>:null}
       <div className={s.folderScroll}>{sortedFolders.map(f=><FolderItem key={f.id} folder={f} depth={folderPaths.get(f.id)?.depth||0} active={filter.folderId===f.id} onChoose={id=>set("folderId",id)}/>)}</div>
       <label className={s.checkLine}><input type="checkbox" checked={filter.includeChildren} onChange={e=>set("includeChildren",e.target.checked)}/> Inclure les sous-dossiers</label>
       <div className={s.folderFooter}>{folderTotal===null?"Dossiers non vérifiés":fmt(folderTotal)+" dossiers natifs"} · hiérarchie source</div>
      </>:null}
     <button className={s.advancedLink} onClick={()=>setAdvanced(v=>!v)}><Filter size={15}/> {advanced?"Masquer":"Afficher"} les filtres avancés <ChevronRight size={15}/></button>
    </aside>
    <div className={s.catalog}>
     <div className={s.selectionBar}><label><input type="checkbox" aria-label="Sélectionner la page" checked={rows.length>0&&rows.every(x=>Boolean(selected[x.id]))} onChange={e=>setSelected(prev=>{const next={...prev};for(const a of rows){if(e.target.checked)next[a.id]=a;else delete next[a.id]}return next})}/><strong>{fmt(selection.length)} sélectionné(s)</strong></label>
      <div className={s.bulkActions}><button disabled={!canManage||!selection.length||busy} onClick={()=>setCreatingFolder(true)}><FolderPlus size={14}/> Nouveau dossier</button>
       <select aria-label="Dossier de destination" value={moveFolder} onChange={e=>setMoveFolder(e.target.value)}><option value="">Racine</option>{sortedFolders.map(f=><option value={f.id} key={f.id}>{folderPaths.get(f.id)?.path||f.name}</option>)}</select>
       <button disabled={!canManage||!selection.length||busy} onClick={()=>void bulkMove()}><Move size={14}/> Déplacer</button>
       <button disabled={!canManage||!selection.length||busy} onClick={()=>void bulkMetadata("alt")}><Check size={14}/> Éditer alt FR</button>
       <button disabled={!canManage||!selection.length||busy} onClick={()=>void bulkMetadata("tag")}><Tags size={14}/> Étiqueter</button>
       <button disabled={!canManage||!selection.length||busy} onClick={()=>void archive()}><Archive size={14}/> Archiver</button>
       <button disabled={!selection.length} onClick={exportSelection}><Download size={14}/> Export</button>
      </div>
      <span>{data?fmt((page-1)*pageSize+Math.min(pageSize,rows.length))+" / "+fmt(data.total):"—"}</span>
     </div>
     {loading?<div className={s.catalogState}><Loader2 size={26}/> Recherche dans le vault…</div>:null}
     {!loading&&!rows.length?<div className={s.catalogState}><Search size={26}/> Aucun média correspondant. Modifiez les filtres ou vérifiez le dossier.</div>:null}
     <div className={grid?s.grid:s.list}>{rows.map(a=><article className={s.asset} key={a.id} data-selected={Boolean(selected[a.id])} data-focused={focused?.id===a.id}>
       <div className={s.preview}><button className={s.assetMain} onClick={()=>void setFocus(a)} aria-label={"Inspecter "+a.fileName}>{a.mime.startsWith("image/")&&a.url?<img src={a.url} alt={a.alt||a.fileName} loading="lazy"/>:<span className={s.fallback}><FileImage size={27}/>{a.mime||"Fichier"}</span>}</button><label className={s.assetCheck}><input type="checkbox" checked={Boolean(selected[a.id])} onChange={e=>select(a,e.target.checked)}/></label></div>
       <div className={s.assetInfo}><button title="Inspecter le média" onClick={()=>void setFocus(a)}><b>{a.fileName||a.assetKey}</b></button><small>{a.mime||"—"} · {formatMarketplaceFileSize(a.size)} {a.width&&a.height?" · "+a.width+"×"+a.height:""}</small><div><span data-active={a.status==="active"} className={s.state}>{a.status||"Inconnu"}</span><span className={s.uses}>{a.usageCount===null?"Usages —":fmt(a.usageCount)+" usages"}</span></div></div>
       <button className={s.assetMore} onClick={()=>void setFocus(a)} aria-label="Ouvrir l'inspecteur"><MoreHorizontal size={17}/></button>
      </article>)}</div>
     <div className={s.pagination}><span>Page {fmt(page)} / {fmt(pages)} · {data?fmt(data.total)+" résultats globaux":"Résultats non vérifiés"}</span><button disabled={page<=1||loading} onClick={()=>setPage(x=>x-1)}><ArrowLeft size={15}/> Précédent</button><button disabled={page>=pages||loading} onClick={()=>setPage(x=>x+1)}>Suivant <ArrowRight size={15}/></button></div>
    </div>
    <aside className={s.inspector}>
      {focused?<><div className={s.inspectorHeader}><strong>INSPECTEUR MEDIA 360</strong><button onClick={()=>{setFocused(null);setDetail(null)}} aria-label="Fermer"><X size={17}/></button></div>
        <div className={s.inspectorImage}>{focused.mime.startsWith("image/")&&focused.url?<img src={focused.url} alt={focused.alt||focused.fileName}/>:<FileImage size={40}/>}</div>
        <h3>{focused.fileName||focused.assetKey}</h3><span className={s.state} data-active={focused.status==="active"}>{focused.status||"Inconnu"}</span>
        <div className={s.inspectorTabs}>{([["detail","Détails"],["languages","Langues"],["rights","Droits"],["usages","Usages"]] as const).map(([v,label])=><button key={v} data-active={tab===v} onClick={()=>setTab(v)}>{label}</button>)}</div>
        {detailError?<div className={s.error}>{detailError}</div>:null}
        {tab==="detail"?<dl className={s.facts}><dt>Dossier média</dt><dd>{folderPaths.get(focused.folderId)?.path||"Racine"}</dd><dt>Dimensions</dt><dd>{focused.width||"—"} × {focused.height||"—"}</dd><dt>Format</dt><dd>{focused.mime||"—"}</dd><dt>Taille</dt><dd>{formatMarketplaceFileSize(focused.size)}</dd><dt>Asset key</dt><dd>{focused.assetKey}</dd><dt>Importé</dt><dd>{date(focused.createdAt)}</dd><dt>Dernière modification</dt><dd>{date(focused.updatedAt)}</dd></dl>:null}
        {tab==="rights"?<dl className={s.facts}><dt>Autorisation</dt><dd>{focused.rights||"Non renseignée"}</dd><dt>Expire</dt><dd>{date(focused.expiresAt)}</dd><dt>État de traitement</dt><dd>{focused.processingState||"Non renseigné"}</dd></dl>:null}
        {tab==="usages"?<div className={s.usages}>{usageLoading?<p>Inspection des références…</p>:usages.length?usages.map((u,i)=><div key={i}><b>{u.label}</b><small>{u.object_type} · {u.slot_key}</small></div>):<p>Aucune référence confirmée ou accès aux usages indisponible.</p>}</div>:null}
        {tab==="languages"?<div className={s.altPreview}><b>Texte alternatif actuel</b><p>{focused.alt||"Aucun texte alternatif présent dans la réponse du vault."}</p></div>:null}
        {detail&&canManage?<form className={s.edit} onSubmit={e=>void save(e)} key={detail.id+"-"+detail.updated_at}><h4>Modifier les métadonnées</h4>
         <label>Alt FR<input name="alt_text_fr" defaultValue={detail.alt_text_fr||""} required/></label>
         <label>Alt EN<input name="alt_text_en" defaultValue={detail.alt_text_en||""}/></label>
         <label>Alt AR<input name="alt_text_ar" defaultValue={detail.alt_text_ar||""}/></label>
         <label>Dossier<select name="folder_id" defaultValue={detail.folder_id||""}><option value="">Racine</option>{sortedFolders.map(x=><option key={x.id} value={x.id}>{folderPaths.get(x.id)?.path||x.name}</option>)}</select></label>
         <label>Droits<select name="rights_status" defaultValue={detail.rights_status||"owned"}>{["owned","licensed","public_domain","restricted","expired"].map(x=><option key={x}>{x}</option>)}</select></label>
         <button className={s.primary} disabled={busy} type="submit"><Check size={15}/> Enregistrer</button>
        </form>:null}
        <div className={s.inspectActions}><button onClick={()=>void navigator.clipboard.writeText(focused.assetKey)}><Clipboard size={14}/> Copier la clé</button><a href={focused.url} target="_blank" rel="noreferrer"><ExternalLink size={14}/> Aperçu</a>
        {canManage&&detail?<><input ref={replaceInput} type="file" accept="image/*,video/mp4,video/webm,application/pdf" className={s.fileHidden} onChange={(e:ChangeEvent<HTMLInputElement>)=>{const f=e.currentTarget.files?.[0];if(f)void replaceAsset(f);e.currentTarget.value=""}}/><button disabled={busy} onClick={()=>replaceInput.current?.click()}><RotateCcw size={14}/> Remplacer</button><button disabled={busy||usageLoading||usages.length>0} onClick={()=>void deletePermanently()}><Trash2 size={14}/> Supprimer (gouverné)</button></>:null}</div>
       </>:<div className={s.emptyInspector}><ImageIcon size={31}/><strong>Sélectionnez un média</strong><p>Inspectez ses dimensions, son fichier, ses droits et toutes ses références.</p></div>}
    </aside>
   </div>
   {creatingFolder?<div className={s.backdrop} onMouseDown={e=>{if(e.target===e.currentTarget)setCreatingFolder(false)}}><form className={s.modal} onSubmit={e=>void createFolder(e)}><div><h3>Créer un dossier natif</h3><button type="button" onClick={()=>setCreatingFolder(false)}><X size={18}/></button></div><p>Le dossier sera créé dans {folderMap.get(filter.folderId)?.name||"la racine"} et visible dans les autres consoles médias.</p><label>Nom du dossier<input name="name" autoFocus required minLength={2} maxLength={100}/></label><button className={s.primary} disabled={busy} type="submit"><FolderPlus size={15}/> Créer ce dossier</button></form></div>:null}
 </section>;
}
