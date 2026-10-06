'use client'
import { useMemo, useState } from 'react'
import { CalendarClock, Loader2, PackageOpen, RefreshCw, RotateCcw, Send, XCircle } from 'lucide-react'
import type { MarketplaceJourney } from '../types'
import styles from '../journey.module.css'

type RequestOption={key:string;label:string;hint:string}
const copy={
  fr:{eyebrow:'MODIFIER CE PARCOURS',title:'Besoin de changer quelque chose ?',body:'Une demande reste rattachée à ce parcours et passe par les règles opérationnelles applicables. L’envoi ne garantit pas l’acceptation : AngelCare confirme la décision et les éventuels impacts.',reason:'Expliquez précisément votre besoin',submit:'Envoyer la demande',empty:'Aucune demande de modification en cours.',sent:'Demande enregistrée. Le parcours va être actualisé.',history:'Demandes déjà envoyées'},
  en:{eyebrow:'CHANGE THIS JOURNEY',title:'Need to change something?',body:'A request stays attached to this journey and follows the applicable operating rules. Submission does not guarantee approval: AngelCare confirms the decision and any impact.',reason:'Explain exactly what you need',submit:'Send request',empty:'No change request in progress.',sent:'Request recorded. The journey will refresh.',history:'Requests already sent'},
  ar:{eyebrow:'تعديل هذا المسار',title:'هل تحتاج إلى تغيير شيء؟',body:'يبقى الطلب مرتبطاً بهذا المسار ويخضع للقواعد التشغيلية المعمول بها. الإرسال لا يعني الموافقة تلقائياً؛ تؤكد AngelCare القرار وأي تأثير.',reason:'اشرح طلبك بدقة',submit:'إرسال الطلب',empty:'لا توجد طلبات تعديل قيد المعالجة.',sent:'تم تسجيل الطلب. سيتم تحديث المسار.',history:'الطلبات المرسلة'},
} as const

function options(journey:MarketplaceJourney):RequestOption[]{
  const locale=journey.locale
  const tr=(fr:string,en:string,ar:string)=>locale==='fr'?fr:locale==='ar'?ar:en
  const common:RequestOption[]=[{key:'general_change',label:tr('Modifier les informations','Change information','تعديل المعلومات'),hint:tr('Coordonnées, consignes ou informations liées au parcours.','Contact details, instructions or journey information.','بيانات الاتصال أو التعليمات أو معلومات المسار.')},{key:'cancellation_request',label:tr('Demander une annulation','Request cancellation','طلب الإلغاء'),hint:tr('Soumis aux conditions, étapes déjà engagées et décisions de remboursement applicables.','Subject to policy, work already performed and applicable refund decisions.','يخضع للسياسة والمراحل المنجزة وقرارات الاسترداد المعمول بها.')}]
  if(['family_booking','recurring_service'].includes(journey.journey_type))return [{key:'reschedule_request',label:tr('Changer le planning','Change schedule','تغيير الموعد'),hint:tr('Date, heure ou cadence du service.','Service date, time or recurrence.','تاريخ أو وقت أو وتيرة الخدمة.')},{key:'service_change',label:tr('Modifier le service','Change service','تعديل الخدمة'),hint:tr('Périmètre, bénéficiaire ou instructions de service.','Scope, beneficiary or service instructions.','النطاق أو المستفيد أو تعليمات الخدمة.')},...common]
  if(['product_order','kit_order'].includes(journey.journey_type))return [{key:'delivery_change',label:tr('Modifier la livraison','Change delivery','تعديل التسليم'),hint:tr('Adresse ou consignes avant verrouillage logistique.','Address or instructions before logistics lock.','العنوان أو التعليمات قبل تثبيت الشحن.')},{key:'return_request',label:tr('Demander un retour','Request return','طلب إرجاع'),hint:tr('La recevabilité dépend du produit, de son état et de la politique applicable.','Eligibility depends on the item, its condition and applicable policy.','تعتمد الأهلية على المنتج وحالته والسياسة المعمول بها.')},...common]
  if(journey.journey_type==='academy_enrollment')return [{key:'cohort_change',label:tr('Changer de cohorte / planning','Change cohort / schedule','تغيير المجموعة / الموعد'),hint:tr('Selon les places et règles Academy disponibles.','Subject to Academy availability and rules.','حسب المقاعد وقواعد الأكاديمية المتاحة.')},...common]
  if(['b2b_quotation','hospitality_programme','corporate_benefit'].includes(journey.journey_type))return [{key:'scope_change',label:tr('Modifier le périmètre','Change scope','تعديل النطاق'),hint:tr('Besoin, volume, site, population ou calendrier.','Need, volume, site, population or timeline.','الاحتياج أو الحجم أو الموقع أو الفئة أو الجدول.')},...common]
  if(journey.journey_type==='partner_activation')return [{key:'plan_change',label:tr('Modifier le plan / périmètre','Change plan / scope','تعديل الخطة / النطاق'),hint:tr('Modules, organisation ou calendrier d’activation.','Modules, organisation or activation schedule.','الوحدات أو المؤسسة أو جدول التفعيل.')},...common]
  if(journey.journey_type==='quality_assessment')return [{key:'assessment_change',label:tr('Modifier l’évaluation','Change assessment','تعديل التقييم'),hint:tr('Site, périmètre ou calendrier.','Site, scope or schedule.','الموقع أو النطاق أو الجدول.')},...common]
  return common
}

function requestStatus(locale:MarketplaceJourney['locale'],status:string){
  const labels={
    fr:{submitted:'Envoyée',under_review:'En cours d’examen',approved:'Approuvée',rejected:'Non approuvée',completed:'Traitée',cancelled:'Clôturée'},
    en:{submitted:'Submitted',under_review:'Under review',approved:'Approved',rejected:'Not approved',completed:'Completed',cancelled:'Closed'},
    ar:{submitted:'تم الإرسال',under_review:'قيد المراجعة',approved:'تمت الموافقة',rejected:'لم تتم الموافقة',completed:'تمت المعالجة',cancelled:'مغلقة'},
  } as const
  return labels[locale][status as keyof typeof labels.fr]||status.replaceAll('_',' ')
}
function decisionMessage(request:MarketplaceJourney['change_requests'][number]){
  const value=request.policy_decision.customer_message
  return typeof value==='string'&&value.trim()?value.trim():null
}

function icon(key:string){if(key.includes('cancel'))return <XCircle size={18}/>;if(key.includes('return'))return <RotateCcw size={18}/>;if(key.includes('delivery'))return <PackageOpen size={18}/>;if(key.includes('schedule')||key.includes('cohort'))return <CalendarClock size={18}/>;return <RefreshCw size={18}/>}
export function CustomerChangeRequestPanel({journey}:{journey:MarketplaceJourney}){
  const t=copy[journey.locale]
  const opts=useMemo(()=>options(journey),[journey])
  const[type,setType]=useState(opts[0]?.key||'general_change')
  const[reason,setReason]=useState('')
  const[busy,setBusy]=useState(false)
  const[message,setMessage]=useState('')
  async function submit(){if(!reason.trim()||busy)return;setBusy(true);setMessage('');try{const response=await fetch(`/api/angelcare-marketplace/journeys/${journey.id}/change-requests`,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({requestType:type,reason:reason.trim(),requestedChanges:{source:'customer-os',journeyType:journey.journey_type}})});const payload=await response.json() as {error?:{message?:string}};if(!response.ok)throw new Error(payload.error?.message||'Request failed');setMessage(t.sent);setReason('');window.setTimeout(()=>window.location.reload(),650)}catch(error){setMessage(error instanceof Error?error.message:'Request failed')}finally{setBusy(false)}}
  return <section className={styles.changePanel} aria-labelledby="customer-change-title"><div className={styles.sectionHeading}><div><span>{t.eyebrow}</span><h2 id="customer-change-title">{t.title}</h2><p>{t.body}</p></div><RefreshCw size={22}/></div><div className={styles.changeComposer}><div className={styles.changeOptions}>{opts.map(option=><button type="button" key={option.key} data-active={type===option.key} onClick={()=>setType(option.key)}>{icon(option.key)}<span><strong>{option.label}</strong><small>{option.hint}</small></span></button>)}</div><div className={styles.changeReason}><label>{t.reason}<textarea rows={4} maxLength={2000} value={reason} onChange={e=>setReason(e.target.value)}/></label><button className={styles.primaryButton} type="button" disabled={busy||!reason.trim()} onClick={()=>void submit()}>{busy?<Loader2 size={16} className={styles.spin}/>:<Send size={16}/>} {t.submit}</button>{message?<p className={styles.feedback} role="status">{message}</p>:null}</div></div><div className={styles.changeHistory}><h3>{t.history}</h3>{journey.change_requests.length?<div>{journey.change_requests.map(request=>{const decision=decisionMessage(request);return <article key={request.id}><span>{request.request_type.replaceAll('_',' ')}</span><strong>{requestStatus(journey.locale,request.status)}</strong><p>{request.reason}</p>{decision?<blockquote>{decision}</blockquote>:null}<time>{new Date(request.submitted_at).toLocaleString(journey.locale)}{request.resolved_at?` · ${new Date(request.resolved_at).toLocaleString(journey.locale)}`:''}</time></article>})}</div>:<p>{t.empty}</p>}</div></section>
}
