import type { ComponentData } from '@puckeditor/core'
import type { PublicExperience360, PublicExperienceMasterDomain } from '../public-experience-authority/types'
import { publicExperienceBinding } from '../public-experience-authority/typed-bindings'
import { shouldRenderWorldBlock } from '../studio-universal/world-operability'
import type { StudioBlockProps } from '../studio-universal/types'

export const ATOMIC_EXPERIENCE_VERSION = 1
export const ATOMIC_ROOTS: Record<string, PublicExperienceMasterDomain> = {
  ac_product_world: 'b2c_product_digital', ac_service_world: 'b2c_service_family',
  ac_academy_world: 'academy_admission', ac_b2b_world: 'b2b_institutional',
}
export const ATOMIC_ROLES = ['opening','story','gallery','facts','benefits','contents','choices','schedule','plans','providers','curriculum','cohorts','trainers','deployment','proof','reviews','faq','related','decision'] as const
export type AtomicRole = typeof ATOMIC_ROLES[number]
export type AtomicLocale = 'fr'|'en'|'ar'
export type AtomicRow = { key: string; title: string; body: string; value: unknown; raw: Record<string, unknown> }
export type AtomicSectionProps = Record<string, unknown> & {
  id: string; role: AtomicRole; title?: unknown; lead?: unknown; eyebrow?: unknown;
  bindingKey?: string; fieldSections?: string; fieldKeys?: string; layout?: string;
  hidden?: boolean; doctrineKeys?: string; enableSelection?: boolean;
  relationKind?: string;
}
export function isAtomicSectionProps(props: Record<string, unknown>): props is AtomicSectionProps {
  return typeof props.id === 'string' && ATOMIC_ROLES.some(role => role === props.role)
}
export const record = (value: unknown): Record<string, unknown> => value !== null && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : {}
export function present(value: unknown): boolean {
  if(value === null || value === undefined) return false
  if(typeof value === 'string') return value.trim().length > 0
  if(Array.isArray(value)) return value.some(present)
  if(typeof value === 'object') return Object.values(value).some(present)
  return true // Zero and false are real published values.
}
export function localeText(value: unknown, locale: AtomicLocale): string {
  if(typeof value === 'string') {
    const translations:Record<string,[string,string,string]>={weekly:['Chaque semaine','Weekly','كل أسبوع'],monthly:['Chaque mois','Monthly','كل شهر'],daily:['Chaque jour','Daily','كل يوم'],one_time:['Ponctuel','One-time','لمرة واحدة'],one_off:['Ponctuel','One-time','لمرة واحدة'],small:['Petit format','Small','حجم صغير'],large:['Grand format','Large','حجم كبير'],monday:['Lundi','Monday','الإثنين'],tuesday:['Mardi','Tuesday','الثلاثاء'],wednesday:['Mercredi','Wednesday','الأربعاء'],thursday:['Jeudi','Thursday','الخميس'],friday:['Vendredi','Friday','الجمعة'],saturday:['Samedi','Saturday','السبت'],sunday:['Dimanche','Sunday','الأحد'],practical_life:['Vie pratique','Practical life','الحياة العملية'],discovery:['Découverte','Discovery','اكتشاف'],parents:['Parents','Parents','الآباء'],caregivers:['Accompagnants','Caregivers','مقدمو الرعاية'],teachers:['Éducateurs','Educators','المربون'],French:['Français','French','الفرنسية'],Arabic:['Arabe','Arabic','العربية'],English:['Anglais','English','الإنجليزية']}
    const labels=translations[value.trim()];return labels?labels[locale==='fr'?0:locale==='en'?1:2]:value.trim()
  }
  const r = record(value)
  return typeof (r[locale] ?? r.fr ?? r.en ?? r.ar) === 'string' ? String(r[locale] ?? r.fr ?? r.en ?? r.ar).trim() : ''
}
export function publicUrl(value: unknown): string | null {
  if(typeof value !== 'string' || !value.trim() || /[\u0000-\u001f]/.test(value)) return null
  const v = value.trim()
  if(v.startsWith('/') && !v.startsWith('//') && !v.includes('\\')) return v
  try { const u = new URL(v); return u.protocol === 'https:' ? u.href : null } catch { return null }
}
export function display(value: unknown, locale: AtomicLocale): string {
  if(value === null || value === undefined) return ''
  if(typeof value === 'boolean') return value ? ({fr:'Oui',en:'Yes',ar:'نعم'}[locale]) : ({fr:'Non',en:'No',ar:'لا'}[locale])
  if(typeof value === 'number') return Number.isFinite(value) ? new Intl.NumberFormat(locale).format(value) : ''
  if(typeof value === 'string') {
    const translations:Record<string,[string,string,string]>={weekly:['Chaque semaine','Weekly','كل أسبوع'],monthly:['Chaque mois','Monthly','كل شهر'],daily:['Chaque jour','Daily','كل يوم'],one_time:['Ponctuel','One-time','لمرة واحدة'],one_off:['Ponctuel','One-time','لمرة واحدة'],small:['Petit format','Small','حجم صغير'],large:['Grand format','Large','حجم كبير'],monday:['Lundi','Monday','الإثنين'],tuesday:['Mardi','Tuesday','الثلاثاء'],wednesday:['Mercredi','Wednesday','الأربعاء'],thursday:['Jeudi','Thursday','الخميس'],friday:['Vendredi','Friday','الجمعة'],saturday:['Samedi','Saturday','السبت'],sunday:['Dimanche','Sunday','الأحد'],practical_life:['Vie pratique','Practical life','الحياة العملية'],discovery:['Découverte','Discovery','اكتشاف'],parents:['Parents','Parents','الآباء'],caregivers:['Accompagnants','Caregivers','مقدمو الرعاية'],teachers:['Éducateurs','Educators','المربون'],French:['Français','French','الفرنسية'],Arabic:['Arabe','Arabic','العربية'],English:['Anglais','English','الإنجليزية']}
    const labels=translations[value.trim()];return labels?labels[locale==='fr'?0:locale==='en'?1:2]:value.trim()
  }
  if(Array.isArray(value)) return value.filter(present).map(v => display(v,locale)).filter(Boolean).join(' · ')
  const r = record(value), localized = localeText(r,locale)
  if(localized) return localized
  return Object.entries(r).filter(([k,v]) => !/^(id|key|.*_id|.*_reference|metadata|attributes|configuration|status|sortOrder|sort_order)$/i.test(k) && present(v)).map(([k,v]) => `${k.replaceAll('_',' ')}: ${display(v,locale)}`).join(' · ')
}
const list = (value: string | undefined) => (value || '').split(',').map(v=>v.trim()).filter(Boolean)
export function isAtomicRoot(type: string, props: Record<string, unknown>): boolean {
  return Object.hasOwn(ATOMIC_ROOTS,type) && props.atomicExperienceVersion === ATOMIC_EXPERIENCE_VERSION
}
export function sectionsFrom(content: unknown): AtomicSectionProps[] {
  if(!Array.isArray(content)) return []
  return content.flatMap((c: ComponentData) => c?.type === 'atomic_offer_section' ? [c.props as AtomicSectionProps] : sectionsFrom(record(c?.props).content))
}
/** Only registered public projections can be addressed. Never metadata/attributes. */
export function bindingValue(data: PublicExperience360, key: string | undefined): unknown {
  if(!key) return undefined
  const binding = publicExperienceBinding(key)
  if(!binding || !binding.publicSafe || (binding.domain !== 'shared' && binding.domain !== data.classification.masterDomain)) return undefined
  const aliases: Record<string,unknown> = {
    'media.primary': data.media.find(m=>m.type !== 'video' && publicUrl(m.url))?.url,
    'media.gallery': data.media.filter(m=>publicUrl(m.url)), 'pricing.current': data.pricing.amount,
    'availability.quantity': data.availability.availableQuantity, 'product.variants': data.variants.items,
    'relations.recommendations': data.recommendations, 'reviews.summary': data.reviews,
    'seo.schema': data.classification.schemaKey,
  }
  if(Object.hasOwn(aliases,key)) return aliases[key]
  if(key==='product.delivery'){
    const source=record(record(data.domainExtension.product).delivery)
    return Object.fromEntries(['lead_time','delivery_method','customer_handover','shipping_methods','shipping_zones','delivery_windows','returns_policy','digital_access_instructions'].filter(k=>present(source[k])).map(k=>[k,source[k]]))
  }
  const root = /^(product|service|academy|b2b)\./.test(key) ? data.domainExtension : data
  return key.split('.').reduce<unknown>((v,k)=>record(v)[k],root)
}
export function sectionValue(data: PublicExperience360, props: AtomicSectionProps): unknown {
  const keys = list(props.fieldKeys), sections = list(props.fieldSections)
  if(keys.length || sections.length) return data.content.fields.filter(f=>present(f.value) && (keys.includes(f.key) || sections.includes(f.section)))
  if(props.role === 'opening' || props.role === 'decision') return data.identity.name
  if(props.role === 'story') return data.identity.description
  if(props.role === 'gallery') return data.media.filter(m=>publicUrl(m.url))
  if(props.role === 'choices') return data.variants.groups
  if(props.role === 'proof') return data.trust.claims.filter(c=>['proven','verified','PROVEN'].includes(c.status) && present(c.evidenceReference))
  if(props.role === 'reviews') return data.reviews.source && data.reviews.count !== null && data.reviews.count > 0 && data.reviews.rating !== null ? data.reviews : null
  if(props.role === 'related') {
    const pool=data.recommendations.filter(r=>r.id !== data.identity.id && !!r.slug && !!r.name)
    if(!props.relationKind)return pool
    const kind=props.relationKind==='accessory'?'cross_sell':props.relationKind
    const ids=new Set(data.relations.filter(r=>r.kind===kind).map(r=>r.entityId).filter(Boolean))
    return pool.filter(r=>ids.has(r.id)) // Unresolved/unpublished relation targets cannot become offers.
  }
  return bindingValue(data,props.bindingKey)
}
export function sectionVisibility(data: PublicExperience360, props: AtomicSectionProps): {visible:boolean; reason:string} {
  if(props.hidden === true) return {visible:false,reason:'Hidden in published composition'}
  if(!ATOMIC_ROLES.includes(props.role)) return {visible:false,reason:'Unsupported component role'}
  const conditions=shouldRenderWorldBlock(props as StudioBlockProps,{locale:data.classification.locale==='ar'?'ar':data.classification.locale==='en'?'en':'fr',territoryId:data.classification.territoryId,audienceId:data.classification.audienceId})
  if(!conditions.render)return {visible:false,reason:conditions.reasons.join(' · ')||'Published display condition'}
  if(list(props.doctrineKeys).length && !list(props.doctrineKeys).includes(data.classification.doctrineKey)) return {visible:false,reason:'Outside assigned doctrine'}
  if(props.role === 'choices' && !data.variants.groups.length) return {visible:false,reason:'No canonical variant groups'}
  const visible = present(sectionValue(data,props))
  return {visible,reason:visible?'Public source populated':'No applicable public data'}
}
export function rows(value: unknown, locale: AtomicLocale): AtomicRow[] {
  const source = Array.isArray(value) ? value : typeof value === 'object' && value !== null ? Object.entries(record(value)).map(([key,value])=>({key,value})) : present(value) ? [value] : []
  return source.filter(present).map((v,index)=>{
    const r=record(v), fieldValue=Object.hasOwn(r,'value') ? r.value : v
    return { key:String(r.key ?? r.id ?? index), title:localeText(r.title,locale)||localeText(r.name,locale)||localeText(r.label,locale)||String(r[`name_${locale}`]||r[`label_${locale}`]||r.displayName||r.key||''), body:localeText(r.description,locale)||localeText(r.body,locale)|| (typeof r.formatted==='string'?r.formatted:display(fieldValue,locale)), value:fieldValue, raw:r }
  }).filter(r=>present(r.value) || r.title || r.body)
}
export function actionState(data: PublicExperience360): {enabled:boolean; path:'basket'|'booking'|'enrollment'|'quotation'; reason:string} {
  const domain=data.classification.masterDomain
  const unavailable=['unavailable','sold_out','blocked','closed','out_of_stock'].includes(data.availability.status) || data.availability.availableQuantity === 0
  const priced=data.pricing.amount !== null && Number.isFinite(data.pricing.amount) && data.pricing.amount >= 0 && !['quote','quote_only','quote_required','on_request','quotation'].includes(data.pricing.mode)
  const publicFields=Object.fromEntries(data.content.fields.map(f=>[f.key,f.value]))
  const path=domain === 'b2c_product_digital' ? 'basket' : domain === 'academy_admission' ? 'enrollment' : domain === 'b2c_service_family' ? 'booking' : 'quotation'
  // B2B is still handed to the category-native authority, which routes priced plans correctly.
  const actionId=path==='basket'?'basket.add':path==='booking'?'booking.start':path==='enrollment'?'academy.enroll':'quotation.start'
  const action=data.actions.find(a=>a.actionId===actionId)
  const enabled=!!action?.available && !unavailable && (path!=='basket'||priced) && !!data.identity.slug && publicFields.status !== 'archived'
  return {enabled,path,reason:enabled?'':unavailable?'unavailable':path==='basket'&&!priced?'price_pending':!action?.available?'action_pending':'identity_pending'}
}

/** Strip raw metadata, private attributes and internal fulfillment notes before the client boundary. */
export function publicAtomicProjection(data:PublicExperience360):PublicExperience360{
  const allowed=publicExperienceBindingsForProjection(data)
  return {...data,domainExtension:allowed,sourceAuthorities:[]}
}
function publicExperienceBindingsForProjection(data:PublicExperience360):Record<string,unknown>{
  const safeProvider=(value:unknown)=>{const r=record(value);return Object.fromEntries(['id','publicReference','displayName','providerType','languages','serviceCategories','ageGroups','zones','certifications'].filter(k=>present(r[k])).map(k=>[k,r[k]]))}
  const service=record(data.domainExtension.service),academy=record(data.domainExtension.academy),b2b=record(data.domainExtension.b2b),product=record(data.domainExtension.product)
  const safe:Record<string,unknown>={fields:Object.fromEntries(data.content.fields.map(f=>[f.key,f.value]))}
  if(data.classification.masterDomain==='b2c_product_digital')safe.product={delivery:bindingValue(data,'product.delivery'),specifications:product.specifications,digitalDelivery:product.digitalDelivery,subscription:product.subscription,accessories:product.accessories,bundles:product.bundles}
  if(data.classification.masterDomain==='b2c_service_family')safe.service={providers:Array.isArray(service.providers)?service.providers.map(safeProvider):[],plans:service.plans,bookingModes:service.bookingModes,scheduleRules:service.scheduleRules,urgency:service.urgency,coverage:{territoryId:data.classification.territoryId}}
  if(data.classification.masterDomain==='academy_admission')safe.academy={curriculum:academy.curriculum,modules:academy.modules,trainers:Array.isArray(academy.trainers)?academy.trainers.map(safeProvider):[],cohorts:academy.cohorts,nextCohort:academy.nextCohort,capacity:academy.capacity,certification:academy.certification,admission:academy.admission}
  if(data.classification.masterDomain==='b2b_institutional')safe.b2b={organisationFit:b2b.organisationFit,deploymentModel:b2b.deploymentModel,diagnostic:b2b.diagnostic,programmes:b2b.programmes,portfolioProof:b2b.portfolioProof}
  return safe
}
