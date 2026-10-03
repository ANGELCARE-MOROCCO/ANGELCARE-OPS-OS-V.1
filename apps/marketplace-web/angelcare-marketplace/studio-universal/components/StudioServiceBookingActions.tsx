'use client'

import {useMemo,useState} from 'react'
import {ArrowRight,CalendarDays,CheckCircle2,Clock3,MapPin,Minus,Plus,ShieldCheck,Sparkles} from 'lucide-react'
import {availabilityCopy,atomicLocale,copy,formatMoney} from './atomic-runtime-presentation'
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
 availabilityStatus:string
 availabilityLabel:string
 bookingEnabled:boolean
 quoteEnabled:boolean
}

const unitPricing=(mode:string)=>/hour|heure|unit|session|day|jour|participant|child|enfant/i.test(mode)
const clamp=(value:number,min:number,max:number)=>Math.min(max,Math.max(min,value))

const serviceCopy=(locale:string)=>{
 const l=atomicLocale(locale)
 return{
  title:copy(l,{fr:'RÉSERVATION ANGELCARE',en:'ANGELCARE BOOKING',ar:'حجز ANGELCARE'}),
  configuration:copy(l,{fr:'Configuration selon votre besoin',en:'Configuration based on your needs',ar:'إعداد حسب احتياجك'}),
  mode:copy(l,{fr:'Mode',en:'Mode',ar:'النمط'}),
  area:copy(l,{fr:'Zone',en:'Area',ar:'المنطقة'}),
  date:copy(l,{fr:'Date souhaitée',en:'Preferred date',ar:'التاريخ المفضل'}),
  time:copy(l,{fr:'Heure souhaitée',en:'Preferred time',ar:'الوقت المفضل'}),
  duration:copy(l,{fr:'Durée / format',en:'Duration / format',ar:'المدة / الصيغة'}),
  displayedEstimate:copy(l,{fr:'Estimation affichée',en:'Displayed estimate',ar:'التقدير المعروض'}),
  disclaimer:copy(l,{fr:'La disponibilité et le montant final sont revérifiés avant toute conséquence.',en:'Availability and the final amount are revalidated before any commitment.',ar:'تتم إعادة التحقق من التوفر والمبلغ النهائي قبل أي التزام.'}),
  book:copy(l,{fr:'Réserver maintenant',en:'Book now',ar:'احجز الآن'}),
  verify:copy(l,{fr:'Vérifier la disponibilité',en:'Check availability',ar:'تحقق من التوفر'}),
  quote:copy(l,{fr:'Demander un devis',en:'Request a quote',ar:'اطلب عرض سعر'}),
  recommended:copy(l,{fr:'Recommandé',en:'Recommended',ar:'موصى به'}),
  decrease:copy(l,{fr:'Diminuer',en:'Decrease',ar:'تقليل'}),
  increase:copy(l,{fr:'Augmenter',en:'Increase',ar:'زيادة'}),
  calculation:copy(l,{fr:'Calcul indicatif à partir du tarif canonique sélectionné',en:'Indicative calculation from the selected canonical rate',ar:'حساب تقديري انطلاقاً من السعر المرجعي المحدد'}),
 }
}

export function ServiceBookingConfiguratorClient({locale,slug,currency,basePrice,pricingLabel,plans,bookingModes,locations,durationOptions,availabilityStatus,availabilityLabel,bookingEnabled,quoteEnabled}:Props){
 const c=serviceCopy(locale),availability=availabilityCopy(availabilityStatus,locale)
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
 const configuredLabel=formatMoney(subtotal,currency,plan?.priceLabel||pricingLabel,locale)
 const query=useMemo(()=>{const q=new URLSearchParams();if(plan?.id)q.set('plan',plan.id);if(mode)q.set('mode',mode);if(location)q.set('location',location);if(duration)q.set('duration',duration);if(date)q.set('date',date);if(time)q.set('time',time);if(units!==1)q.set('units',String(units));return q.toString()},[plan?.id,mode,location,duration,date,time,units])
 const bookingHref=`/angelcare-marketplace/${locale}/booking/${encodeURIComponent(slug)}${query?`?${query}`:''}`
 const quoteHref=`/angelcare-marketplace/${locale}/quotation/${encodeURIComponent(slug)}${query?`?${query}`:''}`
 const changePlan=(id:string)=>{const next=plans.find(row=>row.id===id);setPlanId(id);if(next)setUnits(next.minUnits)}
 const step=plan?.step||1,min=plan?.minUnits||1,max=plan?.maxUnits||12
 return <>
  <div className={styles.bookingConfigurator} data-ac-service-booking-configurator>
   <div className={styles.bookingHeader}><span>{c.title}</span><strong>{configuredLabel}</strong><small>{plan?.label||pricingLabel||c.configuration}</small></div>
   <div className={styles.availabilityState} data-ready={availability.state==='available'}><span className={styles.availabilityPulse}/><div><strong>{availability.label}</strong><small>{availabilityLabel}</small></div><ShieldCheck/></div>
   {plans.length?<div className={styles.planPills} aria-label={c.title}>{plans.slice(0,4).map(row=><button key={row.id} type="button" data-selected={row.id===plan?.id} onClick={()=>changePlan(row.id)}><span>{row.label}</span><small>{formatMoney(row.price,currency,row.priceLabel,locale)}</small>{row.recommended?<b>{c.recommended}</b>:null}</button>)}</div>:null}
   <div className={styles.bookingFields}>
    {bookingModes.length?<label><span>{c.mode}</span><select value={mode} onChange={e=>setMode(e.target.value)}>{bookingModes.map(row=><option key={row} value={row}>{row}</option>)}</select></label>:null}
    {locations.length?<label><span>{c.area}</span><span className={styles.fieldIcon}><MapPin/></span><select value={location} onChange={e=>setLocation(e.target.value)}>{locations.map(row=><option key={row} value={row}>{row}</option>)}</select></label>:null}
    <label><span>{c.date}</span><span className={styles.fieldIcon}><CalendarDays/></span><input type="date" value={date} onChange={e=>setDate(e.target.value)}/></label>
    <label><span>{c.time}</span><span className={styles.fieldIcon}><Clock3/></span><input type="time" value={time} onChange={e=>setTime(e.target.value)}/></label>
    {durationOptions.length?<label><span>{c.duration}</span><select value={duration} onChange={e=>setDuration(e.target.value)}>{durationOptions.map(row=><option key={row} value={row}>{row}</option>)}</select></label>:null}
   </div>
   {plan&&unitPricing(plan.pricingMode)?<div className={styles.unitSelector}><div><span>{plan.unitLabel}</span><small>{c.calculation}</small></div><div><button type="button" aria-label={c.decrease} onClick={()=>setUnits(v=>clamp(v-step,min,max))} disabled={units<=min}><Minus/></button><strong>{units}</strong><button type="button" aria-label={c.increase} onClick={()=>setUnits(v=>clamp(v+step,min,max))} disabled={units>=max}><Plus/></button></div></div>:null}
   <div className={styles.estimateLine}><Sparkles/><span>{c.displayedEstimate}</span><strong>{configuredLabel}</strong></div>
   <p className={styles.bookingDisclaimer}>{c.disclaimer}</p>
   <div className={styles.bookingActions}>
    {bookingEnabled?<a className={styles.reserveButton} href={bookingHref}>{availability.state==='available'?c.book:c.verify} <ArrowRight/></a>:null}
    {quoteEnabled?<a className={styles.quoteButton} href={quoteHref}>{c.quote}</a>:null}
   </div>
  </div>
  <div className={styles.mobileStickyBooking}>
   <div><small>{availability.label}</small><strong>{configuredLabel}</strong></div>
   {bookingEnabled?<a href={bookingHref}>{availability.state==='available'?c.book:c.verify} <ArrowRight/></a>:quoteEnabled?<a href={quoteHref}>{c.quote} <ArrowRight/></a>:null}
  </div>
 </>
}
