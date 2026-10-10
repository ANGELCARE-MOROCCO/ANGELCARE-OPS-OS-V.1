import Link from '@/angelcare-marketplace/navigation-care-orbit/CareOrbitLink'
import {ArrowRight,BadgeCheck,BookOpen,Box,Check,ChevronDown,CircleHelp,CreditCard,Headphones,PackageCheck,ShieldCheck,ShoppingBag,Sparkles,Star,Truck,Users2} from 'lucide-react'
import type {PublicExperience360,PublicExperienceTruthReport} from '@/angelcare-marketplace/public-experience-authority/types'
import {AdviceLink,FavoriteButton,ProductCommerceActions,ProductMediaGalleryClient,QuickBasketButton,ShareButton} from './StudioProductCommerceActions'
import {formatMoney} from './atomic-runtime-presentation'
import styles from './studio-product-world-runtime.module.css'

type Row=Record<string,unknown>
type VariantGroup={key:string;label:string;values:string[]}
type Locale='fr'|'en'|'ar'

const obj=(value:unknown):Row=>value&&typeof value==='object'&&!Array.isArray(value)?value as Row:{}
const arr=(value:unknown):unknown[]=>Array.isArray(value)?value:[]
const text=(value:unknown)=>typeof value==='string'?value.trim():value==null?'':String(value)
const finite=(value:unknown)=>Number.isFinite(Number(value))?Number(value):null
const lower=(value:unknown)=>text(value).toLowerCase()
const clean=(value:string)=>value.replaceAll('_',' ').replaceAll('-',' ').replace(/\s+/g,' ').trim()
const localeOf=(value:string):Locale=>value==='ar'?'ar':value==='en'?'en':'fr'
const proven=(report:PublicExperienceTruthReport,key:string)=>report.decisions.some(row=>row.key===key&&row.state==='PROVEN')

const copy={
 fr:{product:'Produit',availability:'Disponibilité',available:'Disponible',unavailable:'Indisponible',confirm:'Confirmation finale au panier',price:'Prix',from:'À partir de',seller:'Provenance',marketplace:'Offre publiée sur AngelCare Marketplace',delivery:'Livraison',deliveryDefault:'Modalités confirmées selon la destination et la disponibilité',support:'Support AngelCare',governed:'Informations produit gouvernées',details:'Détails essentiels',decision:'Décider en confiance',description:'Description du produit',specs:'Caractéristiques',reviews:'Avis clients',noReviews:'Aucun avis vérifié publié à ce jour.',faq:'Questions fréquentes',similar:'Produits similaires',similarHint:'Produits canoniques du même univers',accessories:'Accessoires compatibles',bundle:'Souvent achetés ensemble',guide:'Conseils & inspirations',community:'Pour mieux choisir',trustTitle:'Ce que nous pouvons confirmer',brandMission:'Une décision plus claire, sans bruit inutile',brandLead:'Prix, disponibilité, variantes, contenu et preuves sont présentés depuis les autorités réelles du Marketplace.',readGuide:'Voir le conseil',seeProduct:'Voir le produit',add:'Ajouter',noSimilar:'Aucun produit similaire suffisamment compatible n’est publié.',noAccessories:'Aucun accessoire compatible publié.',noBundle:'Aucun pack canonique publié.',verified:'Vérifié',ageMin:'Âge minimum',ageMax:'Âge maximum',languages:'Langues',format:'Format',material:'Matériau',contents:'Contenu',source:'Source',stock:'Stock',stockQty:'en stock',rating:'Note',reviewsCount:'avis vérifiés'},
 en:{product:'Product',availability:'Availability',available:'Available',unavailable:'Unavailable',confirm:'Final confirmation in basket',price:'Price',from:'From',seller:'Provenance',marketplace:'Published on AngelCare Marketplace',delivery:'Delivery',deliveryDefault:'Terms confirmed according to destination and availability',support:'AngelCare support',governed:'Governed product information',details:'Essential details',decision:'Decide with confidence',description:'Product description',specs:'Specifications',reviews:'Customer reviews',noReviews:'No verified review has been published yet.',faq:'Frequently asked questions',similar:'Similar products',similarHint:'Canonical products from the same universe',accessories:'Compatible accessories',bundle:'Frequently bought together',guide:'Advice & inspiration',community:'Choose with more clarity',trustTitle:'What we can confirm',brandMission:'A clearer decision, without unnecessary noise',brandLead:'Price, availability, variants, content and proof are presented from real Marketplace authorities.',readGuide:'View advice',seeProduct:'View product',add:'Add',noSimilar:'No sufficiently compatible similar product is published.',noAccessories:'No compatible accessory is published.',noBundle:'No canonical bundle is published.',verified:'Verified',ageMin:'Minimum age',ageMax:'Maximum age',languages:'Languages',format:'Format',material:'Material',contents:'Contents',source:'Source',stock:'Stock',stockQty:'in stock',rating:'Rating',reviewsCount:'verified reviews'},
 ar:{product:'المنتج',availability:'التوفر',available:'متوفر',unavailable:'غير متوفر',confirm:'التأكيد النهائي في السلة',price:'السعر',from:'ابتداءً من',seller:'المصدر',marketplace:'عرض منشور على AngelCare Marketplace',delivery:'التوصيل',deliveryDefault:'يتم تأكيد الشروط حسب الوجهة والتوفر',support:'دعم AngelCare',governed:'معلومات منتج محكومة',details:'التفاصيل الأساسية',decision:'قرار أكثر وضوحًا',description:'وصف المنتج',specs:'المواصفات',reviews:'آراء العملاء',noReviews:'لا توجد مراجعات موثقة منشورة حتى الآن.',faq:'الأسئلة الشائعة',similar:'منتجات مشابهة',similarHint:'منتجات موثوقة من نفس العالم',accessories:'ملحقات متوافقة',bundle:'يتم شراؤها معًا',guide:'نصائح وإلهام',community:'اختيار أوضح',trustTitle:'ما يمكننا تأكيده',brandMission:'قرار أوضح بدون ضوضاء غير ضرورية',brandLead:'يتم عرض السعر والتوفر والخيارات والمحتوى والأدلة من مصادر Marketplace الحقيقية.',readGuide:'عرض النصيحة',seeProduct:'عرض المنتج',add:'أضف',noSimilar:'لا توجد منتجات مشابهة متوافقة بما يكفي.',noAccessories:'لا توجد ملحقات متوافقة منشورة.',noBundle:'لا توجد حزمة موثوقة منشورة.',verified:'موثّق',ageMin:'العمر الأدنى',ageMax:'العمر الأقصى',languages:'اللغات',format:'التنسيق',material:'المادة',contents:'المحتوى',source:'المصدر',stock:'المخزون',stockQty:'في المخزون',rating:'التقييم',reviewsCount:'مراجعات موثقة'},
} as const

function pick(row:Row,keys:string[]){for(const key of keys){const value=row[key];if(value!==null&&value!==undefined&&value!=='')return value}return null}
function domain(data:PublicExperience360){return obj(data.domainExtension)}
function productExtension(data:PublicExperience360){return obj(domain(data).product)}
function fieldRows(data:PublicExperience360){return data.content.fields.filter(row=>row.formatted||row.value!==null&&row.value!==undefined)}
function hintRows(data:PublicExperience360,hints:string[],limit=12){return fieldRows(data).filter(row=>hints.some(hint=>lower(row.key).includes(hint)||lower(row.label).includes(hint))).slice(0,limit)}
function fieldValue(data:PublicExperience360,hints:string[]){const row=hintRows(data,hints,1)[0];return row?row.formatted||text(row.value):''}
function relationMeta(row:PublicExperience360['relations'][number]){return obj(row.metadata)}
function relationRows(data:PublicExperience360,kinds:string[]){const normalized=kinds.map(lower);return data.relations.filter(row=>normalized.some(kind=>lower(row.kind)===kind)&&row.slug)}
function currentLocale(data:PublicExperience360){return localeOf(data.classification.locale)}
function t(data:PublicExperience360,key:keyof typeof copy.fr){return copy[currentLocale(data)][key]}
function actionAvailable(data:PublicExperience360,id:string){return data.actions.some(row=>row.actionId===id&&row.available)}

function money(amount:number|null,currency:string,label='',locale:string='fr'){return formatMoney(amount,currency,label,locale)}

function normalizedStatus(value:string,locale:Locale){
 const raw=lower(value)
 const map:Record<Locale,Record<string,string>>={
  fr:{available:'Disponible',in_stock:'En stock',active:'Disponible',published:'Disponible',unavailable:'Indisponible',out_of_stock:'Rupture de stock',paused:'Indisponible',closed:'Indisponible',trilingual:'Trilingue',bilingual:'Bilingue',true:'Oui',false:'Non'},
  en:{available:'Available',in_stock:'In stock',active:'Available',published:'Available',unavailable:'Unavailable',out_of_stock:'Out of stock',paused:'Unavailable',closed:'Unavailable',trilingual:'Trilingual',bilingual:'Bilingual',true:'Yes',false:'No'},
  ar:{available:'متوفر',in_stock:'متوفر',active:'متوفر',published:'متوفر',unavailable:'غير متوفر',out_of_stock:'نفد المخزون',paused:'غير متوفر',closed:'غير متوفر',trilingual:'ثلاثي اللغات',bilingual:'ثنائي اللغة',true:'نعم',false:'لا'},
 }
 return map[locale][raw]||clean(value)
}

function languageLabel(value:string,locale:Locale){
 const raw=lower(value).replaceAll('_',' ').replace(/\s+/g,' ').trim()
 const maps:Record<Locale,Record<string,string>>={
  fr:{fr:'Français',en:'Anglais',ar:'Arabe','fr ar':'Français + Arabe','fr en':'Français + Anglais','en ar':'Anglais + Arabe','fr en ar':'Français + Anglais + Arabe',trilingual:'Trilingue',bilingual:'Bilingue'},
  en:{fr:'French',en:'English',ar:'Arabic','fr ar':'French + Arabic','fr en':'French + English','en ar':'English + Arabic','fr en ar':'French + English + Arabic',trilingual:'Trilingual',bilingual:'Bilingual'},
  ar:{fr:'الفرنسية',en:'الإنجليزية',ar:'العربية','fr ar':'الفرنسية + العربية','fr en':'الفرنسية + الإنجليزية','en ar':'الإنجليزية + العربية','fr en ar':'الفرنسية + الإنجليزية + العربية',trilingual:'ثلاثي اللغات',bilingual:'ثنائي اللغة'},
 }
 return maps[locale][raw]||normalizedStatus(value,locale)
}

const fieldLabelDictionary:Record<Locale,Record<string,string>>={
 fr:{age_min:'Âge minimum',age_max:'Âge maximum',variant_languages:'Langues disponibles',language:'Langue',languages:'Langues',material:'Matériau',box_dimensions:'Dimensions',format:'Format',card_count:'Nombre de cartes',cards_count:'Nombre de cartes',contents:'Contenu',content_count:'Contenu',brand:'Marque'},
 en:{age_min:'Minimum age',age_max:'Maximum age',variant_languages:'Available languages',language:'Language',languages:'Languages',material:'Material',box_dimensions:'Dimensions',format:'Format',card_count:'Number of cards',cards_count:'Number of cards',contents:'Contents',content_count:'Contents',brand:'Brand'},
 ar:{age_min:'العمر الأدنى',age_max:'العمر الأقصى',variant_languages:'اللغات المتاحة',language:'اللغة',languages:'اللغات',material:'المادة',box_dimensions:'الأبعاد',format:'التنسيق',card_count:'عدد البطاقات',cards_count:'عدد البطاقات',contents:'المحتوى',content_count:'المحتوى',brand:'العلامة'},
}

function humanLabel(key:string,label:string,locale:Locale){
 const normalized=key.toLowerCase()
 if(label&&lower(label)!==normalized&&label.length>2&&!label.includes('_'))return label
 return fieldLabelDictionary[locale][normalized]||clean(label||key).replace(/^./,m=>m.toUpperCase())
}

function humanValue(key:string,value:string,locale:Locale){
 const raw=value.trim()
 if(!raw)return raw
 if(/language|langue/i.test(key))return raw.split(/[,·|/]+/).map(v=>languageLabel(v.trim(),locale)).filter(Boolean).join(' · ')
 if(/age_min|age_max|âge|age/i.test(key)&&/^\d+(\.\d+)?$/.test(raw))return locale==='ar'?`${raw} سنة`:locale==='en'?`${raw} years`:`${raw} ans`
 if(raw==='laminated_card')return locale==='ar'?'بطاقات مغلفة':locale==='en'?'Laminated cards':'Cartes plastifiées'
 return normalizedStatus(raw,locale)
}

function variantGroups(data:PublicExperience360):VariantGroup[]{
 const locale=currentLocale(data)
 return data.variants.groups.map((raw,index)=>{const row=obj(raw),values=arr(row.values||row.options||row.allowed_values).map(text).filter(Boolean);const key=text(row.group_key||row.key||`variant_${index+1}`),label=humanLabel(key,text(row.label_fr||row.label||row.name||row.group_key),locale);return{key,label,values}}).filter(row=>row.values.length)
}

function uniqueMedia(data:PublicExperience360){const seen=new Set<string>();return data.media.filter(row=>{if(!row.url||seen.has(row.url))return false;seen.add(row.url);return true})}
function mediaAt(data:PublicExperience360,index:number){return uniqueMedia(data)[index]?.url||null}
function linkItem(locale:string,slug:string){return `/angelcare-marketplace/${locale}/marketplace/item/${encodeURIComponent(slug)}`}
function isProductKind(value:string){const kind=lower(value);if(!kind)return false;if(/service|training|course|academy|b2b|programme|subscription_request|quote/.test(kind))return false;return /product|item|kit|game|flash|digital|resource|material|card|physical/.test(kind)||kind==='catalog'}

function recommendationRows(data:PublicExperience360){
 const currentCategory=data.classification.categoryKey
 const relByEntity=new Map<string,Row>()
 for(const relation of data.relations.filter(row=>lower(row.kind)==='recommendation')){if(relation.entityId)relByEntity.set(relation.entityId,relationMeta(relation));if(relation.slug)relByEntity.set(relation.slug,relationMeta(relation))}
 const products=data.recommendations.filter(row=>row.slug&&isProductKind(row.kind))
 const exact=currentCategory?products.filter(row=>{const meta=relByEntity.get(row.id)||relByEntity.get(row.slug)||{};const category=text(meta.category||meta.category_key);return !category||category===currentCategory}):products
 return (exact.length?exact:products).slice(0,6)
}

function relationProductRows(data:PublicExperience360,kinds:string[]){return relationRows(data,kinds).filter(row=>{const kind=text(relationMeta(row).kind);return !kind||isProductKind(kind)}).slice(0,6)}

function availabilityView(data:PublicExperience360){
 const locale=currentLocale(data),status=lower(data.availability.status),qty=data.availability.availableQuantity,positive=['available','in_stock','active','open'],negative=['unavailable','out_of_stock','paused','closed','sold_out']
 if(negative.includes(status))return{available:false,label:normalizedStatus(data.availability.status||'unavailable',locale),detail:data.availability.reason||''}
 if(!positive.includes(status))return{available:false,label:locale==='ar'?'يُرجى التأكيد':locale==='en'?'To be confirmed':'À confirmer',detail:data.availability.reason||copy[locale].confirm}
 if(qty!==null&&qty>0)return{available:true,label:locale==='ar'?'متوفر':locale==='en'?'In stock':'En stock',detail:`${qty} ${copy[locale].stockQty}`}
 return{available:true,label:copy[locale].available,detail:data.availability.reason||copy[locale].confirm}
}

function sellerName(data:PublicExperience360){const commercial=obj(domain(data).commercial);return text(pick(commercial,['seller_name','store_name','merchant_name','vendor_name','brand_name','brand']))||fieldValue(data,['brand','marque','vendor','fabricant'])}
function deliveryText(data:PublicExperience360){const delivery=obj(productExtension(data).delivery),value=pick(delivery,['delivery_label','shipping_label','delivery_delay','shipping_delay','lead_time','fulfillment_label']);return text(value)||t(data,'deliveryDefault')}
function warrantyText(data:PublicExperience360){const ext=productExtension(data),value=ext.warranty;return text(value)||fieldValue(data,['warranty','garantie','return','refund','retour'])}

function specificationRows(data:PublicExperience360){
 const locale=currentLocale(data),rows=arr(productExtension(data).specifications).map(obj)
 const source=rows.length?rows.map(row=>({key:text(row.key||row.label),label:text(row.label||row.key),value:text(row.formatted||row.value||row.description)})):fieldRows(data).filter(row=>!['identity','content','media','pricing','publication','seo'].includes(row.section)).map(row=>({key:row.key,label:row.label,value:row.formatted||text(row.value)}))
 const seen=new Set<string>()
 return source.map(row=>({key:row.key,label:humanLabel(row.key,row.label,locale),value:humanValue(row.key,row.value,locale)})).filter(row=>row.label&&row.value&&!seen.has(row.label)&&(seen.add(row.label),true)).slice(0,14)
}

function decisionMetrics(data:PublicExperience360){
 const locale=currentLocale(data),fields=fieldRows(data),find=(hints:string[])=>fields.find(row=>hints.some(h=>lower(row.key).includes(h)||lower(row.label).includes(h)))
 const candidates=[find(['age_min','âge minimum','minimum age']),find(['age_max','âge maximum','maximum age']),find(['language','langue']),find(['format']),find(['material','matériau']),find(['card_count','cards_count','nombre de cartes','contents'])].filter(Boolean) as typeof fields
 const seen=new Set<string>()
 return candidates.map(row=>({key:row.key,label:humanLabel(row.key,row.label,locale),value:humanValue(row.key,row.formatted||text(row.value),locale)})).filter(row=>row.value&&!seen.has(row.label)&&(seen.add(row.label),true)).slice(0,4)
}

function trustItems(data:PublicExperience360){
 const verified=data.trust.claims.filter(row=>row.status==='verified'||row.status==='active'||Boolean(row.evidenceReference)).map(row=>row.label).filter(Boolean)
 const availability=availabilityView(data)
 return [...new Set([...verified,availability.label])].slice(0,4)
}

function Breadcrumb({data}:{data:PublicExperience360}){const locale=data.classification.locale,category=clean(data.classification.categoryKey||data.classification.businessFamilyKey||'Marketplace');return <nav className={styles.breadcrumb} aria-label="Fil d’Ariane"><Link href={`/angelcare-marketplace/${locale}/marketplace`}>Marketplace</Link><span>/</span><Link href={`/angelcare-marketplace/${locale}/marketplace?category=${encodeURIComponent(data.classification.categoryKey||'')}`}>{category}</Link><span>/</span><strong>{data.identity.name}</strong></nav>}

function ProductIdentity({data,truth}:{data:PublicExperience360;truth:PublicExperienceTruthReport}){const locale=currentLocale(data),metrics=decisionMetrics(data),brand=sellerName(data),rating=proven(truth,'rating')&&data.reviews.rating!==null&&data.reviews.count?data.reviews:null;return <section className={styles.identityPanel}><div className={styles.identityBadges}><span>{clean(data.content.schemaName||t(data,'product'))}</span><span><BadgeCheck/>{t(data,'verified')}</span></div><h1>{data.identity.name}</h1>{brand?<p className={styles.brandLine}>{brand}</p>:null}<p className={styles.heroLead}>{data.identity.shortDescription||data.identity.description||data.content.schemaDescription}</p>{rating?<div className={styles.ratingLine}><Star fill="currentColor"/><strong>{rating.rating?.toFixed(1)}</strong><span>{rating.count} {copy[locale].reviewsCount}</span></div>:null}{metrics.length?<div className={styles.metricGrid}>{metrics.map((row,index)=><div key={`${row.key}:${index}`}><span>{row.label}</span><strong>{row.value}</strong></div>)}</div>:null}</section>}

function PurchasePanel({data}:{data:PublicExperience360}){const a=availabilityView(data),seller=sellerName(data),warranty=warrantyText(data),locale=data.classification.locale;return <aside className={styles.purchasePanel} id="purchase-decision"><div className={styles.priceLine}><span>{t(data,'price')}</span><strong>{money(data.pricing.amount,data.pricing.currency,data.pricing.label,data.classification.locale)}</strong></div><div className={a.available?styles.availabilityGood:styles.availabilityBad}><BadgeCheck/><div><strong>{a.label}</strong>{a.detail?<span>{a.detail}</span>:null}</div></div><div className={styles.purchaseFacts}><div><PackageCheck/><span><small>{t(data,'seller')}</small><strong>{seller||t(data,'marketplace')}</strong></span></div><div><Truck/><span><small>{t(data,'delivery')}</small><strong>{deliveryText(data)}</strong></span></div>{warranty?<div><ShieldCheck/><span><small>{currentLocale(data)==='fr'?'Garantie / retour':currentLocale(data)==='en'?'Warranty / returns':'الضمان / الإرجاع'}</small><strong>{warranty}</strong></span></div>:null}</div><ProductCommerceActions locale={locale} itemSlug={data.identity.slug} variantGroups={variantGroups(data)} maxQuantity={data.availability.availableQuantity} available={a.available} basketEnabled={actionAvailable(data,'basket.add')} checkoutEnabled={actionAvailable(data,'checkout.start')}/><AdviceLink locale={locale} itemSlug={data.identity.slug}/><div className={styles.utilityRow}><FavoriteButton locale={locale} itemId={data.identity.id} itemSlug={data.identity.slug}/><ShareButton locale={locale}/></div></aside>}

function TrustStrip({data}:{data:PublicExperience360}){const icons=[ShieldCheck,Truck,Headphones,BadgeCheck];return <section className={styles.trustStrip} aria-label={t(data,'trustTitle')}>{trustItems(data).map((label,index)=>{const Icon=icons[index%icons.length];return <div key={label}><Icon/><span>{label}</span></div>})}</section>}

function ProductStory({data}:{data:PublicExperience360}){const secondary=mediaAt(data,1);return <section className={styles.storySection} id="description"><div className={styles.sectionHeading}><span>{t(data,'details')}</span><h2>{t(data,'description')}</h2></div><div className={secondary?styles.storyWithMedia:styles.storyNoMedia}><div><p className={styles.storyLead}>{data.identity.description||data.identity.shortDescription||data.content.schemaDescription}</p><div className={styles.storySignals}><div><Sparkles/><strong>{data.content.schemaName}</strong><span>{data.content.schemaDescription||t(data,'governed')}</span></div><div><ShieldCheck/><strong>{t(data,'source')}</strong><span>{data.sourceAuthorities.slice(0,3).map(clean).join(' · ')}</span></div></div></div>{secondary?<img src={secondary} alt={data.identity.name} loading="lazy"/>:null}</div></section>}

function SpecificationSection({data}:{data:PublicExperience360}){const rows=specificationRows(data);if(!rows.length)return null;return <section className={styles.specSection} id="specifications"><div className={styles.sectionHeading}><span>{t(data,'decision')}</span><h2>{t(data,'specs')}</h2></div><div className={styles.specGrid}>{rows.map(row=><div key={`${row.key}:${row.label}`}><span>{row.label}</span><strong>{row.value}</strong></div>)}</div></section>}

function Reviews({data,truth}:{data:PublicExperience360;truth:PublicExperienceTruthReport}){const rating=proven(truth,'rating')&&data.reviews.rating!==null&&data.reviews.count?data.reviews:null;return <section className={styles.reviewSection} id="reviews"><div className={styles.sectionHeading}><span>{t(data,'verified')}</span><h2>{t(data,'reviews')}</h2></div>{rating?<div className={styles.reviewSummary}><div><Star fill="currentColor"/><strong>{rating.rating?.toFixed(1)}</strong></div><p>{rating.count} {copy[currentLocale(data)].reviewsCount}</p></div>:<div className={styles.compactEmpty}><Star/><span>{t(data,'noReviews')}</span></div>}</section>}

function ProductFAQ({data}:{data:PublicExperience360}){const locale=currentLocale(data),faqRows=hintRows(data,['faq','question','answer','usage','compatib','warranty','garantie'],6),questions=faqRows.length?faqRows.map(row=>({q:humanLabel(row.key,row.label,locale),a:humanValue(row.key,row.formatted||text(row.value),locale)})):locale==='fr'?[{q:'Comment choisir la bonne variante ?',a:'Les variantes disponibles proviennent du catalogue actif et sont appliquées au panier.'},{q:'Comment la disponibilité est-elle affichée ?',a:'La page distingue le statut publié de la confirmation finale effectuée au panier.'},{q:'Puis-je demander conseil avant achat ?',a:'Oui. Le parcours de support AngelCare reste accessible depuis le panneau d’achat.'}]:locale==='en'?[{q:'How do I choose the right variant?',a:'Available variants come from the active catalogue and are applied in the basket.'},{q:'How is availability shown?',a:'The page separates the published status from final confirmation in the basket.'},{q:'Can I ask for advice before buying?',a:'Yes. AngelCare support remains available from the purchase panel.'}]:[{q:'كيف أختار الخيار المناسب؟',a:'تأتي الخيارات المتاحة من الكتالوج النشط ويتم تطبيقها في السلة.'},{q:'كيف يتم عرض التوفر؟',a:'تفصل الصفحة بين الحالة المنشورة والتأكيد النهائي داخل السلة.'},{q:'هل يمكنني طلب نصيحة قبل الشراء؟',a:'نعم. يبقى دعم AngelCare متاحاً من لوحة الشراء.'}];return <section className={styles.faqSection} id="faq"><div className={styles.sectionHeading}><span><CircleHelp/></span><h2>{t(data,'faq')}</h2></div><div className={styles.faqList}>{questions.map((row,index)=><details key={`${row.q}:${index}`}><summary>{row.q}<ChevronDown/></summary><p>{row.a}</p></details>)}</div></section>}

function MiniProductVisual({src,name}:{src?:string|null;name:string}){return src?<img src={src} alt={name} loading="lazy"/>:<div className={styles.miniPlaceholder}><ShoppingBag/></div>}

function BundleSection({data}:{data:PublicExperience360}){const rows=relationProductRows(data,['bundle','bundles','bundle_item']).slice(0,3);if(!rows.length)return null;const slugs=[data.identity.slug,...rows.map(row=>row.slug!).filter(Boolean)];return <section className={styles.merchSection}><div className={styles.sectionHeading}><span>{t(data,'decision')}</span><h2>{t(data,'bundle')}</h2></div><div className={styles.bundleGrid}><article className={styles.bundleHero}><MiniProductVisual src={mediaAt(data,0)} name={data.identity.name}/><div><strong>{data.identity.name}</strong><span>{money(data.pricing.amount,data.pricing.currency,data.pricing.label,data.classification.locale)}</span></div></article>{rows.map(row=><article className={styles.bundleHero} key={row.slug}><MiniProductVisual name={row.label}/><div><strong>{row.label}</strong></div></article>)}{actionAvailable(data,'basket.add')?<QuickBasketButton locale={data.classification.locale} slugs={slugs} label={currentLocale(data)==='fr'?'Ajouter le pack':currentLocale(data)==='en'?'Add bundle':'أضف الحزمة'}/>:null}</div></section>}

function AccessorySection({data}:{data:PublicExperience360}){const rows=relationProductRows(data,['cross_sell','accessory','accessories','compatible_accessory']);if(!rows.length)return null;return <section className={styles.merchSection}><div className={styles.sectionHeading}><span>{t(data,'decision')}</span><h2>{t(data,'accessories')}</h2></div><div className={styles.productGrid}>{rows.map(row=><article className={styles.productCard} key={row.slug}><MiniProductVisual name={row.label}/><div><strong>{row.label}</strong><small>{clean(text(relationMeta(row).kind||'Produit'))}</small>{actionAvailable(data,'basket.add')?<QuickBasketButton locale={data.classification.locale} slugs={[row.slug!]} label={t(data,'add')}/>:null}</div></article>)}</div></section>}

function SimilarProducts({data}:{data:PublicExperience360}){const rows=recommendationRows(data);if(!rows.length)return null;return <section className={styles.merchSection} id="similar-products"><div className={styles.sectionHeading}><span>{t(data,'similarHint')}</span><h2>{t(data,'similar')}</h2></div><div className={styles.productGrid}>{rows.map(row=><article className={styles.productCard} key={row.id}><Link href={linkItem(data.classification.locale,row.slug)}><MiniProductVisual src={row.mediaUrl} name={row.name}/><div><strong>{row.name}</strong><span className={styles.cardPrice}>{money(row.priceAmount,row.currency,'',data.classification.locale)}</span></div></Link>{actionAvailable(data,'basket.add')?<QuickBasketButton locale={data.classification.locale} slugs={[row.slug]} label={t(data,'add')}/>:null}</article>)}</div></section>}

function GuideSection({data}:{data:PublicExperience360}){const locale=currentLocale(data),media=uniqueMedia(data).slice(1,4),cards=locale==='fr'?[['Bien choisir la variante','Comparez âge, format, langue et contenu avant d’ajouter au panier.'],['Lire les caractéristiques utiles','Concentrez-vous sur les informations qui changent réellement l’usage au quotidien.'],['Vérifier avant de commander','Prix, disponibilité et options restent reliés aux autorités Marketplace.']]:locale==='en'?[['Choose the right variant','Compare age, format, language and contents before adding to basket.'],['Read useful specifications','Focus on the information that changes everyday use.'],['Verify before ordering','Price, availability and options remain connected to Marketplace authorities.']]:[['اختر الخيار المناسب','قارن العمر والتنسيق واللغة والمحتوى قبل الإضافة إلى السلة.'],['اقرأ المواصفات المهمة','ركز على المعلومات التي تؤثر فعليًا على الاستخدام اليومي.'],['تحقق قبل الطلب','يبقى السعر والتوفر والخيارات مرتبطة بمصادر Marketplace.']];return <section className={styles.guideSection}><div className={styles.sectionHeading}><span>{t(data,'community')}</span><h2>{t(data,'guide')}</h2></div><div className={styles.guideGrid}>{cards.map((card,index)=><article key={card[0]}>{media[index]?<img src={media[index].url} alt="" loading="lazy"/>:<div className={styles.guideIcon}>{index===0?<Users2/>:index===1?<BookOpen/>:<ShieldCheck/>}</div>}<div><strong>{card[0]}</strong><p>{card[1]}</p></div></article>)}</div></section>}

function MissionPanel({data}:{data:PublicExperience360}){return <section className={styles.missionPanel}><div><span>{t(data,'trustTitle')}</span><h2>{t(data,'brandMission')}</h2><p>{t(data,'brandLead')}</p></div><ul><li><Check/>{t(data,'governed')}</li><li><Check/>{availabilityView(data).label}</li><li><Check/>{t(data,'support')}</li><li><Check/>{t(data,'marketplace')}</li></ul></section>}

export async function StudioProductWorldRuntime({data,truthReport,worldProps}:{data:PublicExperience360;truthReport:PublicExperienceTruthReport;worldProps:Record<string,unknown>}){
 if(data.classification.masterDomain!=='b2c_product_digital')return null
 const media=uniqueMedia(data).slice(0,8).map(item=>({id:item.id,url:item.url,alt:item.alt})),badge=fieldValue(data,['badge','best_seller','bestseller']),promotion=proven(truthReport,'promotion')
 return <main className={styles.root} dir={data.classification.locale==='ar'?'rtl':'ltr'} data-ac-product-world-runtime="studio-product-promax-ultra" data-ac-product-world-version={text(worldProps.worldVersion)||'runtime-final'}>
  <div className={styles.shell}><Breadcrumb data={data}/><section className={styles.heroGrid}><ProductMediaGalleryClient name={data.identity.name} media={media} promotion={promotion} badge={badge} locale={data.classification.locale}/><ProductIdentity data={data} truth={truthReport}/><PurchasePanel data={data}/></section><TrustStrip data={data}/><nav className={styles.anchorNav} aria-label={t(data,'details')}><a href="#description">{t(data,'description')}</a><a href="#specifications">{t(data,'specs')}</a><a href="#reviews">{t(data,'reviews')}</a><a href="#faq">{t(data,'faq')}</a></nav><ProductStory data={data}/><SpecificationSection data={data}/><Reviews data={data} truth={truthReport}/><ProductFAQ data={data}/><BundleSection data={data}/><AccessorySection data={data}/><SimilarProducts data={data}/><GuideSection data={data}/><MissionPanel data={data}/></div><div className={styles.mobileSticky}><strong>{money(data.pricing.amount,data.pricing.currency,data.pricing.label,data.classification.locale)}</strong><a href="#purchase-decision">{currentLocale(data)==='fr'?'Acheter':currentLocale(data)==='en'?'Buy':'شراء'} <ArrowRight/></a></div>
 </main>
}
