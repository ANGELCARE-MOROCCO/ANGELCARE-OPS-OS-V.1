'use client'
import {ArrowRight,ArrowUpRight,Check,CalendarDays,Layers3,HeartHandshake,Map,BriefcaseBusiness,Sparkles} from 'lucide-react'
import type {CatalogLocale} from '../catalog-discovery/types'
import {UI,tr,type Profile} from './content'
import s from './specialist.module.css'
function Diagram({p,l,focus,context}:{p:Profile;l:CatalogLocale;focus:number|null;context:number|null}){
 const node=(i:number)=> <span key={i} data-active={focus===i}><b>0{i+1}</b>{tr(p.chapters[i].title,l)}</span>
 switch(p.id){
 case 'creches':return <div className={s.dayWheel}><HeartHandshake size={42}/><div>{[0,1,2].map(node)}</div><strong>{context===null?tr(UI.selected,l):tr(p.choices[context],l)}</strong></div>
 case 'schools':return <div className={s.schoolPlanner}><div><CalendarDays/><strong>{tr(p.dimension,l)}</strong></div>{p.choices.map((v,i)=><div key={i} data-active={context===i}><b>{tr(v,l)}</b><span>{focus!==null?tr(p.chapters[focus].title,l):tr(UI.focus,l)}</span></div>)}</div>
 case 'establishment-academy':return <div className={s.skillLadder}>{[0,1,2].map(node)}<ArrowUpRight size={40}/><strong>{tr(p.dimension,l)}</strong></div>
 case 'establishment-os':return <div className={s.workflowDiagram}><Layers3 size={40}/>{[0,1,2].map(i=><div key={i}>{node(i)}{i<2?<ArrowRight/>:null}</div>)}<small>{tr(UI.toolNote,l)}</small></div>
 case 'kids-club':return <div className={s.clubZones}>{[0,1,2].map(i=><div key={i}>{i===0?<Sparkles/>:i===1?<CalendarDays/>:<HeartHandshake/>}{node(i)}</div>)}</div>
 case 'guest-childcare':return <div className={s.stayPassport}><BriefcaseBusiness size={42}/><h3>{context!==null?tr(p.choices[context],l):tr(p.label,l)}</h3>{[0,1,2].map(node)}</div>
 case 'family-concierge':return <div className={s.itineraryMap}><Map size={42}/><ol>{p.stages.map((v,i)=><li key={i}><b>{String(i+1).padStart(2,'0')}</b>{tr(v,l)}</li>)}</ol><strong>{focus!==null?tr(p.chapters[focus].title,l):tr(UI.selected,l)}</strong></div>
 case 'seasonal-programmes':return <div className={s.seasonCalendar}><CalendarDays size={40}/>{p.choices.map((c,i)=><div key={i} data-active={context===i}><strong>{tr(c,l)}</strong><span>{focus!==null?tr(p.chapters[focus].title,l):tr(UI.focus,l)}</span></div>)}</div>
 case 'maternity':return <div className={s.continuityMap}>{p.choices.map((c,i)=><div key={i} data-active={context===i}><HeartHandshake/><strong>{tr(c,l)}</strong></div>)}<small>{tr(UI.medical,l)}</small></div>
 case 'mother-baby':return <div className={s.supportOrbit}><HeartHandshake size={48}/><div>{[0,1,2].map(node)}</div><strong>{context!==null?tr(p.choices[context],l):tr(UI.selected,l)}</strong></div>
 case 'workshops':return <div className={s.sessionCards}>{p.choices.map((v,i)=><div key={i} data-active={context===i}><span>0{i+1}</span><strong>{tr(v,l)}</strong><p>{focus!==null?tr(p.chapters[focus].title,l):tr(UI.focus,l)}</p></div>)}</div>
 case 'family-benefits':return <div className={s.benefitStack}>{[0,1,2].map(i=><div key={i}>{node(i)}<Check/></div>)}<strong>{context!==null?tr(p.choices[context],l):tr(UI.selected,l)}</strong></div>
 case 'emergency-support':return <div className={s.protocolBoard}><BriefcaseBusiness size={40}/>{p.choices.map((v,i)=><div key={i} data-active={context===i}><b>0{i+1}</b><strong>{tr(v,l)}</strong><ArrowRight/></div>)}<small>{tr(UI.toolNote,l)}</small></div>
 case 'family-days':return <div className={s.eventProgramme}><Sparkles size={42}/><div>{[0,1,2].map(node)}</div><strong>{context!==null?tr(p.choices[context],l):tr(UI.selected,l)}</strong></div>
 default:return null
 }
}
export function ProjectExplorer({p,locale,focus,context,onFocus,onContext,onReset}:{p:Profile;locale:CatalogLocale;focus:number|null;context:number|null;onFocus:(i:number)=>void;onContext:(i:number)=>void;onReset:()=>void}){
 return <section id="project-explorer" className={`${s.section} ${s.explorer}`} data-specialist-module="tool" data-specialist-tool={p.id}><div className={s.sectionHead}><span className={s.eyebrow}>{tr(UI.toolNote,locale)}</span><h2>{tr(p.invitation,locale)}</h2><p>{tr(UI.clear,locale)}</p></div><div className={`${s.explorerBody} ${s['explorer_'+p.id.replaceAll('-','_')]}`}><div className={s.controls}><fieldset><legend>{tr(UI.focus,locale)}</legend><div className={s.choiceGroup}>{p.chapters.map((c,i)=><button type="button" aria-pressed={focus===i} onClick={()=>onFocus(i)} key={i}><span>0{i+1}</span>{tr(c.title,locale)}{focus===i?<Check size={18}/>:<ArrowUpRight size={18}/>}</button>)}</div></fieldset><fieldset><legend>{tr(p.dimension,locale)}</legend><div className={s.contextGroup}>{p.choices.map((c,i)=><button type="button" aria-pressed={context===i} onClick={()=>onContext(i)} key={i}>{tr(c,locale)}</button>)}</div></fieldset><button type="button" className={s.textLink} onClick={onReset}>{tr(UI.reset,locale)}</button></div><div className={s.explorerVisual}><Diagram p={p} l={locale} focus={focus} context={context}/><div className={s.insight} role="status"><strong>{focus===null?tr(UI.selected,locale):tr(p.chapters[focus].title,locale)}</strong><p>{focus===null?tr(p.story,locale):tr(p.chapters[focus].body,locale)}</p></div></div></div></section>
}
