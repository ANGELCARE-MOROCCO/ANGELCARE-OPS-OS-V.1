'use client'

import {useMemo,useState} from 'react'
import {ArrowRight,CalendarDays,Check,Clock3,MapPin,Minus,Plus,ShieldCheck,Sparkles} from 'lucide-react'
import styles from './studio-service-world-runtime.module.css'

export type ServicePlanOption={
 id:string
 label:string
 description?:string
 price:number|null
 priceLabel?:string
 features:string[]
 pricingMode:string
 unitLabel:string
 minUnits:number
 maxUnits:number
 step:number
 recommended:boolean
}

type Props={
 locale:string
 slug:string
 currency:string
 basePrice:number|null
 pricingLabel:string
 plans:ServicePlanOption[]
 bookingModes:string[]
 locations:string[]
 durationOptions:string[]
 available:boolean
 availabilityLabel:string
 bookingEnabled:boolean
 quoteEnabled:boolean
}

const money=(amount:number|null,currency:string,label='')=>amount===null?(label||'Sur devis'):`${new Intl.NumberFormat('fr-MA',{maximumFractionDigits:2}).format(amount)} ${currency||'MAD'}`
const unitPricing=(mode:string)=>/hour|heure|unit|session|day|jour|participant|child|enfant/i.test(mode)
const clamp=(value:number,min:number,max:number)=>Math.min(max,Math.max(min,value))

export function ServiceBookingConfiguratorClient({locale,slug,currency,basePrice,pricingLabel,plans,bookingModes,locations,durationOptions,available,availabilityLabel,bookingEnabled,quoteEnabled}:Props){
 const initial=plans.find(row=>row.recommended)||plans[0]||null
 const [planId,setPlanId]=useState(initial?.id||'')
 const plan=plans.find(row=>row.id===planId)||initial
 const [units,setUnits]=useState(plan?.minUnits||1)
 const [mode,setMode]=useState(bookingModes[0]||'')
 const [location,setLocation]=useState(locations[0]||'')
 const [duration,setDuration]=useState(durationOptions[0]||'')
 const [date,setDate]=useState('')
 const [time,setTime]=useState('')
 const unitPrice=plan?.price??basePrice
 const subtotal=unitPrice===null?null:unitPricing(plan?.pricingMode||'')?unitPrice*units:unitPrice
 const configuredLabel=money(subtotal,currency,plan?.priceLabel||pricingLabel)
 const query=useMemo(()=>{const q=new URLSearchParams();if(plan?.id)q.set('plan',plan.id);if(mode)q.set('mode',mode);if(location)q.set('location',location);if(duration)q.set('duration',duration);if(date)q.set('date',date);if(time)q.set('time',time);if(units!==1)q.set('units',String(units));return q.toString()},[plan?.id,mode,location,duration,date,time,units])
 const bookingHref=`/angelcare-marketplace/${locale}/booking/${encodeURIComponent(slug)}${query?`?${query}`:''}`
 const quoteHref=`/angelcare-marketplace/${locale}/quotation/${encodeURIComponent(slug)}${query?`?${query}`:''}`
 const changePlan=(id:string)=>{const next=plans.find(row=>row.id===id);setPlanId(id);if(next)setUnits(next.minUnits)}
 const step=plan?.step||1,min=plan?.minUnits||1,max=plan?.maxUnits||12
 return <>
  <div className={styles.bookingConfigurator} data-ac-service-booking-configurator>
   <div className={styles.bookingHeader}><span>RÉSERVATION ANGELCARE</span><strong>{configuredLabel}</strong><small>{plan?.label||pricingLabel||'Configuration selon votre besoin'}</small></div>
   <div className={styles.availabilityState} data-ready={available}><span className={styles.availabilityPulse}/><div><strong>{available?'Service disponible':'Disponibilité à confirmer'}</strong><small>{availabilityLabel}</small></div><ShieldCheck/></div>
   {plans.length?<div className={styles.planPills} aria-label="Choisir une formule">{plans.slice(0,4).map(row=><button key={row.id} type="button" data-selected={row.id===plan?.id} onClick={()=>changePlan(row.id)}><span>{row.label}</span><small>{money(row.price,currency,row.priceLabel)}</small>{row.recommended?<b>Recommandé</b>:null}</button>)}</div>:null}
   <div className={styles.bookingFields}>
    {bookingModes.length?<label><span>Mode</span><select value={mode} onChange={e=>setMode(e.target.value)}>{bookingModes.map(row=><option key={row} value={row}>{row}</option>)}</select></label>:null}
    {locations.length?<label><span>Zone</span><span className={styles.fieldIcon}><MapPin/></span><select value={location} onChange={e=>setLocation(e.target.value)}>{locations.map(row=><option key={row} value={row}>{row}</option>)}</select></label>:null}
    <label><span>Date souhaitée</span><span className={styles.fieldIcon}><CalendarDays/></span><input type="date" value={date} onChange={e=>setDate(e.target.value)}/></label>
    <label><span>Heure souhaitée</span><span className={styles.fieldIcon}><Clock3/></span><input type="time" value={time} onChange={e=>setTime(e.target.value)}/></label>
    {durationOptions.length?<label><span>Durée / format</span><select value={duration} onChange={e=>setDuration(e.target.value)}>{durationOptions.map(row=><option key={row} value={row}>{row}</option>)}</select></label>:null}
   </div>
   {plan&&unitPricing(plan.pricingMode)?<div className={styles.unitSelector}><div><span>{plan.unitLabel||'Unités'}</span><small>Calcul indicatif à partir du tarif canonique sélectionné</small></div><div><button type="button" aria-label="Diminuer" onClick={()=>setUnits(v=>clamp(v-step,min,max))} disabled={units<=min}><Minus/></button><strong>{units}</strong><button type="button" aria-label="Augmenter" onClick={()=>setUnits(v=>clamp(v+step,min,max))} disabled={units>=max}><Plus/></button></div></div>:null}
   <div className={styles.estimateLine}><Sparkles/><span>Estimation affichée</span><strong>{configuredLabel}</strong></div>
   <p className={styles.bookingDisclaimer}>La disponibilité et le montant final sont revérifiés par les autorités de réservation et de tarification avant toute conséquence.</p>
   <div className={styles.bookingActions}>
    {bookingEnabled?<a className={styles.reserveButton} aria-disabled={!available} href={available?bookingHref:quoteEnabled?quoteHref:bookingHref}>{available?'Réserver maintenant':'Vérifier / demander'} <ArrowRight/></a>:null}
    {quoteEnabled?<a className={styles.quoteButton} href={quoteHref}>Demander un devis</a>:null}
   </div>
  </div>
  <div className={styles.mobileStickyBooking}>
   <div><small>{available?'Disponible':'À confirmer'}</small><strong>{configuredLabel}</strong></div>
   {bookingEnabled?<a href={available?bookingHref:quoteEnabled?quoteHref:bookingHref}>{available?'Réserver':'Vérifier'} <ArrowRight/></a>:quoteEnabled?<a href={quoteHref}>Demander un devis <ArrowRight/></a>:null}
  </div>
 </>
}
