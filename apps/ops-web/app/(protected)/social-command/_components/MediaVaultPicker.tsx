"use client"
import {useEffect,useMemo,useState} from "react"
import {Check,ChevronLeft,ChevronRight,Clock3,FolderKanban,Grid2X2,HardDrive,Images,List,Search,ShieldCheck,SlidersHorizontal,X} from "lucide-react"
import styles from "./MediaVaultPicker.module.css"
import type {MediaVaultAsset,MediaVaultBootstrap} from "@/lib/social-command/media-vault-types"
type Props={selectedIds:string[];onChange:(ids:string[])=>void;campaignId?:string;label?:string;kind?:"image"|"video";max?:number}
async function load(){
 const r=await fetch("/api/social-command/media-vault/library?lifecycle=active&status=ready",{cache:"no-store"})
 const p=await r.json().catch(()=>({ok:false,error:"HTTP "+r.status}))
 if(!r.ok||p?.ok===false)throw Error(p?.error||"HTTP "+r.status)
 return p.data as MediaVaultBootstrap
}
const fmt=(v:number)=>v>1048576?(v/1048576).toFixed(1)+" MB":(v/1024).toFixed(0)+" KB"
export default function MediaVaultPicker({selectedIds,onChange,campaignId,label="MEDIA VAULT",kind,max}:Props){
 const [open,setOpen]=useState(false),[data,setData]=useState<MediaVaultBootstrap|null>(null),[error,setError]=useState(""),[loading,setLoading]=useState(false)
 const [q,setQ]=useState(""),[category,setCategory]=useState(""),[collection,setCollection]=useState(""),[mime,setMime]=useState("")
 const [recent,setRecent]=useState(""),[dateField,setDateField]=useState<"created_at"|"updated_at">("created_at"),[orientation,setOrientation]=useState(""),[usage,setUsage]=useState("")
 const [page,setPage]=useState(1),[pageSize,setPageSize]=useState<20|100|500>(100),[view,setView]=useState<"grid"|"list">("grid")
 const [active,setActive]=useState<MediaVaultAsset|null>(null)
 useEffect(()=>{if(!open)return;let alive=true;setLoading(true);setError("");load().then(x=>{if(alive)setData(x)}).catch(e=>{if(alive)setError(e instanceof Error?e.message:String(e))}).finally(()=>{if(alive)setLoading(false)});return()=>{alive=false}},[open])
 useEffect(()=>{setPage(1)},[q,category,collection,mime,recent,dateField,orientation,usage,pageSize])
 const filtered=useMemo(()=>{
  const term=q.toLocaleLowerCase(),cutoff=recent?Date.now()-Number(recent)*60000:0
  return (data?.assets||[]).filter(a=>{
   if(campaignId&&a.campaign_id&&a.campaign_id!==campaignId)return false
   if(kind&&!(kind==="image"?a.mime_type.startsWith("image/"):a.mime_type.startsWith("video/")))return false
   if(mime&&!a.mime_type.startsWith(mime))return false
   if(category&&!a.categories.some(c=>c.id===category))return false
   if(collection&&!a.collections.some(c=>c.id===collection))return false
   if(usage==="used"&&a.usage_count<1||usage==="unused"&&a.usage_count!==0)return false
   const width=a.width||0,height=a.height||0,ratio=height?width/height:0
   if(orientation==="square"&&Math.abs(ratio-1)>.05)return false
   if(orientation==="portrait"&&(!ratio||ratio>=.95))return false
   if(orientation==="landscape"&&ratio<=1.05)return false
   if(cutoff&&(!Number.isFinite(Date.parse(a[dateField]||""))||Date.parse(a[dateField]||"")<cutoff))return false
   return !term||[a.title,a.original_filename,a.description,...a.tags,...a.categories.map(x=>x.name),...a.collections.map(x=>x.name)].join(" ").toLocaleLowerCase().includes(term)
  })
 },[data,q,category,collection,mime,recent,dateField,orientation,usage,campaignId,kind])
 const totalPages=Math.max(1,Math.ceil(filtered.length/pageSize)),items=filtered.slice((page-1)*pageSize,page*pageSize)
 const inspected=active||items[0]||null
 function toggle(id:string){if(selectedIds.includes(id))onChange(selectedIds.filter(x=>x!==id));else if(!max||selectedIds.length<max)onChange([...selectedIds,id])}
 function reset(){setQ("");setCategory("");setCollection("");setMime("");setRecent("");setOrientation("");setUsage("")}
 return <>
  <button type="button" className={styles.trigger} onClick={()=>setOpen(true)}><HardDrive size={16}/>{label}<span>{selectedIds.length} selected</span></button>
  {open?<div className={styles.backdrop} onMouseDown={e=>{if(e.currentTarget===e.target)setOpen(false)}}>
  <section className={styles.modal} role="dialog" aria-modal="true" aria-label="Windows Media Vault Pro Max" data-media-picker-r4="windows">
   <header><div><span>ANGELCARE OPERATIONS · GOVERNED WINDOWS MEDIA</span><h2>Native Media Vault</h2><p>Choose existing media · Advanced filtering and verified native taxonomy</p></div><button type="button" onClick={()=>setOpen(false)} aria-label="Close"><X size={18}/></button></header>
   <div className={styles.topbar}><label className={styles.search}><Search size={16}/><input aria-label="Search assets" value={q} onChange={e=>setQ(e.target.value)} placeholder="Search title, filenames, categories, tags…"/></label>
    <label>Results<select value={pageSize} onChange={e=>setPageSize(Number(e.target.value) as 20|100|500)}><option value={20}>20 / page</option><option value={100}>100 / page</option><option value={500}>500 / page</option></select></label>
    <button type="button" onClick={reset}>Reset filters</button><button className={styles.action} type="button" onClick={()=>setOpen(false)}><Check size={15}/>Use selection</button></div>
   <div className={styles.body}>
    <aside className={styles.rail}><h3><SlidersHorizontal size={16}/> Advanced filters</h3>
     <label>Native category<select value={category} onChange={e=>setCategory(e.target.value)}><option value="">All categories</option>{(data?.categories||[]).filter(x=>x.status==="active").map(x=><option key={x.id} value={x.id}>{x.name}</option>)}</select></label>
     <label>Collection<select value={collection} onChange={e=>setCollection(e.target.value)}><option value="">All collections</option>{(data?.collections||[]).filter(x=>x.status==="active").map(x=><option key={x.id} value={x.id}>{x.name}</option>)}</select></label>
     <label>Media type<select value={mime} onChange={e=>setMime(e.target.value)}><option value="">All media</option><option value="image/">Images</option><option value="video/">Videos</option><option value="audio/">Audio</option><option value="application/">Documents</option></select></label>
     <label>Orientation<select value={orientation} onChange={e=>setOrientation(e.target.value)}><option value="">All</option><option value="square">Square</option><option value="landscape">Landscape</option><option value="portrait">Portrait</option></select></label>
     <label>Usage<select value={usage} onChange={e=>setUsage(e.target.value)}><option value="">All usage</option><option value="used">Used</option><option value="unused">Unused</option></select></label>
     <label><Clock3 size={13}/> Date field<select value={dateField} onChange={e=>setDateField(e.target.value as "created_at"|"updated_at")}><option value="created_at">Uploaded</option><option value="updated_at">Last modified</option></select></label>
     <label>Uploaded within<select value={recent} onChange={e=>setRecent(e.target.value)}><option value="">Any time</option>{[2,5,10,15,30,60,120,1440,10080,43200].map(n=><option key={n} value={n}>{n<60?n+" minutes":n===60?"1 hour":n===1440?"24 hours":n===10080?"7 days":n===43200?"30 days":n/60+" hours"}</option>)}</select></label>
     <p>Windows Vault filters operate on its authorized API snapshot. Marketplace Media Vault uses a separate media authority.</p>
    </aside>
    <main className={styles.center}><div className={styles.centerHead}><div><strong>{filtered.length} matching assets</strong><small>{data?.assets.length||0} loaded · page {page} of {totalPages}</small></div><div><button onClick={()=>setView("grid")} aria-pressed={view==="grid"} aria-label="Grid view"><Grid2X2 size={16}/></button><button onClick={()=>setView("list")} aria-pressed={view==="list"} aria-label="List view"><List size={16}/></button></div></div>
     {loading?<div className={styles.state}>Loading authorized media…</div>:null}
     {error?<div className={styles.state} role="alert">{error}</div>:null}
     {!loading&&!error?<div className={view==="grid"?styles.grid:styles.list}>{items.map(a=><article className={styles.card} data-selected={selectedIds.includes(a.id)} key={a.id}>
      <button type="button" className={styles.choose} aria-pressed={selectedIds.includes(a.id)} disabled={!!max&&selectedIds.length>=max&&!selectedIds.includes(a.id)} onClick={()=>{toggle(a.id);setActive(a)}}><span className={styles.check}>{selectedIds.includes(a.id)?<Check size={13}/>:null}</span>{a.mime_type.startsWith("image/")&&a.preview_url?<img src={a.preview_url} alt=""/>:<span className={styles.iconPreview}><Images size={32}/></span>}<b>{a.title}</b><small>{a.mime_type.split("/")[1]} · {fmt(a.size_bytes)}</small><span className={styles.pill}><ShieldCheck size={11}/>{a.status} · {a.categories[0]?.name||"Unclassified"}</span><small>Used in {a.usage_count||0} places</small></button>
      <button type="button" className={styles.previewButton} onClick={()=>setActive(a)} aria-label={"Inspect "+a.title}><Images size={14}/></button></article>)}{!items.length?<p>No matching assets.</p>:null}</div>:null}
     <nav className={styles.pager} aria-label="Pages"><button disabled={page===1} onClick={()=>setPage(x=>x-1)}><ChevronLeft size={14}/>Previous</button>{page}/{totalPages}<button disabled={page>=totalPages} onClick={()=>setPage(x=>x+1)}>Next<ChevronRight size={14}/></button></nav>
    </main>
    <aside className={styles.inspector}><h3>Asset preview</h3>{inspected?<><div className={styles.hero}>{inspected.preview_url&&inspected.mime_type.startsWith("image/")?<img src={inspected.preview_url} alt={inspected.title}/>:<Images size={38}/>}</div><strong>{inspected.title}</strong><dl>{[["Asset ID",inspected.id],["File",inspected.original_filename],["MIME",inspected.mime_type],["Size",fmt(inspected.size_bytes)],["Dimensions",(inspected.width||0)+" × "+(inspected.height||0)],["Status",inspected.status],["Created",new Date(inspected.created_at).toLocaleString()],["Category",inspected.categories.map(x=>x.name).join(" / ")],["Collection",inspected.collections.map(x=>x.name).join(" / ")],["Usage",String(inspected.usage_count)]].map(([key,value])=><div key={key}><dt>{key}</dt><dd>{value}</dd></div>)}</dl></>:<p>Select an asset to inspect its metadata.</p>}</aside>
   </div>
   <footer className={styles.footer}><div className={styles.trayTitle}><FolderKanban size={20}/><span>{selectedIds.length}{max?" / "+max:""} selected</span></div><div className={styles.tray}>{selectedIds.map((id,i)=>{const asset=data?.assets.find(x=>x.id===id);return <span className={styles.trayItem} key={id}>{i+1}. {asset?.title||id.slice(0,8)}<button type="button" onClick={()=>toggle(id)} aria-label={"Remove "+id}><X size={12}/></button></span>})}</div><button className={styles.action} type="button" onClick={()=>setOpen(false)}>Done · Use selection</button></footer>
  </section></div>:null}
 </>;
}
