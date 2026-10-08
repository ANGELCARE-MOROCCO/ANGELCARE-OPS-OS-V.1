import Link from 'next/link'
import {ArrowRight,CheckCircle2,Compass,Filter,Layers3,Search,ShieldCheck,Sparkles,TrendingUp} from 'lucide-react'
import type {StorefrontExperience} from '@/angelcare-marketplace/catalog-discovery/types'
import {CatalogCard} from '@/angelcare-marketplace/catalog-discovery/components/CatalogCard'
import {canonicalStorefrontWorld} from '../canonical-worlds'
import {storefrontMerchandisingPlan} from '../storefront-intelligence'
import styles from './canonical-atomic-storefront-world.module.css'

const labels={
 fr:{featured:'À découvrir maintenant',inventory:'Tout explorer',collections:'Collections guidées',filters:'Affiner',search:'Que recherchez-vous ?',open:'Explorer tout',proof:'Données Marketplace live',final:'Continuer votre découverte',available:'offres disponibles'},
 en:{featured:'Discover now',inventory:'Explore everything',collections:'Guided collections',filters:'Refine',search:'What are you looking for?',open:'Explore all',proof:'Live Marketplace data',final:'Continue discovering',available:'available offers'},
 ar:{featured:'اكتشف الآن',inventory:'استكشف الكل',collections:'مجموعات موجهة',filters:'تصفية',search:'ماذا تبحث؟',open:'استكشف الكل',proof:'بيانات السوق المباشرة',final:'تابع الاستكشاف',available:'عروض متاحة'},
} as const

function available(experience:StorefrontExperience){return experience.items.filter(item=>item.availability_status!=='unavailable')}
function route(locale:string,key:string){return `/angelcare-marketplace/${locale}/marketplace/search?category=${encodeURIComponent(key)}`}

export function CanonicalAtomicStorefrontWorld({experience,density}:{experience:StorefrontExperience;density?:'premium'|'commerce'|'hyper_commerce'|'festival'|null}){
 const recipe=canonicalStorefrontWorld(experience.key)
 if(!recipe)return null
 const effectiveDensity=density||recipe.density
 const copy=labels[experience.locale],plan=storefrontMerchandisingPlan(experience,effectiveDensity),live=available(experience),featured=(experience.featured.length?experience.featured:live).slice(0,plan.featuredLimit),inventory=live.slice(0,plan.inventoryLimit),collections=experience.collections.slice(0,plan.collectionLimit),facets=Object.entries(experience.facets).slice(0,10)
 const moduleSet=new Set(recipe.modules)
 return <main className={styles.world} data-ac-pea-built-in-storefront={recipe.id} data-ac-storefront-key={experience.key} data-density={effectiveDensity} data-accent={recipe.accent} dir={experience.locale==='ar'?'rtl':'ltr'}>
  <section className={styles.hero}>
   <div className={styles.heroCopy}><span className={styles.eyebrow}><Sparkles size={15}/> ANGELCARE · {experience.key.replaceAll('-',' ').toUpperCase()}</span><h1>{experience.hero.title||recipe.headline}</h1><p>{experience.hero.lead||recipe.headline}</p><form action={`/angelcare-marketplace/${experience.locale}/marketplace/search`} className={styles.search}><Search size={19}/><input name="q" placeholder={copy.search}/><input type="hidden" name="category" value={experience.key}/><button type="submit">{copy.open}<ArrowRight size={15}/></button></form><div className={styles.heroSignals}><span><CheckCircle2 size={15}/><b>{experience.items.length}</b> {copy.available}</span><span><ShieldCheck size={15}/>{copy.proof}</span><span><Layers3 size={15}/>{collections.length} {copy.collections.toLowerCase()}</span></div></div>
   <aside className={styles.heroPanel}><div className={styles.orbit}><Sparkles/><strong>PRO MAX</strong><span>{effectiveDensity.replaceAll('_',' ')}</span></div><div className={styles.heroMetric}><span>WORLD</span><strong>{recipe.name}</strong></div><div className={styles.heroMetric}><span>AUTORITÉ</span><strong>Storefront360 canonique</strong></div><div className={styles.heroMetric}><span>FALLBACK</span><strong>Renderer natif</strong></div></aside>
  </section>

  {featured.length?<section className={styles.rail}><header><div><span>CURATED LIVE</span><h2>{copy.featured}</h2><p>{recipe.headline}</p></div><Link href={route(experience.locale,experience.key)}>{copy.open}<ArrowRight size={15}/></Link></header><div className={styles.horizontal}>{featured.map(item=><CatalogCard key={item.id} item={item} locale={experience.locale} variant="wide"/>)}</div></section>:null}

  {moduleSet.has('availability')||moduleSet.has('seasonal')||moduleSet.has('pathways')||moduleSet.has('plans')||moduleSet.has('framework')?<section className={styles.signalDeck}><article><Compass/><span>DOCTRINE</span><strong>{recipe.modules.slice(0,4).join(' · ')}</strong><p>Le world adapte sa composition sans déplacer la vérité métier.</p></article><article><TrendingUp/><span>DENSITÉ</span><strong>{effectiveDensity.replaceAll('_',' ')}</strong><p>{inventory.length} cartes live dans la fenêtre courante, sans précharger le catalogue entier.</p></article><article><ShieldCheck/><span>TRUTH</span><strong>Canonical-only</strong><p>Prix, disponibilité, confiance et médias restent gouvernés par leurs autorités natives.</p></article></section>:null}

  <section className={styles.discovery}>
   <aside className={styles.facets}><div className={styles.facetsTitle}><Filter size={16}/><div><span>DISCOVERY</span><h2>{copy.filters}</h2></div></div>{facets.length?facets.map(([key,values])=><div className={styles.facet} key={key}><strong>{key}</strong>{values.slice(0,7).map(value=><Link key={value.value} href={`/angelcare-marketplace/${experience.locale}/marketplace/search?category=${encodeURIComponent(experience.key)}&${encodeURIComponent(key)}=${encodeURIComponent(value.value)}`}><span>{value.value}</span><b>{value.count}</b></Link>)}</div>):<p className={styles.empty}>Aucune facette publique active.</p>}</aside>
   <div className={styles.inventory}><header><div><span>LIVE CATALOG</span><h2>{copy.inventory}</h2><p>Composition automatique depuis Catalog Discovery · {inventory.length} éléments matérialisés.</p></div><Link href={route(experience.locale,experience.key)}>{copy.open}<ArrowRight size={15}/></Link></header><div className={styles.grid}>{inventory.map(item=><CatalogCard key={item.id} item={item} locale={experience.locale}/>)}</div></div>
  </section>

  {collections.map((collection,index)=><section className={styles.collection} key={collection.id} data-index={index}><header><div><span>{collection.selection_method||'CANONICAL COLLECTION'}</span><h2>{collection.title}</h2><p>{collection.subtitle||copy.collections}</p></div><b>{collection.items.length}</b></header><div className={styles.horizontal}>{collection.items.slice(0,12).map(item=><CatalogCard key={item.id} item={item} locale={experience.locale} variant="editorial"/>)}</div></section>)}

  <section className={styles.truthBand}><div><ShieldCheck size={25}/><div><span>PUBLIC EXPERIENCE AUTHORITY</span><h2>Un world dense, zéro shadow truth.</h2></div></div><p>Le design orchestre. Le catalogue, les prix, la disponibilité, les collections et les actions restent canoniques. Si ce world devient incompatible, la route retombe automatiquement sur le storefront natif.</p></section>

  <section className={styles.finalCta}><span>ANGELCARE MARKETPLACE</span><h2>{copy.final}</h2><p>{recipe.headline}</p><Link href={route(experience.locale,experience.key)}>{copy.open}<ArrowRight size={16}/></Link></section>
 </main>
}
