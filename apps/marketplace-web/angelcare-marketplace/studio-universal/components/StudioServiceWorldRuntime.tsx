import Link from '@/angelcare-marketplace/navigation-care-orbit/CareOrbitLink'
import {ArrowRight,BadgeCheck,CalendarDays,Check,CheckCircle2,ChevronDown,ChevronRight,Clock3,HeartHandshake,MapPin,MessageCircle,ShieldCheck,Sparkles,Star,Users2} from 'lucide-react'
import type {PublicExperience360,PublicExperienceTruthReport} from '@/angelcare-marketplace/public-experience-authority/types'
import {LiveCountdown} from '@/angelcare-marketplace/studio-homepage-pro-max/components/LiveCountdown'
import {ServiceBookingConfiguratorClient,type ServicePlanOption} from './StudioServiceBookingActions'
import {atomicLocale,availabilityCopy,copy,formatMoney,humanizeLabel,humanizeValue,isServiceRow,rowNumber,rowText,uniqueMedia} from './atomic-runtime-presentation'
import styles from './studio-service-world-runtime.module.css'

type Row=Record<string,unknown>
type WorldProps=Record<string,unknown>
const obj=(value:unknown):Row=>value&&typeof value==='object'&&!Array.isArray(value)?value as Row:{}
const arr=(value:unknown):unknown[]=>Array.isArray(value)?value:[]
const text=(value:unknown)=>typeof value==='string'?value.trim():value==null?'':String(value)
const finite=(value:unknown)=>Number.isFinite(Number(value))?Number(value):null
const lower=(value:unknown)=>text(value).toLowerCase()
const clean=(value:string)=>value.replaceAll('_',' ').replaceAll('-',' ').replace(/\s+/g,' ').trim()
const proven=(report:PublicExperienceTruthReport,key:string)=>report.decisions.some(row=>row.key===key&&row.state==='PROVEN')
const sourceRows=(value:unknown)=>arr(value).map(obj)
const worldSections=(worldProps:WorldProps)=>arr(worldProps.content).map(obj)
const sectionConfig=(worldProps:WorldProps,id:string)=>worldSections(worldProps).find(row=>text(row.id).toLowerCase()===id.toLowerCase())||{} as Row
const sectionEnabled=(worldProps:WorldProps,id:string)=>{const row=sectionConfig(worldProps,id);return row.hidden!==true&&row.enabled!==false}
const sectionItems=(worldProps:WorldProps,id:string)=>sourceRows(sectionConfig(worldProps,id).items)
const domain=(data:PublicExperience360)=>obj(data.domainExtension)
const service=(data:PublicExperience360)=>obj(domain(data).service)
const fieldRows=(data:PublicExperience360)=>data.content.fields.filter(row=>row.formatted||row.value!==null&&row.value!==undefined)
const hintRows=(data:PublicExperience360,hints:string[],limit=12)=>fieldRows(data).filter(row=>hints.some(h=>lower(row.key).includes(h)||lower(row.label).includes(h))).slice(0,limit)
const fieldValue=(data:PublicExperience360,hints:string[])=>{const row=hintRows(data,hints,1)[0];return row?row.formatted||text(row.value):''}
const pick=(row:Row,keys:string[])=>{for(const key of keys){const v=row[key];if(v!==undefined&&v!==null&&v!=='')return v}return null}
const actionAvailable=(data:PublicExperience360,id:string)=>data.actions.some(row=>row.actionId===id&&row.available)
const relatedHref=(data:PublicExperience360,slug:string)=>`/angelcare-marketplace/${data.classification.locale}/marketplace/item/${encodeURIComponent(slug)}`

const serviceCopy=(locale:string)=>{
 const l=atomicLocale(locale)
 return{
  services:copy(l,{fr:'Services',en:'Services',ar:'الخدمات'}),
  governed:copy(l,{fr:'AngelCare Services · parcours gouverné',en:'AngelCare Services · governed journey',ar:'خدمات AngelCare · مسار محكوم'}),
  canonicalAvailability:copy(l,{fr:'Disponibilité issue de l’autorité canonique',en:'Availability from the canonical authority',ar:'التوفر صادر عن المرجع المعتمد'}),
  service:copy(l,{fr:'ANGELCARE · SERVICE',en:'ANGELCARE · SERVICE',ar:'ANGELCARE · خدمة'}),
  proofs:copy(l,{fr:'preuves vérifiées',en:'verified proofs',ar:'إثباتات موثقة'}),
  daily:copy(l,{fr:'Un accompagnement pensé pour votre quotidien.',en:'Support designed around your daily life.',ar:'دعم مصمم ليناسب حياتك اليومية.'}),
  why:copy(l,{fr:'POURQUOI ANGELCARE',en:'WHY ANGELCARE',ar:'لماذا ANGELCARE'}),
  whyTitle:copy(l,{fr:'Un service clair, fluide et adapté à votre famille.',en:'A clear, seamless service adapted to your family.',ar:'خدمة واضحة وسلسة ومناسبة لعائلتك.'}),
  formulas:copy(l,{fr:'FORMULES',en:'PLANS',ar:'الباقات'}),
  formulasTitle:copy(l,{fr:'Choisissez la formule qui correspond à votre besoin.',en:'Choose the plan that matches your needs.',ar:'اختر الباقة المناسبة لاحتياجك.'}),
  formulasCopy:copy(l,{fr:'Tarifs et caractéristiques proviennent des données canoniques du service.',en:'Pricing and features come from the canonical service data.',ar:'الأسعار والخصائص مأخوذة من بيانات الخدمة المرجعية.'}),
  recommended:copy(l,{fr:'RECOMMANDÉ',en:'RECOMMENDED',ar:'موصى به'}),
  formula:copy(l,{fr:'FORMULE',en:'PLAN',ar:'باقة'}),
  choose:copy(l,{fr:'Choisir cette formule',en:'Choose this plan',ar:'اختر هذه الباقة'}),
  custom:copy(l,{fr:'SOLUTION SUR MESURE',en:'TAILORED SOLUTION',ar:'حل مخصص'}),
  customTitle:copy(l,{fr:'Un besoin plus complexe ?',en:'A more complex need?',ar:'لديك احتياج أكثر تعقيداً؟'}),
  customCopy:copy(l,{fr:'Décrivez votre contexte et poursuivez vers le parcours autorisé.',en:'Describe your context and continue through the authorized journey.',ar:'اشرح سياقك وتابع عبر المسار المعتمد.'}),
  quote:copy(l,{fr:'Demander un devis',en:'Request a quote',ar:'اطلب عرض سعر'}),
  advisor:copy(l,{fr:'Parler à un conseiller',en:'Talk to an advisor',ar:'تحدث مع مستشار'}),
  simple:copy(l,{fr:'SIMPLE ET GUIDÉ',en:'SIMPLE & GUIDED',ar:'بسيط وموجّه'}),
  how:copy(l,{fr:'Comment ça marche ?',en:'How does it work?',ar:'كيف يعمل؟'}),
  providers:copy(l,{fr:'INTERVENANTS',en:'PROVIDERS',ar:'مقدمو الخدمة'}),
  providersTitle:copy(l,{fr:'Des profils publics éligibles pour ce service.',en:'Public profiles eligible for this service.',ar:'ملفات عامة مؤهلة لهذه الخدمة.'}),
  governedProjection:copy(l,{fr:'Projection publique gouvernée',en:'Governed public projection',ar:'عرض عام محكوم'}),
  provider:copy(l,{fr:'Intervenant',en:'Provider',ar:'مقدم خدمة'}),
  eligible:copy(l,{fr:'Profil public éligible',en:'Eligible public profile',ar:'ملف عام مؤهل'}),
  reviews:copy(l,{fr:'AVIS & PREUVES',en:'REVIEWS & PROOF',ar:'الآراء والإثباتات'}),
  reviewsTitle:copy(l,{fr:'Uniquement les retours soutenus par une source disponible.',en:'Only feedback supported by an available source.',ar:'فقط الآراء المدعومة بمصدر متاح.'}),
  approved:copy(l,{fr:'Source approuvée',en:'Approved source',ar:'مصدر معتمد'}),
  related:copy(l,{fr:'DÉCOUVREZ AUSSI',en:'DISCOVER MORE',ar:'اكتشف أيضاً'}),
  relatedTitle:copy(l,{fr:'D’autres services compatibles avec votre besoin.',en:'Other services compatible with your needs.',ar:'خدمات أخرى متوافقة مع احتياجك.'}),
  discover:copy(l,{fr:'Découvrir',en:'Discover',ar:'اكتشف'}),
  activeOffer:copy(l,{fr:'ANGELCARE · OFFRE ACTIVE',en:'ANGELCARE · ACTIVE OFFER',ar:'ANGELCARE · عرض نشط'}),
  verifyEligibility:copy(l,{fr:'Vérifier la disponibilité',en:'Check availability',ar:'تحقق من التوفر'}),
  faq:copy(l,{fr:'QUESTIONS FRÉQUENTES',en:'FREQUENTLY ASKED QUESTIONS',ar:'الأسئلة الشائعة'}),
  faqTitle:copy(l,{fr:'Tout ce qu’il faut savoir avant de réserver.',en:'What to know before booking.',ar:'ما يجب معرفته قبل الحجز.'}),
  faqCopy:copy(l,{fr:'Les réponses éditoriales restent distinctes des faits live de prix et disponibilité.',en:'Editorial answers remain separate from live pricing and availability facts.',ar:'تبقى الإجابات التحريرية منفصلة عن حقائق السعر والتوفر المباشرة.'}),
  question:copy(l,{fr:'Question',en:'Question',ar:'سؤال'}),
  process:[
   copy(l,{fr:'Décrivez votre besoin',en:'Describe your need',ar:'صف احتياجك'}),
   copy(l,{fr:'Choisissez votre contexte',en:'Choose your context',ar:'اختر سياقك'}),
   copy(l,{fr:'Vérifiez la disponibilité',en:'Check availability',ar:'تحقق من التوفر'}),
   copy(l,{fr:'Confirmez votre demande',en:'Confirm your request',ar:'أكد طلبك'}),
   copy(l,{fr:'Suivez votre parcours',en:'Track your journey',ar:'تابع مسارك'}),
  ]
 }
}

function localized(value:unknown,locale:string){const row=obj(value);return text(row[locale]??row.fr??row.en??row.ar??value)}
function labelsFrom(value:unknown,locale:string){
 if(Array.isArray(value))return value.map(v=>{const r=obj(v);return humanizeValue(r.label||r.name||r.title||r.value||v,locale)}).filter(Boolean)
 const row=obj(value);return Object.entries(row).flatMap(([key,v])=>Array.isArray(v)?v.map(x=>humanizeValue(obj(x).label||obj(x).name||x,locale)).filter(Boolean):['string','number','boolean'].includes(typeof v)?[`${humanizeLabel(key,locale)} · ${humanizeValue(v,locale)}`]:[]).slice(0,12)
}
function plans(data:PublicExperience360):ServicePlanOption[]{const locale=data.classification.locale;return sourceRows(service(data).plans).map((row,index)=>{
 const id=text(pick(row,['id','planId','plan_id','key','code']))||`plan-${index+1}`
 const label=localized(pick(row,['label','name','title','plan_name']),locale)||`${serviceCopy(locale).formula} ${index+1}`
 const description=localized(pick(row,['description','body','summary']),locale)
 const price=finite(pick(row,['priceMad','price_mad','price','amount','priceAmount','unitPrice','hourlyRate']))
 const priceLabel=localized(pick(row,['priceLabel','price_label','pricingLabel']),locale)
 const features=arr(pick(row,['features','benefits','includes','items'])).map(v=>localized(obj(v).label||obj(v).name||obj(v).title||v,locale)).filter(Boolean).slice(0,8)
 const pricingMode=text(pick(row,['pricingMode','pricing_mode','billingMode','billing_mode','unit','rateType']))||'flat'
 const unitLabel=localized(pick(row,['unitLabel','unit_label','unitName','unit_name']),locale)||copy(locale,{fr:'Unités',en:'Units',ar:'وحدات'})
 const minUnits=Math.max(1,finite(pick(row,['minUnits','min_units','minimum','minimumUnits']))||1)
 const maxUnits=Math.max(minUnits,finite(pick(row,['maxUnits','max_units','maximum','maximumUnits']))||12)
 const step=Math.max(1,finite(pick(row,['step','increment']))||1)
 const recommended=Boolean(pick(row,['recommended','popular','featured','is_recommended','bestChoice']))
 return{id,label,description,price,priceLabel,features,pricingMode,unitLabel,minUnits,maxUnits,step,recommended}
}).filter(row=>row.label)}
function campaign(data:PublicExperience360,truth:PublicExperienceTruthReport){if(!proven(truth,'promotion'))return null;const commercial=obj(domain(data).commercial),experience=obj(domain(data).experience);const rows=[commercial,experience,service(data)];const first=(keys:string[])=>{for(const r of rows){const v=pick(r,keys);if(v!==null)return localized(v,data.classification.locale)}return''};return{message:first(['promotion_label','campaign_label','promotion_message','offer_label']),discount:first(['discount_label','discount','discount_percentage']),endsAt:first(['ends_at','endsAt','promotion_ends_at','valid_until'])||undefined}}
function bookingModes(data:PublicExperience360){return labelsFrom(service(data).bookingModes||service(data).booking_modes,data.classification.locale).slice(0,6)}
function coverage(data:PublicExperience360){return labelsFrom(service(data).coverage,data.classification.locale).slice(0,8)}
function durationOptions(data:PublicExperience360){const ext=service(data),locale=data.classification.locale;const explicit=labelsFrom(ext.durationOptions||ext.duration_options||ext.durations,locale);if(explicit.length)return explicit.slice(0,8);return labelsFrom(ext.scheduleRules||ext.schedule_rules,locale).filter(v=>/hour|heure|min|session|day|jour|duration|durée|ساعة|يوم/i.test(v)).slice(0,8)}
function requirements(data:PublicExperience360){return labelsFrom(service(data).requirements,data.classification.locale).slice(0,10)}
function processSteps(worldProps:WorldProps,locale:string){const rows=sectionItems(worldProps,'s08-process').map(row=>localized(row.label||row.title,locale)).filter(Boolean);return rows.length?rows.slice(0,6):serviceCopy(locale).process}
function trustLabels(data:PublicExperience360){return [...new Set(data.trust.claims.filter(row=>row.status==='verified'||row.status==='active'||Boolean(row.evidenceReference)).map(row=>row.label).filter(Boolean))].slice(0,5)}
function providerRows(data:PublicExperience360,worldProps:WorldProps){const dynamic=sectionItems(worldProps,'s09-providers');if(dynamic.length)return dynamic.slice(0,8);return sourceRows(service(data).providers).slice(0,8)}
function testimonialRows(data:PublicExperience360){const ext=domain(data);return [...sourceRows(service(data).testimonials),...sourceRows(ext.testimonials),...sourceRows(obj(ext.reviews).items)].slice(0,6)}
function relatedRows(data:PublicExperience360,worldProps:WorldProps):Row[]{const dynamic=sectionItems(worldProps,'s11-related').filter(isServiceRow);if(dynamic.length)return dynamic.slice(0,8);const recommended=data.recommendations.filter(row=>isServiceRow({kind:row.kind})).map(row=>({id:row.id,slug:row.slug,title:row.name,mediaUrl:row.mediaUrl,priceMad:row.priceAmount,currency:row.currency,availability:row.availability,kind:row.kind}));if(recommended.length)return recommended.slice(0,8);return data.relations.filter(row=>['recommendation','cross_sell','related','alternative'].includes(row.kind)&&row.slug&&isServiceRow(obj(row.metadata))).slice(0,8).map(row=>({id:row.entityId,slug:row.slug,title:row.label,...obj(row.metadata)}))}
function faqRows(data:PublicExperience360,worldProps:WorldProps){const configured=sectionItems(worldProps,'s13-faq');if(configured.length)return configured.slice(0,8);const serviceFaq=sourceRows(service(data).faq);return serviceFaq.slice(0,8)}
function benefitRows(data:PublicExperience360){const locale=data.classification.locale;const rows=hintRows(data,['benefit','avantage','trust','safety','flex','support','coverage','qualif'],6);if(rows.length)return rows.map(row=>({label:humanizeLabel(row.key,locale,row.label),value:humanizeValue(row.formatted||row.value,locale)})).filter(row=>row.value);return trustLabels(data).map(label=>({label,value:''})).slice(0,5)}

function UrgencyBar({data,truth}:{data:PublicExperience360;truth:PublicExperienceTruthReport}){const c=campaign(data,truth),ui=serviceCopy(data.classification.locale);return <section className={styles.urgencyBar} data-ac-service-world-section="S00"><div><Sparkles/><strong>{c?.message||ui.governed}</strong>{c?.discount?<span>{c.discount}</span>:null}</div>{c?.endsAt?<LiveCountdown endsAt={c.endsAt}/>:<span className={styles.safeSignal}>{ui.canonicalAvailability}</span>}</section>}
function Breadcrumb({data}:{data:PublicExperience360}){const locale=data.classification.locale,ui=serviceCopy(locale),category=clean(data.classification.businessFamilyKey||data.classification.categoryKey||ui.services);return <nav className={styles.breadcrumb} data-ac-service-world-section="S03"><Link href={`/angelcare-marketplace/${locale}/home-services`}>{ui.services}</Link><ChevronRight/><span>{category}</span><ChevronRight/><strong>{data.identity.name}</strong></nav>}
function HeroIdentity({data,truth}:{data:PublicExperience360;truth:PublicExperienceTruthReport}){const ui=serviceCopy(data.classification.locale),rating=proven(truth,'rating')?data.reviews.rating:null,cover=coverage(data),badge=fieldValue(data,['badge','popular','featured']);return <section className={styles.identityPanel}><span className={styles.eyebrow}>{ui.service}</span>{badge?<b className={styles.badge}>{humanizeValue(badge,data.classification.locale)}</b>:null}<h1>{data.identity.name}</h1>{data.identity.shortDescription?<p className={styles.lead}>{data.identity.shortDescription}</p>:null}<div className={styles.proofRow}>{rating!==null?<span><Star/> {rating.toFixed(1)} · {data.reviews.count||0}</span>:null}{cover[0]?<span><MapPin/> {cover[0]}</span>:null}{data.trust.provenCount>0?<span><ShieldCheck/> {data.trust.provenCount} {ui.proofs}</span>:null}</div><div className={styles.benefitMini}>{benefitRows(data).slice(0,4).map(row=><div key={`${row.label}:${row.value}`}><CheckCircle2/><span><strong>{row.label}</strong>{row.value?<small>{row.value}</small>:null}</span></div>)}</div></section>}
function HeroMedia({data}:{data:PublicExperience360}){const ui=serviceCopy(data.classification.locale),media=uniqueMedia(data.media).slice(0,4),primary=media[0];return <section className={styles.heroMedia}>{primary?<img src={primary.url} alt={primary.alt||data.identity.name}/>:<div className={styles.mediaFallback}><HeartHandshake/><span>AngelCare</span></div>}{media.length>1?<div className={styles.mediaChips}>{media.slice(1,4).map((item,index)=><img key={item.id||index} src={item.url} alt={item.alt||''} loading="lazy"/>)}</div>:null}<div className={styles.mediaOverlay}><span>{ui.daily}</span></div></section>}
function BookingPanel({data}:{data:PublicExperience360}){const ps=plans(data),modes=bookingModes(data),locations=coverage(data),durations=durationOptions(data),availability=availabilityCopy(data.availability.status,data.classification.locale);return <ServiceBookingConfiguratorClient locale={data.classification.locale} slug={data.identity.slug} currency={data.pricing.currency} basePrice={data.pricing.amount} pricingLabel={data.pricing.label} plans={ps} bookingModes={modes} locations={locations} durationOptions={durations} availabilityStatus={data.availability.status} availabilityLabel={data.availability.reason||availability.label} bookingEnabled={actionAvailable(data,'booking.start')} quoteEnabled={actionAvailable(data,'quotation.start')}/>}
function TrustStrip({data}:{data:PublicExperience360}){const rows=trustLabels(data),icons=[BadgeCheck,ShieldCheck,Clock3,HeartHandshake];if(!rows.length)return null;return <section className={styles.trustStrip} data-ac-service-world-section="S05">{rows.map((label,index)=>{const Icon=icons[index%icons.length];return <div key={label}><Icon/><span>{label}</span></div>})}</section>}
function WhyAngelCare({data}:{data:PublicExperience360}){const ui=serviceCopy(data.classification.locale),rows=benefitRows(data),media=uniqueMedia(data.media),image=media[1]?.url||null;if(!rows.length&&!image)return null;return <section className={styles.whyGrid} data-ac-service-world-section="S06"><div className={styles.benefitsPanel}><span className={styles.sectionEyebrow}>{ui.why}</span><h2>{ui.whyTitle}</h2><div className={styles.benefitGrid}>{rows.slice(0,6).map((row,index)=><article key={`${row.label}:${index}`}><span className={styles.iconHalo}>{index%2===0?<ShieldCheck/>:<Clock3/>}</span><div><strong>{row.label}</strong>{row.value?<p>{row.value}</p>:null}</div></article>)}</div></div>{image?<aside className={styles.editorialCard}><img src={image} alt="" loading="lazy"/></aside>:null}</section>}
function PlanComparison({data}:{data:PublicExperience360}){const ui=serviceCopy(data.classification.locale),ps=plans(data),locale=data.classification.locale,canBook=actionAvailable(data,'booking.start'),canQuote=actionAvailable(data,'quotation.start');if(!ps.length&&!canQuote)return null;return <section className={styles.planSection} data-ac-service-world-section="S07"><header><span className={styles.sectionEyebrow}>{ui.formulas}</span><h2>{ui.formulasTitle}</h2><p>{ui.formulasCopy}</p></header><div className={styles.planLayout}><div className={styles.planGrid}>{ps.slice(0,4).map((plan,index)=><article key={plan.id} data-recommended={plan.recommended}><div className={styles.planTop}>{plan.recommended?<span>{ui.recommended}</span>:<span>{ui.formula} {index+1}</span>}<h3>{plan.label}</h3><strong>{formatMoney(plan.price,data.pricing.currency,plan.priceLabel||data.pricing.label,locale)}</strong>{plan.description?<p>{plan.description}</p>:null}</div>{plan.features.length?<ul>{plan.features.map(feature=><li key={feature}><Check/> {feature}</li>)}</ul>:null}{canBook?<Link href={`/angelcare-marketplace/${locale}/booking/${encodeURIComponent(data.identity.slug)}?plan=${encodeURIComponent(plan.id)}`}>{ui.choose} <ArrowRight/></Link>:null}</article>)}</div>{canQuote||requirements(data).length?<aside className={styles.customSolution}><Sparkles/><span>{ui.custom}</span><h3>{ui.customTitle}</h3><p>{ui.customCopy}</p><div>{requirements(data).slice(0,4).map(row=><span key={row}><CheckCircle2/> {row}</span>)}</div>{canQuote?<Link href={`/angelcare-marketplace/${locale}/quotation/${encodeURIComponent(data.identity.slug)}`}>{ui.quote} <ArrowRight/></Link>:<Link href={`/angelcare-marketplace/${locale}/account/support`}>{ui.advisor} <ArrowRight/></Link>}</aside>:null}</div></section>}
function Process({worldProps,locale}:{worldProps:WorldProps;locale:string}){const ui=serviceCopy(locale),icons=[MessageCircle,MapPin,CalendarDays,BadgeCheck,CheckCircle2],steps=processSteps(worldProps,locale);return <section className={styles.processSection} data-ac-service-world-section="S08"><header><span className={styles.sectionEyebrow}>{ui.simple}</span><h2>{ui.how}</h2></header><div className={styles.processRail}>{steps.map((step,index)=>{const Icon=icons[index%icons.length];return <article key={step}><span className={styles.stepNumber}>{String(index+1).padStart(2,'0')}</span><span className={styles.processIcon}><Icon/></span><strong>{step}</strong>{index<steps.length-1?<ArrowRight className={styles.stepArrow}/>:null}</article>})}</div></section>}
function Providers({data,worldProps}:{data:PublicExperience360;worldProps:WorldProps}){const ui=serviceCopy(data.classification.locale),rows=providerRows(data,worldProps);if(!rows.length)return null;return <section className={styles.providersSection} data-ac-service-world-section="S09"><header><div><span className={styles.sectionEyebrow}>{ui.providers}</span><h2>{ui.providersTitle}</h2></div><span className={styles.canonicalBadge}><ShieldCheck/> {ui.governedProjection}</span></header><div className={styles.providerRail}>{rows.map((row,index)=>{const name=rowText(row,['title','name','label','displayName'])||`${ui.provider} ${index+1}`,media=rowText(row,['mediaUrl','avatarUrl','imageUrl','photoUrl']),body=rowText(row,['body','description','specialties','summary']),rating=rowNumber(row,['rating','averageRating']);return <article key={text(row.id||row.entityId||name)}>{media?<img src={media} alt={name} loading="lazy"/>:<div className={styles.providerFallback}><Users2/></div>}<div><strong>{name}</strong>{rating!==null?<span className={styles.rating}><Star/> {rating.toFixed(1)}</span>:null}{body?<p>{body}</p>:null}<span className={styles.providerStatus}><BadgeCheck/> {ui.eligible}</span></div></article>})}</div></section>}
function Reviews({data,truth}:{data:PublicExperience360;truth:PublicExperienceTruthReport}){const ui=serviceCopy(data.classification.locale),rating=proven(truth,'rating')?data.reviews.rating:null,rows=testimonialRows(data);if(rating===null&&!rows.length)return null;return <section className={styles.reviewsSection} data-ac-service-world-section="S10"><div className={styles.reviewSummary}><span className={styles.sectionEyebrow}>{ui.reviews}</span><h2>{ui.reviewsTitle}</h2>{rating!==null?<div className={styles.bigRating}><Star/><strong>{rating.toFixed(1)}</strong><span>{data.reviews.count||0}</span></div>:null}</div>{rows.length?<div className={styles.testimonialRail}>{rows.map((row,index)=>{const quote=rowText(row,['body','quote','text','review','comment']),name=rowText(row,['title','name','author','displayName']);return <article key={`${name}:${index}`}>{quote?<p>“{quote}”</p>:null}{name?<strong>{name}</strong>:null}<small>{ui.approved}</small></article>})}</div>:null}</section>}
function RelatedServices({data,worldProps}:{data:PublicExperience360;worldProps:WorldProps}){const ui=serviceCopy(data.classification.locale),rows=relatedRows(data,worldProps);if(!rows.length)return null;return <section className={styles.relatedSection} data-ac-service-world-section="S11"><header><span className={styles.sectionEyebrow}>{ui.related}</span><h2>{ui.relatedTitle}</h2></header><div className={styles.relatedRail}>{rows.map((row,index)=>{const slug=rowText(row,['slug']),title=rowText(row,['title','name','label'])||`${ui.services} ${index+1}`,media=rowText(row,['mediaUrl','imageUrl']),price=rowNumber(row,['priceMad','priceAmount']);return <article key={text(row.id||row.entityId||slug||index)}>{slug?<Link href={relatedHref(data,slug)}>{media?<img src={media} alt={title} loading="lazy"/>:<div className={styles.relatedFallback}><HeartHandshake/></div>}<strong>{title}</strong>{price!==null?<span>{formatMoney(price,row.currency||row.currencyLabel||'MAD','',data.classification.locale)}</span>:null}<small>{ui.discover} <ArrowRight/></small></Link>:null}</article>})}</div></section>}
function SecondaryCampaign({data,truth}:{data:PublicExperience360;truth:PublicExperienceTruthReport}){const ui=serviceCopy(data.classification.locale),c=campaign(data,truth),canBook=actionAvailable(data,'booking.start'),canQuote=actionAvailable(data,'quotation.start');if(!c||(!canBook&&!canQuote))return null;const href=canBook?`/angelcare-marketplace/${data.classification.locale}/booking/${encodeURIComponent(data.identity.slug)}`:`/angelcare-marketplace/${data.classification.locale}/quotation/${encodeURIComponent(data.identity.slug)}`;return <section className={styles.secondaryCampaign} data-ac-service-world-section="S12"><div><Sparkles/><span>{ui.activeOffer}</span><h2>{c.message}</h2>{c.discount?<strong>{c.discount}</strong>:null}</div>{c.endsAt?<LiveCountdown endsAt={c.endsAt}/>:null}<Link href={href}>{canBook?ui.verifyEligibility:ui.quote} <ArrowRight/></Link></section>}
function FAQ({data,worldProps}:{data:PublicExperience360;worldProps:WorldProps}){const ui=serviceCopy(data.classification.locale),rows=faqRows(data,worldProps);if(!rows.length)return null;return <section className={styles.faqSection} data-ac-service-world-section="S13"><div className={styles.faqIntro}><span className={styles.sectionEyebrow}>{ui.faq}</span><h2>{ui.faqTitle}</h2><p>{ui.faqCopy}</p></div><div className={styles.faqList}>{rows.map((row,index)=>{const q=localized(pick(row,['title','question','label','name']),data.classification.locale)||`${ui.question} ${index+1}`,a=localized(pick(row,['body','answer','description','value']),data.classification.locale);return <details key={`${q}:${index}`}><summary>{q}<ChevronDown/></summary>{a?<p>{a}</p>:null}</details>})}</div></section>}

export async function StudioServiceWorldRuntime({data,truthReport,worldProps}:{data:PublicExperience360;truthReport:PublicExperienceTruthReport;worldProps:WorldProps}){
 if(data.classification.masterDomain!=='b2c_service_family')return null
 const worldKey=text(worldProps.worldKey)||'ac.service.booking.immersive.2030.v2'
 return <main className={styles.root} dir={data.classification.locale==='ar'?'rtl':'ltr'} data-ac-public-experience="studio-service-semantic-runtime-v2" data-ac-service-world-key={worldKey} data-ac-service-doctrine={data.classification.doctrineKey}>
  {sectionEnabled(worldProps,'s00-campaign')?<UrgencyBar data={data} truth={truthReport}/>:null}
  <div className={styles.shell}>
   {sectionEnabled(worldProps,'s03-breadcrumb')?<Breadcrumb data={data}/>:null}
   <section className={styles.heroGrid} data-ac-service-world-section="S04">
    {sectionEnabled(worldProps,'s04-identity')?<HeroIdentity data={data} truth={truthReport}/>:null}
    {sectionEnabled(worldProps,'s04-media')?<HeroMedia data={data}/>:null}
    {sectionEnabled(worldProps,'s04-booking')?<BookingPanel data={data}/>:null}
   </section>
   {sectionEnabled(worldProps,'s05-trust')?<TrustStrip data={data}/>:null}
   {sectionEnabled(worldProps,'s06-why')?<WhyAngelCare data={data}/>:null}
   {sectionEnabled(worldProps,'s07-plans')?<PlanComparison data={data}/>:null}
   {sectionEnabled(worldProps,'s08-process')?<Process worldProps={worldProps} locale={data.classification.locale}/>:null}
   {sectionEnabled(worldProps,'s09-providers')?<Providers data={data} worldProps={worldProps}/>:null}
   {sectionEnabled(worldProps,'s10-reviews')?<Reviews data={data} truth={truthReport}/>:null}
   {sectionEnabled(worldProps,'s11-related')?<RelatedServices data={data} worldProps={worldProps}/>:null}
   {sectionEnabled(worldProps,'s12-campaign')?<SecondaryCampaign data={data} truth={truthReport}/>:null}
   {sectionEnabled(worldProps,'s13-faq')?<FAQ data={data} worldProps={worldProps}/>:null}
  </div>
 </main>
}
