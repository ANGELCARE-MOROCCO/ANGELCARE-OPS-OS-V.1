"use client"
import { useEffect, useMemo, useRef, useState } from "react"
import { Bookmark, ChevronDown, Globe2, Plus, RefreshCw, Trash2, UserRound } from "lucide-react"
import styles from "./MZ9SavedViews.module.css"

type SavedView={id:string;actor_user_id:string;name:string;universe:string;view_key:string;query:Record<string,unknown>;is_shared:boolean;updated_at:string}
type Bootstrap={actor:{id:string;name:string;email:string;role:string};views:SavedView[];preferences:Record<string,unknown>}
async function ox(path:string,init?:RequestInit){const r=await fetch(`/api/social-command/operator-experience/${path}`,{...init,headers:{...(init?.body?{"content-type":"application/json"}:{}),...(init?.headers||{})},cache:"no-store"});const p=await r.json().catch(()=>({ok:false,error:`HTTP ${r.status}`}));if(!r.ok||p?.ok===false)throw new Error(p?.error||`HTTP ${r.status}`);return p.data}

export default function MZ9SavedViews({universe,current,onApply}:{universe:string;current:string;onApply:(view:string)=>void}){
  const[open,setOpen]=useState(false),[data,setData]=useState<Bootstrap|null>(null),[error,setError]=useState(""),[busy,setBusy]=useState(false)
  const root=useRef<HTMLDivElement|null>(null)
  const refresh=async()=>{try{setError("");setData(await ox("bootstrap"))}catch(e){setError(e instanceof Error?e.message:String(e))}}
  useEffect(()=>{if(open&&!data)void refresh()},[open])
  useEffect(()=>{if(!open)return;const close=(e:MouseEvent)=>{if(root.current&&!root.current.contains(e.target as Node))setOpen(false)};window.addEventListener("mousedown",close);return()=>window.removeEventListener("mousedown",close)},[open])
  const views=useMemo(()=>data?.views.filter(v=>v.universe===universe)||[],[data?.views,universe])
  const save=async()=>{const name=prompt("Saved view name",`${universe.toUpperCase()} · ${current}`)?.trim();if(!name)return;const shared=confirm("Share this saved view with other authorized Social Command operators?\n\nOK = shared\nCancel = personal only");setBusy(true);try{await ox("views",{method:"POST",body:JSON.stringify({name,universe,viewKey:current,query:{},isShared:shared})});await refresh()}catch(e){setError(e instanceof Error?e.message:String(e))}finally{setBusy(false)}}
  const remove=async(view:SavedView)=>{if(!data||view.actor_user_id!==data.actor.id)return;if(!confirm(`Delete saved view “${view.name}”?`))return;setBusy(true);try{await ox(`views/${view.id}`,{method:"DELETE"});await refresh()}catch(e){setError(e instanceof Error?e.message:String(e))}finally{setBusy(false)}}
  return <div className={styles.root} ref={root}><button className={styles.trigger} onClick={()=>setOpen(v=>!v)} title="Saved operator views"><Bookmark/><span>VIEWS</span><em>{views.length}</em><ChevronDown/></button>{open?<div className={styles.popover}><header><div><span>OPERATOR VIEWS</span><b>{data?.actor.name||"AngelCare operator"}</b><small>{data?.actor.role||"Authenticated"}</small></div><button disabled={busy} onClick={()=>void refresh()}><RefreshCw/></button></header><button className={styles.save} disabled={busy} onClick={()=>void save()}><Plus/>Save current view</button><section>{views.map(view=><article key={view.id}><button onClick={()=>{onApply(view.view_key);setOpen(false)}}><span>{view.is_shared?<Globe2/>:<UserRound/>}</span><div><b>{view.name}</b><small>{view.view_key} · {view.is_shared?"shared":"personal"}</small></div></button>{data?.actor.id===view.actor_user_id?<button className={styles.delete} onClick={()=>void remove(view)}><Trash2/></button>:null}</article>)}{data&&!views.length?<p>No saved view in this workspace yet.</p>:null}{!data&&!error?<p>Loading operator preferences…</p>:null}</section>{error?<footer>{error}</footer>:null}</div>:null}</div>
}
