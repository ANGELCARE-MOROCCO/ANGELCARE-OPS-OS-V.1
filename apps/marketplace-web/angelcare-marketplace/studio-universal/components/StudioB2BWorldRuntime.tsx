import Link from 'next/link'
import {ArrowRight,BadgeCheck,BarChart3,BookOpen,BriefcaseBusiness,Building2,CheckCircle2,ChevronDown,ChevronRight,ClipboardCheck,Handshake,Layers3,ShieldCheck,Star,Target,Users2,WandSparkles} from 'lucide-react'
import type {PublicExperience360,PublicExperienceTruthReport} from '@/angelcare-marketplace/public-experience-authority/types'
import {B2BCommercialConfiguratorClient,type B2BCommercialMode,type B2BConfiguratorOption} from './StudioB2BConversionActions'
import {atomicLocale,copy,durationDays,formatMoney,humanizeLabel,humanizeValue,isB2BRow,rowNumber,rowText,uniqueMedia} from './atomic-runtime-presentation'
import styles from './studio-b2b-world-runtime.module.css'

type Row=Record<string,unknown>
type WorldProps=Record<string,unknown>
const obj=(v:unknown):Row=>v&&typeof v==='object'&&!Array.isArray(v)?v as Row:{}
const arr=(v:unknown):unknown[]=>Array.isArray(v)?v:[]
const text=(v:unknown)=>typeof v==='string'?v.trim():v==null?'':String(v)
const finite=(v:unknown)=>Number.isFinite(Number(v))?Number(v):null
const lower=(v:unknown)=>text(v).toLowerCase()
const bool=(v:unknown)=>typeof v==='boolean'?v:['true','1','yes','oui'].includes(lower(v))
const clean=(v:string)=>v.replaceAll('_',' ').replaceAll('-',' ').replace(/\s+/g,' ').trim()
const proven=(report:PublicExperienceTruthReport,key:string)=>report.decisions.some(row=>row.key===key&&row.state==='PROVEN')
const icons=[BookOpen,Users2,ShieldCheck,ClipboardCheck,BarChart3,Handshake,Layers3,Target]

const worldSections=(worldProps:WorldProps)=>arr(worldProps.content).map(obj)
const sectionConfig=(worldProps:WorldProps,id:string)=>worldSections(worldProps).find(row=>text(row.id).toLowerCase()===id.toLowerCase())||{} as Row
const sectionEnabled=(worldProps:WorldProps,id:string)=>{const row=sectionConfig(worldProps,id);return row.hidden!==true&&row.enabled!==false}
const sourceItems=(worldProps:WorldProps,id:string)=>arr(sectionConfig(worldProps,id).items).map(obj)
const domain=(data:PublicExperience360)=>obj(data.domainExtension)
const b2b=(data:PublicExperience360)=>obj(domain(data).b2b)
const fieldRows=(data:PublicExperience360)=>data.content.fields.filter(row=>row.formatted||row.value!==null&&row.value!==undefined)
const hintRows=(data:PublicExperience360,hints:string[],limit=20)=>fieldRows(data).filter(row=>hints.some(h=>lower(row.key).includes(h)||lower(row.label).includes(h))).slice(0,limit)
const fieldRow=(data:PublicExperience360,hints:string[])=>hintRows(data,hints,1)[0]||null
const fieldText=(data:PublicExperience360,hints:string[])=>{const row=fieldRow(data,hints);return row?text(row.formatted||row.value):''}
const fieldNumber=(data:PublicExperience360,hints:string[])=>{const row=fieldRow(data,hints);return row?finite(row.value??row.formatted):null}
const fieldBoolean=(data:PublicExperience360,hints:string[])=>{const row=fieldRow(data,hints);return row?bool(row.value??row.formatted):false}
const values=(v:unknown)=>Array.isArray(v)?v.flatMap(item=>typeof item==='object'&&item!==null?Object.values(item as Row).map(text):[text(item)]).filter(Boolean):v&&typeof v==='object'?Object.values(v as Row).map(text).filter(Boolean):text(v)?text(v).split(/[,;|]/).map(x=>x.trim()).filter(Boolean):[]
const fieldValues=(data:PublicExperience360,hints:string[])=>{const row=fieldRow(data,hints);if(!row)return[];const raw=values(row.value);return raw.length?raw:values(row.formatted)}
const extensionRows=(value:unknown)=>arr(value).map(obj)
const unique=(rows:string[])=>[...new Set(rows.filter(Boolean))]
const publicAction=(data:PublicExperience360,id:string)=>data.actions.some(row=>row.actionId===id&&row.available)

const b2bCopy=(locale:string)=>{
 const l=atomicLocale(locale)
 return{
  home:copy(l,{fr:'Accueil',en:'Home',ar:'الرئيسية'}),
  solutions:copy(l,{fr:'Solutions B2B',en:'B2B solutions',ar:'حلول الشركات'}),
  institutional:copy(l,{fr:'B2B Institutionnel',en:'Institutional B2B',ar:'حلول مؤسساتية'}),
  quote:copy(l,{fr:'Demander un devis',en:'Request a quote',ar:'اطلب عرض سعر'}),
  request:copy(l,{fr:'Demander une étude',en:'Request an assessment',ar:'اطلب دراسة'}),
  advisor:copy(l,{fr:'Parler à un conseiller',en:'Talk to an advisor',ar:'تحدث مع مستشار'}),
  included:copy(l,{fr:'CE QUI EST INCLUS',en:'WHAT IS INCLUDED',ar:'ما الذي يشمله الحل'}),
  includedTitle:copy(l,{fr:'Une solution structurée autour de votre besoin.',en:'A solution structured around your needs.',ar:'حل منظم حول احتياجاتك.'}),
  canonicalModules:copy(l,{fr:'Les modules affichés proviennent des champs publics canoniques de cette offre.',en:'Displayed modules come from this offer’s canonical public fields.',ar:'الوحدات المعروضة تأتي من الحقول العامة المرجعية لهذا العرض.'}),
  architecture:copy(l,{fr:'ARCHITECTURE DE LA SOLUTION',en:'SOLUTION ARCHITECTURE',ar:'بنية الحل'}),
  architectureTitle:copy(l,{fr:'Des composantes claires, combinées selon votre contexte.',en:'Clear components combined around your context.',ar:'مكونات واضحة يتم دمجها حسب سياقك.'}),
  module:copy(l,{fr:'Module',en:'Module',ar:'وحدة'}),
  deployment:copy(l,{fr:'DÉPLOIEMENT',en:'DEPLOYMENT',ar:'التنفيذ'}),
  deploymentTitle:copy(l,{fr:'Une mise en place pilotée, visible et progressive.',en:'A controlled, visible and progressive rollout.',ar:'تنفيذ مُدار وواضح وتدريجي.'}),
  precisePlanning:copy(l,{fr:'Le planning précis est confirmé pendant le cadrage.',en:'The precise schedule is confirmed during scoping.',ar:'يتم تأكيد الجدول الدقيق أثناء مرحلة التأطير.'}),
  indicativeLead:copy(l,{fr:'Délai indicatif canonique',en:'Canonical indicative lead time',ar:'المدة التقديرية المرجعية'}),
  fit:copy(l,{fr:'FIT ORGANISATIONNEL',en:'ORGANIZATIONAL FIT',ar:'الملاءمة المؤسسية'}),
  fitTitle:copy(l,{fr:'Pour quel contexte cette solution est-elle conçue ?',en:'What context is this solution designed for?',ar:'لأي سياق تم تصميم هذا الحل؟'}),
  diagnostic:copy(l,{fr:'DIAGNOSTIC',en:'DIAGNOSTIC',ar:'التشخيص'}),
  diagnosticTitle:copy(l,{fr:'Les éléments qui cadrent la recommandation.',en:'The inputs that frame the recommendation.',ar:'العناصر التي تؤطر التوصية.'}),
  diagnosticCopy:copy(l,{fr:'Le diagnostic est déclenché par le parcours B2B canonique lorsque nécessaire.',en:'The diagnostic is triggered by the canonical B2B journey when needed.',ar:'يتم تشغيل التشخيص عبر مسار B2B المرجعي عند الحاجة.'}),
  proof:copy(l,{fr:'RÉSULTATS & PREUVES',en:'OUTCOMES & PROOF',ar:'النتائج والإثباتات'}),
  proofTitle:copy(l,{fr:'Uniquement les éléments soutenus par une autorité publique.',en:'Only elements supported by a public authority.',ar:'فقط العناصر المدعومة بجهة عامة معتمدة.'}),
  commercial:copy(l,{fr:'CADRE COMMERCIAL',en:'COMMERCIAL FRAMEWORK',ar:'الإطار التجاري'}),
  commercialTitle:copy(l,{fr:'Les paramètres utiles avant devis ou activation.',en:'Useful parameters before quotation or activation.',ar:'المعطيات المهمة قبل عرض السعر أو التفعيل.'}),
  truthNote:copy(l,{fr:'Les montants, remises, capacités et garanties ne sont jamais inventés par le thème.',en:'Amounts, discounts, capacities and guarantees are never invented by the theme.',ar:'لا يتم اختلاق المبالغ أو الخصومات أو السعات أو الضمانات من القالب.'}),
  faq:copy(l,{fr:'FAQ',en:'FAQ',ar:'الأسئلة الشائعة'}),
  faqTitle:copy(l,{fr:'Questions fréquentes sur la mise en place.',en:'Frequently asked questions about implementation.',ar:'أسئلة شائعة حول التنفيذ.'}),
  related:copy(l,{fr:'SOLUTIONS ASSOCIÉES',en:'RELATED SOLUTIONS',ar:'حلول مرتبطة'}),
  relatedTitle:copy(l,{fr:'Construisez un dispositif institutionnel cohérent.',en:'Build a coherent institutional setup.',ar:'ابنِ منظومة مؤسساتية متكاملة.'}),
  discover:copy(l,{fr:'Découvrir',en:'Discover',ar:'اكتشف'}),
  project:copy(l,{fr:'VOTRE PROJET',en:'YOUR PROJECT',ar:'مشروعك'}),
  finalTitle:copy(l,{fr:'Passez du besoin institutionnel à une proposition structurée.',en:'Move from institutional need to a structured proposal.',ar:'انتقل من الاحتياج المؤسساتي إلى عرض منظم.'}),
  finalCopy:copy(l,{fr:'Diagnostic, devis et handover restent gouvernés par les workflows B2B AngelCare.',en:'Diagnostic, quotation and handover remain governed by AngelCare B2B workflows.',ar:'يبقى التشخيص وعرض السعر والإحالة محكوماً بسير عمل B2B في AngelCare.'}),
  sites:copy(l,{fr:'Sites évalués',en:'Sites assessed',ar:'المواقع المقيمة'}),
  beneficiaries:copy(l,{fr:'Bénéficiaires',en:'Beneficiaries',ar:'المستفيدون'}),
  personnel:copy(l,{fr:'Personnel',en:'Staff',ar:'الموظفون'}),
  employees:copy(l,{fr:'Employés',en:'Employees',ar:'الموظفون'}),
  children:copy(l,{fr:'Enfants / volume',en:'Children / volume',ar:'الأطفال / الحجم'}),
  families:copy(l,{fr:'Familles',en:'Families',ar:'العائلات'}),
  participants:copy(l,{fr:'Participants',en:'Participants',ar:'المشاركون'}),
  users:copy(l,{fr:'Utilisateurs',en:'Users',ar:'المستخدمون'}),
 }
}

function doctrineLabel(key:string,locale:string){const l=atomicLocale(locale);const map:Record<string,{fr:string;en:string;ar:string}>={
 'school-managed-programme':{fr:'Écoles & crèches',en:'Schools & nurseries',ar:'المدارس والحضانات'},
 'school-staff-reinforcement':{fr:'Renfort d’équipes',en:'Staff reinforcement',ar:'تعزيز الفرق'},
 'hospitality-kids-programme':{fr:'Hospitality',en:'Hospitality',ar:'الضيافة'},
 'corporate-childcare-benefit':{fr:'Avantage garde d’enfants',en:'Childcare benefit',ar:'ميزة رعاية الأطفال'},
 'health-adjacent-programme':{fr:'Partenaire santé',en:'Health partner',ar:'شريك صحي'},
 'event-venue-programme':{fr:'Événementiel',en:'Events',ar:'الفعاليات'},
 'partner-os-plan':{fr:'Partner OS',en:'Partner OS',ar:'Partner OS'},
 'quality-check-assessment':{fr:'Quality Check 360',en:'Quality Check 360',ar:'Quality Check 360'},
 'custom-managed-solution':{fr:'Solution sur mesure',en:'Custom managed solution',ar:'حل مخصص'},
 };return map[key]?.[l]||clean(key)}
function pricingMode(data:PublicExperience360):B2BCommercialMode{const raw=lower(fieldText(data,['pricing_mode'])||data.pricing.mode);if(raw.includes('per_site'))return'per_site';if(raw.includes('per_child'))return'per_child';if(raw.includes('per_employee'))return'per_employee';if(raw.includes('per_event'))return'per_event';if(raw.includes('subscription')||raw.includes('recurr'))return'subscription';if(raw.includes('volume'))return'volume_pricing';if(raw.includes('fixed'))return'fixed';if(raw.includes('starting'))return'starting_from';if(raw.includes('configured'))return'configured_estimate';if(raw.includes('quote'))return'quote_only';return data.pricing.amount===null?'quote_only':'starting_from'}
function options(rows:string[],locale:string):B2BConfiguratorOption[]{return unique(rows).map(value=>({value,label:humanizeValue(value,locale)}))}
function organisationOptions(data:PublicExperience360){return options(fieldValues(data,['organization_type','organisation_type']),data.classification.locale)}
function territoryOptions(data:PublicExperience360){return options(fieldValues(data,['territory_codes','city','ville','region','zone']),data.classification.locale)}
function moduleOptions(data:PublicExperience360){return options(fieldValues(data,['programme_modules','required_components','included_modules','benefit_models','assessment_scope','solution_scope','add_on_keys']),data.classification.locale)}
function capacityConfig(data:PublicExperience360){const ui=b2bCopy(data.classification.locale),doctrine=data.classification.doctrineKey;let hints=['children_capacity','expected_child_volume','beneficiary_volume'],label=ui.beneficiaries;if(doctrine==='school-staff-reinforcement'){hints=['personnel_count'];label=ui.personnel}else if(doctrine==='corporate-childcare-benefit'){hints=['employee_population'];label=ui.employees}else if(doctrine==='hospitality-kids-programme'){hints=['expected_child_volume','property_size_rooms'];label=ui.children}else if(doctrine==='health-adjacent-programme'){hints=['expected_family_volume'];label=ui.families}else if(doctrine==='event-venue-programme'){hints=['expected_child_volume','expected_attendance'];label=ui.participants}else if(doctrine==='partner-os-plan'){hints=['user_limit'];label=ui.users}else if(doctrine==='quality-check-assessment'){hints=['site_count'];label=ui.sites}const value=fieldNumber(data,hints)??1;return{label,defaultValue:Math.max(1,Math.round(value)),min:1,max:Math.max(10,Math.ceil(value*4)||1000),step:value>=100?10:value>=20?5:1}}
function commercialAmount(data:PublicExperience360,truth:PublicExperienceTruthReport){if(!proven(truth,'pricing'))return null;return data.pricing.amount??fieldNumber(data,['recurring_fee_dh'])??fieldNumber(data,['starting_price_dh'])}
function trustClaims(data:PublicExperience360){return data.trust.claims.filter(row=>row.status==='verified'||row.status==='active'||Boolean(row.evidenceReference)).map(row=>row.label).filter(Boolean)}
function metricRows(data:PublicExperience360){return hintRows(data,['impact','result','beneficiary','partner','satisfaction','compliance','experience','capacity','site'],12).map(row=>({label:humanizeLabel(row.key,data.classification.locale,row.label),value:humanizeValue(row.formatted||row.value,data.classification.locale)})).filter(r=>r.value).slice(0,6)}
function includedRows(data:PublicExperience360){const hints=['programme_modules','required_components','included_modules','benefit_models','covered_service_keys','assessment_scope','solution_scope','equipment_requirements','staffing_requirements','support_level','report_type'];return hintRows(data,hints,18).flatMap(row=>{const vals=values(row.value);return vals.length?vals.map(v=>({title:humanizeValue(v,data.classification.locale),copy:humanizeLabel(row.key,data.classification.locale,row.label)})):row.formatted?[{title:humanizeValue(row.formatted,data.classification.locale),copy:humanizeLabel(row.key,data.classification.locale,row.label)}]:[]}).slice(0,8)}
function fitRows(data:PublicExperience360){return extensionRows(b2b(data).organisationFit).map(row=>({label:humanizeLabel(row.key||row.label,data.classification.locale,row.label),value:humanizeValue(row.value||row.formatted||row.description,data.classification.locale)})).filter(r=>r.label&&r.value).slice(0,8)}
function diagnosticRows(data:PublicExperience360){return extensionRows(b2b(data).diagnostic).map(row=>({label:humanizeLabel(row.key||row.label,data.classification.locale,row.label),value:humanizeValue(row.value||row.formatted||row.description,data.classification.locale)})).filter(r=>r.label&&r.value).slice(0,8)}
function deploymentRows(data:PublicExperience360,worldProps:WorldProps){const ext=extensionRows(b2b(data).deploymentModel).map(row=>({title:humanizeLabel(row.key||row.label||row.title,data.classification.locale,row.label||row.title),copy:humanizeValue(row.value||row.formatted||row.description,data.classification.locale)})).filter(r=>r.title&&r.copy);if(ext.length)return ext.slice(0,6);return arr(worldProps.deploymentFallback).map(obj).map(row=>({title:text(row.title),copy:text(row.copy)})).filter(r=>r.title&&r.copy).slice(0,6)}
function programmeRows(data:PublicExperience360,worldProps:WorldProps){const source=sourceItems(worldProps,'b06-programme');if(source.length)return source.slice(0,6);return extensionRows(b2b(data).programmes).slice(0,6)}
function relatedRows(data:PublicExperience360,worldProps:WorldProps){const source=sourceItems(worldProps,'b12-related').filter(isB2BRow);if(source.length)return source.slice(0,6);return data.recommendations.filter(row=>isB2BRow({kind:row.kind})).slice(0,6).map(row=>({id:row.id,slug:row.slug,title:row.name,priceAmount:row.priceAmount,currency:row.currency,mediaUrl:row.mediaUrl,kind:row.kind}))}
function faqRows(worldProps:WorldProps){return arr(worldProps.faqItems).map(obj).map(row=>({q:text(row.q||row.question||row.title),a:text(row.a||row.answer||row.copy)})).filter(row=>row.q&&row.a).slice(0,8)}

function Breadcrumb({data}:{data:PublicExperience360}){const ui=b2bCopy(data.classification.locale),l=data.classification.locale;return <nav className={styles.breadcrumb} data-ac-b2b-section="B00" aria-label="Breadcrumb"><Link href={`/angelcare-marketplace/${l}/marketplace`}>{ui.home}</Link><ChevronRight/><span>{ui.solutions}</span><ChevronRight/><span>{doctrineLabel(data.classification.doctrineKey,l)}</span><ChevronRight/><strong>{data.identity.name}</strong></nav>}
function Identity({data}:{data:PublicExperience360}){const ui=b2bCopy(data.classification.locale),trust=trustClaims(data).slice(0,4),canQuote=publicAction(data,'quotation.start'),canRequest=publicAction(data,'b2b.request')||publicAction(data,'inquiry.submit');return <div className={styles.identity}><div className={styles.badges}><span>{ui.institutional}</span><b>{doctrineLabel(data.classification.doctrineKey,data.classification.locale)}</b></div><h1>{data.identity.name}</h1><p>{data.identity.shortDescription||data.identity.description}</p>{trust.length?<div className={styles.microProof}>{trust.map(label=><span key={label}><BadgeCheck/>{label}</span>)}</div>:null}<div className={styles.heroActions}>{canQuote?<a href="#b2b-commercial-panel">{ui.quote}<ArrowRight/></a>:canRequest?<a href="#b2b-commercial-panel">{ui.request}<ArrowRight/></a>:null}<Link href={`/angelcare-marketplace/${data.classification.locale}/account/support`}>{ui.advisor}</Link></div></div>}
function Media({data}:{data:PublicExperience360}){const media=uniqueMedia(data.media)[0];return <div className={styles.mediaStage}>{media?<img src={media.url} alt={media.alt||data.identity.name}/>:<div className={styles.mediaFallback}><Building2/><span>{doctrineLabel(data.classification.doctrineKey,data.classification.locale)}</span></div>}<div className={styles.mediaAtmosphere}/></div>}
function Conversion({data,truth}:{data:PublicExperience360;truth:PublicExperienceTruthReport}){const mode=pricingMode(data),capacity=capacityConfig(data),siteMin=Math.max(1,Math.round(fieldNumber(data,['site_minimum'])??1)),siteMax=Math.max(siteMin,Math.round(fieldNumber(data,['site_maximum'])??Math.max(4,siteMin))),siteDefault=Math.max(siteMin,Math.round(fieldNumber(data,['site_count'])??siteMin)),amount=commercialAmount(data,truth),billingPeriod=fieldText(data,['billing_period','company_billing_cycle','billing_basis']),quoteRequired=fieldBoolean(data,['quotation_required'])||mode==='quote_only',lead=durationDays(fieldText(data,['implementation_lead_time_days']),data.classification.locale);return <div id="b2b-commercial-panel"><B2BCommercialConfiguratorClient locale={data.classification.locale} slug={data.identity.slug} doctrine={data.classification.doctrineKey} currency={data.pricing.currency||'MAD'} amount={amount} amountLabel={data.pricing.label||''} pricingMode={mode} billingPeriod={billingPeriod} recurringFee={proven(truth,'pricing')?fieldNumber(data,['recurring_fee_dh']):null} setupFee={proven(truth,'pricing')?fieldNumber(data,['setup_fee_dh']):null} quotationRequired={quoteRequired} quoteEnabled={publicAction(data,'quotation.start')} requestEnabled={publicAction(data,'b2b.request')||publicAction(data,'inquiry.submit')} subscriptionEnabled={publicAction(data,'subscription.start')} organizationType={fieldText(data,['organization_type','organisation_type'])} organizationOptions={organisationOptions(data)} capacityLabel={capacity.label} capacityDefault={capacity.defaultValue} capacityMin={capacity.min} capacityMax={capacity.max} capacityStep={capacity.step} siteDefault={siteDefault} siteMin={siteMin} siteMax={siteMax} territoryDefault={territoryOptions(data)[0]?.value||''} territoryOptions={territoryOptions(data)} moduleOptions={moduleOptions(data)} implementationLeadTime={lead}/></div>}
function TrustRail({data}:{data:PublicExperience360}){const claims=trustClaims(data).slice(0,5);if(!claims.length)return null;return <section className={styles.trustRail} data-ac-b2b-section="B04">{claims.map((label,index)=>{const I=icons[index%icons.length];return <div key={`${label}:${index}`}><I/><span>{label}</span></div>})}</section>}
function Included({data}:{data:PublicExperience360}){const ui=b2bCopy(data.classification.locale),rows=includedRows(data);if(!rows.length)return null;return <section className={styles.section} data-ac-b2b-section="B05"><header><span>{ui.included}</span><h2>{ui.includedTitle}</h2><p>{ui.canonicalModules}</p></header><div className={styles.includedGrid}>{rows.map((row,index)=>{const I=icons[index%icons.length];return <article key={`${row.title}:${index}`}><div><I/></div><strong>{row.title}</strong><small>{row.copy}</small></article>})}</div></section>}
function Programme({data,worldProps}:{data:PublicExperience360;worldProps:WorldProps}){const ui=b2bCopy(data.classification.locale),rows=programmeRows(data,worldProps);if(!rows.length)return null;return <section className={styles.section} data-ac-b2b-section="B06"><header><span>{ui.architecture}</span><h2>{ui.architectureTitle}</h2></header><div className={styles.programmeGrid}>{rows.map((row,index)=>{const title=rowText(row,['title','name','label'])||`${ui.module} ${index+1}`,copyText=rowText(row,['description','copy','body']),media=rowText(row,['mediaUrl','imageUrl']);return <article key={`${title}:${index}`}>{media?<img src={media} alt={title} loading="lazy"/>:<div className={styles.programmeFallback}><WandSparkles/></div>}<div><span>{String(index+1).padStart(2,'0')}</span><strong>{title}</strong>{copyText?<p>{copyText}</p>:null}</div></article>})}</div></section>}
function Deployment({data,worldProps}:{data:PublicExperience360;worldProps:WorldProps}){const ui=b2bCopy(data.classification.locale),rows=deploymentRows(data,worldProps),lead=durationDays(fieldText(data,['implementation_lead_time_days']),data.classification.locale);if(!rows.length)return null;return <section className={`${styles.section} ${styles.deploymentSection}`} data-ac-b2b-section="B07"><header><span>{ui.deployment}</span><h2>{ui.deploymentTitle}</h2><p>{lead?`${ui.indicativeLead} : ${lead}.`:ui.precisePlanning}</p></header><div className={styles.timeline}>{rows.map((row,index)=><article key={`${row.title}:${index}`}><b>{index+1}</b><div><strong>{row.title}</strong>{row.copy?<p>{row.copy}</p>:null}</div></article>)}</div></section>}
function FitDiagnostic({data}:{data:PublicExperience360}){const ui=b2bCopy(data.classification.locale),fit=fitRows(data),diag=diagnosticRows(data);if(!fit.length&&!diag.length)return null;return <section className={styles.dualSection} data-ac-b2b-section="B08"><article><span>{ui.fit}</span><h2>{ui.fitTitle}</h2>{fit.length?<div className={styles.factList}>{fit.map(row=><div key={row.label}><CheckCircle2/><span><small>{row.label}</small><strong>{row.value}</strong></span></div>)}</div>:null}</article><article><span>{ui.diagnostic}</span><h2>{ui.diagnosticTitle}</h2>{diag.length?<div className={styles.factList}>{diag.map(row=><div key={row.label}><ClipboardCheck/><span><small>{row.label}</small><strong>{row.value}</strong></span></div>)}</div>:<p>{ui.diagnosticCopy}</p>}</article></section>}
function Proof({data,truth}:{data:PublicExperience360;truth:PublicExperienceTruthReport}){const ui=b2bCopy(data.classification.locale),metrics=metricRows(data),claims=trustClaims(data).slice(0,6),rating=proven(truth,'rating')?data.reviews.rating:null;if(!metrics.length&&!claims.length&&rating===null)return null;return <section className={`${styles.section} ${styles.proofSection}`} data-ac-b2b-section="B09"><header><span>{ui.proof}</span><h2>{ui.proofTitle}</h2></header>{metrics.length?<div className={styles.metrics}>{metrics.map((row,index)=><div key={`${row.label}:${index}`}><strong>{row.value}</strong><small>{row.label}</small></div>)}</div>:null}<div className={styles.proofBody}>{claims.length?<div className={styles.claims}>{claims.map(row=><span key={row}><ShieldCheck/>{row}</span>)}</div>:null}{rating!==null?<div className={styles.rating}><Star/><strong>{rating.toFixed(1)}</strong><span>{data.reviews.count||0}</span></div>:null}</div></section>}
function CommercialTerms({data,truth}:{data:PublicExperience360;truth:PublicExperienceTruthReport}){const ui=b2bCopy(data.classification.locale),rows=hintRows(data,['pricing_mode','starting_price_dh','quotation_required','implementation_lead_time_days','contract_duration_months','billing_basis','billing_model','company_billing_cycle','support_level','trial_days','duration_days'],12).filter(row=>!row.key.includes('starting_price')||proven(truth,'pricing'));if(!rows.length)return null;return <section className={styles.section} data-ac-b2b-section="B10"><header><span>{ui.commercial}</span><h2>{ui.commercialTitle}</h2></header><div className={styles.termGrid}>{rows.map(row=><div key={row.key}><small>{humanizeLabel(row.key,data.classification.locale,row.label)}</small><strong>{row.key.includes('lead_time')||row.key==='duration_days'?durationDays(row.value??row.formatted,data.classification.locale):humanizeValue(row.formatted||row.value,data.classification.locale)}</strong></div>)}</div><p className={styles.truthNote}><ShieldCheck/> {ui.truthNote}</p></section>}
function FAQ({worldProps,locale}:{worldProps:WorldProps;locale:string}){const ui=b2bCopy(locale),rows=faqRows(worldProps);if(!rows.length)return null;return <section className={styles.section} data-ac-b2b-section="B11"><header><span>{ui.faq}</span><h2>{ui.faqTitle}</h2></header><div className={styles.faqList}>{rows.map((row,index)=><details key={`${row.q}:${index}`}><summary>{row.q}<ChevronDown/></summary><p>{row.a}</p></details>)}</div></section>}
function Related({data,worldProps}:{data:PublicExperience360;worldProps:WorldProps}){const ui=b2bCopy(data.classification.locale),rows=relatedRows(data,worldProps);if(!rows.length)return null;const l=data.classification.locale;return <section className={styles.section} data-ac-b2b-section="B12"><header><span>{ui.related}</span><h2>{ui.relatedTitle}</h2></header><div className={styles.relatedRail}>{rows.map((row,index)=>{const slug=rowText(row,['slug']),title=rowText(row,['title','name','label'])||`${ui.solutions} ${index+1}`,media=rowText(row,['mediaUrl','imageUrl']),price=rowNumber(row,['price','priceAmount','priceMad']);return <article key={`${title}:${index}`}>{slug?<Link href={`/angelcare-marketplace/${l}/marketplace/item/${encodeURIComponent(slug)}`}>{media?<img src={media} alt={title} loading="lazy"/>:<div className={styles.relatedFallback}><BriefcaseBusiness/></div>}<div><strong>{title}</strong>{price!==null?<small>{formatMoney(price,rowText(row,['currency','currencyLabel'])||'MAD','',l)}</small>:null}<span>{ui.discover}<ArrowRight/></span></div></Link>:null}</article>})}</div></section>}
function FinalConversion({data}:{data:PublicExperience360}){const ui=b2bCopy(data.classification.locale),l=data.classification.locale,canQuote=publicAction(data,'quotation.start'),canRequest=publicAction(data,'b2b.request')||publicAction(data,'inquiry.submit');return <section className={styles.finalBand} data-ac-b2b-section="B13"><div><span>{ui.project}</span><h2>{ui.finalTitle}</h2><p>{ui.finalCopy}</p></div><div>{canQuote?<a href={`/angelcare-marketplace/${l}/quotation/${encodeURIComponent(data.identity.slug)}`}>{ui.quote}<ArrowRight/></a>:canRequest?<a href="#b2b-commercial-panel">{ui.request}<ArrowRight/></a>:null}<Link href={`/angelcare-marketplace/${l}/account/support`}>{ui.advisor}</Link></div></section>}

export async function StudioB2BWorldRuntime({data,truthReport,worldProps}:{data:PublicExperience360;truthReport:PublicExperienceTruthReport;worldProps:WorldProps}){
 if(data.classification.masterDomain!=='b2b_institutional')return null
 const worldKey=text(worldProps.worldKey)||'ac.b2b.solution.immersive.2030.v2'
 return <main className={styles.root} dir={data.classification.locale==='ar'?'rtl':'ltr'} data-ac-public-experience="studio-b2b-semantic-runtime-v2" data-ac-b2b-world-key={worldKey} data-ac-b2b-doctrine={data.classification.doctrineKey}>
  <div className={styles.shell}>
   {sectionEnabled(worldProps,'b00-breadcrumb')?<Breadcrumb data={data}/>:null}
   <section className={styles.heroGrid} data-ac-b2b-section="B01" data-ac-b2b-decision-triad>
    {sectionEnabled(worldProps,'b01-identity')?<Identity data={data}/>:null}
    {sectionEnabled(worldProps,'b02-media')?<Media data={data}/>:null}
    {sectionEnabled(worldProps,'b03-conversion')?<Conversion data={data} truth={truthReport}/>:null}
   </section>
   {sectionEnabled(worldProps,'b04-trust')?<TrustRail data={data}/>:null}
   {sectionEnabled(worldProps,'b05-included')?<Included data={data}/>:null}
   {sectionEnabled(worldProps,'b06-programme')?<Programme data={data} worldProps={worldProps}/>:null}
   {sectionEnabled(worldProps,'b07-deployment')?<Deployment data={data} worldProps={worldProps}/>:null}
   {sectionEnabled(worldProps,'b08-fit-diagnostic')?<FitDiagnostic data={data}/>:null}
   {sectionEnabled(worldProps,'b09-proof')?<Proof data={data} truth={truthReport}/>:null}
   {sectionEnabled(worldProps,'b10-commercial')?<CommercialTerms data={data} truth={truthReport}/>:null}
   {sectionEnabled(worldProps,'b11-faq')?<FAQ worldProps={worldProps} locale={data.classification.locale}/>:null}
   {sectionEnabled(worldProps,'b12-related')?<Related data={data} worldProps={worldProps}/>:null}
   {sectionEnabled(worldProps,'b13-final')?<FinalConversion data={data}/>:null}
  </div>
 </main>
}
