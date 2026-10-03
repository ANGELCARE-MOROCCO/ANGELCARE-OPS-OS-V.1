export type AtomicLocale='fr'|'en'|'ar'
export type AtomicCopy={fr:string;en:string;ar:string}

type Row=Record<string,unknown>

const text=(value:unknown)=>value==null?'':String(value).trim()
const obj=(value:unknown):Row=>value&&typeof value==='object'&&!Array.isArray(value)?value as Row:{}

export const atomicLocale=(value:unknown):AtomicLocale=>value==='en'||value==='ar'?value:'fr'
export const intlLocale=(value:unknown)=>atomicLocale(value)==='en'?'en-MA':atomicLocale(value)==='ar'?'ar-MA':'fr-MA'
export const copy=(locale:unknown,row:AtomicCopy)=>row[atomicLocale(locale)]

const CURRENCY_LABELS:Record<AtomicLocale,Record<string,string>>={
 fr:{MAD:'DH',DH:'DH',DHS:'DH'},
 en:{MAD:'MAD',DH:'MAD',DHS:'MAD'},
 ar:{MAD:'د.م.',DH:'د.م.',DHS:'د.م.'},
}

export function formatMoney(amount:number|null|undefined,currency:unknown,label:unknown,locale:unknown){
 const l=atomicLocale(locale)
 if(amount===null||amount===undefined||!Number.isFinite(Number(amount)))return text(label)||copy(l,{fr:'Sur devis',en:'On request',ar:'حسب الطلب'})
 const raw=text(currency).toUpperCase()||'MAD'
 const currencyLabel=CURRENCY_LABELS[l][raw]||raw
 return `${new Intl.NumberFormat(intlLocale(l),{maximumFractionDigits:2}).format(Number(amount))} ${currencyLabel}`
}

export function formatDate(value:unknown,locale:unknown){
 const raw=text(value);if(!raw)return''
 const date=new Date(raw);if(Number.isNaN(date.getTime()))return raw
 return new Intl.DateTimeFormat(intlLocale(locale),{day:'2-digit',month:'short',year:'numeric'}).format(date)
}

export function cleanToken(value:unknown){return text(value).replaceAll('_',' ').replaceAll('-',' ').replace(/\s+/g,' ').trim()}

const LABELS:Record<string,AtomicCopy>={
 age_min:{fr:'Âge minimum',en:'Minimum age',ar:'الحد الأدنى للعمر'},
 age_max:{fr:'Âge maximum',en:'Maximum age',ar:'الحد الأقصى للعمر'},
 variant_languages:{fr:'Langues disponibles',en:'Available languages',ar:'اللغات المتاحة'},
 laminated_card:{fr:'Finition plastifiée',en:'Laminated finish',ar:'تشطيب مغلف'},
 availability_status:{fr:'Disponibilité',en:'Availability',ar:'التوفر'},
 pricing_mode:{fr:'Mode de tarification',en:'Pricing model',ar:'نموذج التسعير'},
 quotation_required:{fr:'Devis requis',en:'Quotation required',ar:'يتطلب عرض سعر'},
 implementation_lead_time_days:{fr:'Délai de mise en place',en:'Implementation lead time',ar:'مدة التنفيذ'},
 contract_duration_months:{fr:'Durée du contrat',en:'Contract duration',ar:'مدة العقد'},
 billing_basis:{fr:'Base de facturation',en:'Billing basis',ar:'أساس الفوترة'},
 billing_model:{fr:'Modèle de facturation',en:'Billing model',ar:'نموذج الفوترة'},
 company_billing_cycle:{fr:'Cycle de facturation',en:'Billing cycle',ar:'دورة الفوترة'},
 support_level:{fr:'Niveau de support',en:'Support level',ar:'مستوى الدعم'},
 trial_days:{fr:'Période d’essai',en:'Trial period',ar:'فترة التجربة'},
 duration_days:{fr:'Durée',en:'Duration',ar:'المدة'},
}

const VALUES:Record<string,AtomicCopy>={
 available:{fr:'Disponible',en:'Available',ar:'متاح'},
 unavailable:{fr:'Indisponible',en:'Unavailable',ar:'غير متاح'},
 open:{fr:'Ouvert',en:'Open',ar:'مفتوح'},
 closed:{fr:'Fermé',en:'Closed',ar:'مغلق'},
 paused:{fr:'Temporairement suspendu',en:'Temporarily paused',ar:'موقوف مؤقتاً'},
 out_of_stock:{fr:'Indisponible',en:'Unavailable',ar:'غير متاح'},
 inventory:{fr:'Stock',en:'Inventory',ar:'المخزون'},
 trilingual:{fr:'Trilingue',en:'Trilingual',ar:'ثلاثي اللغات'},
 bilingual:{fr:'Bilingue',en:'Bilingual',ar:'ثنائي اللغة'},
 online:{fr:'En ligne',en:'Online',ar:'عن بُعد'},
 onsite:{fr:'Sur site',en:'On-site',ar:'حضوري'},
 hybrid:{fr:'Hybride',en:'Hybrid',ar:'هجين'},
 yes:{fr:'Oui',en:'Yes',ar:'نعم'},
 no:{fr:'Non',en:'No',ar:'لا'},
 true:{fr:'Oui',en:'Yes',ar:'نعم'},
 false:{fr:'Non',en:'No',ar:'لا'},
 flat:{fr:'Tarif fixe',en:'Fixed price',ar:'سعر ثابت'},
 fixed:{fr:'Tarif fixe',en:'Fixed price',ar:'سعر ثابت'},
 starting_from:{fr:'À partir de',en:'Starting from',ar:'ابتداءً من'},
 quote_only:{fr:'Sur devis',en:'On request',ar:'حسب الطلب'},
 per_site:{fr:'Par site',en:'Per site',ar:'لكل موقع'},
 per_child:{fr:'Par enfant',en:'Per child',ar:'لكل طفل'},
 per_employee:{fr:'Par employé',en:'Per employee',ar:'لكل موظف'},
 per_event:{fr:'Par événement',en:'Per event',ar:'لكل فعالية'},
 subscription:{fr:'Abonnement',en:'Subscription',ar:'اشتراك'},
 volume_pricing:{fr:'Tarification au volume',en:'Volume pricing',ar:'تسعير حسب الحجم'},
 configured_estimate:{fr:'Estimation configurée',en:'Configured estimate',ar:'تقدير مخصص'},
}

export function humanizeLabel(key:unknown,locale:unknown,fallback?:unknown){
 const normalized=text(key).toLowerCase()
 if(LABELS[normalized])return copy(locale,LABELS[normalized])
 const preferred=text(fallback)
 if(preferred&&atomicLocale(locale)==='fr')return preferred
 const clean=cleanToken(key)
 if(!clean)return preferred
 return clean.charAt(0).toUpperCase()+clean.slice(1)
}

export function humanizeValue(value:unknown,locale:unknown):string{
 if(value===null||value===undefined)return''
 if(Array.isArray(value))return value.map(row=>humanizeValue(row,locale)).filter(Boolean).join(' · ')
 if(typeof value==='object'){
  const row=obj(value)
  const preferred=text(row.label||row.name||row.title||row.value)
  return preferred?humanizeValue(preferred,locale):''
 }
 const raw=text(value);const normalized=raw.toLowerCase().trim()
 if(VALUES[normalized])return copy(locale,VALUES[normalized])
 if(normalized==='fr')return atomicLocale(locale)==='ar'?'الفرنسية':atomicLocale(locale)==='en'?'French':'Français'
 if(normalized==='en')return atomicLocale(locale)==='ar'?'الإنجليزية':atomicLocale(locale)==='en'?'English':'Anglais'
 if(normalized==='ar')return atomicLocale(locale)==='ar'?'العربية':atomicLocale(locale)==='en'?'Arabic':'Arabe'
 return cleanToken(raw)
}

export function uniqueMedia<T extends {url:string}>(rows:T[]){
 const seen=new Set<string>()
 return rows.filter(row=>{const url=text(row.url);if(!url||seen.has(url))return false;seen.add(url);return true})
}

export function rowText(row:Row,keys:string[]){for(const key of keys){const value=row[key];if(value!==undefined&&value!==null&&value!=='')return text(value)}return''}
export function rowNumber(row:Row,keys:string[]){for(const key of keys){const value=row[key];if(value!==undefined&&value!==null&&value!==''&&Number.isFinite(Number(value)))return Number(value)}return null}

const kindOf=(row:Row)=>text(row.kind||row.catalogKind||row.catalog_kind||row.type||obj(row.metadata).kind).toLowerCase()
const sourceOf=(row:Row)=>text(row.sourceId||obj(row.__studioSourceReference).sourceId).toLowerCase()
const domainOf=(row:Row)=>text(row.masterDomain||row.master_domain||row.domain).toLowerCase()

export function isServiceRow(row:Row){const k=kindOf(row),s=sourceOf(row),d=domainOf(row);return d==='b2c_service_family'||k==='service'||k==='services'||s.includes('services')}
export function isAcademyRow(row:Row){const k=kindOf(row),s=sourceOf(row),d=domainOf(row);return d==='academy_admission'||['training','course','academy','formation'].includes(k)||s.startsWith('academy.')}
export function isB2BRow(row:Row){const k=kindOf(row),s=sourceOf(row),d=domainOf(row);return d==='b2b_institutional'||k==='b2b'||k==='institutional'||k==='solution'||k.startsWith('b2b_')||s.startsWith('b2b.')}
export function isProductRow(row:Row){const k=kindOf(row),d=domainOf(row);return d==='b2c_product_digital'||['product','digital_product','kit','resource'].includes(k)}

export function availabilityCopy(status:unknown,locale:unknown){
 const normalized=text(status).toLowerCase()
 if(['available','open','in_stock','enrollment_open','active'].includes(normalized))return{state:'available' as const,label:copy(locale,{fr:'Disponible',en:'Available',ar:'متاح'})}
 if(['unavailable','closed','paused','out_of_stock','sold_out','disabled'].includes(normalized))return{state:'blocked' as const,label:copy(locale,{fr:'Indisponible',en:'Unavailable',ar:'غير متاح'})}
 return{state:'unknown' as const,label:copy(locale,{fr:'À confirmer',en:'To be confirmed',ar:'يُرجى التأكيد'})}
}

export function durationDays(value:unknown,locale:unknown){
 const raw=text(value);if(!raw)return''
 if(!/^\d+(?:\.\d+)?$/.test(raw))return humanizeValue(raw,locale)
 const n=Number(raw)
 const unit=n===1?copy(locale,{fr:'jour',en:'day',ar:'يوم'}):copy(locale,{fr:'jours',en:'days',ar:'أيام'})
 return `${new Intl.NumberFormat(intlLocale(locale)).format(n)} ${unit}`
}
