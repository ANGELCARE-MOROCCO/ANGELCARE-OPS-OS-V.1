"use client"
import { useEffect, useMemo, useRef, useState } from "react"
import {
  Archive, BarChart3, Check, ChevronRight, FolderKanban, FolderPlus, Grid2X2, HardDrive, Heart,
  Images, Layers3, PencilLine, Plus, RefreshCw, RotateCcw, Search, Tags, Trash2, UploadCloud, Video, X,
} from "lucide-react"
import SovereignModal from "./SovereignModal"
import styles from "./MediaVaultWorkspace.module.css"
import type { SocialBootstrap, SocialCampaign, SocialMediaAsset } from "@/lib/social-command/types"
import type { MediaVaultAsset, MediaVaultBootstrap, MediaVaultCategory, MediaVaultCollection } from "@/lib/social-command/media-vault-types"

type View="library"|"categories"|"collections"|"archive"|"trash"|"usage"
type Props={data:SocialBootstrap;onUpload:(files:File[])=>Promise<SocialMediaAsset[]>;onComposer:(format:"post"|"story"|"reel"|"carousel")=>void;selected:string[];setSelected:(value:any)=>void}
const fmtBytes=(v:number)=>{if(!v)return"0 B";const u=["B","KB","MB","GB","TB"];let i=0,n=v;while(n>=1024&&i<u.length-1){n/=1024;i++}return `${n.toFixed(i>1?1:0)} ${u[i]}`}
const date=(v:string)=>new Date(v).toLocaleString("fr-FR",{day:"2-digit",month:"short",year:"2-digit",hour:"2-digit",minute:"2-digit"})
async function mv(path:string,init?:RequestInit){const r=await fetch(`/api/social-command/media-vault/${path}`,{...init,headers:{...(init?.body?{"content-type":"application/json"}:{}),...(init?.headers||{})},cache:"no-store"});const p=await r.json().catch(()=>({ok:false,error:`HTTP ${r.status}`}));if(!r.ok||p?.ok===false)throw new Error(p?.error||`HTTP ${r.status}`);return p.data}

export default function MediaVaultWorkspace({data,onUpload,onComposer,selected,setSelected}:Props){
  const [view,setView]=useState<View>("library"),[library,setLibrary]=useState<MediaVaultBootstrap|null>(null),[loading,setLoading]=useState(true),[error,setError]=useState(""),[q,setQ]=useState(""),[categoryId,setCategoryId]=useState(""),[collectionId,setCollectionId]=useState(""),[campaignId,setCampaignId]=useState(""),[kind,setKind]=useState(""),[favorite,setFavorite]=useState(false),[detail,setDetail]=useState<MediaVaultAsset|null>(null),[editor,setEditor]=useState<MediaVaultAsset|null>(null),[taxonomy,setTaxonomy]=useState<{kind:"category"|"collection";row:MediaVaultCategory|MediaVaultCollection|null}|null>(null),[bulkCategory,setBulkCategory]=useState(""),[bulkCollection,setBulkCollection]=useState("")
  const fileRef=useRef<HTMLInputElement|null>(null)
  const refresh=async()=>{setLoading(true);setError("");try{const p=new URLSearchParams();p.set("lifecycle",view==="trash"?"trashed":view==="archive"?"archived":"active");if(q)p.set("q",q);if(categoryId)p.set("categoryId",categoryId);if(collectionId)p.set("collectionId",collectionId);if(campaignId)p.set("campaignId",campaignId);if(kind)p.set("kind",kind);if(favorite)p.set("favorite","true");setLibrary(await mv(`library?${p.toString()}`))}catch(e){setError(e instanceof Error?e.message:String(e))}finally{setLoading(false)}}
  useEffect(()=>{const t=window.setTimeout(()=>void refresh(),q?250:0);return()=>window.clearTimeout(t)},[view,q,categoryId,collectionId,campaignId,kind,favorite])
  const open=async(id:string)=>{try{setDetail(await mv(`items/${id}`))}catch(e){setError(e instanceof Error?e.message:String(e))}}
  const act=async(path:string,body:Record<string,unknown>={})=>{setError("");try{await mv(path,{method:"POST",body:JSON.stringify(body)});setDetail(null);setEditor(null);await refresh()}catch(e){setError(e instanceof Error?e.message:String(e));throw e}}
  const patch=async(path:string,body:Record<string,unknown>)=>{setError("");try{await mv(path,{method:"PATCH",body:JSON.stringify(body)});await refresh()}catch(e){setError(e instanceof Error?e.message:String(e));throw e}}
  const bulk=async(action:string,extra:Record<string,unknown>={})=>{if(!selected.length)return;try{await act("bulk-action",{action,assetIds:selected,...extra});setSelected([])}catch{/* error already surfaced */}}
  const importMedia=async(files:File[])=>{if(!files.length)return;setError("");try{const created=await onUpload(files);const classify:Record<string,unknown>={};if(categoryId)classify.categoryIds=[categoryId];if(collectionId)classify.collectionIds=[collectionId];if(campaignId)classify.campaignId=campaignId;if(Object.keys(classify).length){for(const asset of created)await mv(`items/${asset.id}`,{method:"PATCH",body:JSON.stringify(classify)})}await refresh()}catch(e){setError(e instanceof Error?e.message:String(e))}}
  const toggle=(id:string)=>setSelected((v:string[])=>v.includes(id)?v.filter(x=>x!==id):[...v,id])
  const stats=library?.stats
  return <div className={styles.shell}>
    <header className={styles.hero}><div className={styles.heroIcon}><HardDrive/></div><div><span>ANGELCARE · DIGITAL ASSET GOVERNANCE</span><h2>Media Vault</h2><p>One Windows-backed asset estate with real taxonomy, collections, lifecycle control and Studio synchronization.</p></div><aside><button onClick={()=>fileRef.current?.click()}><UploadCloud/>Import media</button><input ref={fileRef} hidden multiple type="file" accept="image/*,video/*" onChange={e=>{const files=Array.from(e.target.files||[]);e.currentTarget.value="";void importMedia(files)}}/><button onClick={()=>setTaxonomy({kind:"category",row:null})}><FolderPlus/>New category</button><button onClick={()=>void refresh()}><RefreshCw/></button></aside></header>
    <section className={styles.stats}>{[[stats?.active||0,"ACTIVE",Grid2X2],[stats?.ready||0,"READY",Check],[stats?.categories||0,"CATEGORIES",FolderKanban],[stats?.collections||0,"COLLECTIONS",Layers3],[stats?.favorites||0,"FAVORITES",Heart],[fmtBytes(stats?.bytes||0),"INDEXED",HardDrive]].map(([value,label,Icon]:any)=><article key={label}><Icon/><div><b>{value}</b><span>{label}</span></div></article>)}</section>
    <nav className={styles.views}>{[["library","LIBRARY",Grid2X2],["categories","CATEGORIES",FolderKanban],["collections","COLLECTIONS",Layers3],["usage","USAGE",BarChart3],["archive","ARCHIVE",Archive],["trash","TRASH",Trash2]].map(([id,label,Icon]:any)=><button key={id} className={view===id?styles.activeView:""} onClick={()=>{setView(id);setSelected([])}}><Icon/>{label}</button>)}</nav>
    {error?<div className={styles.error}>{error}</div>:null}
    {view==="library"||view==="archive"||view==="trash"?<>
      <section className={styles.filters}><label><Search/><input value={q} onChange={e=>setQ(e.target.value)} placeholder="Search media, tags, category, collection…"/></label><select value={categoryId} onChange={e=>setCategoryId(e.target.value)}><option value="">All categories</option>{(library?.categories||[]).filter(c=>c.status==="active").map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select><select value={collectionId} onChange={e=>setCollectionId(e.target.value)}><option value="">All collections</option>{(library?.collections||[]).filter(c=>c.status==="active").map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select><select value={campaignId} onChange={e=>setCampaignId(e.target.value)}><option value="">All campaigns</option>{data.campaigns.map((c:SocialCampaign)=><option key={c.id} value={c.id}>{c.title}</option>)}</select><select value={kind} onChange={e=>setKind(e.target.value)}><option value="">All media</option><option value="image">Images</option><option value="video">Videos</option></select><button className={favorite?styles.filterOn:""} onClick={()=>setFavorite(v=>!v)}><Heart/>Favorites</button></section>
      {selected.length?<div className={styles.bulk}><b>{selected.length} SELECTED</b>{view==="trash"?<button onClick={()=>bulk("restore")}><RotateCcw/>Restore</button>:view==="archive"?<><button onClick={()=>bulk("restore")}><RotateCcw/>Restore</button><button onClick={()=>bulk("trash")}><Trash2/>Trash</button></>:<><select value={bulkCategory} onChange={e=>setBulkCategory(e.target.value)}><option value="">Category…</option>{(library?.categories||[]).filter(c=>c.status==="active").map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select><select value={bulkCollection} onChange={e=>setBulkCollection(e.target.value)}><option value="">Collection…</option>{(library?.collections||[]).filter(c=>c.status==="active").map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select><button disabled={!bulkCategory&&!bulkCollection} onClick={()=>bulk("classify",{...(bulkCategory?{categoryIds:[bulkCategory]}:{}),...(bulkCollection?{collectionIds:[bulkCollection]}:{})})}><Tags/>Classify</button><button onClick={()=>bulk("archive")}><Archive/>Archive</button><button onClick={()=>bulk("trash")}><Trash2/>Trash</button><button onClick={()=>onComposer("post")}><Plus/>Create post</button></>}<button onClick={()=>setSelected([])}><X/>Clear</button></div>:null}
      <section className={styles.grid}>{loading?<State icon={<RefreshCw/>} title="Synchronizing Windows asset index…"/>:(library?.assets||[]).length?(library?.assets||[]).map((asset,i)=><AssetCard key={asset.id} asset={asset} index={i} selected={selected.includes(asset.id)} onToggle={()=>toggle(asset.id)} onOpen={()=>open(asset.id)} onEdit={()=>setEditor(asset)}/>):<State icon={<Images/>} title={view==="trash"?"Trash is empty.":view==="archive"?"Archive is empty.":"No media matches this view."}/>}</section>
    </>:null}
    {view==="categories"?<TaxonomyBoard kind="category" categories={library?.categories||[]} collections={library?.collections||[]} assets={library?.assets||[]} onNew={()=>setTaxonomy({kind:"category",row:null})} onEdit={row=>setTaxonomy({kind:"category",row})} onPatch={patch} onPurge={act}/>:null}
    {view==="collections"?<TaxonomyBoard kind="collection" categories={library?.categories||[]} collections={library?.collections||[]} assets={library?.assets||[]} onNew={()=>setTaxonomy({kind:"collection",row:null})} onEdit={row=>setTaxonomy({kind:"collection",row})} onPatch={patch} onPurge={act}/>:null}
    {view==="usage"?<Usage assets={library?.assets||[]}/>:null}
    <AssetDossier asset={detail} permissions={library?.permissions} onClose={()=>setDetail(null)} onEdit={()=>detail&&setEditor(detail)} onAct={act}/>
    <AssetEditor asset={editor} categories={library?.categories||[]} collections={library?.collections||[]} campaigns={data.campaigns} onClose={()=>setEditor(null)} onSave={async body=>{await patch(`items/${editor?.id}`,body);setEditor(null)}}/>
    <TaxonomyEditor state={taxonomy} categories={library?.categories||[]} campaigns={data.campaigns} onClose={()=>setTaxonomy(null)} onSave={async body=>{if(!taxonomy)return;const base=taxonomy.kind==="category"?"categories":"collections";if(taxonomy.row)await mv(`${base}/${taxonomy.row.id}`,{method:"PATCH",body:JSON.stringify(body)});else await mv(base,{method:"POST",body:JSON.stringify(body)});setTaxonomy(null);await refresh()}}/>
  </div>
}

function AssetCard({asset,index,selected,onToggle,onOpen,onEdit}:{asset:MediaVaultAsset;index:number;selected:boolean;onToggle:()=>void;onOpen:()=>void;onEdit:()=>void}){return <article className={`${styles.card} ${selected?styles.cardSelected:""}`}><button className={styles.visual} onClick={onToggle}>{asset.preview_url?(asset.mime_type.startsWith("video/")?<video src={asset.preview_url} muted preload="metadata"/>:<img src={asset.preview_url} alt=""/>):asset.mime_type.startsWith("video/")?<Video/>:<Images/>}<span>{String(index+1).padStart(3,"0")}</span><i>{selected?<Check/>:null}</i>{asset.favorite?<em><Heart/></em>:null}</button><div className={styles.cardBody}><small>{asset.mime_type.split("/")[1]?.toUpperCase()} · {fmtBytes(asset.size_bytes)}</small><h3>{asset.title||asset.original_filename}</h3><p>{asset.categories.slice(0,2).map(c=>c.name).join(" / ")||"Unclassified"}</p><div>{asset.tags?.slice(0,3).map(t=><span key={t}>{t}</span>)}</div><footer><button onClick={onOpen}>Open <ChevronRight/></button><button onClick={onEdit}><PencilLine/></button></footer></div></article>}
function State({icon,title}:{icon:React.ReactNode;title:string}){return <div className={styles.state}>{icon}<b>{title}</b></div>}

function AssetDossier({asset,permissions,onClose,onEdit,onAct}:{asset:MediaVaultAsset|null;permissions:MediaVaultBootstrap["permissions"]|undefined;onClose:()=>void;onEdit:()=>void;onAct:(path:string,body?:Record<string,unknown>)=>Promise<void>}){
  const [confirm,setConfirm]=useState(false),[typed,setTyped]=useState(""),[busy,setBusy]=useState(false)
  if(!asset)return null
  const purge=async()=>{if(typed!=="PERMANENTLY DELETE")return;setBusy(true);try{await onAct(`items/${asset.id}/purge`,{confirmation:typed})}finally{setBusy(false)}}
  return <SovereignModal open={true} onClose={onClose} title={asset.title||asset.original_filename} kicker="MEDIA VAULT · ASSET DOSSIER" wide={false}><div className={styles.dossier}>
    <div className={styles.dossierPreview}>{asset.preview_url?(asset.mime_type.startsWith("video/")?<video controls src={asset.preview_url}/>:<img src={asset.preview_url} alt=""/>):<Images/>}</div>
    <section><div><span>FILE</span><b>{asset.original_filename}</b></div><div><span>TYPE</span><b>{asset.mime_type}</b></div><div><span>SIZE</span><b>{fmtBytes(asset.size_bytes)}</b></div><div><span>USAGE</span><b>{asset.usage_count}</b></div><div><span>STATE</span><b>{asset.lifecycle_status.toUpperCase()}</b></div><div><span>CREATED</span><b>{date(asset.created_at)}</b></div></section>
    <div className={styles.dossierTax}><b>CATEGORIES</b>{asset.categories.length?asset.categories.map(c=><span key={c.id}>{c.name}</span>):<small>None</small>}<b>COLLECTIONS</b>{asset.collections.length?asset.collections.map(c=><span key={c.id}>{c.name}</span>):<small>None</small>}</div>
    <footer><button onClick={onEdit}><PencilLine/>Edit metadata</button>{asset.lifecycle_status!=="active"&&permissions?.restore?<button onClick={()=>onAct(`items/${asset.id}/restore`)}><RotateCcw/>Restore</button>:null}{asset.lifecycle_status==="active"&&permissions?.archive?<button onClick={()=>onAct(`items/${asset.id}/archive`)}><Archive/>Archive</button>:null}{asset.lifecycle_status!=="trashed"&&permissions?.trash?<button className={styles.warn} onClick={()=>onAct(`items/${asset.id}/trash`)}><Trash2/>Move to trash</button>:null}{asset.lifecycle_status==="trashed"&&permissions?.hardDelete?<button className={styles.danger} onClick={()=>{setTyped("");setConfirm(true)}}><Trash2/>Permanent delete</button>:null}</footer>
    {confirm?<div className={styles.confirm}><b>Permanent deletion removes the Windows binary and canonical media record.</b><p>Only a minimal immutable audit tombstone remains. Type <strong>PERMANENTLY DELETE</strong> to authorize the purge.</p><input value={typed} onChange={e=>setTyped(e.target.value)} placeholder="PERMANENTLY DELETE" autoComplete="off"/><div><button onClick={()=>setConfirm(false)}>Cancel</button><button disabled={typed!=="PERMANENTLY DELETE"||busy} className={styles.danger} onClick={()=>void purge()}>{busy?"Deleting…":"PERMANENTLY DELETE"}</button></div></div>:null}
  </div></SovereignModal>
}
function AssetEditor({asset,categories,collections,campaigns,onClose,onSave}:{asset:MediaVaultAsset|null;categories:MediaVaultCategory[];collections:MediaVaultCollection[];campaigns:SocialCampaign[];onClose:()=>void;onSave:(body:Record<string,unknown>)=>Promise<void>}){
  const [form,setForm]=useState<any>({})
  const [busy,setBusy]=useState(false)
  useEffect(()=>{
    if(asset)setForm({
      title:asset.title||asset.original_filename,
      description:asset.description||"",
      tags:(asset.tags||[]).join(", "),
      campaignId:asset.campaign_id||"",
      favorite:asset.favorite,
      categoryIds:asset.categories.map(c=>c.id),
      collectionIds:asset.collections.map(c=>c.id),
    })
  },[asset?.id])
  if(!asset)return null
  const toggle=(key:string,id:string)=>setForm((f:any)=>({...f,[key]:(f[key]||[]).includes(id)?f[key].filter((x:string)=>x!==id):[...(f[key]||[]),id]}))
  const save=async()=>{
    setBusy(true)
    try{
      await onSave({...form,tags:String(form.tags||"").split(/[|;,\n]+/).map(v=>v.trim()).filter(Boolean)})
    }finally{setBusy(false)}
  }
  return <SovereignModal open={true} onClose={onClose} title="Edit media asset" kicker="MEDIA VAULT · CLASSIFY & GOVERN" wide={false}>
    <div className={styles.editor}>
      <label>Title<input value={form.title||""} onChange={e=>setForm({...form,title:e.target.value})}/></label>
      <label>Description<textarea rows={4} value={form.description||""} onChange={e=>setForm({...form,description:e.target.value})}/></label>
      <label>Tags<input value={form.tags||""} onChange={e=>setForm({...form,tags:e.target.value})} placeholder="summer, home-service, promo"/></label>
      <label>Campaign<select value={form.campaignId||""} onChange={e=>setForm({...form,campaignId:e.target.value})}><option value="">No campaign</option>{campaigns.map(c=><option key={c.id} value={c.id}>{c.title}</option>)}</select></label>
      <label className={styles.favorite}><input type="checkbox" checked={Boolean(form.favorite)} onChange={e=>setForm({...form,favorite:e.target.checked})}/>Favorite asset</label>
      <div className={styles.classify}>
        <section><b>CATEGORIES</b>{categories.filter(c=>c.status==="active").map(c=><label key={c.id}><input type="checkbox" checked={(form.categoryIds||[]).includes(c.id)} onChange={()=>toggle("categoryIds",c.id)}/>{c.name}</label>)}</section>
        <section><b>COLLECTIONS</b>{collections.filter(c=>c.status==="active").map(c=><label key={c.id}><input type="checkbox" checked={(form.collectionIds||[]).includes(c.id)} onChange={()=>toggle("collectionIds",c.id)}/>{c.name}</label>)}</section>
      </div>
      <footer><button onClick={onClose}>Cancel</button><button disabled={busy} onClick={()=>void save()}><Check/>Save changes</button></footer>
    </div>
  </SovereignModal>
}
function TaxonomyBoard({kind,categories,collections,assets,onNew,onEdit,onPatch,onPurge}:{kind:"category"|"collection";categories:MediaVaultCategory[];collections:MediaVaultCollection[];assets:MediaVaultAsset[];onNew:()=>void;onEdit:(row:MediaVaultCategory|MediaVaultCollection)=>void;onPatch:(p:string,b:Record<string,unknown>)=>Promise<void>;onPurge:(p:string,b?:Record<string,unknown>)=>Promise<void>}){
  const rows=(kind==="category"?categories:collections) as Array<MediaVaultCategory|MediaVaultCollection>
  const base=kind==="category"?"categories":"collections"
  const purge=async(row:MediaVaultCategory|MediaVaultCollection)=>{const confirmation=window.prompt(`Permanent deletion removes "${row.name}" taxonomy and its links. Type PERMANENTLY DELETE to continue.`)||"";if(confirmation!=="PERMANENTLY DELETE")return;await onPurge(`${base}/${row.id}/purge`,{confirmation})}
  return <div className={styles.taxonomyBoard}>
    <header><div><span>{kind==="category"?"FREE HIERARCHY":"CURATED SETS"}</span><h3>{kind==="category"?"Categories, subcategories and operational paths.":"Collections group media independently from campaigns."}</h3></div><button onClick={onNew}><Plus/>New {kind}</button></header>
    <div>{rows.map(row=><article key={row.id} data-state={row.status}>
      <div><b>{row.name}</b><p>{row.description||"No description"}</p><small>{assets.filter(a=>kind==="category"?a.categories.some(c=>c.id===row.id):a.collections.some(c=>c.id===row.id)).length} assets · {String(row.status).toUpperCase()}</small></div>
      <aside><button onClick={()=>onEdit(row)}><PencilLine/>Edit</button>
        {row.status==="active"?<><button onClick={()=>onPatch(`${base}/${row.id}`,{status:"archived"})}><Archive/>Archive</button><button className={styles.dangerText} onClick={()=>onPatch(`${base}/${row.id}`,{status:"trashed"})}><Trash2/>Trash</button></>:null}
        {row.status==="archived"?<><button onClick={()=>onPatch(`${base}/${row.id}`,{status:"active"})}><RotateCcw/>Restore</button><button className={styles.dangerText} onClick={()=>onPatch(`${base}/${row.id}`,{status:"trashed"})}><Trash2/>Trash</button></>:null}
        {row.status==="trashed"?<><button onClick={()=>onPatch(`${base}/${row.id}`,{status:"active"})}><RotateCcw/>Restore</button><button className={styles.dangerText} onClick={()=>void purge(row)}><Trash2/>Permanent delete</button></>:null}
      </aside>
    </article>)}</div>
  </div>
}
function TaxonomyEditor({state,categories,campaigns,onClose,onSave}:{state:{kind:"category"|"collection";row:MediaVaultCategory|MediaVaultCollection|null}|null;categories:MediaVaultCategory[];campaigns:SocialCampaign[];onClose:()=>void;onSave:(body:Record<string,unknown>)=>Promise<void>}){
  const row=state?.row||null,kind=state?.kind||null
  const [name,setName]=useState(""),[description,setDescription]=useState(""),[parentId,setParentId]=useState(""),[campaignId,setCampaignId]=useState(""),[sortOrder,setSortOrder]=useState("0"),[busy,setBusy]=useState(false)
  useEffect(()=>{if(!state){setName("");setDescription("");setParentId("");setCampaignId("");setSortOrder("0");return}setName(row?.name||"");setDescription(row?.description||"");setSortOrder(String(row?.sort_order||0));setParentId(kind==="category"?String((row as MediaVaultCategory|null)?.parent_id||""):"");setCampaignId(kind==="collection"?String((row as MediaVaultCollection|null)?.campaign_id||""):"")},[state?.kind,state?.row?.id])
  if(!kind)return null
  const save=async()=>{setBusy(true);try{await onSave({name:name.trim(),description:description.trim(),parentId:parentId||null,campaignId:campaignId||null,sortOrder:Number(sortOrder||0)})}finally{setBusy(false)}}
  return <SovereignModal open={true} onClose={onClose} title={`${row?"Edit":"New"} media ${kind}`} kicker="MEDIA VAULT · TAXONOMY" wide={false}><div className={styles.editor}>
    <label>Name<input value={name} onChange={e=>setName(e.target.value)}/></label><label>Description<textarea rows={4} value={description} onChange={e=>setDescription(e.target.value)}/></label>
    {kind==="category"?<label>Parent<select value={parentId} onChange={e=>setParentId(e.target.value)}><option value="">Root category</option>{categories.filter(c=>c.status==="active"&&c.id!==row?.id).map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select></label>:<label>Campaign link<select value={campaignId} onChange={e=>setCampaignId(e.target.value)}><option value="">Independent collection</option>{campaigns.map(c=><option key={c.id} value={c.id}>{c.title}</option>)}</select></label>}
    <label>Sort order<input type="number" value={sortOrder} onChange={e=>setSortOrder(e.target.value)}/></label>
    <footer><button onClick={onClose}>Cancel</button><button disabled={!name.trim()||busy} onClick={()=>void save()}><Check/>{busy?"Saving…":row?"Save changes":"Create"}</button></footer>
  </div></SovereignModal>
}
function Usage({assets}:{assets:MediaVaultAsset[]}){const max=Math.max(1,...assets.map(a=>a.usage_count));return <div className={styles.usage}><header><BarChart3/><div><span>REAL USAGE EVIDENCE</span><h3>Assets ranked by actual publication linkage.</h3></div></header>{[...assets].sort((a,b)=>b.usage_count-a.usage_count).map((a,i)=><article key={a.id}><b>{String(i+1).padStart(2,"0")}</b><div><h4>{a.title}</h4><span>{a.categories.map(c=>c.name).join(" / ")||"Unclassified"}</span></div><div className={styles.bar}><i style={{width:`${(a.usage_count/max)*100}%`}}/></div><strong>{a.usage_count}</strong></article>)}</div>}
