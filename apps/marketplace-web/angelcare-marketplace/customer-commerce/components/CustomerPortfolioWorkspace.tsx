'use client'
import {useState} from 'react'
import {WorkspaceTools} from '../../customer-experience/WorkspaceTools'
import Link from '@/angelcare-marketplace/navigation-care-orbit/CareOrbitLink'
import { Award, Building2, CalendarClock, ClipboardCheck, FileText, GraduationCap, PackageCheck, Repeat2, ShieldCheck, WalletCards } from 'lucide-react'
import type { MarketplaceJourney } from '../../journey-control/types'
import type { DiscoveryItem } from '../../catalog-discovery/types'
import type { CustomerPortfolio } from '../types'
import { CustomerPortalNavigation } from './CustomerPortalNavigation'
import styles from '../customer-commerce.module.css'

type Filter=CustomerPortfolio['filter']
type Locale=CustomerPortfolio['locale']
type DomainConfig={title:Record<Locale,string>;kicker:string;description:Record<Locale,string>;empty:Record<Locale,string>;tone:string}
const CONFIG:Record<Filter,DomainConfig>={
  product_order:{title:{fr:'Mes commandes',en:'My Orders',ar:'طلباتي'},kicker:'COMMERCE',description:{fr:'Produits et kits avec état de paiement, préparation, livraison/retrait, documents et prochaine action.',en:'Products and kits with payment, preparation, delivery/pickup, documents and next action.',ar:'المنتجات والمجموعات مع حالة الدفع والتحضير والتسليم والوثائق والخطوة التالية.'},empty:{fr:'Aucune commande pour le moment.',en:'No orders yet.',ar:'لا توجد طلبات بعد.'},tone:'blue'},
  kit_order:{title:{fr:'Mes kits',en:'My Kits',ar:'مجموعاتي'},kicker:'KITS',description:{fr:'Kits commandés et suivi de leur exécution réelle.',en:'Ordered kits and their real fulfillment state.',ar:'المجموعات المطلوبة وحالة تنفيذها الفعلية.'},empty:{fr:'Aucun kit commandé.',en:'No kit orders.',ar:'لا توجد مجموعات مطلوبة.'},tone:'blue'},
  family_booking:{title:{fr:'Mes réservations',en:'My Bookings',ar:'حجوزاتي'},kicker:'SERVICES',description:{fr:'Services famille avec planning, intervenant visible lorsqu’autorisé, instructions et changements.',en:'Family services with schedule, assigned professional when authorized, instructions and changes.',ar:'خدمات الأسرة مع الجدول والمختص عند السماح والتعليمات والتغييرات.'},empty:{fr:'Aucune réservation pour le moment.',en:'No bookings yet.',ar:'لا توجد حجوزات بعد.'},tone:'pink'},
  recurring_service:{title:{fr:'Mes services récurrents',en:'Recurring Services',ar:'الخدمات المتكررة'},kicker:'SERVICES',description:{fr:'Vos prestations récurrentes et leurs prochaines échéances.',en:'Your recurring services and upcoming dates.',ar:'خدماتك المتكررة ومواعيدها القادمة.'},empty:{fr:'Aucun service récurrent.',en:'No recurring services.',ar:'لا توجد خدمات متكررة.'},tone:'pink'},
  academy_enrollment:{title:{fr:'Mon Academy',en:'My Academy',ar:'أكاديميتي'},kicker:'LEARNING',description:{fr:'Inscriptions, cohorte, éligibilité, certification, documents et prochaines actions.',en:'Enrollments, cohort, eligibility, certification, documents and next actions.',ar:'التسجيلات والمجموعة والأهلية والشهادة والوثائق والخطوات التالية.'},empty:{fr:'Aucune inscription Academy.',en:'No Academy enrollment.',ar:'لا يوجد تسجيل في الأكاديمية.'},tone:'violet'},
  b2b_quotation:{title:{fr:'Mes devis & solutions',en:'My Quotes & Solutions',ar:'عروض الأسعار والحلول'},kicker:'SOLUTIONS',description:{fr:'Demandes, qualification, propositions et décisions reliées à leur dossier réel.',en:'Requests, qualification, proposals and decisions tied to their real case.',ar:'الطلبات والتأهيل والمقترحات والقرارات المرتبطة بملفها الحقيقي.'},empty:{fr:'Aucun devis en cours.',en:'No quote in progress.',ar:'لا توجد عروض أسعار قيد المعالجة.'},tone:'cyan'},
  hospitality_programme:{title:{fr:'Programmes Hospitality',en:'Hospitality Programmes',ar:'برامج الضيافة'},kicker:'HOSPITALITY',description:{fr:'Programmes et demandes Hospitality suivis de bout en bout.',en:'Hospitality programmes and requests tracked end to end.',ar:'برامج وطلبات الضيافة مع متابعة كاملة.'},empty:{fr:'Aucun programme Hospitality.',en:'No hospitality programme.',ar:'لا توجد برامج ضيافة.'},tone:'amber'},
  corporate_benefit:{title:{fr:'Mes avantages entreprise',en:'Corporate Benefits',ar:'مزايا الشركة'},kicker:'CORPORATE',description:{fr:'Avantages, éligibilité et parcours entreprise réellement activés.',en:'Benefits, eligibility and corporate journeys actually activated.',ar:'المزايا والأهلية ومسارات الشركة المفعلة فعلياً.'},empty:{fr:'Aucun avantage entreprise actif.',en:'No active corporate benefit.',ar:'لا توجد مزايا شركة نشطة.'},tone:'blue'},
  partner_activation:{title:{fr:'Mes abonnements & Partner OS',en:'Subscriptions & Partner OS',ar:'الاشتراكات وPartner OS'},kicker:'SUBSCRIPTIONS',description:{fr:'Plans, activation, statut d’abonnement et prochaines étapes Partner OS.',en:'Plans, activation, subscription status and next Partner OS steps.',ar:'الخطط والتفعيل وحالة الاشتراك والخطوات التالية.'},empty:{fr:'Aucun abonnement Partner OS.',en:'No Partner OS subscription.',ar:'لا يوجد اشتراك Partner OS.'},tone:'cyan'},
  quality_assessment:{title:{fr:'Mes Quality Checks',en:'My Quality Checks',ar:'فحوصات الجودة'},kicker:'QUALITY',description:{fr:'Assessments, preuves, rapports et état de validation sans score inventé.',en:'Assessments, evidence, reports and validation state without invented scores.',ar:'التقييمات والأدلة والتقارير وحالة التحقق بدون درجات مختلقة.'},empty:{fr:'Aucun Quality Check.',en:'No Quality Check.',ar:'لا يوجد فحص جودة.'},tone:'emerald'},
  all:{title:{fr:'Tous mes parcours',en:'All My Journeys',ar:'كل مساراتي'},kicker:'MY ANGELCARE',description:{fr:'Vue consolidée de tous vos parcours ANGELCARE.',en:'Consolidated view of every ANGELCARE journey.',ar:'عرض موحد لكل مسارات ANGELCARE.'},empty:{fr:'Aucun parcours.',en:'No journey.',ar:'لا توجد مسارات.'},tone:'navy'},
}

const asText=(value:unknown)=>typeof value==='string'&&value.trim()?value.trim():null
const asNumber=(value:unknown)=>typeof value==='number'&&Number.isFinite(value)?value:null
const firstText=(record:Record<string,unknown>,keys:string[])=>keys.map(k=>asText(record[k])).find(Boolean)||null
const firstNumber=(record:Record<string,unknown>,keys:string[])=>keys.map(k=>asNumber(record[k])).find(v=>v!==null)??null
const dateLabel=(value:string|null,locale:Locale)=>value?new Intl.DateTimeFormat(locale,{dateStyle:'medium',timeStyle:'short'}).format(new Date(value)):null
const catalogPrice=(item:DiscoveryItem,locale:Locale)=>item.price_mode==='quote_only'?(locale==='fr'?'Sur devis':locale==='ar'?'حسب العرض':'Quote only'):item.price_amount==null?'—':`${item.price_mode==='starting_from'?(locale==='fr'?'Dès ':locale==='ar'?'ابتداءً من ':'From '):''}${item.price_amount.toLocaleString(locale)} ${item.currency_label}`
const catalogAvailability=(value:string,locale:Locale)=>{
  const labels={fr:{available:'Disponible',in_stock:'En stock',bookable:'Réservable',limited:'Disponibilité limitée',unavailable:'Indisponible',out_of_stock:'Rupture',coming_soon:'Bientôt disponible'},en:{available:'Available',in_stock:'In stock',bookable:'Bookable',limited:'Limited availability',unavailable:'Unavailable',out_of_stock:'Out of stock',coming_soon:'Coming soon'},ar:{available:'متاح',in_stock:'متوفر',bookable:'قابل للحجز',limited:'توفر محدود',unavailable:'غير متاح',out_of_stock:'نفد المخزون',coming_soon:'قريباً'}} as const
  return labels[locale][value as keyof typeof labels.fr]||value.replaceAll('_',' ')
}
const catalogKind=(value:string,locale:Locale)=>{
  const labels:Record<string,Record<Locale,string>>={product:{fr:'Produit',en:'Product',ar:'منتج'},kit:{fr:'Kit',en:'Kit',ar:'مجموعة'},service:{fr:'Service',en:'Service',ar:'خدمة'},training:{fr:'Formation',en:'Training',ar:'تكوين'},b2b:{fr:'Solution',en:'Solution',ar:'حل'},subscription:{fr:'Abonnement',en:'Subscription',ar:'اشتراك'},assessment:{fr:'Évaluation',en:'Assessment',ar:'تقييم'}}
  return labels[value]?.[locale]||value.replaceAll('_',' ')
}
const catalogAction=(journey:MarketplaceJourney,locale:Locale)=>['product_order','kit_order'].includes(journey.journey_type)?(locale==='fr'?'Acheter à nouveau':locale==='ar'?'شراء مرة أخرى':'Buy again'):['family_booking','recurring_service'].includes(journey.journey_type)?(locale==='fr'?'Réserver à nouveau':locale==='ar'?'الحجز مرة أخرى':'Book again'):journey.journey_type==='academy_enrollment'?(locale==='fr'?'Voir la formation':locale==='ar'?'عرض الدورة':'View course'):(locale==='fr'?'Voir l’offre':locale==='ar'?'عرض العرض':'View offer')
const statusLabel=(status:string,locale:Locale)=>{
  const fr:Record<string,string>={registered:'Enregistré',awaiting_customer:'Action requise',awaiting_angelcare:'En traitement',qualified:'Qualifié',scheduled:'Planifié',in_preparation:'En préparation',in_progress:'En cours',completed:'Terminé',blocked:'Bloqué',recovery:'Sous assistance',cancelled:'Annulé'}
  const en:Record<string,string>={registered:'Registered',awaiting_customer:'Action required',awaiting_angelcare:'In review',qualified:'Qualified',scheduled:'Scheduled',in_preparation:'Preparing',in_progress:'In progress',completed:'Completed',blocked:'Blocked',recovery:'Support in progress',cancelled:'Cancelled'}
  const ar:Record<string,string>={registered:'مسجل',awaiting_customer:'إجراء مطلوب',awaiting_angelcare:'قيد المعالجة',qualified:'مؤهل',scheduled:'مجدول',in_preparation:'قيد التحضير',in_progress:'قيد التنفيذ',completed:'مكتمل',blocked:'متوقف',recovery:'قيد الدعم',cancelled:'ملغى'}
  return (locale==='fr'?fr:locale==='en'?en:ar)[status]||status
}

function journeyFacts(j:MarketplaceJourney,locale:Locale):Array<{label:string;value:string}>{
  const facts:Array<{label:string;value:string}>=[]
  const add=(label:string,value:string|null)=>{if(value)facts.push({label,value})}
  const money=firstNumber(j.financial_status,['total_amount','amount','gross_amount','expected_amount','captured_amount'])
  const currency=firstText(j.financial_status,['currency_label','currency'])||'MAD'
  if(money!==null)add(locale==='fr'?'Montant':locale==='ar'?'المبلغ':'Amount',`${money.toLocaleString(locale)} ${currency}`)
  if(['product_order','kit_order'].includes(j.journey_type)){
    add(locale==='fr'?'Exécution':locale==='ar'?'التنفيذ':'Fulfillment',firstText(j.fulfillment_status,['shipping_status','fulfillment_status','status','delivery_status']))
    add(locale==='fr'?'Livraison / retrait':locale==='ar'?'التسليم / الاستلام':'Delivery / pickup',firstText(j.fulfillment_status,['delivery_label','pickup_label','delivery_method']))
  }else if(['family_booking','recurring_service'].includes(j.journey_type)){
    add(locale==='fr'?'Date':locale==='ar'?'التاريخ':'Date',dateLabel(j.scheduled_start_at,locale))
    add(locale==='fr'?'Intervenant':locale==='ar'?'المختص':'Professional',firstText(j.fulfillment_status,['provider_display_name','professional_name','team_label']))
    add(locale==='fr'?'Lieu':locale==='ar'?'المكان':'Location',firstText(j.customer_context,['service_address','address_label','city']))
  }else if(j.journey_type==='academy_enrollment'){
    add(locale==='fr'?'Cohorte':locale==='ar'?'المجموعة':'Cohort',firstText(j.fulfillment_status,['cohort_label','cohort_name']))
    add(locale==='fr'?'Éligibilité':locale==='ar'?'الأهلية':'Eligibility',firstText(j.fulfillment_status,['eligibility','eligibility_status']))
    add(locale==='fr'?'Certification':locale==='ar'?'الشهادة':'Certification',firstText(j.fulfillment_status,['certification_status','certificate_status']))
  }else if(['b2b_quotation','hospitality_programme','corporate_benefit'].includes(j.journey_type)){
    add(locale==='fr'?'Périmètre':locale==='ar'?'النطاق':'Scope',firstText(j.customer_context,['scope_label','solution_label','programme_label']))
    add(locale==='fr'?'Proposition':locale==='ar'?'المقترح':'Proposal',firstText(j.fulfillment_status,['proposal_status','quote_status','decision_status']))
  }else if(j.journey_type==='partner_activation'){
    add(locale==='fr'?'Plan':locale==='ar'?'الخطة':'Plan',firstText(j.customer_context,['plan_name','plan_label']))
    add(locale==='fr'?'Activation':locale==='ar'?'التفعيل':'Activation',firstText(j.fulfillment_status,['activation_status','subscription_status']))
  }else if(j.journey_type==='quality_assessment'){
    add(locale==='fr'?'Assessment':locale==='ar'?'التقييم':'Assessment',firstText(j.fulfillment_status,['assessment_status','report_status','validation_status']))
  }
  return facts.slice(0,3)
}

function domainIcon(filter:Filter){
  if(filter==='product_order'||filter==='kit_order')return <PackageCheck/>
  if(filter==='family_booking'||filter==='recurring_service')return <CalendarClock/>
  if(filter==='academy_enrollment')return <GraduationCap/>
  if(filter==='partner_activation')return <Repeat2/>
  if(filter==='quality_assessment')return <ClipboardCheck/>
  if(['b2b_quotation','hospitality_programme','corporate_benefit'].includes(filter))return <Building2/>
  return <ShieldCheck/>
}

export function CustomerPortfolioWorkspace({data}:{data:CustomerPortfolio}){
  const{locale}=data
  const cfg=CONFIG[data.filter]
  const [query,setQuery]=useState(''),[filter,setFilter]=useState('all')
  const filtered=data.filteredJourneys.filter(j=>(filter==='all'||j.status===filter)&&`${j.title} ${j.subtitle||''} ${j.public_reference}`.toLocaleLowerCase(locale).includes(query.trim().toLocaleLowerCase(locale)))
  const statuses=[...new Set(data.filteredJourneys.map(j=>j.status))].map(value=>({value,label:statusLabel(value,locale)}))
  const attention=data.filteredJourneys.filter(j=>['awaiting_customer','blocked','recovery'].includes(j.status))
  const scheduled=data.filteredJourneys.filter(j=>j.scheduled_start_at)
  const docs=data.filteredJourneys.reduce((sum,j)=>sum+j.documents.length,0)
  const openActions=data.filteredJourneys.reduce((sum,j)=>sum+j.actions.filter(a=>['open','in_progress'].includes(a.status)).length,0)
  return <main data-ac-surface="portfolio" className={styles.root} dir={locale==='ar'?'rtl':'ltr'}><div className={styles.portalShell}>
    <section className={styles.domainHero} data-tone={cfg.tone}><div className={styles.domainHeroIcon}>{domainIcon(data.filter)}</div><div><span className={styles.eyebrow}>{cfg.kicker}</span><h1>{cfg.title[locale]}</h1><p>{cfg.description[locale]}</p></div><aside><WalletCards/><span>{locale==='fr'?'Solde Wallet':locale==='ar'?'رصيد المحفظة':'Wallet balance'}</span><strong>{data.wallet?.available_balance.toLocaleString(locale)||0} AC</strong><Link href={`/angelcare-marketplace/${locale}/account/wallet`}>{locale==='fr'?'Voir mon Wallet':locale==='ar'?'عرض المحفظة':'View Wallet'}</Link></aside></section>
    <CustomerPortalNavigation locale={locale}/>
    <section className={styles.domainMetrics}><article><strong>{data.filteredJourneys.length}</strong><span>{locale==='fr'?'dossiers':locale==='ar'?'ملفات':'items'}</span></article><article><strong>{scheduled.length}</strong><span>{locale==='fr'?'planifiés':locale==='ar'?'مجدولة':'scheduled'}</span></article><article data-alert={attention.length>0}><strong>{attention.length}</strong><span>{locale==='fr'?'à surveiller':locale==='ar'?'تحتاج انتباه':'need attention'}</span></article><article data-alert={openActions>0}><strong>{openActions}</strong><span>{locale==='fr'?'actions ouvertes':locale==='ar'?'إجراءات مفتوحة':'open actions'}</span></article><article><strong>{docs}</strong><span>{locale==='fr'?'documents':locale==='ar'?'وثائق':'documents'}</span></article></section>
    <WorkspaceTools locale={locale} query={query} onQuery={setQuery} filter={filter} onFilter={setFilter} options={statuses} count={filtered.length}/><section className={styles.domainPanel}><header><div><span className={styles.eyebrow}>{cfg.kicker}</span><h2>{cfg.title[locale]}</h2></div>{openActions?<Link href={`/angelcare-marketplace/${locale}/account/action-center`}>{locale==='fr'?`${openActions} action(s) à traiter`:locale==='ar'?`${openActions} إجراء`:`${openActions} action(s) to do`}</Link>:null}</header>{filtered.length?<div className={styles.domainList}>{filtered.map(j=>{const facts=journeyFacts(j,locale);const actions=j.actions.filter(a=>['open','in_progress'].includes(a.status));const item=data.catalogItems[j.id];return <article className={styles.domainCard} data-status={j.status} key={j.id}><div className={styles.domainCardTop}><div><span>{statusLabel(j.status,locale)}</span><small>{j.public_reference}</small></div><strong>{j.completion_percent}%</strong></div><h3>{j.title}</h3>{j.subtitle?<p className={styles.domainSubtitle}>{j.subtitle}</p>:null}{item?<Link className={styles.domainCommercePreview} href={`/angelcare-marketplace/${locale}/marketplace/item/${item.slug}`}>{item.media_url?<img src={item.media_url} alt={item.name} loading="lazy"/>:<div className={styles.domainCommercePlaceholder}>{item.kind.slice(0,1).toUpperCase()}</div>}<div><span>{catalogKind(item.kind,locale)}</span><strong>{item.name}</strong><small>{catalogPrice(item,locale)} · {catalogAvailability(item.availability_status,locale)}</small></div></Link>:null}<div className={styles.domainFactGrid}>{facts.map(f=><div key={`${j.id}-${f.label}`}><span>{f.label}</span><strong>{f.value}</strong></div>)}</div><div className={styles.domainCardMeta}><span><CalendarClock/> {dateLabel(j.scheduled_start_at,locale)||dateLabel(j.updated_at,locale)}</span><span><FileText/> {j.documents.length} {locale==='fr'?'document(s)':locale==='ar'?'وثيقة':'document(s)'}</span><span><Award/> {actions.length} {locale==='fr'?'action(s)':locale==='ar'?'إجراء':'action(s)'}</span></div>{j.next_action_label?<div className={styles.nextStep}><span>{locale==='fr'?'Prochaine étape':locale==='ar'?'الخطوة التالية':'Next step'}</span><strong>{j.next_action_label}</strong></div>:null}<footer><div className={styles.progressTrack}><i style={{width:`${j.completion_percent}%`}}/></div><div className={styles.domainCardActions}><Link className={styles.cardSecondary} href={`/angelcare-marketplace/${locale}/account/journeys/${j.id}`}>{locale==='fr'?'Détails':locale==='ar'?'التفاصيل':'Details'}</Link>{item?<Link className={styles.cardPrimary} href={`/angelcare-marketplace/${locale}/marketplace/item/${item.slug}`}>{catalogAction(j,locale)}</Link>:null}</div></footer></article>})}</div>:<div className={styles.emptyState}>{data.filteredJourneys.length?(locale==='fr'?'Aucun résultat pour ces filtres.':locale==='ar'?'لا توجد نتائج لهذه التصفية.':'No results for these filters.'):cfg.empty[locale]}</div>}</section>
  </div></main>
}
