'use client'

import {useMemo,useState} from 'react'
import {ArrowRight,CalendarDays,CheckCircle2,Clock3,GraduationCap,ShieldCheck,Users2} from 'lucide-react'
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
 cartEnabled:boolean
 admissionRequired:boolean
 admissionLabel:string
 available:boolean
}

const money=(amount:number|null,currency:string,label='')=>amount===null?(label||'Sur devis'):`${new Intl.NumberFormat('fr-MA',{maximumFractionDigits:2}).format(amount)} ${currency||'MAD'}`
const date=(value:string|null)=>value?new Intl.DateTimeFormat('fr-MA',{day:'2-digit',month:'short',year:'numeric'}).format(new Date(value)):''

export function AcademyEnrollmentPanelClient({locale,slug,currency,price,priceLabel,cohorts,modeLabel,enrollmentEnabled,cartEnabled,admissionRequired,admissionLabel,available}:Props){
 const initial=cohorts.find(row=>(row.available??0)>0)||cohorts[0]||null
 const [cohortId,setCohortId]=useState(initial?.id||'')
 const cohort=cohorts.find(row=>row.id===cohortId)||initial
 const query=useMemo(()=>{const q=new URLSearchParams();if(cohort?.id)q.set('cohort',cohort.id);return q.toString()},[cohort?.id])
 const enrollHref=`/angelcare-marketplace/${locale}/enrollment/${encodeURIComponent(slug)}${query?`?${query}`:''}`
 const basketHref=`/angelcare-marketplace/${locale}/basket?item=${encodeURIComponent(slug)}${cohort?.id?`&cohort=${encodeURIComponent(cohort.id)}`:''}`
 const actionLabel=admissionRequired?'Démarrer ma candidature':cohort?'Choisir cette session':'S’inscrire maintenant'
 return <>
  <aside className={styles.enrollmentCard} data-ac-academy-enrollment>
   <div className={styles.enrollmentHead}><span>INSCRIPTION ANGELCARE ACADEMY</span><strong>{money(price,currency,priceLabel)}</strong><small>{modeLabel||'Programme Academy'}</small></div>
   <div className={styles.availabilityState} data-ready={available}><span className={styles.statusPulse}/><div><strong>{available?'Inscriptions disponibles':'Disponibilité à confirmer'}</strong><small>{admissionRequired?admissionLabel:'Les conditions sont revérifiées avant inscription.'}</small></div><ShieldCheck/></div>
   {cohorts.length?<div className={styles.cohortPicker}><label>Prochaine session</label><div className={styles.cohortOptions}>{cohorts.slice(0,4).map(row=><button key={row.id} type="button" data-selected={row.id===cohort?.id} onClick={()=>setCohortId(row.id)}><span><CalendarDays/>{row.label}</span>{row.startsAt?<small>{date(row.startsAt)}</small>:null}{row.available!==null?<b><Users2/>{row.available} place{row.available===1?'':'s'}</b>:null}</button>)}</div></div>:null}
   {cohort?<div className={styles.cohortSummary}><div><CalendarDays/><span><small>Début</small><strong>{date(cohort.startsAt)||'À confirmer'}</strong></span></div>{cohort.endsAt?<div><Clock3/><span><small>Fin</small><strong>{date(cohort.endsAt)}</strong></span></div>:null}{cohort.trainerName?<div><GraduationCap/><span><small>Formateur</small><strong>{cohort.trainerName}</strong></span></div>:null}</div>:null}
   <div className={styles.enrollmentActions}>{enrollmentEnabled?<a className={styles.enrollButton} href={enrollHref}>{actionLabel}<ArrowRight/></a>:null}{cartEnabled&&!admissionRequired?<a className={styles.cartButton} href={basketHref}>Ajouter au panier</a>:null}</div>
   <p className={styles.enrollmentDisclaimer}><CheckCircle2/> Prix, session, capacité et éligibilité sont recalculés par les autorités Academy avant toute conséquence.</p>
  </aside>
  <div className={styles.mobileStickyEnroll}><div><small>{available?'INSCRIPTIONS OUVERTES':'À CONFIRMER'}</small><strong>{money(price,currency,priceLabel)}</strong></div>{enrollmentEnabled?<a href={enrollHref}>{admissionRequired?'Candidater':'S’inscrire'}<ArrowRight/></a>:null}</div>
 </>
}
