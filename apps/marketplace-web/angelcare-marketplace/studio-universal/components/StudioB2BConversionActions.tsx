'use client'

import {useMemo,useState} from 'react'
import {ArrowRight,Building2,CheckCircle2,MapPin,Minus,Plus,ShieldCheck,Sparkles,Users2} from 'lucide-react'
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

const money=(amount:number|null,currency:string,label='')=>amount===null?(label||'Sur devis'):`${new Intl.NumberFormat('fr-MA',{maximumFractionDigits:2}).format(amount)} ${currency||'MAD'}`
const clamp=(value:number,min:number,max:number)=>Math.min(max,Math.max(min,value))
const normalized=(value:string)=>value.toLowerCase().replace(/[^a-z0-9]+/g,'_')

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
 if(mode==='per_event')return 1
 return 1
}
function primaryLabel(doctrine:string,mode:B2BCommercialMode,quotationRequired:boolean){
 if(doctrine==='partner-os-plan'&&mode==='subscription')return 'Demander l’activation'
 if(doctrine==='quality-check-assessment'&&!quotationRequired)return 'Réserver l’évaluation'
 if(quotationRequired||mode==='quote_only')return 'Demander un devis'
 return 'Configurer la solution'
}

export function B2BCommercialConfiguratorClient(props:Props){
 const {locale,slug,doctrine,currency,amount,amountLabel,pricingMode,billingPeriod,recurringFee,setupFee,quotationRequired,quoteEnabled,requestEnabled,subscriptionEnabled,organizationType,organizationOptions,capacityLabel,capacityDefault,capacityMin,capacityMax,capacityStep,siteDefault,siteMin,siteMax,territoryDefault,territoryOptions,moduleOptions,implementationLeadTime}=props
 const [organization,setOrganization]=useState(organizationOptions[0]?.value||organizationType||'')
 const [capacity,setCapacity]=useState(capacityDefault??Math.max(1,capacityMin))
 const [sites,setSites]=useState(Math.max(siteMin,siteDefault||1))
 const [territory,setTerritory]=useState(territoryDefault||territoryOptions[0]?.value||'')
 const [module,setModule]=useState(moduleOptions[0]?.value||'')
 const base=pricingMode==='subscription'?(recurringFee??amount):amount
 const multiplier=unitMultiplier(pricingMode,sites,capacity)
 const estimate=base===null?null:base*multiplier
 const display=money(estimate,currency,amountLabel)
 const suffix=pricingMode==='subscription'&&billingPeriod?` / ${billingPeriod}`:''
 const query=useMemo(()=>{const q=new URLSearchParams();if(organization)q.set('organization_type',organization);if(capacity>0)q.set('capacity',String(capacity));if(sites>0)q.set('sites',String(sites));if(territory)q.set('territory',territory);if(module)q.set('module',module);q.set('pricing_mode',pricingMode);return q.toString()},[organization,capacity,sites,territory,module,pricingMode])
 const quoteHref=`/angelcare-marketplace/${locale}/quotation/${encodeURIComponent(slug)}?${query}`
 const reqBase=requestRoute(locale,doctrine),requestHref=`${reqBase}${reqBase.includes('?')?'&':'?'}item=${encodeURIComponent(slug)}&${query}`
 const diagBase=diagnosticRoute(locale,doctrine),diagnosticHref=`${diagBase}${diagBase.includes('?')?'&':'?'}item=${encodeURIComponent(slug)}&${query}`
 const primaryHref=doctrine==='partner-os-plan'&&subscriptionEnabled?requestHref:quoteEnabled?quoteHref:requestHref
 const label=primaryLabel(doctrine,pricingMode,quotationRequired)
 return <>
  <aside className={styles.commercialCard} data-ac-b2b-commercial-configurator>
   <div className={styles.commercialHead}>
    <span>SOLUTION COMMERCIALE</span>
    <small>{pricingMode==='quote_only'||amount===null?'Configuration sur devis':'À partir de'}</small>
    <strong>{display}{suffix}</strong>
    {setupFee!==null?<em>Frais de mise en place : {money(setupFee,currency)}</em>:null}
   </div>
   <div className={styles.commercialAssurance}><ShieldCheck/><div><strong>Configuration institutionnelle</strong><small>Le montant final et l’éligibilité sont revérifiés avant toute conséquence.</small></div></div>
   <div className={styles.configFields}>
    {organizationOptions.length>1?<label><span><Building2/>Type de structure</span><select value={organization} onChange={e=>setOrganization(e.target.value)}>{organizationOptions.map(row=><option key={row.value} value={row.value}>{row.label}</option>)}</select></label>:organization?<div className={styles.fixedField}><Building2/><span><small>Type de structure</small><strong>{organizationOptions[0]?.label||organization}</strong></span></div>:null}
    <label><span><Users2/>{capacityLabel}</span><div className={styles.stepper}><button type="button" aria-label="Diminuer" onClick={()=>setCapacity(v=>clamp(v-capacityStep,capacityMin,capacityMax))} disabled={capacity<=capacityMin}><Minus/></button><strong>{capacity}</strong><button type="button" aria-label="Augmenter" onClick={()=>setCapacity(v=>clamp(v+capacityStep,capacityMin,capacityMax))} disabled={capacity>=capacityMax}><Plus/></button></div></label>
    <label><span><Building2/>Nombre de sites</span><div className={styles.stepper}><button type="button" aria-label="Diminuer" onClick={()=>setSites(v=>clamp(v-1,siteMin,siteMax))} disabled={sites<=siteMin}><Minus/></button><strong>{sites}</strong><button type="button" aria-label="Augmenter" onClick={()=>setSites(v=>clamp(v+1,siteMin,siteMax))} disabled={sites>=siteMax}><Plus/></button></div></label>
    {territoryOptions.length?<label><span><MapPin/>Ville / territoire</span><select value={territory} onChange={e=>setTerritory(e.target.value)}>{territoryOptions.map(row=><option key={row.value} value={row.value}>{row.label}</option>)}</select></label>:<label><span><MapPin/>Ville / territoire</span><input value={territory} onChange={e=>setTerritory(e.target.value)} placeholder="Votre ville"/></label>}
    {moduleOptions.length?<label><span><Sparkles/>Formule / module</span><select value={module} onChange={e=>setModule(e.target.value)}>{moduleOptions.map(row=><option key={row.value} value={row.value}>{row.label}</option>)}</select></label>:null}
   </div>
   <div className={styles.estimateBox}>
    <div><span>Estimation indicative</span><strong>{display}{suffix}</strong></div>
    <small>{pricingMode==='per_site'?`${sites} site${sites>1?'s':''}`:pricingMode==='per_child'||pricingMode==='per_employee'||pricingMode==='volume_pricing'?`${capacity} ${capacityLabel.toLowerCase()}`:'Selon la configuration retenue'}</small>
    {implementationLeadTime?<small>Mise en place : {implementationLeadTime}</small>:null}
   </div>
   <div className={styles.commercialActions}>
    {(quoteEnabled||requestEnabled||subscriptionEnabled)?<a className={styles.quoteButton} href={primaryHref}>{label}<ArrowRight/></a>:null}
    {requestEnabled&&doctrine!=='partner-os-plan'?<a className={styles.diagnosticButton} href={diagnosticHref}>Démarrer le diagnostic</a>:null}
    <a className={styles.advisorLink} href={`/angelcare-marketplace/${locale}/account/support`}>Parler à un conseiller</a>
   </div>
   <p className={styles.commercialDisclaimer}><CheckCircle2/> Devis sans engagement · données commerciales canoniques · validation humaine avant handover.</p>
  </aside>
  <div className={styles.mobileStickyQuote}>
   <div><small>{pricingMode==='quote_only'||amount===null?'SUR DEVIS':'À PARTIR DE'}</small><strong>{display}{suffix}</strong></div>
   {(quoteEnabled||requestEnabled||subscriptionEnabled)?<a href={primaryHref}>{label}<ArrowRight/></a>:null}
  </div>
 </>
}
