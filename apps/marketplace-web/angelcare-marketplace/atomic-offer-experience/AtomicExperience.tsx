'use client'
import {careOrbitLocation} from '@/angelcare-marketplace/navigation-care-orbit/client-controller'

import { useEffect, useId, useMemo, useRef, useState, type CSSProperties, type ReactNode } from 'react'
import { ArrowRight, ArrowUpRight, Check, ChevronLeft, ChevronRight, Copy, Heart, Maximize2, Minus, Plus, Share2, ShieldCheck, Sparkles, X } from 'lucide-react'
import type { ComponentData } from '@puckeditor/core'
import type { PublicExperience360 } from '../public-experience-authority/types'
import { actionState, ATOMIC_ROOTS, display, localeText, present, publicUrl, record, rows, sectionValue, sectionVisibility, sectionsFrom, type AtomicLocale, type AtomicSectionProps } from './model'
import { atomicCopy } from './copy'
import { cleanSelection, readSelection, saveSelection, selectionHref } from './selection'
import { ATOMIC_INTENT_KEYS } from './journey-intent'
import { designToStyle, responsiveDataAttributes } from '../studio-universal/design'
import type { StudioDesignStyle, StudioResponsiveState } from '../studio-universal/types'
import styles from './atomic.module.css'
import {Context,useExperience,type ExperienceContext} from './context'
import {Benefits,People,Programme,PublishedPlans,Specifications,Deployment,ReviewSummary} from './RichModules'

const noHeadingRoles=new Set(['opening','decision'])
const label=(r:Record<string,unknown>,locale:AtomicLocale)=>String(r[`label_${locale}`]||r.label||r.group_key||r.key||'')
const options=(r:Record<string,unknown>)=>Array.isArray(r.values)?r.values.filter((v):v is string=>typeof v==='string'&&v.trim().length>0):[]
const fieldKey=(r:Record<string,unknown>)=>String(r.group_key||r.key||'')
function visitorReference(){
  const encoded=document.cookie.split('; ').find(c=>c.startsWith('ac_marketplace_visitor='))?.split('=')[1]
  try{if(encoded)return decodeURIComponent(encoded)}catch{}
  const visitor=crypto.randomUUID();document.cookie=`ac_marketplace_visitor=${visitor}; path=/; max-age=31536000; samesite=lax`;return visitor
}
async function api<T>(url:string,init?:RequestInit):Promise<T>{
  const response=await fetch(url,{...init,headers:{'content-type':'application/json',...init?.headers}})
  const payload=await response.json().catch(()=>({})) as {data?:T;error?:{message?:string}}
  if(!response.ok||payload.error||payload.data===undefined)throw Error('ACTION_FAILED')
  return payload.data
}
function price(data:PublicExperience360,locale:AtomicLocale){
  if(data.pricing.label.trim())return data.pricing.label
  if(data.pricing.amount===null)return atomicCopy(locale).unknown
  try{return new Intl.NumberFormat(locale,{style:'currency',currency:data.pricing.currency}).format(data.pricing.amount)}catch{return `${data.pricing.amount} ${data.pricing.currency}`}
}
function validVariants(data:PublicExperience360,selection:Record<string,unknown>){
  const groups=data.variants.groups
  if(groups.some(g=>g.required===true&&!options(g).includes(String(selection[fieldKey(g)]||''))))return false
  const picked=groups.filter(g=>present(selection[fieldKey(g)]))
  if(data.variants.items.length&&picked.length){
    return data.variants.items.some(v=>!['inactive','archived','unavailable'].includes(String(v.status||''))&&picked.every(g=>record(v.configuration)[fieldKey(g)]===selection[fieldKey(g)]))
  }
  return true
}
function frameStyle(props:Record<string,unknown>):CSSProperties{
  const style=designToStyle(props.sourceDesign as StudioDesignStyle|undefined)
  const safeColor=(v:unknown)=>typeof v==='string'&&/^#[0-9a-f]{3,8}$/i.test(v)?v:undefined
  return {...style,'--ao-accent':safeColor(props.accent),'--ao-companion':safeColor(props.companion),'--ao-ink':safeColor(props.ink)} as CSSProperties
}

/** Versioned compositions own order and content; the engine supplies behaviour only. */
export function AtomicExperienceFrame({type,props,data,locale,children,previewOnly=false}:{type:string;props:Record<string,unknown>;data?:PublicExperience360|null;locale:AtomicLocale;children:ReactNode;previewOnly?:boolean}){
  const [selection,setSelection]=useState<Record<string,unknown>>({}),[quantity,setQuantity]=useState(1),[busy,setBusy]=useState(false),[message,setMessage]=useState(''),[basketId,setBasketId]=useState<string|null>(null),[active,setActive]=useState(''),[atFooter,setAtFooter]=useState(false)
  const lock=useRef(false),c=atomicCopy(locale)
  const specs=useMemo(()=>sectionsFrom(props.content),[props.content])
  const visible=useMemo(()=>data?specs.filter(s=>sectionVisibility(data,s).visible):[],[data,specs])
  const nav=visible.filter(s=>!noHeadingRoles.has(s.role)).filter((s,i,all)=>all.findIndex(other=>(localeText(other.navTitle,locale)||other.role)===(localeText(s.navTitle,locale)||s.role))===i)
  useEffect(()=>{
    setSelection({});setQuantity(1);setBasketId(null);setMessage('')
    if(!data||previewOnly)return
    const allowed=new Set([...data.content.fields.map(f=>f.key),...data.variants.groups.map(fieldKey),...ATOMIC_INTENT_KEYS])
    const draft=readSelection(data.identity.slug,locale,allowed)
    setSelection(draft)
    if(typeof draft.quantity==='number'&&draft.quantity>0)setQuantity(Math.min(99,Math.floor(draft.quantity)))
  },[data?.identity.id,locale,previewOnly])
  useEffect(()=>{
    if(!data)return
    const nodes=nav.map(s=>document.getElementById(s.id)).filter((n):n is HTMLElement=>!!n)
    if(!('IntersectionObserver' in window))return
    const observer=new IntersectionObserver(entries=>{const e=entries.find(e=>e.isIntersecting);if(e)setActive(e.target.id)},{rootMargin:'-22% 0px -58% 0px'})
    nodes.forEach(n=>observer.observe(n));return()=>observer.disconnect()
  },[data?.identity.id,nav.map(s=>s.id).join('|')])
  useEffect(()=>{const footer=document.querySelector('footer');if(!footer||!('IntersectionObserver' in window))return;const observer=new IntersectionObserver(entries=>setAtFooter(entries.some(e=>e.isIntersecting)));observer.observe(footer);return()=>observer.disconnect()},[data?.identity.id])
  function setChoice(key:string,value:unknown){setSelection(current=>{const next={...current,[key]:value};if(data&&!previewOnly)saveSelection(data.identity.slug,locale,next);return next});setBasketId(null);setMessage('')}
  async function act(mode?:'checkout'){
    if(!data||lock.current||previewOnly)return
    const state=actionState(data)
    if(!state.enabled){setMessage(c[state.reason as keyof typeof c]||c.apiError);return}
    if(!validVariants(data,selection)){setMessage(c.selectRequired);return}
    const configuration=cleanSelection(selection),draft={...configuration,quantity}
    saveSelection(data.identity.slug,locale,draft)
    if(state.path!=='basket'){
      careOrbitLocation.assign(selectionHref(`/angelcare-marketplace/${locale}/${state.path}/${encodeURIComponent(data.identity.slug)}`,draft));return
    }
    lock.current=true;setBusy(true);setMessage('')
    try{
      const visitor=visitorReference()
      const basket=await api<{id:string}>(`/api/angelcare-marketplace/conversion/basket?locale=${locale}&kind=transactional`,{headers:{'x-marketplace-visitor':visitor}})
      if(!basket.id)throw Error('NO_BASKET')
      const line=await api<{id?:unknown}>(`/api/angelcare-marketplace/conversion/basket/${encodeURIComponent(basket.id)}/items`,{method:'POST',body:JSON.stringify({visitorReference:visitor,itemSlug:data.identity.slug,locale,quantity,configuration})})
      if(typeof line?.id!=='string'||!line.id.trim())throw Error('NO_BASKET_LINE')
      setBasketId(basket.id)
      if(mode==='checkout')careOrbitLocation.assign(`/angelcare-marketplace/${locale}/checkout?basket=${encodeURIComponent(basket.id)}&kind=transactional`)
    }catch{setMessage(c.apiError)}finally{lock.current=false;setBusy(false)}
  }
  if(data&&ATOMIC_ROOTS[type]!==data.classification.masterDomain)return null
  if(!data)return <article className={styles.experience} data-domain={ATOMIC_ROOTS[type]} style={frameStyle(props)} dir={locale==='ar'?'rtl':'ltr'}><div className={styles.editorNotice}>{c.preview}</div>{children}</article>
  const context:ExperienceContext={data,locale,selection,setChoice,quantity,setQuantity:v=>{setQuantity(v);setBasketId(null)},busy,message,act,basketId,previewOnly}
  return <Context.Provider value={context}><article className={styles.experience} style={frameStyle(props)} lang={locale} dir={locale==='ar'?'rtl':'ltr'} data-ac-atomic-experience="1" data-domain={data.classification.masterDomain} data-doctrine={data.classification.doctrineKey}>
    <div className={styles.ambient} aria-hidden="true"/>
    <div className={styles.composition}>{Array.isArray(children)?children[0]:null}
    {nav.length?<nav className={styles.sectionNav} aria-label={c.details}>{nav.map(s=><a key={s.id} href={`#${s.id}`} aria-current={active===s.id?'location':undefined}>{localeText(s.navTitle,locale)||localeText(s.title,locale)||s.role}</a>)}</nav>:null}
    {Array.isArray(children)?children.slice(1):children}</div>
    {!atFooter&&visible.some(s=>s.role==='decision'||s.role==='opening')?<div className={styles.mobileDecision}><div><small>{data.identity.name}</small><strong>{price(data,locale)}</strong></div><button type="button" onClick={()=>document.getElementById(visible.find(s=>s.role==='decision')?.id||visible[0]?.id)?.scrollIntoView({behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth',block:'center'})}>{c.choose}<ArrowRight size={16}/></button></div>:null}
  </article></Context.Provider>
}

function Gallery({compact=false}:{compact?:boolean}){
  const x=useExperience(),[selected,setSelected]=useState(0),dialog=useRef<HTMLDialogElement>(null),opener=useRef<HTMLButtonElement>(null)
  if(!x)return null
  const media=x.data.media.filter(m=>publicUrl(m.url)),active=media[selected]||media[0],c=atomicCopy(x.locale)
  if(!active)return null
  const video=active.type==='video'||active.type==='video/mp4'
  const renderMedia=(large:boolean)=>video?<video src={active.url} controls preload="metadata" aria-label={active.alt||x.data.identity.name}/>:<img src={active.url} alt={active.alt||x.data.identity.name} loading={compact?'eager':'lazy'} fetchPriority={compact?'high':'auto'} className={large?styles.zoomImage:styles.fitImage}/>
  return <div className={styles.gallery} data-compact={compact}>
    <div className={styles.mediaStage}>{renderMedia(false)}{!video?<button ref={opener} className={styles.zoom} type="button" aria-label={c.zoom} onClick={()=>dialog.current?.showModal()}><Maximize2 size={18}/></button>:null}<span className={styles.mediaCount}>{selected+1} / {media.length}</span></div>
    {media.length>1?<div className={styles.thumbnails}>{media.map((m,i)=><button type="button" key={m.id||i} aria-label={`${i+1} · ${m.alt||x.data.identity.name}`} aria-pressed={i===selected} onClick={()=>setSelected(i)}>{m.type==='video'?<span>▶</span>:<img src={m.url} alt="" loading="lazy"/>}</button>)}</div>:null}
    <dialog ref={dialog} className={styles.lightbox} onClose={()=>opener.current?.focus()}><div className={styles.lightboxBar}><strong>{x.data.identity.name}</strong><button type="button" onClick={()=>dialog.current?.close()} aria-label={c.close}><X/></button></div>{renderMedia(true)}{media.length>1?<div className={styles.lightboxControls}><button type="button" aria-label={c.previous} onClick={()=>setSelected(i=>(i-1+media.length)%media.length)}><ChevronLeft/></button><span>{selected+1} / {media.length}</span><button type="button" aria-label={c.next} onClick={()=>setSelected(i=>(i+1)%media.length)}><ChevronRight/></button></div>:null}</dialog>
  </div>
}

function Engagement(){
  const x=useExperience(),[saved,setSaved]=useState(false),[busy,setBusy]=useState(false),[feedback,setFeedback]=useState(''),lock=useRef(false)
  useEffect(()=>{if(!x||x.previewOnly)return;let live=true;fetch('/api/angelcare-marketplace/homepage/engagement').then(r=>r.ok?r.json():null).then(p=>{if(live)setSaved(Array.isArray(p?.data)&&p.data.some((r:Record<string,unknown>)=>r.catalog_item_id===x.data.identity.id&&r.selection_type==='saved'))}).catch(()=>{});return()=>{live=false}},[x?.data.identity.id,x?.previewOnly])
  if(!x||x.previewOnly)return null
  const c=atomicCopy(x.locale)
  async function toggle(){if(!x||lock.current)return;lock.current=true;setBusy(true);setFeedback('');try{const next=!saved;const receipt=await api<{recorded:boolean}>('/api/angelcare-marketplace/homepage/engagement',{method:'POST',body:JSON.stringify({event_name:next?'product.saved':'product.unsaved',locale:x.locale,catalog_item_id:x.data.identity.id,selection_type:'saved',active:next,route:window.location.pathname,event_data:{itemSlug:x.data.identity.slug}})});if(receipt.recorded!==true)throw Error('NOT_RECORDED');setSaved(next)}catch{setFeedback(c.apiError)}finally{lock.current=false;setBusy(false)}}
  async function share(){try{if(navigator.share)await navigator.share({title:x!.data.identity.name,url:location.href});else{await navigator.clipboard.writeText(location.href);setFeedback(c.urlCopied)}}catch(e){if(!(e instanceof Error&&e.name==='AbortError'))setFeedback(c.apiError)}}
  return <div className={styles.engagement}><button type="button" onClick={()=>void toggle()} disabled={busy} aria-pressed={saved}><Heart size={17} fill={saved?'currentColor':'none'}/>{saved?c.saved:c.save}</button><button type="button" onClick={()=>void share()}><Share2 size={17}/>{c.share}</button>{feedback?<span role="status">{feedback}</span>:null}</div>
}

function VariantChoices(){
  const x=useExperience();if(!x)return null
  return <div className={styles.variantGroups}>{x.data.variants.groups.map(g=>{const key=fieldKey(g);return <fieldset key={key}><legend>{label(g,x.locale)}{g.required===true?' *':''}</legend><div className={styles.pills}>{options(g).map(o=><button type="button" key={o} aria-pressed={x.selection[key]===o} onClick={()=>x.setChoice(key,o)}>{display(o,x.locale)}{x.selection[key]===o?<Check size={14}/>:null}</button>)}</div></fieldset>})}</div>
}

function Decision({compact=false}:{compact?:boolean}){
  const x=useExperience();if(!x)return null
  const c=atomicCopy(x.locale),state=actionState(x.data),product=state.path==='basket',max=x.data.availability.availableQuantity===null?99:Math.min(99,Math.max(0,Math.floor(x.data.availability.availableQuantity))),selected=Object.entries(x.selection).filter(([,v])=>present(v))
  const choiceLabel=(key:string)=>x.data.content.fields.find(f=>f.key===key)?.label||({requestedDate:c.date,requestedTime:c.time,cohortId:c.chooseCohort,quantity:c.quantity} as Record<string,string>)[key]||label(x.data.variants.groups.find(g=>fieldKey(g)===key)||{},x.locale)||c.choose
  const choiceValue=(key:string,value:unknown)=>key==='cohortId'?String((Array.isArray(record(x.data.domainExtension.academy).cohorts)?record(x.data.domainExtension.academy).cohorts as Record<string,unknown>[]:[]).find(r=>r.id===value)?.name||c.chooseCohort):display(value,x.locale)
  async function copy(){try{await navigator.clipboard.writeText(`${x!.data.identity.name}\n${selected.map(([k,v])=>`${choiceLabel(k)}: ${choiceValue(k,v)}`).join('\n')}`)}catch{}}
  return <div className={styles.decision} data-compact={compact}><div className={styles.decisionTop}><span>{c.selection}</span><Sparkles size={18}/></div><strong className={styles.price}>{price(x.data,x.locale)}</strong><small>{c.review}</small>
    {x.data.classification.masterDomain==='b2c_service_family'?<div className={styles.intentFields}><label>{c.date}<input type="date" value={typeof x.selection.requestedDate==='string'?x.selection.requestedDate:''} onChange={e=>x.setChoice('requestedDate',e.target.value)}/></label><label>{c.time}<input type="time" value={typeof x.selection.requestedTime==='string'?x.selection.requestedTime:''} onChange={e=>x.setChoice('requestedTime',e.target.value)}/></label></div>:null}
    {product?<><VariantChoices/><div className={styles.quantity}><label htmlFor={`quantity-${compact?'opening':'decision'}`}>{c.quantity}</label><div><button type="button" aria-label={`${c.quantity} −`} disabled={x.quantity<=1||x.busy} onClick={()=>x.setQuantity(Math.max(1,x.quantity-1))}><Minus size={16}/></button><input id={`quantity-${compact?'opening':'decision'}`} type="number" min="1" max={Math.max(1,max)} value={x.quantity} disabled={!max||x.busy} onChange={e=>x.setQuantity(Math.min(Math.max(1,max),Math.max(1,Math.floor(Number(e.target.value)||1))))}/><button type="button" aria-label={`${c.quantity} +`} disabled={x.quantity>=max||x.busy} onClick={()=>x.setQuantity(Math.min(max,x.quantity+1))}><Plus size={16}/></button></div></div></>:null}
    {selected.length?<details className={styles.brief} open={!compact}><summary>{c.selection} · {selected.length}</summary>{selected.map(([k,v])=><div key={k}><span>{choiceLabel(k)}</span><strong>{choiceValue(k,v)}</strong></div>)}<button type="button" onClick={()=>void copy()}><Copy size={14}/>{c.copy}</button></details>:null}
    {!state.enabled?<p className={styles.actionMessage} role="status">{c[state.reason as keyof typeof c]||c.apiError}</p>:null}
    {x.basketId?<div className={styles.success} role="status"><Check size={18}/><a href={`/angelcare-marketplace/${x.locale}/basket`}>{c.added}</a><a href={`/angelcare-marketplace/${x.locale}/checkout?basket=${encodeURIComponent(x.basketId)}&kind=transactional`}>{c.checkout}<ArrowRight size={16}/></a></div>:<button className={styles.primaryButton} type="button" disabled={!state.enabled||x.busy||x.previewOnly} onClick={()=>void x.act()}>{x.busy?c.busy:product?c.add:c.continue}<ArrowRight size={18}/></button>}
    {product&&!x.basketId?<button className={styles.secondaryButton} type="button" disabled={!state.enabled||x.busy||x.previewOnly} onClick={()=>void x.act('checkout')}>{({fr:'Commander maintenant',en:'Buy now',ar:'اشترِ الآن'})[x.locale]}<ArrowRight size={15}/></button>:null}
    {x.message?<p className={styles.actionMessage} role="alert">{x.message}</p>:null}
  </div>
}

function Opening({props}:{props:AtomicSectionProps}){
  const x=useExperience();if(!x)return null
  const c=atomicCopy(x.locale),data=x.data,fields=data.content.fields.filter(f=>['age_min','age_max','duration_hours','duration_minutes','delivery_modality','minimum_duration_hours','maximum_duration_hours','minimum_commitment_weeks','monthly_included_hours','language','organisation_type'].includes(f.key)&&present(f.value)).slice(0,6)
  const hasMedia=data.media.some(m=>publicUrl(m.url))
  return <div className={styles.opening} data-layout={props.layout||'gallery-split'} data-has-media={hasMedia}><div className={styles.openingIntro}><a className={styles.back} href={`/angelcare-marketplace/${x.locale}/marketplace`}>{c.back}<ArrowUpRight size={14}/></a><span className={styles.eyebrow}>{localeText(props.eyebrow,x.locale)||data.content.schemaName}</span><h1>{data.identity.name}</h1>{data.identity.shortDescription?<p className={styles.heroLead}>{data.identity.shortDescription}</p>:null}{fields.length?<div className={styles.heroFacts}>{fields.map(f=><span key={f.key}><small>{f.label}</small><strong>{display(f.value,x.locale)}</strong></span>)}</div>:null}<div className={styles.heroMeta}>{data.reviews.source&&data.reviews.count!==null&&data.reviews.count>0&&data.reviews.rating!==null?<a href={`#${sectionsFrom(props.content).find(s=>s.role==='reviews')?.id||'reviews'}`} onClick={e=>{e.preventDefault();document.querySelector('[data-role=reviews]')?.scrollIntoView({behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth'})}}><span aria-hidden="true">★</span> {data.reviews.rating} / 5 · {data.reviews.count} {c.rating}</a>:null}{data.availability.availableQuantity!==null?<span>{c.capacity} · {data.availability.availableQuantity}</span>:null}</div><Engagement/></div>{hasMedia?<div className={styles.openingMedia}><Gallery compact/></div>:null}<div className={styles.openingDecision}><Decision compact/></div><span className={styles.heroWatermark} aria-hidden="true">ANGELCARE</span></div>
}

function FieldCards({value,props}:{value:unknown;props:AtomicSectionProps}){
  const x=useExperience();if(!x)return null
  const filtered=rows(value,x.locale)
  const selectable=props.enableSelection===true
  return <><div className={styles.cards} data-layout={props.layout||'bento'}>{filtered.map((r,i)=><div key={r.key} className={styles.card} data-index={i%6}>
    <span className={styles.cardIndex}>{String(i+1).padStart(2,'0')}</span>{r.title?<h3>{r.title.replaceAll('_',' ')}</h3>:null}
    {selectable&&Array.isArray(r.value)&&r.value.every(v=>typeof v==='string')?<div className={styles.pills}>{(r.value as string[]).map(v=><button type="button" key={v} aria-pressed={Array.isArray(x.selection[r.key])&&(x.selection[r.key] as string[]).includes(v)} onClick={()=>{const current=Array.isArray(x.selection[r.key])?x.selection[r.key] as string[]:[];x.setChoice(r.key,current.includes(v)?current.filter(a=>a!==v):[...current,v])}}>{display(v,x.locale)}</button>)}</div>:selectable&&typeof r.value==='number'&&['site_count','beneficiary_volume','employee_population','expected_child_volume','expected_attendance','personnel_count'].includes(r.key)?<label className={styles.intentFields}>{r.title}<input type="number" min="0" value={typeof x.selection[r.key]==='number'?String(x.selection[r.key]):String(r.value)} onChange={e=>x.setChoice(r.key,e.target.value===''?'':Number(e.target.value))}/></label>:<p>{r.body}</p>}
    {publicUrl(r.raw.url||r.raw.mediaUrl||r.raw.imageUrl)?<img src={publicUrl(r.raw.url||r.raw.mediaUrl||r.raw.imageUrl)!} alt={r.title} loading="lazy"/>:null}
  </div>)}</div></>
}

function Disclosure({value,role}:{value:unknown;role:string}){
  const x=useExperience();if(!x)return null
  return <div className={styles.disclosures}>{rows(value,x.locale).map((r,i)=><details key={r.key} open={role==='curriculum'&&i===0}><summary><span>{String(i+1).padStart(2,'0')}</span><strong>{r.title||display(r.value,x.locale)}</strong><Plus size={18}/></summary>{r.body?<p>{r.body}</p>:null}{Array.isArray(r.raw.lessons)?<ol>{r.raw.lessons.filter(present).map((v,index)=><li key={index}>{display(v,x.locale)}</li>)}</ol>:null}{typeof r.raw.durationMinutes==='number'?<small>{r.raw.durationMinutes} min</small>:null}</details>)}</div>
}

function Schedule({value,props}:{value:unknown;props:AtomicSectionProps}){
  const x=useExperience();if(!x)return null
  // Published rule lists are constraints, never a fabricated live availability calendar.
  const ruleRows=rows(value,x.locale)
  const days=ruleRows.find(r=>r.key==='available_days'),publishedDays=Array.isArray(days?.value)?days.value as string[]:[],selectedDays=Array.isArray(x.selection.available_days)?x.selection.available_days as string[]:[]
  const weekdays=['monday','tuesday','wednesday','thursday','friday','saturday','sunday'],names={fr:['Lun','Mar','Mer','Jeu','Ven','Sam','Dim'],en:['Mon','Tue','Wed','Thu','Fri','Sat','Sun'],ar:['الإثنين','الثلاثاء','الأربعاء','الخميس','الجمعة','السبت','الأحد']}
  return <div className={styles.schedule}>{publishedDays.length?<div className={styles.weekBoard} aria-label={days?.title}>{weekdays.map((day,i)=><button type="button" key={day} disabled={!publishedDays.includes(day)} aria-pressed={selectedDays.includes(day)} onClick={()=>x.setChoice('available_days',selectedDays.includes(day)?selectedDays.filter(d=>d!==day):[...selectedDays,day])}><span>{names[x.locale][i]}</span><strong>{selectedDays.includes(day)?<Check size={20}/>:publishedDays.includes(day)?<Plus size={20}/>:<Minus size={16}/>}</strong><small>{selectedDays.includes(day)&&typeof x.selection.requestedTime==='string'?x.selection.requestedTime:'—'}</small></button>)}</div>:null}<FieldCards value={value} props={{...props,layout:'strip',enableSelection:true}}/><div className={styles.scheduleNote}><ShieldCheck size={18}/><span>{atomicCopy(x.locale).draft}</span></div>{ruleRows.some(r=>r.key==='start_date'||r.key==='programme_start_date')?<p>{ruleRows.filter(r=>/^(start_date|end_date|programme_start_date|programme_end_date)$/.test(r.key)).map(r=>r.body).join(' → ')}</p>:null}</div>
}

function ContentExplorer({value}:{value:unknown}){
  const x=useExperience(),[selected,setSelected]=useState(0);if(!x)return null
  const source=rows(value,x.locale),current=source[selected]||source[0]
  if(!current)return null
  return <div className={styles.contentExplorer}><div className={styles.contentIndex}>{source.map((r,i)=><button key={r.key} type="button" aria-pressed={i===selected} onClick={()=>setSelected(i)}><span>{String(i+1).padStart(2,'0')}</span><strong>{r.title||display(r.value,x.locale)}</strong><ArrowRight size={17}/></button>)}</div><div className={styles.contentDetail}><span className={styles.eyebrow}>{current.title}</span><strong>{String(selected+1).padStart(2,'0')}</strong>{Array.isArray(current.value)?<ul>{current.value.filter(present).map((v,i)=><li key={i}>{display(v,x.locale)}</li>)}</ul>:<p>{current.body}</p>}</div></div>
}

function Cohorts({value}:{value:unknown}){
  const x=useExperience();if(!x)return null
  const list=Array.isArray(value)?value:present(value)?[value]:[],c=atomicCopy(x.locale)
  return <div className={styles.cohorts}>{list.map((v,i)=>{const r=record(v),id=typeof r.id==='string'?r.id:'',title=String(r.title||r.name||r.code||r.label||''),start=String(r.startDate||r.startsAt||r.start_date||'')
    const capacity=typeof r.capacity==='number'?r.capacity:null,enrolled=typeof r.enrolledCount==='number'?r.enrolledCount:null,remaining=capacity!==null&&enrolled!==null?Math.max(0,capacity-enrolled):null
    return <article key={id||i}><div className={styles.cohortDate}>{start?<time dateTime={start}>{Number.isFinite(new Date(start).getTime())?new Intl.DateTimeFormat(x.locale,{day:'numeric',month:'short'}).format(new Date(start)):start}</time>:<span>{String(i+1).padStart(2,'0')}</span>}</div><div><h3>{title||x.data.identity.name}</h3><p>{display(r.description||r.location||r.modality||'',x.locale)}</p>{remaining!==null?<small>{c.capacity} · {remaining}</small>:null}</div>{id&&r.status==='enrollment_open'?<button type="button" aria-pressed={x.selection.cohortId===id} disabled={remaining===0} onClick={()=>x.setChoice('cohortId',id)}>{c.chooseCohort}<ArrowRight size={16}/></button>:null}</article>
  })}</div>
}

function Related({value}:{value:unknown}){
  const x=useExperience();if(!x)return null
  const items=Array.isArray(value)?value as PublicExperience360['recommendations']:[]
  return <div className={styles.related}>{items.map(r=><a key={r.id} href={`/angelcare-marketplace/${x.locale}/marketplace/item/${encodeURIComponent(r.slug)}`} className={styles.relatedCard} data-has-media={!!publicUrl(r.mediaUrl)}>{publicUrl(r.mediaUrl)?<div className={styles.relatedImage}><img src={r.mediaUrl!} alt={r.name} loading="lazy"/></div>:null}<div><span>{r.kind}</span><h3>{r.name}</h3>{r.priceAmount!==null?<strong>{r.priceAmount} {r.currency}</strong>:null}<ArrowUpRight size={20}/></div></a>)}</div>
}

export function AtomicOfferSection({props,editorMode=false}:{props:AtomicSectionProps;editorMode?:boolean}){
  const x=useExperience(),id=useId()
  if(!x)return editorMode?<section className={styles.editorSection}><span>{String(props.role)} · {String(props.layout||'bento')}</span><h2>{localeText(props.title,'fr')}</h2><p>{atomicCopy('fr').preview}</p><code>{props.bindingKey||props.fieldKeys||props.fieldSections||props.role}</code>{props.hidden?<strong>{atomicCopy('fr').hidden}</strong>:null}</section>:null
  const visibility=sectionVisibility(x.data,props)
  if(!visibility.visible)return null
  const value=sectionValue(x.data,props),title=localeText(props.title,x.locale),lead=localeText(props.lead,x.locale),eyebrow=localeText(props.eyebrow,x.locale)
  let body:ReactNode=null
  if(props.role==='opening')body=<Opening props={props}/>
  else if(props.role==='gallery')body=<Gallery/>
  else if(props.role==='decision')body=<div className={styles.finalDecision}><div><span className={styles.eyebrow}>{eyebrow||atomicCopy(x.locale).selection}</span><h2>{title||x.data.identity.name}</h2>{lead?<p>{lead}</p>:null}<p>{x.data.identity.shortDescription}</p><Engagement/></div><Decision/></div>
  else if(props.role==='story'){const image=x.data.media.filter(m=>m.type!=='video'&&publicUrl(m.url))[Math.max(0,Number(props.mediaIndex)||1)];body=<div className={styles.story} data-has-image={!!image}>{image?<img src={image.url} alt={image.alt||x.data.identity.name} loading="lazy"/>:null}<div><span className={styles.storyMark} aria-hidden="true">✦</span><p>{display(value,x.locale)}</p></div></div>}
  else if(props.role==='choices')body=<VariantChoices/>
  else if(props.role==='curriculum')body=<Programme value={value}/>
  else if(props.role==='faq')body=<Disclosure value={value} role={props.role}/>
  else if(props.role==='contents')body=<ContentExplorer value={value}/>
  else if(props.role==='schedule')body=<Schedule value={value} props={props}/>
  else if(props.role==='cohorts')body=<Cohorts value={value}/>
  else if(props.role==='related')body=<Related value={value}/>
  else if(props.role==='reviews')body=<ReviewSummary/>
  else if(props.role==='proof')body=<div className={styles.proofs}>{x.data.trust.claims.filter(r=>['proven','verified','PROVEN'].includes(r.status)&&r.evidenceReference).map(r=><article key={r.key}><ShieldCheck size={26}/><h3>{r.label}</h3>{publicUrl(r.evidenceReference)?<a href={publicUrl(r.evidenceReference)!} target="_blank" rel="noopener noreferrer">{atomicCopy(x.locale).evidence}<ArrowUpRight size={16}/></a>:null}</article>)}</div>
  else if(props.role==='providers'||props.role==='trainers')body=<People value={value}/>
  else if(props.role==='benefits')body=<Benefits value={value}/>
  else if(props.role==='plans')body=<PublishedPlans value={value} props={props}/>
  else if(props.role==='deployment')body=<Deployment value={value}/>
  else if(props.layout==='ledger')body=<Specifications value={value} props={props}/>
  else body=<FieldCards value={value} props={props}/>
  const design=designToStyle(props.sourceDesign as StudioDesignStyle|undefined)
  return <section id={props.id||id} className={styles.section} data-role={props.role} data-layout={props.layout} data-ac-atomic-section={props.id} style={design} {...responsiveDataAttributes(props.responsive as StudioResponsiveState|undefined)}>
    {!noHeadingRoles.has(props.role)&&title?<header className={styles.sectionHeading}>{eyebrow?<span className={styles.eyebrow}>{eyebrow}</span>:null}<h2>{title}</h2>{lead?<p>{lead}</p>:null}</header>:null}{body}
  </section>
}


export function AtomicOfferGroup({props,children}:{props:Record<string,unknown>;children:ReactNode}){
 const x=useExperience(),components=Array.isArray(props.content)?props.content as ComponentData[]:[]
 const visible=components.map(c=>c.type==='atomic_offer_section'?!!x&&sectionVisibility(x.data,c.props as AtomicSectionProps).visible:sectionsFrom(record(c.props).content).some(s=>!!x&&sectionVisibility(x.data,s).visible))
 if(props.hidden===true||x&&!visible.some(Boolean))return null
 const filtered=Array.isArray(children)?children.filter((_,i)=>!x||visible[i]):children
 return <div className={styles.moduleGroup} data-layout={String(props.layout||'balanced')} data-count={visible.filter(Boolean).length} style={designToStyle(props.sourceDesign as StudioDesignStyle|undefined)} {...responsiveDataAttributes(props.responsive as StudioResponsiveState|undefined)}>{filtered}</div>
}

export function AtomicDocumentPreview({component,data,locale,previewOnly=false}:{component:ComponentData;data:PublicExperience360;locale:AtomicLocale;previewOnly?:boolean}){
  const props=record(component.props)
  function render(children:unknown):ReactNode{return Array.isArray(children)?children.map((c:ComponentData,i)=>c.type==='atomic_offer_section'?<AtomicOfferSection key={String(c.props.id)||i} props={c.props as AtomicSectionProps}/>:c.type==='atomic_offer_group'?<AtomicOfferGroup key={String(c.props?.id)||i} props={record(c.props)}>{render(record(c.props).content)}</AtomicOfferGroup>:<div key={String(c.props?.id)||i}>{render(record(c.props).content)}</div>):null}
  return <AtomicExperienceFrame key={`${data.identity.id}:${locale}`} type={component.type} props={props} data={data} locale={locale} previewOnly={previewOnly}>{render(props.content)}</AtomicExperienceFrame>
}
