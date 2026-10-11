'use client'
import {useRef,useState} from 'react'
import {ChevronLeft,ChevronRight,Maximize2,Sparkles,X} from 'lucide-react'
import type {PublicExperience360} from '../types'
import {publicUrl} from '../../atomic-offer-experience/model'
import {atomicCopy} from '../../atomic-offer-experience/copy'
import styles from './canonical-atomic-detail-world.module.css'

export function NativeDetailGallery({media,name,locale}:{media:PublicExperience360['media'];name:string;locale:'fr'|'en'|'ar'}){
 const [selected,setSelected]=useState(0),dialog=useRef<HTMLDialogElement>(null),opener=useRef<HTMLButtonElement>(null)
 const sources=media.filter(m=>publicUrl(m.url)),index=Math.min(selected,Math.max(0,sources.length-1)),active=sources[index],c=atomicCopy(locale)
 if(!active)return <div className={styles.mediaEmpty}><Sparkles/><span>ANGELCARE</span></div>
 const render=()=>active.type==='video'||active.type==='video/mp4'?<video src={active.url} controls preload="metadata" aria-label={active.alt||name}/>:<img className={styles.primaryMedia} src={active.url} alt={active.alt||name}/>
 return <div className={styles.mediaStage}><div className={styles.galleryMain}>{render()}<button ref={opener} type="button" className={styles.mediaExpand} onClick={()=>dialog.current?.showModal()} aria-label={c.zoom}><Maximize2 size={18}/></button><span className={styles.galleryCount}>{index+1} / {sources.length}</span></div>{sources.length>1?<div className={styles.mediaRail}>{sources.map((m,i)=><button key={m.id||i} type="button" aria-label={`${i+1} · ${m.alt||name}`} aria-pressed={index===i} onClick={()=>setSelected(i)}>{m.type==='video'||m.type==='video/mp4'?<span>▶</span>:<img src={m.url} alt="" loading="lazy"/>}</button>)}</div>:null}<dialog ref={dialog} className={styles.mediaDialog} onClose={()=>{dialog.current?.querySelectorAll('video').forEach(v=>v.pause());opener.current?.focus()}}><div><strong>{name}</strong><button type="button" aria-label={c.close} onClick={()=>dialog.current?.close()}><X/></button></div>{render()}{sources.length>1?<nav aria-label={c.zoom}><button type="button" aria-label={c.previous} onClick={()=>setSelected(i=>(i+sources.length-1)%sources.length)}><ChevronLeft/></button><span>{index+1} / {sources.length}</span><button type="button" aria-label={c.next} onClick={()=>setSelected(i=>(i+1)%sources.length)}><ChevronRight/></button></nav>:null}</dialog></div>
}
