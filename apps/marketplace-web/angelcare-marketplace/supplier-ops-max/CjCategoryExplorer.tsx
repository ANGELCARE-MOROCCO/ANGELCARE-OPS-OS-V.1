'use client'
import {useMemo,useState} from 'react'
import {ChevronRight,FolderTree,Search,RefreshCw,CheckCircle2} from 'lucide-react'
import type {CjCategory} from './cj-native'
import css from './category-explorer.module.css'

type Props={tree:CjCategory[];selectedId:string;onSelect:(id:string)=>void;onRefresh:()=>Promise<void>;busy:boolean;status:string}
export function CjCategoryExplorer({tree,selectedId,onSelect,onRefresh,busy,status}:Props){
 const [root,setRoot]=useState(''),[mid,setMid]=useState(''),[keyword,setKeyword]=useState(''),[show,setShow]=useState(true)
 const selectedRoot=tree.find(x=>x.id===root)||tree[0]
 const selectedMid=selectedRoot?.children.find(x=>x.id===mid)||selectedRoot?.children[0]
 const leaves=useMemo(()=>tree.flatMap(r=>r.children.flatMap(m=>m.children)),[tree])
 const matches=useMemo(()=>keyword.trim()?leaves.filter(x=>x.path.toLowerCase().includes(keyword.trim().toLowerCase())).slice(0,80):[],[leaves,keyword])
 const selected=leaves.find(x=>x.id===selectedId)
 return <section className={css.wrap}>
  <div className={css.heading}><div className={css.icon}><FolderTree size={22}/></div><div className={css.headCopy}><span>CJ SUPPLIER TAXONOMY · PROVIDER-SOURCED</span><h3>Browse the complete category world</h3><p>Explore first, second and third levels. Select a real leaf category to execute a supplier-side product search.</p></div><div className={css.headActions}><button onClick={()=>setShow(v=>!v)}>{show?'Collapse':'Expand'} <ChevronRight size={15}/></button><button disabled={busy} onClick={onRefresh}><RefreshCw size={15}/> Refresh taxonomy</button></div></div>
  <div className={css.filterBar}><label><Search size={16}/><input aria-label="Find CJ category" placeholder="Search across the supplier's category hierarchy…" value={keyword} onChange={e=>{setKeyword(e.target.value);setShow(true)}}/></label><span>{leaves.length} provider leaf categories</span>{selected&&<button className={css.selected} onClick={()=>onSelect('')}><CheckCircle2 size={14}/> {selected.path} <span>Clear</span></button>}</div>
  {!!status&&<div className={css.status}>{status}</div>}
  {show&&<>
   {!tree.length?<div className={css.empty}>No authenticated CJ category tree available yet. Use Refresh taxonomy; an unverified connector does not produce an invented category list.</div>:keyword.trim()?<div className={css.searchMatches}>{matches.map(leaf=><button key={leaf.id} className={leaf.id===selectedId?css.chosen:''} onClick={()=>{onSelect(leaf.id);setKeyword('')}}><b>{leaf.name}</b><small>{leaf.path}</small><ChevronRight size={15}/></button>)}{!matches.length&&<div className={css.empty}>No actual CJ categories match this search.</div>}</div>:<div className={css.tree}>
    <div><div className={css.levelTitle}>01 / First level <b>{tree.length}</b></div>{tree.map(x=><button key={x.id} className={selectedRoot?.id===x.id?css.active:''} onClick={()=>{setRoot(x.id);setMid('')}}>{x.name}<ChevronRight size={14}/></button>)}</div>
    <div><div className={css.levelTitle}>02 / Second level <b>{selectedRoot?.children?.length||0}</b></div>{selectedRoot?.children.map(x=><button key={x.id} className={selectedMid?.id===x.id?css.active:''} onClick={()=>setMid(x.id)}>{x.name}<ChevronRight size={14}/></button>)}</div>
    <div><div className={css.levelTitle}>03 / Product categories <b>{selectedMid?.children?.length||0}</b></div>{selectedMid?.children.map(x=><button key={x.id} className={selectedId===x.id?css.chosen:''} onClick={()=>onSelect(x.id)}>{x.name}{selectedId===x.id?<CheckCircle2 size={15}/>:<ChevronRight size={14}/>}</button>)}</div>
   </div>}
  </>}
 </section>
}
