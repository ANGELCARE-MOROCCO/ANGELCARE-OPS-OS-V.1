import Link from 'next/link'
import {
  ArrowRight, BadgeCheck, BookOpen, Box, Check, CheckCircle2, ChevronDown, ChevronRight,
  CircleHelp, Clock3, CreditCard, Headphones, Heart, MapPin, PackageCheck, RefreshCcw,
  Search, ShieldCheck, ShoppingBag, ShoppingCart, Sparkles, Star, Truck, Users2, Zap,
} from 'lucide-react'
import type {PublicExperience360,PublicExperienceTruthReport} from '../../types'
import {LiveCountdown} from '@/angelcare-marketplace/studio-homepage-pro-max/components/LiveCountdown'
import {AdviceLink,FavoriteButton,ProductCommerceActions,ProductMediaGalleryClient,QuickBasketButton,ShareButton} from './ProductCommerceActions'
import {PRODUCT_PRO_MAX_WORLD01_ID,PRODUCT_PRO_MAX_WORLD01_TEMPLATE_KEY} from './contract'
import styles from './product-pro-max-world01.module.css'

type Row=Record<string,unknown>
type VariantGroup={key:string;label:string;values:string[]}

const obj=(value:unknown):Row=>value&&typeof value==='object'&&!Array.isArray(value)?value as Row:{}
const arr=(value:unknown):unknown[]=>Array.isArray(value)?value:[]
const text=(value:unknown)=>typeof value==='string'?value.trim():value==null?'':String(value)
const finite=(value:unknown)=>Number.isFinite(Number(value))?Number(value):null
const lower=(value:unknown)=>text(value).toLowerCase()
const cleanLabel=(value:string)=>value.replaceAll('_',' ').replaceAll('-',' ').replace(/\s+/g,' ').trim()
const proven=(report:PublicExperienceTruthReport,key:string)=>report.decisions.some(row=>row.key===key&&row.state==='PROVEN')
const money=(amount:number|null,currency:string,label='')=>amount===null?(label||'Sur devis'):`${new Intl.NumberFormat('fr-MA',{maximumFractionDigits:2}).format(amount)} ${currency||'MAD'}`

function pick(row:Row,keys:string[]){for(const key of keys){const value=row[key];if(value!==null&&value!==undefined&&value!=='')return value}return null}
function deepPick(rows:Row[],keys:string[]){for(const row of rows){const value=pick(row,keys);if(value!==null)return value}return null}
function domain(data:PublicExperience360){return obj(data.domainExtension)}
function fieldRows(data:PublicExperience360){return data.content.fields.filter(row=>row.formatted||row.value!==null&&row.value!==undefined)}
function hintRows(data:PublicExperience360,hints:string[],limit=12){return fieldRows(data).filter(row=>hints.some(hint=>lower(row.key).includes(hint)||lower(row.label).includes(hint))).slice(0,limit)}
function fieldValue(data:PublicExperience360,hints:string[]){const row=hintRows(data,hints,1)[0];return row?row.formatted||text(row.value):''}
function productExtension(data:PublicExperience360){return obj(domain(data).product)}
function variantGroups(data:PublicExperience360):VariantGroup[]{return data.variants.groups.map((raw,index)=>{const row=obj(raw),values=arr(row.values||row.options||row.allowed_values).map(text).filter(Boolean);return{key:text(row.group_key||row.key||`variant_${index+1}`),label:text(row.label_fr||row.label||row.name||row.group_key)||`Option ${index+1}`,values}}).filter(row=>row.values.length)}
function relationRows(data:PublicExperience360,kinds:string[]){return data.relations.filter(row=>kinds.includes(row.kind)&&row.slug)}
function recommendationRows(data:PublicExperience360){return data.recommendations.filter(row=>row.slug)}
function relationMeta(row:PublicExperience360['relations'][number]){return obj(row.metadata)}
function sourceRows(value:unknown){return arr(value).map(obj)}

function campaignData(data:PublicExperience360,truth:PublicExperienceTruthReport){
 const ext=domain(data),commercial=obj(ext.commercial),experience=obj(ext.experience),fields=obj(ext.fields)
 const sources=[commercial,experience,fields]
 if(!proven(truth,'promotion'))return null
 const message=text(deepPick(sources,['promotion_label','promotion_message','campaign_label','offer_label','promo_label','sale_label']))||'Offre spéciale AngelCare'
 const endsAt=text(deepPick(sources,['offer_ends_at','ends_at','promotion_ends_at','campaign_ends_at','valid_until']))||undefined
 const discount=text(deepPick(sources,['discount_label','discount','promotion_discount','discount_percentage','discount_percent']))
 return{message,endsAt,discount}
}

function compareAt(data:PublicExperience360,truth:PublicExperienceTruthReport){
 if(!proven(truth,'promotion')||data.pricing.amount===null)return null
 const ext=domain(data),commercial=obj(ext.commercial),experience=obj(ext.experience),fields=obj(ext.fields)
 const value=finite(deepPick([commercial,experience,fields],['compare_at_price','compareAtPrice','reference_price','list_price','old_price','price_before']))
 return value!==null&&value>data.pricing.amount?value:null
}

function benefitRows(data:PublicExperience360){
 const candidates=[...hintRows(data,['benefit','avantage','feature','usage','comfort','safety','compact','light','age'],8)]
 if(candidates.length)return candidates.slice(0,5)
 return fieldRows(data).slice(0,5)
}

function specificationRows(data:PublicExperience360){
 const product=productExtension(data),rows=sourceRows(product.specifications)
 if(rows.length)return rows.slice(0,12).map(row=>({key:text(row.key||row.label),label:text(row.label||row.key),value:text(row.formatted||row.value||row.description)})).filter(row=>row.label&&row.value)
 return fieldRows(data).filter(row=>!['identity','content','media','pricing','publication','seo'].includes(row.section)).slice(0,12).map(row=>({key:row.key,label:row.label,value:row.formatted||text(row.value)}))
}

function trustLabels(data:PublicExperience360){
 const verified=data.trust.claims.filter(row=>row.status==='verified'||row.status==='active'||Boolean(row.evidenceReference)).map(row=>row.label).filter(Boolean)
 return [...new Set([...verified,'Paiement sécurisé','Disponibilité revérifiée','Support AngelCare'])].slice(0,5)
}

function mediaAt(data:PublicExperience360,index:number){return data.media[index]?.url||data.media[0]?.url||null}
function linkItem(locale:string,slug:string){return `/angelcare-marketplace/${locale}/marketplace/item/${encodeURIComponent(slug)}`}

function UrgencyCampaignBar({data,truth}:{data:PublicExperience360;truth:PublicExperienceTruthReport}){
 const campaign=campaignData(data,truth)
 return <section className={styles.urgencyBar} data-ac-product-world-section="P00"><div>{campaign?<><Sparkles/><strong>{campaign.message}</strong>{campaign.discount?<span>{campaign.discount}</span>:null}</>:<><Sparkles/><strong>AngelCare · Sélection famille & quotidien</strong></>}</div>{campaign?.endsAt?<LiveCountdown endsAt={campaign.endsAt}/>:<span className={styles.safeSignal}>Offres vérifiées uniquement</span>}</section>
}

function CommerceHeader({data}:{data:PublicExperience360}){const locale=data.classification.locale;return <>
 <header className={styles.commerceHeader} data-ac-product-world-section="P01">
  <Link className={styles.logoLink} href={`/angelcare-marketplace/${locale}/marketplace`} aria-label="AngelCare Marketplace"><img src="/brand/angelcare-official-user-transparent.png" alt="AngelCare"/></Link>
  <form className={styles.searchBox} action={`/angelcare-marketplace/${locale}/marketplace`} method="get"><Search/><input name="q" aria-label="Rechercher" placeholder="Rechercher un produit, une marque, une catégorie…"/><button type="submit" aria-label="Lancer la recherche"><Search/></button></form>
  <div className={styles.headerUtility}><Link href={`/angelcare-marketplace/${locale}/account/support`}><Headphones/><span>Service client</span></Link><Link href={`/angelcare-marketplace/${locale}/account`}><Users2/><span>Mon compte</span></Link><Link href={`/angelcare-marketplace/${locale}/account`}><Heart/><span>Mes favoris</span></Link><Link href={`/angelcare-marketplace/${locale}/basket`}><ShoppingCart/><span>Mon panier</span></Link><Link className={styles.partnerCta} href={`/angelcare-marketplace/${locale}/partner-os/contact`}>Devenir partenaire</Link></div>
 </header>
 <nav className={styles.taxonomyNav} data-ac-product-world-section="P02" aria-label="Univers AngelCare">{['Univers bébé','Jouets et jeux','Mode','Hygiène & soin','Maison et sécurité','Sorties et voyage','Puériculture','Nos marques','Promotions'].map((label,index)=><Link key={label} href={`/angelcare-marketplace/${locale}/marketplace?nav=${index}`}>{label}<ChevronDown/></Link>)}</nav>
 </>}

function Breadcrumb({data}:{data:PublicExperience360}){const locale=data.classification.locale,category=cleanLabel(data.classification.categoryKey||data.classification.businessFamilyKey||'Marketplace');return <nav className={styles.breadcrumb} data-ac-product-world-section="P03" aria-label="Fil d’Ariane"><Link href={`/angelcare-marketplace/${locale}/marketplace`}>Accueil</Link><ChevronRight/><Link href={`/angelcare-marketplace/${locale}/marketplace?category=${encodeURIComponent(data.classification.categoryKey||'')}`}>{category}</Link><ChevronRight/><span>{data.identity.name}</span></nav>}

function ProductMediaGallery({data,truth}:{data:PublicExperience360;truth:PublicExperienceTruthReport}){const media=data.media.slice(0,8).map(item=>({id:item.id,url:item.url,alt:item.alt})),promotion=proven(truth,'promotion'),badge=fieldValue(data,['badge','merchandising','best_seller','bestseller']);return <ProductMediaGalleryClient name={data.identity.name} media={media} promotion={promotion} badge={badge}/>}

function ProductIdentityPanel({data,truth}:{data:PublicExperience360;truth:PublicExperienceTruthReport}){const benefits=benefitRows(data),rating=proven(truth,'rating')&&data.reviews.rating!==null&&data.reviews.count?data.reviews:null,brand=fieldValue(data,['brand','marque','vendor','fabricant']);return <section className={styles.identityPanel} data-ac-product-world-section="P05">
 <div className={styles.badgeLine}>{proven(truth,'promotion')?<span>Promotion vérifiée</span>:null}{data.availability.status?<span className={styles.blueBadge}>{cleanLabel(data.availability.status)}</span>:null}</div>
 <h1>{data.identity.name}</h1>{brand?<p className={styles.brandLine}>Par <strong>{brand}</strong></p>:null}
 {rating?<div className={styles.ratingLine}><span className={styles.stars}>★★★★★</span><strong>{rating.rating?.toFixed(1)}</strong><Link href="#avis">({rating.count} avis)</Link></div>:null}
 {data.identity.shortDescription?<p className={styles.identityLead}>{data.identity.shortDescription}</p>:null}
 <ul className={styles.benefitList}>{benefits.map(row=><li key={row.key}><CheckCircle2/><span>{row.formatted||text(row.value)}</span></li>)}</ul>
 <div className={styles.featureGrid}>{benefits.slice(0,4).map((row,index)=><div key={row.key}><span>{[Sparkles,PackageCheck,ShieldCheck,Heart][index]?null:null}{index===0?<Sparkles/>:index===1?<Box/>:index===2?<ShieldCheck/>:<Heart/>}</span><strong>{row.label}</strong><small>{row.formatted||text(row.value)}</small></div>)}</div>
 </section>}

function PurchaseDecisionBox({data,truth}:{data:PublicExperience360;truth:PublicExperienceTruthReport}){
 const comparison=compareAt(data,truth),current=data.pricing.amount,currency=data.pricing.currency||'MAD',available=!['unavailable','out_of_stock','closed','paused'].includes(lower(data.availability.status)),scarcity=proven(truth,'scarcity')?data.availability.availableQuantity:null,fulfillment=obj(domain(data).fulfillment),delivery=text(pick(fulfillment,['delivery_label','delivery_estimate','shipping_label','lead_time','delivery_window']))||'Livraison selon destination et éligibilité',groups=variantGroups(data),savings=comparison!==null&&current!==null?comparison-current:null
 return <aside className={styles.purchaseBox} id="purchase-decision" data-ac-product-world-section="P06">
  <div className={styles.priceHead}>{comparison!==null?<del>{money(comparison,currency)}</del>:null}{savings!==null&&savings>0?<span>Économisez {money(savings,currency)}</span>:null}</div>
  <strong className={styles.currentPrice}>{money(current,currency,data.pricing.label)}</strong>
  <div className={styles.stockLine} data-available={available}><CheckCircle2/><span>{available?(scarcity!==null&&scarcity<=10?`En stock · ${scarcity} disponible${scarcity>1?'s':''}`:'En stock / disponible'):'Indisponible actuellement'}</span></div>
  <div className={styles.deliveryBox}><Truck/><div><strong>{delivery}</strong><small>{data.availability.authority?`Vérifié par ${cleanLabel(data.availability.authority)}`:'Disponibilité revérifiée avant commande'}</small></div></div>
  <ProductCommerceActions locale={data.classification.locale} itemSlug={data.identity.slug} variantGroups={groups} maxQuantity={scarcity} available={available}/>
  <AdviceLink locale={data.classification.locale} itemSlug={data.identity.slug}/><div className={styles.secondaryPurchaseActions}><FavoriteButton locale={data.classification.locale} itemId={data.identity.id} itemSlug={data.identity.slug}/><ShareButton/></div>
  <div className={styles.purchaseTrust}><span><ShieldCheck/>Paiement sécurisé</span><span><RefreshCcw/>Retours selon politique</span><span><Headphones/>Service client</span></div>
 </aside>
}

function AssuranceProofStrip({data}:{data:PublicExperience360}){const labels=trustLabels(data);return <section className={styles.assuranceStrip} data-ac-product-world-section="P07">{labels.map((label,index)=><div key={label}>{index===0?<Truck/>:index===1?<Star/>:index===2?<ShieldCheck/>:index===3?<RefreshCcw/>:<Headphones/>}<span>{label}</span></div>)}</section>}

function LifestyleBenefitBanner({data}:{data:PublicExperience360}){const left=mediaAt(data,1),right=mediaAt(data,2),benefits=benefitRows(data).slice(0,4);return <section className={styles.lifestyleBanner} data-ac-product-world-section="P08">{left?<img src={left} alt="" loading="lazy"/>:<div/>}<div className={styles.lifestyleCopy}><h2>Profiter du quotidien avec plus de confiance</h2><div>{benefits.map((row,index)=><span key={row.key}>{index===0?<Sparkles/>:index===1?<Heart/>:index===2?<PackageCheck/>:<ShieldCheck/>}<b>{row.label}</b></span>)}</div></div>{right?<img src={right} alt="" loading="lazy"/>:<div/>}</section>}

function AnchorTabs(){return <nav className={styles.anchorTabs} data-ac-product-world-section="P09" aria-label="Navigation produit"><a href="#description">Description</a><a href="#caracteristiques">Caractéristiques</a><a href="#avis">Avis</a><a href="#faq">Questions fréquentes</a></nav>}

function ProductDescription({data}:{data:PublicExperience360}){const media=mediaAt(data,3)||mediaAt(data,1),benefits=benefitRows(data).slice(0,4);return <section className={styles.descriptionPanel} id="description" data-ac-product-world-section="P10"><h2>Description du produit</h2><p>{data.identity.description||data.identity.shortDescription||'Les informations publiées sont issues du dossier produit canonique AngelCare.'}</p>{media?<img src={media} alt="" loading="lazy"/>:null}<div className={styles.useCases}>{benefits.map((row,index)=><span key={row.key}>{index===0?<MapPin/>:index===1?<PackageCheck/>:index===2?<Sparkles/>:<Heart/>}<b>{row.label}</b></span>)}</div></section>}

function TechnicalSpecifications({data}:{data:PublicExperience360}){const rows=specificationRows(data);return <section className={styles.specPanel} id="caracteristiques" data-ac-product-world-section="P11"><h2>Caractéristiques techniques</h2>{rows.length?<dl>{rows.map(row=><div key={row.key}><dt>{row.label}</dt><dd>{row.value}</dd></div>)}</dl>:<div className={styles.emptyTruth}>Aucune caractéristique publique supplémentaire n’est disponible.</div>}</section>}

function ReviewSummaryAndFeed({data,truth}:{data:PublicExperience360;truth:PublicExperienceTruthReport}){const ok=proven(truth,'rating')&&data.reviews.rating!==null&&Boolean(data.reviews.count);return <section className={styles.reviewPanel} id="avis" data-ac-product-world-section="P12"><h2>Avis clients</h2>{ok?<><div className={styles.reviewScore}><strong>{data.reviews.rating?.toFixed(1)} <small>sur 5</small></strong><span>★★★★★</span><p>Basé sur {data.reviews.count} avis publiés</p></div><div className={styles.reviewTruthCard}><BadgeCheck/><div><strong>Avis issus de l’autorité publique</strong><p>Le thème ne fabrique aucun témoignage, nom client ou photo.</p></div></div></>:<div className={styles.emptyTruth}>Aucun avis publié vérifiable pour ce produit.</div>}</section>}

function ProductFAQ({data}:{data:PublicExperience360}){const faqRows=hintRows(data,['faq','question','answer','usage','compatib','warranty','garantie'],6);const questions=faqRows.length?faqRows.map(row=>({q:row.label,a:row.formatted||text(row.value)})):[{q:'Comment choisir la bonne variante ?',a:'Les variantes disponibles sont affichées depuis le dossier canonique du produit.'},{q:'Comment la disponibilité est-elle vérifiée ?',a:'Le prix et la disponibilité sont revérifiés par les autorités Marketplace avant la confirmation.'},{q:'Puis-je demander conseil ?',a:'Utilisez le parcours de support AngelCare depuis cette page.'}];return <section className={styles.faqPanel} id="faq" data-ac-product-world-section="P13"><h2>Questions fréquentes</h2>{questions.map((row,index)=><details key={`${row.q}:${index}`}><summary>{row.q}<ChevronDown/></summary><p>{row.a}</p></details>)}</section>}

function MiniProductVisual({src,name}:{src?:string|null;name:string}){return src?<img src={src} alt={name} loading="lazy"/>:<div className={styles.miniPlaceholder}><ShoppingBag/></div>}

function BundleCrossSell({data}:{data:PublicExperience360}){const relations=relationRows(data,['bundle']).slice(0,2);if(!relations.length)return <section className={styles.bundlePanel} data-ac-product-world-section="P14"><h2>Souvent achetés ensemble</h2><div className={styles.emptyTruth}>Aucun pack canonique ou ensemble compatible n’est publié pour le moment.</div></section>;const slugs=[data.identity.slug,...relations.map(row=>row.slug!).filter(Boolean)];return <section className={styles.bundlePanel} data-ac-product-world-section="P14"><h2>Souvent achetés ensemble</h2><div className={styles.bundleRow}><div className={styles.bundleItem}><MiniProductVisual src={mediaAt(data,0)} name={data.identity.name}/><strong>{data.identity.name}</strong><span>{money(data.pricing.amount,data.pricing.currency,data.pricing.label)}</span></div>{relations.map(row=><div className={styles.bundleItem} key={row.slug}><b className={styles.plus}>+</b><MiniProductVisual name={row.label}/><strong>{row.label}</strong></div>)}<div className={styles.bundleAction}><span>Composition vérifiée au panier</span><QuickBasketButton locale={data.classification.locale} slugs={slugs} label="Ajouter le pack"/></div></div></section>}

function CompatibleAccessories({data}:{data:PublicExperience360}){const rows=relationRows(data,['cross_sell']).slice(0,4);return <section className={styles.accessoryPanel} data-ac-product-world-section="P15"><header><h2>Accessoires compatibles</h2><span>Relations canoniques</span></header>{rows.length?<div className={styles.productRail}>{rows.map(row=><article key={row.slug}><MiniProductVisual name={row.label}/><strong>{row.label}</strong><small>{cleanLabel(text(relationMeta(row).kind||'accessoire'))}</small><QuickBasketButton locale={data.classification.locale} slugs={[row.slug!]} label="Ajouter"/></article>)}</div>:<div className={styles.emptyTruth}>Aucun accessoire compatible n’est publié.</div>}</section>}

function SimilarProducts({data}:{data:PublicExperience360}){const rows=recommendationRows(data).slice(0,4);return <section className={styles.similarPanel} data-ac-product-world-section="P16"><header><h2>Produits similaires</h2><span>Suggestions canoniques</span></header>{rows.length?<div className={styles.productRail}>{rows.map(row=><article key={row.id}><Link href={linkItem(data.classification.locale,row.slug)}><MiniProductVisual src={row.mediaUrl} name={row.name}/><strong>{row.name}</strong></Link><span className={styles.railPrice}>{money(row.priceAmount,row.currency)}</span><QuickBasketButton locale={data.classification.locale} slugs={[row.slug]} label="Ajouter"/></article>)}</div>:<div className={styles.emptyTruth}>Aucune recommandation similaire publiée.</div>}</section>}

function ParentGuideRail({data}:{data:PublicExperience360}){const locale=data.classification.locale,media=[mediaAt(data,1),mediaAt(data,2),mediaAt(data,3)];const titles=['Bien choisir selon votre quotidien','Comprendre les caractéristiques utiles','Conseils pour profiter durablement du produit'];return <section className={styles.guidePanel} data-ac-product-world-section="P17"><h2>Conseils & inspirations pour les parents</h2><div>{titles.map((title,index)=><article key={title}><MiniProductVisual src={media[index]} name={title}/><strong>{title}</strong><Link href={`/angelcare-marketplace/${locale}/marketplace?guide=${index}`}>Lire le guide <ArrowRight/></Link></article>)}</div></section>}

function CommunityJoinPanel({data}:{data:PublicExperience360}){const locale=data.classification.locale;return <section className={styles.communityPanel} data-ac-product-world-section="P18"><div className={styles.communityMosaic}>{data.media.slice(0,4).map((item,index)=><img key={item.id||index} src={item.url} alt="" loading="lazy"/>)}</div><div><h2>Rejoignez la communauté AngelCare</h2><p>Des repères, des conseils et des expériences pour accompagner les familles dans leurs décisions.</p><Link href={`/angelcare-marketplace/${locale}/account`}>Nous rejoindre <ArrowRight/></Link></div></section>}

function MissionBrandPanel({data}:{data:PublicExperience360}){const media=mediaAt(data,0);return <section className={styles.missionPanel} data-ac-product-world-section="P19"><div><h2>Parce que chaque choix compte dans la vie de famille.</h2><ul><li><Check/>Des produits et informations gouvernés</li><li><Check/>Une disponibilité revérifiée</li><li><Check/>Des parcours d’achat reliés au Marketplace</li><li><Check/>Un accompagnement AngelCare</li></ul></div>{media?<img src={media} alt="" loading="lazy"/>:null}</section>}

function SecondaryTrustStrip({data}:{data:PublicExperience360}){return <section className={styles.secondaryTrust} data-ac-product-world-section="P20">{trustLabels(data).map((label,index)=><div key={label}>{index===0?<CreditCard/>:index===1?<Truck/>:index===2?<RefreshCcw/>:index===3?<Headphones/>:<ShieldCheck/>}<span>{label}</span></div>)}</section>}

function MegaCommerceFooter({data}:{data:PublicExperience360}){const locale=data.classification.locale;return <footer className={styles.footer} data-ac-product-world-section="P21"><div className={styles.footerBrand}><img src="/brand/angelcare-official-user-transparent.png" alt="AngelCare"/><div className={styles.socialDots}><span>f</span><span>◎</span><span>▶</span><span>in</span></div></div><div><strong>Nos univers</strong><Link href={`/angelcare-marketplace/${locale}/marketplace`}>Maison</Link><Link href={`/angelcare-marketplace/${locale}/marketplace`}>Mode</Link><Link href={`/angelcare-marketplace/${locale}/marketplace`}>Jouets</Link><Link href={`/angelcare-marketplace/${locale}/marketplace`}>Sorties</Link></div><div><strong>Aide & contact</strong><Link href={`/angelcare-marketplace/${locale}/account/support`}>Centre d’aide</Link><Link href={`/angelcare-marketplace/${locale}/account/orders`}>Suivi de commande</Link><Link href={`/angelcare-marketplace/${locale}/account/support`}>Retours et remboursements</Link><Link href={`/angelcare-marketplace/${locale}/account/support`}>Nous contacter</Link></div><div><strong>À propos</strong><Link href={`/angelcare-marketplace/${locale}/marketplace`}>Notre mission</Link><Link href={`/angelcare-marketplace/${locale}/marketplace`}>Nos engagements</Link><Link href={`/angelcare-marketplace/${locale}/partner-os/contact`}>Partenaires</Link></div><div><strong>Nos applications</strong><div className={styles.storeBadges}><span><b>App Store</b><small>Application AngelCare</small></span><span><b>Google Play</b><small>Application AngelCare</small></span></div><strong className={styles.newsletterTitle}>Restez informé</strong><p>Actualités Marketplace et conseils famille.</p><Link className={styles.newsletterLink} href={`/angelcare-marketplace/${locale}/account`}>Créer mon espace</Link></div><div className={styles.footerLegal}><span>© AngelCare</span><Link href={`/angelcare-marketplace/${locale}/marketplace`}>Conditions générales</Link><Link href={`/angelcare-marketplace/${locale}/marketplace`}>Politique de confidentialité</Link><span className={styles.footerSignature}>Des choix plus simples, un quotidien plus doux.</span></div></footer>}

export async function ProductProMaxWorld01({data,truthReport,authority}:{data:PublicExperience360;truthReport:PublicExperienceTruthReport;authority:string}){
 if(data.classification.masterDomain!=='b2c_product_digital')return null
 return <main className={styles.root} dir={data.classification.locale==='ar'?'rtl':'ltr'} data-ac-public-experience="product-pro-max-world-01" data-ac-public-experience-authority={authority} data-ac-product-world-id={PRODUCT_PRO_MAX_WORLD01_ID} data-ac-product-world-key={PRODUCT_PRO_MAX_WORLD01_TEMPLATE_KEY}>
  <UrgencyCampaignBar data={data} truth={truthReport}/><CommerceHeader data={data}/><div className={styles.shell}><Breadcrumb data={data}/><div className={styles.decisionGrid}><ProductMediaGallery data={data} truth={truthReport}/><ProductIdentityPanel data={data} truth={truthReport}/><PurchaseDecisionBox data={data} truth={truthReport}/></div><AssuranceProofStrip data={data}/><LifestyleBenefitBanner data={data}/><AnchorTabs/><div className={styles.detailMatrix}><ProductDescription data={data}/><TechnicalSpecifications data={data}/><ReviewSummaryAndFeed data={data} truth={truthReport}/><ProductFAQ data={data}/></div><div className={styles.merchMatrix}><BundleCrossSell data={data}/><CompatibleAccessories data={data}/><SimilarProducts data={data}/></div><div className={styles.editorialMatrix}><ParentGuideRail data={data}/><CommunityJoinPanel data={data}/><MissionBrandPanel data={data}/></div><SecondaryTrustStrip data={data}/></div><MegaCommerceFooter data={data}/><div className={styles.mobileStickyPurchase}><strong>{money(data.pricing.amount,data.pricing.currency,data.pricing.label)}</strong><a href="#purchase-decision"><ShoppingCart/>Ajouter</a><a href="#purchase-decision"><Zap/>Acheter</a></div>
 </main>
}
