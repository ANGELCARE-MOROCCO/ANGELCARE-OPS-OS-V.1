'use client';
import {useEffect,useRef,useState,type KeyboardEvent,type ReactNode} from 'react';
import Link from 'next/link';
import {useRouter} from 'next/navigation';
import {ArrowRight,ArrowUpRight,ShieldCheck,FileCheck2} from 'lucide-react';
import type {Locale} from '../contracts';
import {v7} from '../vacancy-pm7-copy';
import s from '../vacancy-pm7.module.css';
export type VacancyPanelId='overview'|'role'|'fit'|'terms'|'international'|'employer'|'apply';
export interface VacancyPane{id:VacancyPanelId;label:string;content:ReactNode}
export function VacancyWorkspace({locale,panels,applyHref,employerHref,employerName,actions,active,alreadyApplied,applyOpen}:{locale:Locale;panels:VacancyPane[];applyHref:string;employerHref:string;employerName:string;actions:ReactNode;active:boolean;alreadyApplied:boolean;applyOpen:boolean}){
 const router=useRouter(),copy=v7(locale),[selected,setSelected]=useState<VacancyPanelId>('overview');
 const tabRefs=useRef<Array<HTMLButtonElement|null>>([]),lastUrl=useRef('');
 useEffect(()=>{if(applyOpen)setSelected('apply');},[applyOpen]);
 const getHash=():VacancyPanelId=>{
  const h=window.location.hash.slice(1);
  if(h==='application')return 'apply';
  const matched=panels.find(p=>p.id===h)?.id;
  if(matched)return matched;
  return new URLSearchParams(window.location.search).get('apply')==='1'?'apply':'overview';
 };
 useEffect(()=>{
  const sync=()=>{const id=getHash();setSelected(id)};
  sync();window.addEventListener('hashchange',sync);
  return()=>window.removeEventListener('hashchange',sync);
 // eslint-disable-next-line react-hooks/exhaustive-deps
 },[]);
 function select(id:VacancyPanelId,focus=false){
  setSelected(id);
  if(typeof window!=='undefined'){
   const dest=window.location.pathname+window.location.search+'#'+id;
   if(lastUrl.current!==dest){window.history.replaceState(window.history.state,'',dest);lastUrl.current=dest;}
  }
  if(focus){const idx=panels.findIndex(p=>p.id===id);tabRefs.current[idx]?.focus();}
 }
 function keys(event:KeyboardEvent<HTMLButtonElement>,index:number){
  let next:number|null=null;
  const rtl=locale==='ar';
  if(event.key==='ArrowRight')next=(index+(rtl?-1:1)+panels.length)%panels.length;
  else if(event.key==='ArrowLeft')next=(index+(rtl?1:-1)+panels.length)%panels.length;
  else if(event.key==='Home')next=0;
  else if(event.key==='End')next=panels.length-1;
  if(next!==null){event.preventDefault();select(panels[next].id,true);}
 }
 const startApply=()=>{
  if(!active)return;
  if(alreadyApplied){select('apply');return;}
  // Server initializes application documents and restores drafts with ?apply=1.
  if(!new URLSearchParams(window.location.search).has('apply')){
   router.push(applyHref+'#apply');
  }else select('apply');
 };
 return <div className={s.workspace}>
  <div className={s.mainRail}>
   <nav className={s.tabs} role="tablist" aria-label={copy.explore}>
    {panels.map((panel,index)=><button key={panel.id} ref={node=>{tabRefs.current[index]=node}} id={`jobkix-v7-tab-${panel.id}`} role="tab" aria-controls={`jobkix-v7-panel-${panel.id}`} aria-selected={selected===panel.id} tabIndex={selected===panel.id?0:-1} onClick={()=>select(panel.id)} onKeyDown={event=>keys(event,index)} className={selected===panel.id?s.active:''}>{String(index+1).padStart(2,'0')} <span>{panel.label}</span></button>)}
   </nav>
   {panels.map(panel=><section key={panel.id} id={`jobkix-v7-panel-${panel.id}`} role="tabpanel" aria-labelledby={`jobkix-v7-tab-${panel.id}`} tabIndex={0} className={s.panelViewport} hidden={selected!==panel.id} aria-hidden={selected!==panel.id}>{panel.content}</section>)}
  </div>
  <aside className={s.sidebar} aria-label={copy.action}>
   <div className={s.sideCard}>
    <div className={s.sideEyebrow}>{copy.action}</div><h3>{copy.next}</h3><p>{copy.applicationText}</p>
    {active?<button type="button" onClick={startApply} className={s.primary}>{copy.continueApplication}<ArrowRight size={16} aria-hidden="true"/></button>:<div className={s.ended}>{copy.closed}</div>}
    <div className={s.actionArea} aria-label={copy.saveShare}>{actions}</div>
    <div className={s.consentHint}><FileCheck2 size={14} aria-hidden="true"/>{copy.declared}</div>
   </div>
   <div className={s.sideCard}><div className={s.sideEyebrow}>{copy.company}</div><h3>{employerName}</h3><p>{copy.employerWorld}</p><Link className={s.sideLink} href={employerHref}>{copy.viewEmployer}<ArrowUpRight size={15} aria-hidden="true"/></Link></div>
   <div className={`${s.sideCard} ${s.trustCard}`}><ShieldCheck size={19} aria-hidden="true"/><strong>{copy.noScore}</strong><p>{copy.fitNotice}</p><button onClick={()=>select('fit')} type="button" className={s.sideLink}>{copy.fit} <ArrowRight size={15} aria-hidden="true"/></button></div>
  </aside>
 </div>;
}
