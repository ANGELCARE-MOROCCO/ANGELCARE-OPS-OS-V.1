'use client'

import {useMemo,useState} from 'react'
import {ArrowRight,CalendarDays,CheckCircle2,Clock3,GraduationCap,ShieldCheck,Users2} from 'lucide-react'
import {availabilityCopy,atomicLocale,copy,formatDate,formatMoney} from './atomic-runtime-presentation'
import styles from './studio-academy-world-runtime.module.css'

export type AcademyCohortOption={
 id:string
 label:string
 startsAt:string|null
 endsAt:string|null
 capacity:number|null
 enrolled:number|null
 available:number|null
 status:string
 trainerName?:string
}

type Props={
 locale:string
 slug:string
 currency:string
 price:number|null
 priceLabel:string
 cohorts:AcademyCohortOption[]
 modeLabel:string
 enrollmentEnabled:boolean
 admissionRequired:boolean
 admissionLabel:string
 availabilityStatus:string
}

const academyCopy=(locale:string)=>{
 const l=atomicLocale(locale)
 return{
  title:copy(l,{fr:'INSCRIPTION ANGELCARE ACADEMY',en:'ANGELCARE ACADEMY ENROLLMENT',ar:'التسجيل في أكاديمية ANGELCARE'}),
  programme:copy(l,{fr:'Programme Academy',en:'Academy programme',ar:'برنامج الأكاديمية'}),
  direct:copy(l,{fr:'Les conditions sont revérifiées avant inscription.',en:'Conditions are revalidated before enrollment.',ar:'تتم إعادة التحقق من الشروط قبل التسجيل.'}),
  next:copy(l,{fr:'Prochaine session',en:'Next session',ar:'الدورة القادمة'}),
  start:copy(l,{fr:'Début',en:'Start',ar:'البداية'}),
  end:copy(l,{fr:'Fin',en:'End',ar:'النهاية'}),
  trainer:copy(l,{fr:'Formateur',en:'Trainer',ar:'المدرب'}),
  confirm:copy(l,{fr:'À confirmer',en:'To be confirmed',ar:'يُرجى التأكيد'}),
  apply:copy(l,{fr:'Démarrer ma candidature',en:'Start my application',ar:'ابدأ طلب التقديم'}),
  choose:copy(l,{fr:'Choisir cette session',en:'Choose this session',ar:'اختر هذه الدورة'}),
  enroll:copy(l,{fr:'S’inscrire maintenant',en:'Enroll now',ar:'سجّل الآن'}),
  disclaimer:copy(l,{fr:'Prix, session, capacité et éligibilité sont revérifiés avant toute conséquence.',en:'Price, session, capacity and eligibility are revalidated before any commitment.',ar:'تتم إعادة التحقق من السعر والدورة والسعة والأهلية قبل أي التزام.'}),
  seats:copy(l,{fr:'places',en:'seats',ar:'مقاعد'}),
 }
}

export function AcademyEnrollmentPanelClient({locale,slug,currency,price,priceLabel,cohorts,modeLabel,enrollmentEnabled,admissionRequired,admissionLabel,availabilityStatus}:Props){
 const c=academyCopy(locale),availability=availabilityCopy(availabilityStatus,locale)
 const initial=cohorts.find(row=>(row.available??0)>0)||cohorts[0]||null
 const [cohortId,setCohortId]=useState(initial?.id||'')
 const cohort=cohorts.find(row=>row.id===cohortId)||initial
 const query=useMemo(()=>{const q=new URLSearchParams();if(cohort?.id)q.set('cohort',cohort.id);return q.toString()},[cohort?.id])
 const enrollHref=`/angelcare-marketplace/${locale}/enrollment/${encodeURIComponent(slug)}${query?`?${query}`:''}`
 const actionLabel=admissionRequired?c.apply:cohort?c.choose:c.enroll
 return <>
  <aside className={styles.enrollmentCard} data-ac-academy-enrollment>
   <div className={styles.enrollmentHead}><span>{c.title}</span><strong>{formatMoney(price,currency,priceLabel,locale)}</strong><small>{modeLabel||c.programme}</small></div>
   <div className={styles.availabilityState} data-ready={availability.state==='available'}><span className={styles.statusPulse}/><div><strong>{availability.label}</strong><small>{admissionRequired?admissionLabel:c.direct}</small></div><ShieldCheck/></div>
   {cohorts.length?<div className={styles.cohortPicker}><label>{c.next}</label><div className={styles.cohortOptions}>{cohorts.slice(0,4).map(row=><button key={row.id} type="button" data-selected={row.id===cohort?.id} onClick={()=>setCohortId(row.id)}><span><CalendarDays/>{row.label}</span>{row.startsAt?<small>{formatDate(row.startsAt,locale)}</small>:null}{row.available!==null?<b><Users2/>{row.available} {c.seats}</b>:null}</button>)}</div></div>:null}
   {cohort?<div className={styles.cohortSummary}><div><CalendarDays/><span><small>{c.start}</small><strong>{formatDate(cohort.startsAt,locale)||c.confirm}</strong></span></div>{cohort.endsAt?<div><Clock3/><span><small>{c.end}</small><strong>{formatDate(cohort.endsAt,locale)}</strong></span></div>:null}{cohort.trainerName?<div><GraduationCap/><span><small>{c.trainer}</small><strong>{cohort.trainerName}</strong></span></div>:null}</div>:null}
   <div className={styles.enrollmentActions}>{enrollmentEnabled?<a className={styles.enrollButton} href={enrollHref}>{actionLabel}<ArrowRight/></a>:null}</div>
   <p className={styles.enrollmentDisclaimer}><CheckCircle2/> {c.disclaimer}</p>
  </aside>
  <div className={styles.mobileStickyEnroll}><div><small>{availability.label}</small><strong>{formatMoney(price,currency,priceLabel,locale)}</strong></div>{enrollmentEnabled?<a href={enrollHref}>{admissionRequired?c.apply:c.enroll}<ArrowRight/></a>:null}</div>
 </>
}
