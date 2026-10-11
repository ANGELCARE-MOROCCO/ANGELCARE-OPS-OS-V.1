import {nativeDetailText as tr} from './native-detail-copy'
import Link from '@/angelcare-marketplace/navigation-care-orbit/CareOrbitLink'
import {ArrowRight,CalendarDays,CheckCircle2,ChevronRight,Clock3,GraduationCap,Heart,Layers3,MapPin,PackageCheck,ShieldCheck,ShoppingBag,Sparkles,Star,Users2} from 'lucide-react'
import type {PublicExperience360,PublicExperienceTruthReport} from '../types'
import {canonicalDetailWorld} from '../canonical-worlds'
import styles from './canonical-atomic-detail-world.module.css'
import {NativeDetailGallery} from './NativeDetailGallery'
import {display,present,rows} from '../../atomic-offer-experience/model'

const money=(data:PublicExperience360,amount:number|null,currency:string,label:string)=>amount===null?(label||tr(data,'À confirmer')):`${new Intl.NumberFormat(data.classification.locale,{maximumFractionDigits:2}).format(amount)} ${currency||'Dhs'}`
const o=(v:unknown):Record<string,unknown>=>v&&typeof v==='object'&&!Array.isArray(v)?v as Record<string,unknown>:{ }
const a=(v:unknown):unknown[]=>Array.isArray(v)?v:[]
const s=(v:unknown)=>typeof v==='string'?v:v==null?'':String(v)
const label=(v:unknown)=>{const row=o(v);return s(row.label||row.title||row.name||row.key||row.value)}
const value=(v:unknown)=>{const row=o(v);return s(row.formatted||row.value||row.body||row.description||row.label||v)}

function actionHref(actionId:string,data:PublicExperience360){const locale=data.classification.locale,slug=encodeURIComponent(data.identity.slug),id=encodeURIComponent(data.identity.id)
 if(actionId==='basket.add'||actionId==='checkout.start')return`/angelcare-marketplace/${locale}/basket?item=${slug}`
 if(actionId==='booking.start')return`/angelcare-marketplace/${locale}/booking/${slug}`
 if(actionId==='quotation.start')return`/angelcare-marketplace/${locale}/quotation/${slug}`
 if(actionId==='academy.enroll')return`/angelcare-marketplace/${locale}/enrollment/${slug}`
 if(actionId==='subscription.start')return`/angelcare-marketplace/${locale}/subscription/${slug}`
 if(actionId==='family_request.start')return`/angelcare-marketplace/${locale}/family/request?item=${id}`
 if(actionId==='b2b.request')return`/angelcare-marketplace/${locale}/corporates/request?program=${id}`
 return`/angelcare-marketplace/${locale}/marketplace/item/${slug}`
}
function truth(report:PublicExperienceTruthReport,key:string){return report.decisions.find(row=>row.key===key)?.state==='PROVEN'}
function primaryAction(data:PublicExperience360){const ids=data.actions.filter(row=>row.available).map(row=>row.actionId);for(const id of ['booking.start','academy.enroll','quotation.start','b2b.request','basket.add','subscription.start','family_request.start'])if(ids.includes(id))return id;return ids[0]||null}
function secondaryAction(data:PublicExperience360,primary:string|null){return data.actions.find(row=>row.available&&row.actionId!==primary)?.actionId||null}

function MediaStage({data}:{data:PublicExperience360}){return <NativeDetailGallery media={data.media} name={data.identity.name} locale={data.classification.locale==='ar'?'ar':data.classification.locale==='en'?'en':'fr'}/>}
function TrustRail({data}:{data:PublicExperience360}){const claims=data.trust.claims.filter(row=>['verified','proven','PROVEN'].includes(row.status)&&Boolean(row.evidenceReference)).slice(0,5);if(!claims.length)return null;return <section className={styles.trustRail}>{claims.map(row=><div key={row.key}><ShieldCheck/><span>{row.label}</span></div>)}</section>}
function FieldGrid({data,title,filter}:{data:PublicExperience360;title:string;filter?:(key:string)=>boolean}){const rows=data.content.fields.filter(row=>row.formatted&&(!filter||filter(row.key)));if(!rows.length)return null;return <section className={styles.section}><header><span>{tr(data,"ANGELCARE · DÉTAILS")}</span><h2>{title}</h2></header><div className={styles.factGrid}>{rows.map(row=><article key={row.key}><small>{row.label}</small><strong>{row.formatted}</strong></article>)}</div></section>}
function RelationRail({data,title,kinds}:{data:PublicExperience360;title:string;kinds:string[]}){const rows=data.relations.filter(row=>kinds.includes(row.kind)&&row.slug).slice(0,10);if(!rows.length)return null;return <section className={styles.section}><header><span>{tr(data,"DÉCOUVERTE LIÉE")}</span><h2>{title}</h2></header><div className={styles.relationGrid}>{rows.map(row=><Link href={`/angelcare-marketplace/${data.classification.locale}/marketplace/item/${row.slug}`} key={`${row.kind}:${row.entityId||row.slug}`}><div><span>{row.kind.replaceAll('_',' ')}</span><strong>{row.label}</strong></div><ChevronRight/></Link>)}</div></section>}
function ReviewPanel({data,report}:{data:PublicExperience360;report:PublicExperienceTruthReport}){if(!truth(report,'rating')||data.reviews.rating===null||!data.reviews.count)return null;return <section className={styles.reviewPanel}><div><Star/><strong>{data.reviews.rating.toFixed(1)}</strong><span>{data.reviews.count} {tr(data,'avis vérifiables')}</span></div><p>{tr(data,"Découvrez les retours partagés sur cette offre.")}</p></section>}
function ExtensionList({data,title,value:raw}:{data:PublicExperience360;title:string;value:unknown}){const entries=rows(raw,data.classification.locale==='ar'?'ar':data.classification.locale==='en'?'en':'fr');if(!entries.length)return null;return <section className={styles.section}><header><span>{tr(data,"EXPLOREZ LES POSSIBILITÉS")}</span><h2>{title}</h2></header><div className={styles.extensionList}>{entries.map(row=><div key={row.key}><CheckCircle2/><div>{row.title?<strong>{row.title}</strong>:null}<span>{row.body}</span></div></div>)}</div></section>}

function DomainModules({data}:{data:PublicExperience360}){const ext=o(data.domainExtension)
 if(data.classification.masterDomain==='b2c_product_digital'){const product=o(ext.product);return <><ExtensionList data={data} title={tr(data,"Spécifications et usages")} value={product.specifications}/><ExtensionList data={data} title={tr(data,"Livraison & accès")} value={Object.entries(o(product.delivery)).map(([key,v])=>({label:key,value:v}))}/><RelationRail data={data} title={tr(data,"À associer à cette offre")} kinds={['cross_sell','bundle','upsell']}/><RelationRail data={data} title={tr(data,"Alternatives & recommandations")} kinds={['alternative','recommendation']}/></>}
 if(data.classification.masterDomain==='b2c_service_family'){const service=o(ext.service);return <><ExtensionList data={data} title={tr(data,"Formules et options")} value={service.plans}/><ExtensionList data={data} title={tr(data,"Disponibilités & calendrier")} value={service.scheduleRules}/><ExtensionList data={data} title={tr(data,"Conditions de réservation")} value={service.requirements}/><RelationRail data={data} title={tr(data,"Services complémentaires")} kinds={['recommendation','cross_sell']}/></>}
 if(data.classification.masterDomain==='academy_admission'){const academy=o(ext.academy);return <><ExtensionList data={data} title={tr(data,"Programme & résultats d’apprentissage")} value={academy.curriculum}/><ExtensionList data={data} title={tr(data,"Modules")} value={academy.modules}/><ExtensionList data={data} title={tr(data,"Cohorte & prochaine session")} value={academy.nextCohort}/><ExtensionList data={data} title={tr(data,"Équipe pédagogique")} value={academy.trainers}/><RelationRail data={data} title={tr(data,"Continuer votre parcours")} kinds={['recommendation','upsell']}/></>}
 const b2b=o(ext.b2b);return <><ExtensionList data={data} title={tr(data,"Fit organisationnel")} value={b2b.organisationFit}/><ExtensionList data={data} title={tr(data,"Diagnostic")} value={b2b.diagnostic}/><ExtensionList data={data} title={tr(data,"Modèle de déploiement")} value={b2b.deploymentModel}/><RelationRail data={data} title={tr(data,"Solutions associées")} kinds={['recommendation','cross_sell','upsell']}/></>
}

export async function CanonicalAtomicDetailWorld({data,truthReport,authority}:{data:PublicExperience360;truthReport:PublicExperienceTruthReport;authority:string}){
 const recipe=canonicalDetailWorld(data.classification.masterDomain);if(!recipe)return null
 const primary=primaryAction(data),secondary=secondaryAction(data,primary),price=money(data,data.pricing.amount,data.pricing.currency,data.pricing.label),available=data.availability.status&&!['unavailable','out_of_stock','closed','paused'].includes(data.availability.status.toLowerCase())
 const actionLabel=tr(data,primary==='basket.add'?'Ajouter au panier':primary==='booking.start'?'Réserver maintenant':primary==='academy.enroll'?"S’inscrire":primary==='quotation.start'||primary==='b2b.request'?'Demander un devis':primary==='subscription.start'?'Choisir ce plan':'Continuer')
 return <main className={styles.root} data-domain={data.classification.masterDomain||'unknown'} data-ac-public-experience="atomic-canonical" data-ac-authority={authority} lang={data.classification.locale} dir={data.classification.locale==='ar'?'rtl':'ltr'}>
  <div className={styles.topSignal}><span><Sparkles/> {recipe.eyebrow}</span><Link href={`/angelcare-marketplace/${data.classification.locale}/marketplace`}>← Marketplace</Link></div>
  <section className={styles.decisionFold}>
   <MediaStage data={data}/>
   <div className={styles.identity}><span className={styles.eyebrow}>{tr(data,recipe.promise)}</span><h1>{data.identity.name}</h1>{data.identity.shortDescription?<p>{data.identity.shortDescription}</p>:null}<div className={styles.microProof}>{data.availability.authority?<span><ShieldCheck/> {tr(data,'Modalités à découvrir')}</span>:null}{data.reviews.rating!==null&&truth(truthReport,'rating')?<span><Star/> {data.reviews.rating.toFixed(1)} · {data.reviews.count||0}</span>:null}</div><div className={styles.tagRow}>{data.variants.count?<span>{data.variants.count} {tr(data,'variantes')}</span>:null}</div></div>
   <aside className={styles.decisionCard}><span>{tr(data,"VOTRE PROCHAINE ÉTAPE")}</span><strong className={styles.price}>{price}</strong><div className={styles.availability} data-ready={available}>{available?<CheckCircle2/>:<Clock3/>}<div><strong>{tr(data,available?'Disponible / éligible':'Disponibilité à confirmer')}</strong></div></div>{primary?<Link className={styles.primaryCta} data-ac-action={primary} href={actionHref(primary,data)}>{actionLabel}<ArrowRight/></Link>:null}{secondary?<Link className={styles.secondaryCta} data-ac-action={secondary} href={actionHref(secondary,data)}>{tr(data,"Autre option")}<ChevronRight/></Link>:null}<div className={styles.safeNotes}><span><ShieldCheck/> {tr(data,'Prix et modalités vérifiés avant confirmation')}</span></div></aside>
  </section>
  <TrustRail data={data}/>
  <section className={styles.section}><header><span>{tr(data,"POUR DÉCIDER")}</span><h2>{data.content.schemaName}</h2><p>{data.content.schemaDescription||data.identity.description}</p></header><div className={styles.metrics}>{data.availability.startsAt&&Number.isFinite(Date.parse(data.availability.startsAt))?<div><CalendarDays/><strong>{new Date(data.availability.startsAt).toLocaleDateString(data.classification.locale)}</strong><span>{tr(data,"début")}</span></div>:null}{data.availability.availableQuantity!==null&&truth(truthReport,'scarcity')?<div><Users2/><strong>{data.availability.availableQuantity}</strong><span>{tr(data,"capacité disponible")}</span></div>:null}{data.media.length?<div><Sparkles/><strong>{data.media.length}</strong><span>{tr(data,"médias officiels")}</span></div>:null}{data.trust.provenCount?<div><ShieldCheck/><strong>{data.trust.provenCount}</strong><span>{tr(data,"preuves")}</span></div>:null}</div></section>
  <DomainModules data={data}/>
  <FieldGrid data={data} title={tr(data,"Tout ce qui est inclus dans ce dossier")}/>
  <ReviewPanel data={data} report={truthReport}/>
  <section className={styles.finalBand}><div><span>{tr(data,"ANGELCARE · À VOUS DE CHOISIR")}</span><h2>{tr(data,"Et si votre prochaine expérience commençait ici ?")}</h2></div>{primary?<Link className={styles.primaryCta} data-ac-action={primary} href={actionHref(primary,data)}>{actionLabel}<ArrowRight/></Link>:null}</section>
  {primary?<div className={styles.mobileBar}><div><span>{price}</span><small>{tr(data,available?'Disponible':'À confirmer')}</small></div><Link data-ac-action={primary} href={actionHref(primary,data)}>{actionLabel}</Link></div>:null}
 </main>
}
