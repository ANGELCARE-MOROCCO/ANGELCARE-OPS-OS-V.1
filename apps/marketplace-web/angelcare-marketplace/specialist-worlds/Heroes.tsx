import Link from '@/angelcare-marketplace/navigation-care-orbit/CareOrbitLink'
import {ArrowUpRight,Sparkles,Building2,ArrowRight,CalendarDays,Layers3} from 'lucide-react'
import type {CatalogLocale} from '../catalog-discovery/types'
import {UI,tr,type Profile} from './content'
import {href,requestHref} from './contract'
import s from './specialist.module.css'
export function Art({p,l,className='',priority=false}:{p:Profile;l:CatalogLocale;className?:string;priority?:boolean}){return <figure className={`${s.art} ${className}`}><img src={`/angelcare-marketplace/specialist-worlds-r1/${p.image}.webp`} alt={tr(p.label,l)} width={1536} height={1024} loading={priority?'eager':'lazy'} fetchPriority={priority?'high':'auto'}/><figcaption>{tr(UI.illustration,l)}</figcaption></figure>}
function Heading({p,l}:{p:Profile;l:CatalogLocale}){return <div className={s.heading}><span className={s.eyebrow}><Building2 size={15}/>{tr(UI.b2b,l)} · {tr(p.label,l)}</span><h1>{tr(p.title,l)}</h1><p className={s.lead}>{tr(p.lead,l)}</p><div className={s.actions}><Link className={s.button} href="#project-explorer">{tr(p.invitation,l)}<ArrowUpRight size={19}/></Link><Link className={s.secondary} href="#specialist-offers">{tr(UI.discover,l)}<ArrowRight size={17}/></Link></div><p className={s.audience}>{tr(p.audience,l)}</p></div>}
function Ribbon({p,l}:{p:Profile;l:CatalogLocale}){return <div className={s.ribbon}>{p.chapters.map(c=><span key={c.title.en}><Sparkles size={15}/>{tr(c.title,l)}</span>)}</div>}
function Stages({p,l}:{p:Profile;l:CatalogLocale}){return <ol className={s.heroStages}>{p.stages.map((c,i)=><li key={i}><b>{String(i+1).padStart(2,'0')}</b><span>{tr(c,l)}</span></li>)}</ol>}
export function SpecialistHero({p,l}:{p:Profile;l:CatalogLocale}){
 const h=<Heading p={p} l={l}/>,a=<Art p={p} l={l} priority/>,r=<Ribbon p={p} l={l}/>,st=<Stages p={p} l={l}/>
 const body=(()=>{switch(p.id){
 case 'creches':return <><div className={s.nurseryOpening}>{h}<div className={s.nurseryScene}>{a}<div className={s.floatingTag}><Sparkles/><span>{tr(p.chapters[0].title,l)}</span></div></div></div>{r}</>
 case 'schools':return <><div className={s.campusHeading}>{h}<div className={s.campusSeal}><Layers3/><span>{tr(UI.operating,l)}</span></div></div><div className={s.campusScene}>{a}{st}</div></>
 case 'establishment-academy':return <><div className={s.trainingOpening}><div>{a}<span className={s.photoSticker}>{tr(p.chapters[0].title,l)}</span></div>{h}</div>{st}</>
 case 'establishment-os':return <><div className={s.systemOpening}>{h}<div className={s.systemDiagram}>{p.chapters.map((c,i)=><div key={i}><Layers3/><strong>{tr(c.title,l)}</strong><span>{tr(p.stages[i],l)}</span></div>)}</div></div><div className={s.systemScene}>{a}<p>{tr(UI.toolNote,l)}</p></div></>
 case 'kids-club':return <><div className={s.clubOpening}>{h}<div className={s.clubScene}>{a}<div className={s.clubBadge}><Sparkles size={30}/><strong>{tr(p.chapters[0].title,l)}</strong></div></div></div>{r}<div className={s.clubFoot}>{st}</div></>
 case 'guest-childcare':return <><div className={s.guestOpening}>{a}<div className={s.guestPaper}>{h}</div></div>{r}</>
 case 'family-concierge':return <><div className={s.conciergeOpening}>{h}<div className={s.conciergeScene}>{a}{st}</div></div>{r}</>
 case 'seasonal-programmes':return <><div className={s.seasonHeading}>{h}</div><div className={s.seasonOpening}><div className={s.seasonCards}>{p.choices.map((v,i)=><a href="#project-explorer" key={i}><CalendarDays/><b>{tr(v,l)}</b><ArrowUpRight/></a>)}</div>{a}</div>{r}</>
 case 'maternity':return <><div className={s.continuumOpening}><div>{h}{st}</div>{a}</div>{r}</>
 case 'mother-baby':return <><div className={s.motherOpening}><div>{h}<div className={s.softNote}>{tr(p.chapters[2].title,l)}</div></div><div className={s.motherScene}>{a}<Sparkles className={s.bigSparkle} size={72}/></div></div>{r}</>
 case 'workshops':return <><div className={s.workshopOpening}><div className={s.workshopMast}>{h}</div><div className={s.workshopPoster}>{a}<div>{tr(p.chapters[1].title,l)}</div></div></div>{st}</>
 case 'family-benefits':return <><div className={s.benefitOpening}>{a}{h}</div><div className={s.benefitPortfolio}>{p.chapters.map((c,i)=><a href="#project-explorer" key={i}><span>0{i+1}</span><strong>{tr(c.title,l)}</strong><ArrowUpRight/></a>)}</div></>
 case 'emergency-support':return <><div className={s.contingencyOpening}>{h}<aside className={s.protocol}>{st}<Link href={requestHref(p,l,'')}>{tr(UI.prepare,l)}<ArrowUpRight/></Link></aside></div><div className={s.contingencyScene}>{a}{r}</div></>
 case 'family-days':return <><div className={s.eventHeading}>{h}</div><div className={s.eventScene}>{a}<div className={s.eventTickets}>{p.chapters.map((c,i)=><span key={i}><Sparkles/>{tr(c.title,l)}</span>)}</div></div></>
 default:return null
 }})()
 return <header className={`${s.hero} ${s[p.id.replaceAll('-','_')]}`} data-specialist-module="hero" data-opening={p.id}>{body}</header>
}
