'use client'
import {useEffect,useState} from 'react'
import {ArrowRight,ArrowUpRight,BookOpen,Compass,Headphones,Layers3,Sparkles} from 'lucide-react'
import type {EditorialAction,EditorialLocale,EditorialRole,EditorialView} from './model'
import {localCopy} from './model'
import s from './editorial.module.css'

const copy={fr:{context:'INSPIRATION ANGELCARE',explore:'Explorer les détails',planning:'Préparer mon planning',curriculum:'Explorer le programme',scope:'Comprendre le périmètre',advice:'Parlons de votre besoin',discovery:'Découvrir les associations',editorial:'Visuel éditorial · les caractéristiques de l’offre sont précisées dans le dossier.'},en:{context:'ANGELCARE INSPIRATION',explore:'Explore the details',planning:'Prepare my schedule',curriculum:'Explore the programme',scope:'Understand the scope',advice:'Discuss your needs',discovery:'Explore the associations',editorial:'Editorial image · offer details are specified in the dossier.'},ar:{context:'إلهام ANGELCARE',explore:'استكشف التفاصيل',planning:'حضر جدولي',curriculum:'استكشف البرنامج',scope:'افهم النطاق',advice:'لنتحدث عن احتياجاتك',discovery:'اكتشف الخيارات المكملة',editorial:'صورة توضيحية، وتفاصيل العرض موضحة في الملف.'}}
export function EditorialExperience({editorial,role,locale,prefix,available,onAdvice,variant='compact',currentId,onNavigate}:{editorial:EditorialView;role:EditorialRole;locale:EditorialLocale;prefix:string;available:string[];onAdvice:()=>void;variant?:'compact'|'chapter'|'guidance';currentId?:string;onNavigate?:(action:EditorialAction)=>void}){
 const story=editorial.stories.find(row=>row.role===role),t=copy[locale],[imageFailed,setImageFailed]=useState(false)
 useEffect(()=>setImageFailed(false),[story?.image])
 if(!editorial.enabled||!story||story.hidden)return null
 const target=available.includes(story.action)?story.action:available.includes('description')?'description':available[0],advice=story.action==='advice'||!target,discovery=story.action==='discovery'&&!!currentId
 const label=discovery?t.discovery:advice?t.advice:['planning','plans'].includes(story.action)?t.planning:['curriculum','pathway','outcomes','cohorts'].includes(story.action)?t.curriculum:['fit','included','deployment','commercial','evidence'].includes(story.action)&&editorial.domain==='b2b'?t.scope:t.explore
 const Icon=role==='guidance'?Headphones:role==='understand'?Layers3:Compass
 return <section className={s.story} data-editorial-role={role} data-editorial-pack={editorial.packKey} data-domain={editorial.domain} data-treatment={editorial.treatment} data-variant={variant} aria-label={localCopy(story.heading,locale)}>
  <figure className={s.picture} data-image-unavailable={imageFailed}>{imageFailed?<span className={s.imageFallback}><Compass/><small>{t.context}</small></span>:<img src={story.image} alt={localCopy(story.heading,locale)} style={{objectPosition:story.focus}} loading="lazy" decoding="async" onError={()=>setImageFailed(true)}/>}<span className={s.imageMark} aria-hidden="true"><Sparkles/></span></figure>
  <div className={s.copy}><span className={s.eyebrow}><Icon/>{role==='guidance'?editorial.label:t.context}</span><h3>{localCopy(story.heading,locale)}</h3><p>{localCopy(story.body,locale)}</p>{advice&&!discovery?<button type="button" onClick={onAdvice}>{label}<ArrowUpRight/></button>:<a href={discovery?'#ac-discovery-'+currentId:'#'+prefix+'-'+target} onClick={event=>{if(onNavigate){event.preventDefault();onNavigate(story.action)}}}>{label}<ArrowRight/></a>}{variant!=='compact'?<small>{t.editorial}</small>:null}</div>
 </section>
}
