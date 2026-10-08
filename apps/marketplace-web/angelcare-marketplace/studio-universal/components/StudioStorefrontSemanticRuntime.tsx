import Link from 'next/link'
import {ArrowRight,CalendarDays,CheckCircle2,ChevronRight,Clock3,Filter,MapPin,Search,ShieldCheck,Sparkles} from 'lucide-react'
import type {StorefrontExperience,DiscoveryItem} from '@/angelcare-marketplace/catalog-discovery/types'
import {CatalogCard} from '@/angelcare-marketplace/catalog-discovery/components/CatalogCard'
import {StudioActionLink} from '@/angelcare-marketplace/studio-action-registry/components/StudioActionLink'
import type {WorldFactorySemanticRole} from '@/angelcare-marketplace/public-experience-authority/world-factory/types'
import styles from './studio-storefront-semantic-runtime.module.css'

type Row=Record<string,unknown>
type Props=Record<string,unknown>
const row=(value:unknown):Row=>value&&typeof value==='object'&&!Array.isArray(value)?value as Row:{}
const rows=(value:unknown):Row[]=>Array.isArray(value)?value.filter(item=>item&&typeof item==='object'&&!Array.isArray(item)) as Row[]:[]
const text=(value:unknown,fallback='')=>typeof value==='string'?value.trim():value==null?fallback:String(value)
const bool=(value:unknown,fallback=false)=>typeof value==='boolean'?value:fallback
const number=(value:unknown)=>Number.isFinite(Number(value))?Number(value):null
const uniq=<T,>(values:T[])=>[...new Set(values)]
const ui=(locale:StorefrontExperience['locale'])=>locale==='ar'?{discover:'استكشف',continue:'متابعة',learnMore:'معرفة المزيد',truth:'حقائق موثوقة',offers:'عروض',item:'عنصر',step:'خطوة',governedProof:'إشارة عامة من سلطة الثقة المعتمدة.'}:locale==='en'?{discover:'Explore',continue:'Continue',learnMore:'Learn more',truth:'Governed truth',offers:'offers',item:'Item',step:'Step',governedProof:'Public signal from the governed trust authority.'}:{discover:'Explorer',continue:'Continuer',learnMore:'En savoir plus',truth:'Vérité gouvernée',offers:'offres',item:'Élément',step:'Étape',governedProof:'Signal public issu de l’autorité de confiance.'}

const DEFAULT_COPY:Record<string,{eyebrow:string;title:string;lead:string}>={
 storefront_categories:{eyebrow:'DISCOVERY',title:'Explorez par univers',lead:'Accédez directement aux familles d’offres pertinentes.'},
 storefront_inventory:{eyebrow:'LIVE CATALOG',title:'Toutes les offres',lead:'Inventaire public gouverné par les autorités Marketplace.'},
 storefront_collection:{eyebrow:'CURATED',title:'Sélection AngelCare',lead:'Une sélection éditoriale et commerciale gouvernée.'},
 storefront_facets:{eyebrow:'FILTERS',title:'Affinez votre choix',lead:'Filtrez sans perdre le contexte du storefront.'},
 storefront_campaigns:{eyebrow:'CAMPAIGNS',title:'En ce moment',lead:'Campagnes actives et éligibles uniquement.'},
 storefront_availability:{eyebrow:'AVAILABILITY',title:'Disponible maintenant',lead:'Disponibilité issue des autorités canoniques.'},
 storefront_process:{eyebrow:'HOW IT WORKS',title:'Comment ça fonctionne',lead:'Un parcours clair, étape par étape.'},
 storefront_pathways:{eyebrow:'PATHWAYS',title:'Choisissez votre parcours',lead:'Des trajectoires organisées selon votre objectif.'},
 storefront_sessions:{eyebrow:'SESSIONS',title:'Sessions et prochaines disponibilités',lead:'Cohortes et sessions publiées.'},
 storefront_segments:{eyebrow:'SEGMENTS',title:'Pour chaque organisation',lead:'Des solutions adaptées à votre contexte.'},
 storefront_diagnostic:{eyebrow:'DIAGNOSTIC',title:'Identifiez la bonne solution',lead:'Qualifiez votre besoin avant de choisir.'},
 storefront_seasonal:{eyebrow:'SEASONAL',title:'Temps forts et programmes saisonniers',lead:'Sélections actives adaptées à la période.'},
 storefront_use_cases:{eyebrow:'USE CASES',title:'Pensé pour vos usages',lead:'Explorez par situation réelle.'},
 storefront_boundary:{eyebrow:'SCOPE & SAFETY',title:'Un périmètre clair',lead:'Ce que le service couvre — et ce qu’il ne remplace pas.'},
 storefront_referral:{eyebrow:'ORIENTATION',title:'Orientation et relais',lead:'Le bon relais lorsque le besoin sort du périmètre.'},
 storefront_benefits:{eyebrow:'BENEFITS',title:'Bénéfices concrets',lead:'Une proposition structurée autour des besoins réels.'},
 storefront_impact:{eyebrow:'IMPACT',title:'Résultats et impact',lead:'Preuves et indicateurs uniquement lorsqu’ils sont gouvernés.'},
 storefront_plans:{eyebrow:'PLANS',title:'Plans et formules',lead:'Comparez les plans disponibles.'},
 storefront_capabilities:{eyebrow:'CAPABILITIES',title:'Modules et capacités',lead:'Comprenez exactement ce qui est inclus.'},
 storefront_framework:{eyebrow:'FRAMEWORK',title:'Référentiel et standards',lead:'Une lecture structurée du cadre d’évaluation.'},
 storefront_assessment:{eyebrow:'ASSESSMENT',title:'Évaluations disponibles',lead:'Choisissez le périmètre adapté.'},
 storefront_qualifications:{eyebrow:'QUALIFICATIONS',title:'Qualifications vérifiables',lead:'Compétences et credentials publics uniquement.'},
 storefront_professional_availability:{eyebrow:'AVAILABILITY',title:'Professionnels disponibles',lead:'Disponibilités publiques et éligibles.'},
 storefront_comparison:{eyebrow:'COMPARE',title:'Comparez avant de décider',lead:'Mettez les différences utiles en évidence.'},
 storefront_editorial:{eyebrow:'GUIDES',title:'Comprendre avant de choisir',lead:'Guides et contenus éditoriaux liés à cet univers.'},
 storefront_proof:{eyebrow:'PROOF',title:'Preuves et références',lead:'Signaux gouvernés issus des autorités de confiance.'},
 storefront_trust:{eyebrow:'TRUST',title:'Pourquoi AngelCare',lead:'Des signaux de confiance vérifiables.'},
 storefront_final_conversion:{eyebrow:'NEXT STEP',title:'Passez à l’étape suivante',lead:'Continuez avec le parcours canonique adapté.'},
}

function roleOf(props:Props):WorldFactorySemanticRole{
 const wf=row(props.__worldFactory)
 return text(wf.role,'unknown') as WorldFactorySemanticRole
}
function copyFor(role:WorldFactorySemanticRole,props:Props){const d=DEFAULT_COPY[role]||{eyebrow:'ANGELCARE',title:'',lead:''};return{eyebrow:text(props.eyebrow,d.eyebrow),title:text(props.title,d.title),lead:text(props.lead,d.lead)}}
function sourceId(item:Row){return text(row(item.__studioSourceReference).sourceId||item.sourceId)}
function entityId(item:Row){return text(row(item.__studioSourceReference).entityId||item.entityId||item.value||item.id)}
function itemTitle(item:Row){return text(item.title||item.label||item.name)}
function itemBody(item:Row){return text(item.body||item.description||item.subtitle||item.value)}
function itemMeta(item:DiscoveryItem,key:string){const value=item.metadata?.[key];return value==null?'':String(value)}
function priceLabel(item:Row,locale:StorefrontExperience['locale']){const amount=number(item.priceMad??item.price_amount??item.price);if(amount===null)return text(item.priceLabel||item.price_label);const fmt=locale==='ar'?'ar-MA':locale==='en'?'en-MA':'fr-MA';return `${new Intl.NumberFormat(fmt,{maximumFractionDigits:2}).format(amount)} ${text(item.currencyLabel||item.currency_label,'MAD')}`}
function catalogMatches(experience:StorefrontExperience,props:Props){
 const input=rows(props.items),ids=input.map(entityId).filter(Boolean),catalogOnly=input.length>0&&input.every(item=>!sourceId(item)||sourceId(item)==='catalog.items')
 if(ids.length&&catalogOnly){const order=new Map(ids.map((id,index)=>[id,index]));return experience.items.filter(item=>order.has(item.id)).sort((a,b)=>(order.get(a.id)??999)-(order.get(b.id)??999))}
 return [] as DiscoveryItem[]
}
function fallbackInventory(experience:StorefrontExperience,role:WorldFactorySemanticRole){
 if(role==='storefront_availability'||role==='storefront_professional_availability')return experience.items.filter(item=>item.availability_status&&!['unavailable','hidden','blocked'].includes(item.availability_status.toLowerCase()))
 if(role==='storefront_sessions')return experience.items.filter(item=>item.kind==='training'||/cohort|session/i.test(JSON.stringify(item.metadata)))
 if(role==='storefront_plans')return experience.items.filter(item=>item.price_mode==='subscription'||item.kind==='saas_module')
 if(role==='storefront_assessment')return experience.items.filter(item=>item.kind==='audit')
 return experience.items
}
function configRows(experience:StorefrontExperience,role:WorldFactorySemanticRole){
 const semantic=role.replace('storefront_','').replaceAll('_','-')
 const sections=(experience.storefrontSections||[]).filter(section=>{
  const type=text(section.type).toLowerCase(),key=text(section.key||section.role).toLowerCase();return [semantic,semantic.replaceAll('-','_'),role].includes(type)||[semantic,semantic.replaceAll('-','_'),role].includes(key)
 })
 return sections.flatMap(section=>rows(section.items).length?rows(section.items):[section])
}
function derivedRows(experience:StorefrontExperience,role:WorldFactorySemanticRole):Row[]{
 const configured=configRows(experience,role);if(configured.length)return configured
 if(role==='storefront_categories'||role==='storefront_segments'){
  const facet=experience.facets.category?.length?experience.facets.category:experience.facets.kind||[]
  return facet.map(item=>({title:item.value,label:`${item.count} offre${item.count>1?'s':''}`,value:item.value,count:item.count}))
 }
 if(role==='storefront_facets')return Object.entries(experience.facets).flatMap(([key,values])=>values.map(item=>({title:item.value,label:key,value:item.value,count:item.count})))
 if(role==='storefront_pathways')return experience.collections.map(collection=>({id:collection.id,title:collection.title,body:collection.subtitle||'',value:collection.collection_key,count:collection.items.length}))
 if(role==='storefront_trust'||role==='storefront_proof'){
  const labels=uniq(experience.items.flatMap(item=>item.trust_labels||[]).filter(Boolean)).slice(0,12)
  return labels.map(label=>({title:label,body:ui(experience.locale).governedProof}))
 }
 if(role==='storefront_availability'||role==='storefront_professional_availability'){
  const counts=new Map<string,number>();for(const item of experience.items){if(item.availability_status)counts.set(item.availability_status,(counts.get(item.availability_status)||0)+1)}
  return [...counts].map(([status,count])=>({title:status,label:`${count} offre${count>1?'s':''}`,value:status,count}))
 }
 if(role==='storefront_benefits'||role==='storefront_capabilities'||role==='storefront_framework'||role==='storefront_boundary'||role==='storefront_referral'||role==='storefront_process'||role==='storefront_diagnostic'||role==='storefront_impact'){
  const config=experience.experienceConfig||{};const value=config[role]??config[role.replace('storefront_','')]??config[role.replace('storefront_','').replaceAll('_','-')];return rows(value)
 }
 return []
}

function Header({role,props}:{role:WorldFactorySemanticRole;props:Props}){const c=copyFor(role,props);return <header className={styles.header}>{c.eyebrow?<span>{c.eyebrow}</span>:null}{c.title?<h2>{c.title}</h2>:null}{c.lead?<p>{c.lead}</p>:null}</header>}
function GenericRows({items,props,locale}:{items:Row[];props:Props;locale:StorefrontExperience['locale']}){const copy=ui(locale);return <div className={styles.semanticGrid}>{items.map((item,index)=><article className={styles.semanticCard} key={entityId(item)||`${itemTitle(item)}:${index}`}><div><strong>{itemTitle(item)||`${copy.item} ${index+1}`}</strong>{text(item.label)&&text(item.label)!==itemTitle(item)?<span>{text(item.label)}</span>:null}</div>{itemBody(item)?<p>{itemBody(item)}</p>:null}{priceLabel(item,locale)?<b>{priceLabel(item,locale)}</b>:null}{item.__studioResolvedAction?<StudioActionLink action={item.__studioResolvedAction as any} attribution={props.__studioAttribution as any} interactionId={`item:${index}`}>{text(item.actionLabel||item.ctaLabel,copy.discover)}<ChevronRight size={15}/></StudioActionLink>:null}</article>)}</div>}
function CatalogRows({items,experience}:{items:DiscoveryItem[];experience:StorefrontExperience}){return <div className={styles.catalogGrid}>{items.map(item=><CatalogCard key={item.id} item={item} locale={experience.locale}/>)}</div>}
function Timeline({items,locale}:{items:Row[];locale:StorefrontExperience['locale']}){const copy=ui(locale);return <ol className={styles.timeline}>{items.map((item,index)=><li key={entityId(item)||index}><span>{index+1}</span><div><strong>{itemTitle(item)||`${copy.step} ${index+1}`}</strong>{itemBody(item)?<p>{itemBody(item)}</p>:null}</div></li>)}</ol>}

function Hero({experience,props}:{experience:StorefrontExperience;props:Props}){
 const title=text(props.title,experience.hero.title),lead=text(props.lead,experience.hero.lead),eyebrow=text(props.eyebrow,experience.hero.eyebrow)
 return <section className={styles.hero} data-ac-storefront-semantic="storefront_hero"><div><span>{eyebrow}</span><h1>{title}</h1><p>{lead}</p><form action={`/angelcare-marketplace/${experience.locale}/marketplace/search`}><Search size={18}/><input name="q" placeholder={experience.locale==='fr'?'Que recherchez-vous ?':experience.locale==='ar'?'ماذا تبحث؟':'What are you looking for?'}/><input type="hidden" name="category" value={experience.key}/><button type="submit">{ui(experience.locale).discover}<ArrowRight size={16}/></button></form><div className={styles.signals}><span><ShieldCheck size={16}/>{ui(experience.locale).truth}</span><span><CheckCircle2 size={16}/>{experience.items.length} {ui(experience.locale).offers}</span></div></div>{text(props.mediaUrl)?<img src={text(props.mediaUrl)} alt={text(props.mediaAlt,title)}/>:<div className={styles.heroVisual}><Sparkles/><strong>{experience.key.replaceAll('-',' ').toUpperCase()}</strong></div>}</section>
}

function Facets({experience,props}:{experience:StorefrontExperience;props:Props}){return <section className={styles.section} data-ac-storefront-semantic="storefront_facets"><Header role="storefront_facets" props={props}/><div className={styles.facetGroups}>{Object.entries(experience.facets).filter(([,values])=>values.length).map(([key,values])=><div key={key}><strong>{key}</strong><div>{values.slice(0,12).map(value=><Link key={value.value} href={`/angelcare-marketplace/${experience.locale}/marketplace/search?category=${experience.key}&${encodeURIComponent(key)}=${encodeURIComponent(value.value)}`}>{value.value}<b>{value.count}</b></Link>)}</div></div>)}</div></section>}

function Conversion({props,role,locale}:{props:Props;role:WorldFactorySemanticRole;locale:StorefrontExperience['locale']}){const c=copyFor(role,props),copy=ui(locale);return <section className={styles.conversion} data-ac-storefront-semantic={role}><div><span>{c.eyebrow}</span><h2>{c.title}</h2><p>{c.lead}</p></div><div>{props.primaryAction?<StudioActionLink action={props.__studioResolvedPrimaryAction as any} attribution={props.__studioAttribution as any} interactionId="primary">{text(props.primaryCtaLabel,copy.continue)}<ArrowRight size={16}/></StudioActionLink>:null}{props.secondaryAction?<StudioActionLink action={props.__studioResolvedSecondaryAction as any} attribution={props.__studioAttribution as any} interactionId="secondary">{text(props.secondaryCtaLabel,copy.learnMore)}</StudioActionLink>:null}</div></section>}

export function StudioStorefrontSemanticRuntime({experience,props}:{experience:StorefrontExperience;props:Props}){
 const role=roleOf(props)
 if(role==='storefront_hero')return <Hero experience={experience} props={props}/>
 if(role==='storefront_facets')return <Facets experience={experience} props={props}/>
 if(role==='storefront_final_conversion'||role==='storefront_diagnostic'||role==='storefront_referral'){
  const configured=rows(props.items).length?rows(props.items):derivedRows(experience,role)
  if((role==='storefront_diagnostic'||role==='storefront_referral')&&configured.length)return <section className={styles.section} data-ac-storefront-semantic={role}><Header role={role} props={props}/><GenericRows items={configured} props={props} locale={experience.locale}/>{(props.primaryAction||props.secondaryAction)?<Conversion props={{...props,title:'',lead:'',eyebrow:''}} role={role} locale={experience.locale}/>:null}</section>
  return <Conversion props={props} role={role} locale={experience.locale}/>
 }
 const explicit=rows(props.items),matched=catalogMatches(experience,props),catalog=matched.length?matched:explicit.length?[]:fallbackInventory(experience,role)
 const semantic=explicit.length?explicit:derivedRows(experience,role)
 const timeline=['storefront_process','storefront_pathways','storefront_framework'].includes(role)
 const shouldHide=bool(props.hideWhenEmpty,true)&&!catalog.length&&!semantic.length
 if(shouldHide)return null
 return <section className={styles.section} data-ac-storefront-semantic={role}><Header role={role} props={props}/>{catalog.length?<CatalogRows items={catalog.slice(0,Math.max(1,Math.min(36,Number(props.limit||12))))} experience={experience}/>:timeline?<Timeline items={semantic} locale={experience.locale}/>:<GenericRows items={semantic} props={props} locale={experience.locale}/>}</section>
}
