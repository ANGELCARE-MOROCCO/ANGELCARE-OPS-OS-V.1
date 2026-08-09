'use client'
import { useMemo, useState } from 'react'
import { ArrowRight, CheckCircle2, LoaderCircle, RotateCcw, ShieldCheck } from 'lucide-react'
import type { ExperienceFieldBlueprint } from '../../category-native/types'
import type { AdaptiveExperienceData, CategoryNativeCommitResult, CategoryNativeSession } from '../types'
import styles from '../experience.module.css'

type ApiEnvelope<T> = { data?: T; error?: { message?: string; fieldErrors?: Record<string, string[]> } }
const excludedKeys = new Set([
  'item_key','service_key','solution_key','programme_key','course_key','cohort_key','pathway_key','assessment_key','plan_key','resource_key','admission_key','workshop_key','game_key','kit_key','box_key',
  'name_fr','name_en','name_ar','short_description_fr','short_description_en','short_description_ar','full_description_fr','full_description_en','full_description_ar','description_fr','description_en','description_ar',
  'slug','status','featured','best_pick','primary_image_reference','gallery_references','price_mode','price_amount','price_dh','starting_price_dh','territory_codes',
])

function visitorReference() {
  const key = 'angelcare-marketplace-visitor-reference'
  const current = window.localStorage.getItem(key)
  if (current) return current
  const created = crypto.randomUUID()
  window.localStorage.setItem(key, created)
  return created
}

async function api<T>(url: string, init: RequestInit): Promise<T> {
  const response = await fetch(url, { ...init, headers: { 'content-type': 'application/json', ...(init.headers || {}) } })
  const payload = await response.json() as ApiEnvelope<T>
  if (!response.ok || payload.error) throw new Error(payload.error?.message || 'Une erreur est survenue.')
  if (payload.data === undefined) throw new Error('Réponse serveur incomplète.')
  return payload.data
}

function initialValues(data: AdaptiveExperienceData) {
  const values: Record<string, unknown> = { ...data.item.experience_configuration }
  for (const fieldValue of data.fieldValues) {
    if (fieldValue.value !== null && fieldValue.value !== undefined && fieldValue.value !== '') values[fieldValue.field.field_key] = fieldValue.value
  }
  for (const field of data.schema.fields) if (values[field.field_key] === undefined && field.default_value !== null && field.default_value !== undefined) values[field.field_key] = field.default_value
  return values
}

function controlFields(data: AdaptiveExperienceData) {
  return data.schema.fields.filter((field) =>
    field.public_visible && !excludedKeys.has(field.field_key) && !['identity','content','media','pricing','publication','seo'].includes(field.section_key),
  ).slice(0, 32)
}

function fieldLabel(field: ExperienceFieldBlueprint, locale: AdaptiveExperienceData['locale']) {
  return locale === 'fr' ? field.label_fr : locale === 'ar' ? field.label_ar : field.label_en
}

function FieldControl({field,value,locale,error,onChange}:{field:ExperienceFieldBlueprint;value:unknown;locale:AdaptiveExperienceData['locale'];error?:string;onChange:(value:unknown)=>void}) {
  const label = fieldLabel(field,locale)
  const wide = ['textarea','richtext','time_ranges','list','component_list','json'].includes(field.field_type)
  if (field.allowed_values.length || field.field_type === 'select') return <label className={styles.field} data-wide={wide}><span>{label}{field.required?<b> *</b>:null}</span><select value={typeof value==='string'?value:''} onChange={(event)=>onChange(event.target.value)}><option value="">—</option>{field.allowed_values.map((option)=><option value={option} key={option}>{option.replaceAll('_',' ')}</option>)}</select>{field.help_fr?<small>{field.help_fr}</small>:null}{error?<small className={styles.fieldError}>{error}</small>:null}</label>
  if (field.field_type === 'multiselect' || field.field_type === 'territory_list') { const selected=Array.isArray(value)?value.map(String):[]; return <div className={styles.field} data-wide={wide}><span>{label}{field.required?<b> *</b>:null}</span><div className={styles.choiceGrid}>{field.allowed_values.length?field.allowed_values.map((option)=><button type="button" key={option} data-selected={selected.includes(option)} onClick={()=>onChange(selected.includes(option)?selected.filter((entry)=>entry!==option):[...selected,option])}>{option.replaceAll('_',' ')}</button>):<input value={selected.join(' | ')} onChange={(event)=>onChange(event.target.value.split('|').map((entry)=>entry.trim()).filter(Boolean))}/>}</div>{error?<small className={styles.fieldError}>{error}</small>:null}</div> }
  if (field.field_type === 'boolean') return <label className={styles.field}><span>{label}</span><div className={styles.toggle}><input type="checkbox" checked={Boolean(value)} onChange={(event)=>onChange(event.target.checked)}/><small>{Boolean(value)?(locale==='fr'?'Activé':locale==='ar'?'مفعل':'Enabled'):(locale==='fr'?'Non activé':locale==='ar'?'غير مفعل':'Not enabled')}</small></div>{error?<small className={styles.fieldError}>{error}</small>:null}</label>
  if (field.field_type === 'textarea' || field.field_type === 'richtext' || field.field_type === 'json' || field.field_type === 'component_list') return <label className={styles.field} data-wide="true"><span>{label}{field.required?<b> *</b>:null}</span><textarea value={typeof value==='string'?value:Array.isArray(value)?value.join(' | '):value?JSON.stringify(value):''} onChange={(event)=>onChange(field.field_type==='json'?event.target.value:event.target.value)}/>{field.help_fr?<small>{field.help_fr}</small>:null}{error?<small className={styles.fieldError}>{error}</small>:null}</label>
  const inputType = field.field_type === 'date' || field.field_type === 'datetime' || field.field_type === 'time' ? (field.field_type === 'datetime' ? 'datetime-local' : field.field_type) : ['number','integer','money'].includes(field.field_type) ? 'number' : 'text'
  return <label className={styles.field} data-wide={wide}><span>{label}{field.required?<b> *</b>:null}</span><input type={inputType} value={typeof value==='string'||typeof value==='number'?value:''} onChange={(event)=>onChange(inputType==='number'?(event.target.value===''?'':Number(event.target.value)):event.target.value)}/>{field.help_fr?<small>{field.help_fr}</small>:null}{error?<small className={styles.fieldError}>{error}</small>:null}</label>
}

export function ExperienceConfigurator({data}:{data:AdaptiveExperienceData}) {
  const [configuration,setConfiguration]=useState<Record<string,unknown>>(()=>initialValues(data))
  const [identity,setIdentity]=useState({contactName:'',email:'',phone:''})
  const [session,setSession]=useState<CategoryNativeSession|null>(null)
  const [outcome,setOutcome]=useState<CategoryNativeCommitResult|null>(null)
  const [busy,setBusy]=useState(false)
  const [message,setMessage]=useState<string|null>(null)
  const [termsAccepted,setTermsAccepted]=useState(false)
  const [privacyAccepted,setPrivacyAccepted]=useState(false)
  const [nonMedicalAccepted,setNonMedicalAccepted]=useState(false)
  const [state,setState]=useState<'idle'|'error'|'success'>('idle')
  const fields=useMemo(()=>controlFields(data),[data])
  const groups=useMemo(()=>fields.reduce<Record<string,ExperienceFieldBlueprint[]>>((result,field)=>{result[field.section_key]=[...(result[field.section_key]||[]),field];return result},{}),[fields])
  const errors=session?.validation.errors||{}
  const needsNonMedical=data.schema.schema_key==='non-medical-support-service'||data.schema.schema_key==='health-adjacent-programme'
  const identityReady=identity.contactName.trim().length>=2&&(identity.email.trim().includes('@')||identity.phone.trim().length>=8)
  const consentsReady=termsAccepted&&privacyAccepted&&(!needsNonMedical||nonMedicalAccepted)
  const summary=fields.filter((field)=>configuration[field.field_key]!==undefined&&configuration[field.field_key]!==''&&configuration[field.field_key]!==null).slice(0,12)

  async function ensureSession() {
    if (session) return session
    const created=await api<CategoryNativeSession>('/api/angelcare-marketplace/conversion/category-native/session',{method:'POST',body:JSON.stringify({itemSlug:data.item.slug,locale:data.locale,visitorReference:visitorReference(),idempotencyKey:`experience:${data.item.id}:${crypto.randomUUID()}`,sourceRoute:window.location.pathname,initialConfiguration:configuration})})
    setSession(created)
    return created
  }
  async function saveAndRevalidate() {
    setBusy(true);setMessage(null);setState('idle')
    try{const current=await ensureSession();const updated=await api<CategoryNativeSession>(`/api/angelcare-marketplace/conversion/category-native/session/${current.sessionKey}/configuration`,{method:'PATCH',body:JSON.stringify({visitorReference:visitorReference(),configuration,identity})});setSession(updated);if(!updated.validation.valid){setState('error');setMessage(data.locale==='fr'?'Certains champs requis doivent être complétés.':data.locale==='ar'?'يجب إكمال بعض الحقول المطلوبة.':'Some required fields must be completed.');return}const validated=await api<CategoryNativeSession>(`/api/angelcare-marketplace/conversion/category-native/session/${current.sessionKey}/revalidate`,{method:'POST',body:JSON.stringify({visitorReference:visitorReference(),quantity:Number(configuration.quantity||1)})});setSession(validated);setState(validated.availability?.status==='unavailable'?'error':'success');setMessage(validated.availability?.status==='unavailable'?(data.locale==='fr'?'Cette configuration n’est pas disponible.':data.locale==='ar'?'هذا الإعداد غير متاح.':'This configuration is unavailable.'):(data.locale==='fr'?'Prix et disponibilité revérifiés.':data.locale==='ar'?'تمت إعادة التحقق من السعر والتوفر.':'Price and availability revalidated.'))}catch(error){setState('error');setMessage(error instanceof Error?error.message:'Erreur de configuration.')}finally{setBusy(false)}
  }
  async function commit() {
    setBusy(true);setMessage(null)
    try{const current=session||await ensureSession();const result=await api<CategoryNativeCommitResult>(`/api/angelcare-marketplace/conversion/category-native/session/${current.sessionKey}/commit`,{method:'POST',body:JSON.stringify({visitorReference:visitorReference(),idempotencyKey:`commit:${current.sessionKey}`,consents:{terms:termsAccepted,privacy:privacyAccepted,nonMedical:nonMedicalAccepted}})});setOutcome(result);setSession(result.session);setState('success');setMessage(data.locale==='fr'?`Demande créée : ${result.outcome.public_reference}`:data.locale==='ar'?`تم إنشاء الطلب: ${result.outcome.public_reference}`:`Request created: ${result.outcome.public_reference}`)}catch(error){setState('error');setMessage(error instanceof Error?error.message:'Confirmation impossible.')}finally{setBusy(false)}
  }
  return <div className={styles.configurator}>
    <div className={styles.configMain}>
      <div className={styles.stepBar}><button type="button" data-active="true">01 · {data.locale==='fr'?'Configuration':data.locale==='ar'?'الإعداد':'Configuration'}</button><button type="button" data-active={session?.status==='ready_for_review'}>02 · {data.locale==='fr'?'Disponibilité':data.locale==='ar'?'التوفر':'Availability'}</button><button type="button" data-active={Boolean(outcome)}>03 · {data.locale==='fr'?'Confirmation':data.locale==='ar'?'التأكيد':'Confirmation'}</button></div>
      <section className={styles.fieldGroup}><h3>{data.locale==='fr'?'Vos coordonnées':data.locale==='ar'?'بيانات التواصل':'Your contact details'}</h3><div className={styles.fieldGrid}><label className={styles.field}><span>{data.locale==='fr'?'Nom complet':data.locale==='ar'?'الاسم الكامل':'Full name'} *</span><input value={identity.contactName} autoComplete="name" onChange={(event)=>setIdentity((current)=>({...current,contactName:event.target.value}))}/></label><label className={styles.field}><span>Email</span><input type="email" value={identity.email} autoComplete="email" onChange={(event)=>setIdentity((current)=>({...current,email:event.target.value}))}/></label><label className={styles.field}><span>{data.locale==='fr'?'Téléphone':data.locale==='ar'?'الهاتف':'Phone'}</span><input type="tel" value={identity.phone} autoComplete="tel" onChange={(event)=>setIdentity((current)=>({...current,phone:event.target.value}))}/></label></div><small>{data.locale==='fr'?'Un email ou un téléphone valide est requis. Ces informations ne seront pas redemandées sans motif opérationnel.':data.locale==='ar'?'يلزم بريد إلكتروني أو هاتف صالح. لن نطلب هذه المعلومات مرة أخرى دون سبب تشغيلي.':'A valid email or phone is required. This information will not be requested again without an operational reason.'}</small></section>
      {data.variantGroups.length?<section className={styles.fieldGroup}><h3>{data.locale==='fr'?'Variantes':data.locale==='ar'?'الخيارات':'Variants'}</h3><div className={styles.fieldGrid}>{data.variantGroups.map((group)=><div className={styles.field} key={group.group_key}><span>{data.locale==='fr'?group.label_fr:data.locale==='ar'?group.label_ar:group.label_en}{group.required?<b> *</b>:null}</span><div className={styles.choiceGrid}>{group.values.map((option)=><button type="button" key={option} data-selected={configuration[group.group_key]===option} onClick={()=>setConfiguration((current)=>({...current,[group.group_key]:option}))}>{option.replaceAll('_',' ')}</button>)}</div></div>)}</div></section>:null}
      <div className={styles.fieldGroups}>{Object.entries(groups).map(([group,entries])=><section className={styles.fieldGroup} key={group}><h3>{group.replaceAll('_',' ')}</h3><div className={styles.fieldGrid}>{entries.map((field)=><FieldControl key={field.field_key} field={field} value={configuration[field.field_key]} locale={data.locale} error={errors[field.field_key]} onChange={(value)=>setConfiguration((current)=>({...current,[field.field_key]:value}))}/>)}</div></section>)}</div>
    </div>
    <aside className={styles.configAside}><span>LIVE CONFIGURATION</span><h3>{data.locale==='fr'?'Votre sélection':data.locale==='ar'?'اختيارك':'Your selection'}</h3><div className={styles.summaryRows}>{summary.length?summary.map((field)=><div className={styles.summaryRow} key={field.field_key}><span>{fieldLabel(field,data.locale)}</span><strong>{Array.isArray(configuration[field.field_key])?(configuration[field.field_key] as unknown[]).join(' · '):String(configuration[field.field_key])}</strong></div>):<div className={styles.summaryRow}><span>{data.locale==='fr'?'Commencez votre configuration':data.locale==='ar'?'ابدأ الإعداد':'Start configuring'}</span><strong>{data.item.name}</strong></div>}</div>{message?<div className={styles.configStatus} data-state={state}>{state==='success'?<CheckCircle2 size={16}/>:state==='error'?<ShieldCheck size={16}/>:null} {message}</div>:null}<div className={styles.consentPanel}><label><input type="checkbox" checked={termsAccepted} onChange={(event)=>setTermsAccepted(event.target.checked)}/><span>{data.locale==='fr'?'J’accepte les conditions Marketplace applicables à cette configuration.':data.locale==='ar'?'أوافق على شروط السوق المطبقة على هذا الإعداد.':'I accept the Marketplace terms applicable to this configuration.'}</span></label><label><input type="checkbox" checked={privacyAccepted} onChange={(event)=>setPrivacyAccepted(event.target.checked)}/><span>{data.locale==='fr'?'J’ai lu l’information relative à la confidentialité.':data.locale==='ar'?'اطلعت على إشعار الخصوصية.':'I have read the privacy notice.'}</span></label>{needsNonMedical?<label><input type="checkbox" checked={nonMedicalAccepted} onChange={(event)=>setNonMedicalAccepted(event.target.checked)}/><span>{data.locale==='fr'?'Je comprends que cette offre est strictement non médicale.':data.locale==='ar'?'أفهم أن هذه الخدمة غير طبية تماماً.':'I understand that this offer is strictly non-medical.'}</span></label>:null}</div><div className={styles.configButtons}><button type="button" onClick={saveAndRevalidate} disabled={busy||Boolean(outcome)}>{busy?<LoaderCircle size={18}/>:<RotateCcw size={18}/>} {data.locale==='fr'?'Revérifier prix et disponibilité':data.locale==='ar'?'إعادة التحقق من السعر والتوفر':'Revalidate price and availability'}</button><button type="button" onClick={commit} disabled={busy||!session||session.status==='unavailable'||!identityReady||!consentsReady||Boolean(outcome)}>{data.locale==='fr'?'Confirmer cette configuration':data.locale==='ar'?'تأكيد هذا الإعداد':'Confirm this configuration'} <ArrowRight size={17}/></button></div></aside>
  </div>
}
