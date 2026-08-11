"use client"
import { useEffect, useMemo, useState } from "react"
import { BookOpenText, Check, ChevronRight, Search, ShieldCheck, SlidersHorizontal, Sparkles, X } from "lucide-react"
import styles from "./CopyVaultPicker.module.css"
import type { CopyVaultBootstrap, CopyVaultSelection, CopyVaultType } from "@/lib/social-command/copy-vault-types"
import type { SocialChannel, SocialFormat } from "@/lib/social-command/types"

type Props={
  surface:string
  format?:SocialFormat
  channels?:SocialChannel[]
  campaignId?:string
  copyTypes?:CopyVaultType[]
  onSelect:(selection:CopyVaultSelection)=>void
  label?:string
  compact?:boolean
}

async function loadPicker(params:URLSearchParams){const r=await fetch(`/api/social-command/copy-vault/picker?${params.toString()}`,{cache:"no-store"});const p=await r.json().catch(()=>({ok:false,error:`HTTP ${r.status}`}));if(!r.ok||p?.ok===false)throw new Error(p?.error||`HTTP ${r.status}`);return p.data as CopyVaultBootstrap}
function statusLabel(value:string){return value.replaceAll("_"," ").toUpperCase()}

export default function CopyVaultPicker({surface,format,channels=[],campaignId,copyTypes=[],onSelect,label="COPY VAULT",compact=false}:Props){
  const [open,setOpen]=useState(false),[loading,setLoading]=useState(false),[error,setError]=useState(""),[data,setData]=useState<CopyVaultBootstrap|null>(null),[query,setQuery]=useState(""),[category,setCategory]=useState(""),[language,setLanguage]=useState(""),[selected,setSelected]=useState<string|null>(null)
  useEffect(()=>{if(!open)return;const onKey=(event:KeyboardEvent)=>{if(event.key==="Escape")setOpen(false)};window.addEventListener("keydown",onKey);setLoading(true);setError("");const params=new URLSearchParams();if(format)params.set("format",format);if(channels.length)params.set("channels",channels.join(","));if(campaignId)params.set("campaignId",campaignId);if(copyTypes.length)params.set("copyTypes",copyTypes.join(","));loadPicker(params).then(setData).catch(e=>setError(e instanceof Error?e.message:String(e))).finally(()=>setLoading(false));return()=>window.removeEventListener("keydown",onKey)},[open,format,channels.join(","),campaignId,copyTypes.join(",")])
  const items=useMemo(()=>{const q=query.trim().toLowerCase();return (data?.items||[]).filter(item=>{const version=item.approved_version;if(!version)return false;if(category&&!item.categories.some(c=>c.id===category))return false;if(language&&version.language!==language)return false;if(q&&!`${item.code} ${item.title} ${item.business_unit} ${version.body} ${version.tags.join(" ")} ${item.categories.map(c=>c.name).join(" ")}`.toLowerCase().includes(q))return false;return true})},[data,query,category,language])
  const languages=useMemo(()=>[...new Set((data?.items||[]).map(i=>i.approved_version?.language).filter(Boolean) as string[])].sort(),[data])
  const choose=(item:any,mode:"exact"|"customize")=>{const v=item.approved_version;if(!v)return;onSelect({itemId:item.id,versionNo:v.version_no,code:item.code,title:item.title,copyType:item.copy_type,body:v.body,shortVersion:v.short_version,cta:v.cta,hashtags:v.hashtags,tags:v.tags,language:v.language,businessUnit:item.business_unit,campaignId:item.campaign_id,categoryIds:item.categories.map((c:any)=>c.id),categories:item.categories.map((c:any)=>c.name),mode});setOpen(false);setSelected(null)}
  return <>
    <button type="button" aria-haspopup="dialog" aria-expanded={open} className={compact?styles.compactTrigger:styles.trigger} onClick={()=>setOpen(true)}><BookOpenText/>{label}<span>Approved library</span></button>
    {open?<div className={styles.backdrop} role="dialog" aria-modal="true" aria-label="AngelCare Copy Vault" onMouseDown={()=>setOpen(false)}><section className={styles.modal} onMouseDown={e=>e.stopPropagation()}>
      <header className={styles.header}><div className={styles.brandGlyph}><BookOpenText/></div><div><span>ANGELCARE · GOVERNED COPY</span><h2>Copy Vault</h2><p>Select approved messaging or use it as an editable starting point.</p></div><button type="button" className={styles.close} onClick={()=>setOpen(false)}><X/></button></header>
      <div className={styles.contextRail}><span><ShieldCheck/>APPROVED ONLY</span><span>{surface.replaceAll("_"," ").toUpperCase()}</span>{format?<span>{format.toUpperCase()}</span>:null}{channels.map(channel=><span key={channel}>{channel.toUpperCase()}</span>)}</div>
      <div className={styles.filters}><label><Search/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search copy, category, service, city…"/></label><label><SlidersHorizontal/><select value={category} onChange={e=>setCategory(e.target.value)}><option value="">All categories</option>{(data?.categories||[]).filter(c=>c.status==="active").map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select></label><select value={language} onChange={e=>setLanguage(e.target.value)}><option value="">All languages</option>{languages.map(lang=><option key={lang}>{lang}</option>)}</select></div>
      <main className={styles.canvas}>{loading?<div className={styles.state}><Sparkles/><b>Loading approved messaging…</b></div>:error?<div className={styles.error}><b>Copy Vault unavailable</b><p>{error}</p></div>:items.length?items.map(item=>{const v=item.approved_version!;const active=selected===item.id;return <article key={item.id} className={active?styles.selected:""}><button type="button" className={styles.cardMain} onClick={()=>setSelected(active?null:item.id)}><div className={styles.cardTop}><span>{item.copy_type.replaceAll("_"," ")}</span><em>{v.language.toUpperCase()}</em></div><h3>{item.title}</h3><p>{v.body}</p><footer><div>{item.categories.slice(0,3).map(c=><span key={c.id}>{c.name}</span>)}</div><small>{item.usage_count} uses · v{v.version_no}</small></footer></button>{active?<div className={styles.actionDeck}><button type="button" onClick={()=>choose(item,"exact")}><Check/>Use approved copy</button><button type="button" onClick={()=>choose(item,"customize")}><Sparkles/>Use + customize</button><span>{statusLabel(v.status)} · {v.approval_policy.toUpperCase()}</span></div>:<ChevronRight className={styles.chevron}/>}</article>}):<div className={styles.state}><BookOpenText/><b>No approved copy matches this context.</b><p>You can still write manually without leaving the studio.</p></div>}</main>
      <footer className={styles.footer}><span>One canonical library · synchronized on every refresh</span><button type="button" onClick={()=>setOpen(false)}>Write manually</button></footer>
    </section></div>:null}
  </>
}
