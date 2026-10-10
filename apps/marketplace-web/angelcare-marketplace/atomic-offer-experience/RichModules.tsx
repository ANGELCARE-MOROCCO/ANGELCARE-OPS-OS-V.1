'use client'
import {useState,type ComponentType} from 'react'
import {ArrowRight,BookOpen,Check,CheckCircle2,ChevronRight,Clock,Globe,GraduationCap,Layers,MapPin,ShieldCheck,Sparkles,Star,Users} from 'lucide-react'
import {useExperience} from './context'
import {display,present,record,rows,type AtomicSectionProps} from './model'
import {atomicCopy} from './copy'
import styles from './atomic.module.css'
const icons:ComponentType<{size?:number}>[]=[Sparkles,Users,BookOpen,Layers,ShieldCheck,Globe]
const vocabulary={fr:{programme:'Programme',details:'Explorer les détails',profile:'Profil public',languages:'Langues',coverage:'Zones',expertise:'Compétences',certifications:'Certifications publiées',option:'Option publiée',choose:'Choisir',selected:'Sélectionné',outline:'Le contenu de votre parcours',review:'Synthèse des avis publiés',source:'Source',scope:'Les informations de cette offre',steps:'Étapes et modalités publiées'},en:{programme:'Programme',details:'Explore the details',profile:'Public profile',languages:'Languages',coverage:'Areas',expertise:'Expertise',certifications:'Published certifications',option:'Published option',choose:'Choose',selected:'Selected',outline:'Inside your learning journey',review:'Published review summary',source:'Source',scope:'This offer’s information',steps:'Published steps and terms'},ar:{programme:'البرنامج',details:'استكشف التفاصيل',profile:'ملف عام',languages:'اللغات',coverage:'المناطق',expertise:'الكفاءات',certifications:'الشهادات المنشورة',option:'خيار منشور',choose:'اختر',selected:'تم الاختيار',outline:'محتوى مسارك التعليمي',review:'ملخص التقييمات المنشورة',source:'المصدر',scope:'معلومات هذا العرض',steps:'الخطوات والشروط المنشورة'}}
export function Benefits({value}:{value:unknown}){
 const x=useExperience();if(!x)return null
 return <div className={styles.benefitGrid}>{rows(value,x.locale).map((r,i)=>{const Icon=icons[i%icons.length];return <article key={r.key}><span className={styles.iconTile}><Icon size={23}/></span><div>{r.title?<h3>{r.title}</h3>:null}<p>{r.body}</p></div></article>})}</div>
}
export function Specifications({value,props}:{value:unknown;props:AtomicSectionProps}){
 const x=useExperience();if(!x)return null
 return <dl className={styles.specifications}>{rows(value,x.locale).map(r=><div key={r.key}><dt>{r.title||vocabulary[x.locale].scope}</dt><dd>{display(r.value,x.locale)}</dd></div>)}</dl>
}
export function People({value}:{value:unknown}){
 const x=useExperience();if(!x)return null
 const c=vocabulary[x.locale]
 return <div className={styles.people}>{rows(value,x.locale).map(r=>{const p=r.raw,name=String(p.displayName||p.name||r.title),initials=name.split(/\s+/).filter(Boolean).slice(0,2).map(s=>s[0]).join('');return <article key={r.key}><div className={styles.profileHeader}><div className={styles.monogram} aria-hidden="true">{initials}</div><div><small>{c.profile}</small><h3>{name}</h3>{present(p.providerType)?<span>{display(p.providerType,x.locale)}</span>:null}</div></div><dl>{[[c.languages,p.languages],[c.expertise,p.serviceCategories],[c.coverage,p.zones],[c.certifications,p.certifications]].filter(([,v])=>present(v)).map(([name,v],i)=><div key={i}><dt>{String(name)}</dt><dd>{display(v,x.locale)}</dd></div>)}</dl></article>})}</div>
}
export function Programme({value}:{value:unknown}){
 const x=useExperience(),[selected,setSelected]=useState(0);if(!x)return null
 const list=rows(value,x.locale),active=list[selected]||list[0],c=vocabulary[x.locale]
 if(!active)return null
 const lessonList=Array.isArray(active.raw.lessons)?active.raw.lessons.filter(present):Array.isArray(active.value)?active.value.filter(present):[]
 return <div className={styles.programme}><div className={styles.programmeList} role="group" aria-label={c.programme}>{list.map((r,i)=><button key={r.key} type="button" aria-pressed={selected===i} onClick={()=>setSelected(i)}><span>{String(i+1).padStart(2,'0')}</span><strong>{r.title||display(r.value,x.locale)}</strong><ChevronRight size={17}/></button>)}</div><div className={styles.programmeDetail}><div className={styles.programmeTop}><BookOpen size={25}/><span>{c.outline}</span></div><h3>{active.title}</h3>{active.body?<p>{active.body}</p>:null}{lessonList.length?<ul>{lessonList.map((v,i)=><li key={i}><CheckCircle2 size={16}/><span>{display(v,x.locale)}</span></li>)}</ul>:null}{typeof active.raw.durationMinutes==='number'?<span className={styles.duration}><Clock size={16}/>{active.raw.durationMinutes} min</span>:null}</div></div>
}
export function PublishedPlans({value,props}:{value:unknown;props:AtomicSectionProps}){
 const x=useExperience();if(!x)return null
 const list=rows(value,x.locale),c=vocabulary[x.locale]
 // Options belong to the currently resolved schema. They do not create priced offers or switch doctrine.
 const selectable=list.filter(r=>Array.isArray(r.value)&&r.value.length&&r.value.every(v=>typeof v==='string')),details=list.filter(r=>!selectable.includes(r))
 return <div className={styles.planArea}>{selectable.map(r=><fieldset key={r.key}><legend>{r.title}</legend><div className={styles.planOptions}>{(r.value as string[]).map((v,i)=>{const picked=Array.isArray(x.selection[r.key])&&(x.selection[r.key] as string[]).includes(v);return <div key={v} className={styles.planOption} data-selected={picked}><span className={styles.optionSymbol}><Layers size={22}/></span><small>{c.option} · {String(i+1).padStart(2,'0')}</small><h3>{display(v,x.locale)}</h3>{props.enableSelection?<button type="button" aria-label={`${c.choose} ${display(v,x.locale)}`} aria-pressed={picked} onClick={()=>{const current=Array.isArray(x.selection[r.key])?x.selection[r.key] as string[]:[];x.setChoice(r.key,picked?current.filter(a=>a!==v):r.key==='recurrence_types'?[v]:[...current,v])}}>{picked?<Check size={16}/>:<ArrowRight size={16}/>} {picked?c.selected:c.choose}</button>:null}</div>})}</div></fieldset>)}{details.length?<Specifications value={details.map(r=>r.raw)} props={props}/>:null}</div>
}
export function Deployment({value}:{value:unknown}){
 const x=useExperience();if(!x)return null
 return <ol className={styles.deployment}>{rows(value,x.locale).map((r,i)=><li key={r.key}><span>{String(i+1).padStart(2,'0')}</span><div><h3>{r.title}</h3><p>{r.body}</p></div></li>)}</ol>
}
export function ReviewSummary(){
 const x=useExperience();if(!x)return null
 const c=vocabulary[x.locale]
 return <div className={styles.reviewSummary}><div><div className={styles.ratingStars} aria-hidden="true">{Array.from({length:5},(_,i)=><Star key={i} size={21} fill={i<Math.floor(x.data.reviews.rating||0)?'currentColor':'none'}/>)}</div><strong>{x.data.reviews.rating} / 5</strong><span>{x.data.reviews.count} {atomicCopy(x.locale).rating}</span></div><div><h3>{c.review}</h3><p>{c.source} · {x.data.reviews.source}</p></div></div>
}
