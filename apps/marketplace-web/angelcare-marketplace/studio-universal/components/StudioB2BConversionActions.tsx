'use client'

import {useMemo,useState} from 'react'
import {ArrowRight,Building2,CheckCircle2,MapPin,Minus,Plus,ShieldCheck,Sparkles,Users2} from 'lucide-react'
import {atomicLocale,copy,formatMoney,humanizeValue} from './atomic-runtime-presentation'
import styles from './studio-b2b-world-runtime.module.css'

export type B2BCommercialMode='fixed'|'starting_from'|'per_site'|'per_child'|'per_employee'|'per_event'|'subscription'|'quote_only'|'configured_estimate'|'volume_pricing'
export type B2BConfiguratorOption={value:string;label:string}

type Props={
 locale:string
 slug:string
 doctrine:string
 currency:string
 amount:number|null
 amountLabel:string
 pricingMode:B2BCommercialMode
 billingPeriod:string
 recurringFee:number|null
 setupFee:number|null
 quotationRequired:boolean
 quoteEnabled:boolean
 requestEnabled:boolean
 subscriptionEnabled:boolean
 organizationType:string
 organizationOptions:B2BConfiguratorOption[]
 capacityLabel:string
 capacityDefault:number|null
 capacityMin:number
 capacityMax:number
 capacityStep:number
 siteDefault:number
 siteMin:number
 siteMax:number
 territoryDefault:string
 territoryOptions:B2BConfiguratorOption[]
 moduleOptions:B2BConfiguratorOption[]
 implementationLeadTime:string
}

const clamp=(value:number,min:number,max:number)=>Math.min(max,Math.max(min,value))

const b2bCopy=(locale:string)=>{
 const l=atomicLocale(locale)
 return{
  title:copy(l,{fr:'SOLUTION COMMERCIALE',en:'COMMERCIAL SOLUTION',ar:'الحل التجاري'}),
  configured:copy(l,{fr:'Configuration sur devis',en:'Configured on request',ar:'إعداد حسب الطلب'}),
  starting:copy(l,{fr:'À partir de',en:'Starting from',ar:'ابتداءً من'}),
  setup:copy(l,{fr:'Frais de mise en place',en:'Setup fee',ar:'رسوم الإعداد'}),
  institutional:copy(l,{fr:'Configuration institutionnelle',en:'Institutional configuration',ar:'إعداد مؤسساتي'}),
  assurance:copy(l,{fr:'Le montant final et l’éligibilité sont revérifiés avant toute conséquence.',en:'The final amount and eligibility are revalidated before any commitment.',ar:'تتم إعادة التحقق من المبلغ النهائي والأهلية قبل أي التزام.'}),
  orgType:copy(l,{fr:'Type de structure',en:'Organization type',ar:'نوع المؤسسة'}),
  sites:copy(l,{fr:'Nombre de sites',en:'Number of sites',ar:'عدد المواقع'}),
  territory:copy(l,{fr:'Ville / territoire',en:'City / territory',ar:'المدينة / المنطقة'}),
  territoryPlaceholder:copy(l,{fr:'Votre ville',en:'Your city',ar:'مدينتك'}),
  module:copy(l,{fr:'Formule / module',en:'Plan / module',ar:'الخطة / الوحدة'}),
  estimate:copy(l,{fr:'Estimation indicative',en:'Indicative estimate',ar:'تقدير مبدئي'}),
  according:copy(l,{fr:'Selon la configuration retenue',en:'Based on the selected configuration',ar:'حسب الإعداد المختار'}),
  implementation:copy(l,{fr:'Mise en place',en:'Implementation',ar:'التنفيذ'}),
  quote:copy(l,{fr:'Demander un devis',en:'Request a quote',ar:'اطلب عرض سعر'}),
  request:copy(l,{fr:'Demander une étude',en:'Request an assessment',ar:'اطلب دراسة'}),
  activate:copy(l,{fr:'Demander l’activation',en:'Request activation',ar:'اطلب التفعيل'}),
  configure:copy(l,{fr:'Configurer la solution',en:'Configure the solution',ar:'إعداد الحل'}),
  diagnostic:copy(l,{fr:'Démarrer le diagnostic',en:'Start the diagnostic',ar:'ابدأ التشخيص'}),
  advisor:copy(l,{fr:'Parler à un conseiller',en:'Talk to an advisor',ar:'تحدث مع مستشار'}),
  disclaimer:copy(l,{fr:'Données commerciales canoniques · validation avant handover.',en:'Canonical commercial data · validation before handover.',ar:'بيانات تجارية مرجعية · تحقق قبل الإحالة.'}),
  decrease:copy(l,{fr:'Diminuer',en:'Decrease',ar:'تقليل'}),
  increase:copy(l,{fr:'Augmenter',en:'Increase',ar:'زيادة'}),
 }
}

function requestRoute(locale:string,doctrine:string){
 if(doctrine==='hospitality-kids-programme')return `/angelcare-marketplace/${locale}/hospitality/request`
 if(doctrine==='corporate-childcare-benefit')return `/angelcare-marketplace/${locale}/corporates/request`
 if(doctrine==='health-adjacent-programme')return `/angelcare-marketplace/${locale}/health-partners/request`
 if(doctrine==='partner-os-plan')return `/angelcare-marketplace/${locale}/partner-os/contact`
 if(doctrine==='quality-check-assessment')return `/angelcare-marketplace/${locale}/establishments/quality-check-360`
 return `/angelcare-marketplace/${locale}/establishments/request`
}
function diagnosticRoute(locale:string,doctrine:string){
 if(doctrine==='partner-os-plan')return `/angelcare-marketplace/${locale}/partner-os/contact`
 if(doctrine==='quality-check-assessment')return `/angelcare-marketplace/${locale}/quality-check`
 return `/angelcare-marketplace/${locale}/establishments/diagnostic`
}
function unitMultiplier(mode:B2BCommercialMode,sites:number,capacity:number){
 if(mode==='per_site')return Math.max(1,sites)
 if(mode==='per_child'||mode==='per_employee'||mode==='volume_pricing')return Math.max(1,capacity)
 return 1
}

export function B2BCommercialConfiguratorClient(props:Props){
 const {locale,slug,doctrine,currency,amount,amountLabel,pricingMode,billingPeriod,recurringFee,setupFee,quotationRequired,quoteEnabled,requestEnabled,subscriptionEnabled,organizationType,organizationOptions,capacityLabel,capacityDefault,capacityMin,capacityMax,capacityStep,siteDefault,siteMin,siteMax,territoryDefault,territoryOptions,moduleOptions,implementationLeadTime}=props
 const c=b2bCopy(locale)
 const [organization,setOrganization]=useState(organizationOptions[0]?.value||organizationType||'')
 const [capacity,setCapacity]=useState(capacityDefault??Math.max(1,capacityMin))
 const [sites,setSites]=useState(Math.max(siteMin,siteDefault||1))
 const [territory,setTerritory]=useState(territoryDefault||territoryOptions[0]?.value||'')
 const [module,setModule]=useState(moduleOptions[0]?.value||'')
 const base=pricingMode==='subscription'?(recurringFee??amount):amount
 const multiplier=unitMultiplier(pricingMode,sites,capacity)
 const estimate=base===null?null:base*multiplier
 const display=formatMoney(estimate,currency,amountLabel,locale)
 const suffix=pricingMode==='subscription'&&billingPeriod?` / ${humanizeValue(billingPeriod,locale)}`:''
 const query=useMemo(()=>{const q=new URLSearchParams();if(organization)q.set('organization_type',organization);if(capacity>0)q.set('capacity',String(capacity));if(sites>0)q.set('sites',String(sites));if(territory)q.set('territory',territory);if(module)q.set('module',module);q.set('pricing_mode',pricingMode);return q.toString()},[organization,capacity,sites,territory,module,pricingMode])
 const quoteHref=`/angelcare-marketplace/${locale}/quotation/${encodeURIComponent(slug)}?${query}`
 const reqBase=requestRoute(locale,doctrine),requestHref=`${reqBase}${reqBase.includes('?')?'&':'?'}item=${encodeURIComponent(slug)}&${query}`
 const diagBase=diagnosticRoute(locale,doctrine),diagnosticHref=`${diagBase}${diagBase.includes('?')?'&':'?'}item=${encodeURIComponent(slug)}&${query}`
 const hasPrimary=quoteEnabled||requestEnabled||subscriptionEnabled
 const primaryHref=doctrine==='partner-os-plan'&&subscriptionEnabled?requestHref:quoteEnabled?quoteHref:requestHref
 const primaryLabel=doctrine==='partner-os-plan'&&subscriptionEnabled?c.activate:quoteEnabled?c.quote:requestEnabled?c.request:c.configure
 return <>
  <aside className={styles.commercialCard} data-ac-b2b-commercial-configurator data-quotation-required={quotationRequired||pricingMode==='quote_only'}>
   <div className={styles.commercialHead}>
    <span>{c.title}</span><small>{pricingMode==='quote_only'||amount===null?c.configured:c.starting}</small><strong>{display}{suffix}</strong>
    {setupFee!==null?<em>{c.setup} : {formatMoney(setupFee,currency,'',locale)}</em>:null}
   </div>
   <div className={styles.commercialAssurance}><ShieldCheck/><div><strong>{c.institutional}</strong><small>{c.assurance}</small></div></div>
   <div className={styles.configFields}>
    {organizationOptions.length>1?<label><span><Building2/>{c.orgType}</span><select value={organization} onChange={e=>setOrganization(e.target.value)}>{organizationOptions.map(row=><option key={row.value} value={row.value}>{row.label}</option>)}</select></label>:organization?<div className={styles.fixedField}><Building2/><span><small>{c.orgType}</small><strong>{organizationOptions[0]?.label||humanizeValue(organization,locale)}</strong></span></div>:null}
    <label><span><Users2/>{capacityLabel}</span><div className={styles.stepper}><button type="button" aria-label={c.decrease} onClick={()=>setCapacity(v=>clamp(v-capacityStep,capacityMin,capacityMax))} disabled={capacity<=capacityMin}><Minus/></button><strong>{capacity}</strong><button type="button" aria-label={c.increase} onClick={()=>setCapacity(v=>clamp(v+capacityStep,capacityMin,capacityMax))} disabled={capacity>=capacityMax}><Plus/></button></div></label>
    <label><span><Building2/>{c.sites}</span><div className={styles.stepper}><button type="button" aria-label={c.decrease} onClick={()=>setSites(v=>clamp(v-1,siteMin,siteMax))} disabled={sites<=siteMin}><Minus/></button><strong>{sites}</strong><button type="button" aria-label={c.increase} onClick={()=>setSites(v=>clamp(v+1,siteMin,siteMax))} disabled={sites>=siteMax}><Plus/></button></div></label>
    {territoryOptions.length?<label><span><MapPin/>{c.territory}</span><select value={territory} onChange={e=>setTerritory(e.target.value)}>{territoryOptions.map(row=><option key={row.value} value={row.value}>{row.label}</option>)}</select></label>:<label><span><MapPin/>{c.territory}</span><input value={territory} onChange={e=>setTerritory(e.target.value)} placeholder={c.territoryPlaceholder}/></label>}
    {moduleOptions.length?<label><span><Sparkles/>{c.module}</span><select value={module} onChange={e=>setModule(e.target.value)}>{moduleOptions.map(row=><option key={row.value} value={row.value}>{row.label}</option>)}</select></label>:null}
   </div>
   <div className={styles.estimateBox}><div><span>{c.estimate}</span><strong>{display}{suffix}</strong></div><small>{pricingMode==='per_site'?`${sites} ${c.sites.toLowerCase()}`:pricingMode==='per_child'||pricingMode==='per_employee'||pricingMode==='volume_pricing'?`${capacity} ${capacityLabel.toLowerCase()}`:c.according}</small>{implementationLeadTime?<small>{c.implementation} : {implementationLeadTime}</small>:null}</div>
   <div className={styles.commercialActions}>
    {hasPrimary?<a className={styles.quoteButton} href={primaryHref}>{primaryLabel}<ArrowRight/></a>:null}
    {requestEnabled&&doctrine!=='partner-os-plan'?<a className={styles.diagnosticButton} href={diagnosticHref}>{c.diagnostic}</a>:null}
    <a className={styles.advisorLink} href={`/angelcare-marketplace/${locale}/account/support`}>{c.advisor}</a>
   </div>
   <p className={styles.commercialDisclaimer}><CheckCircle2/> {c.disclaimer}</p>
  </aside>
  <div className={styles.mobileStickyQuote}><div><small>{pricingMode==='quote_only'||amount===null?c.configured:c.starting}</small><strong>{display}{suffix}</strong></div>{hasPrimary?<a href={primaryHref}>{primaryLabel}<ArrowRight/></a>:null}</div>
 </>
}
