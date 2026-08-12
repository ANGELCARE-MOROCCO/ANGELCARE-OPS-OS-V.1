import Link from 'next/link'
import {ArrowRight,BookOpenCheck,Building2,HeartHandshake,Hotel,PackageOpen,Search,ShieldCheck,Sparkles,UsersRound,HeartPulse,BriefcaseBusiness} from 'lucide-react'
import type {DiscoverySearch as DiscoverySearchData,StorefrontKey} from '../types'
import {catalogCopy} from '../content'
import {CategoryNativeCard} from '../../category-native-experience/components/CategoryNativeCard'
import {CategoryNativeFilters} from '../../category-native-experience/components/CategoryNativeFilters'
import {categoryNativeFilters} from '../../category-native-experience/repository'
import {getPublishedSurface} from '../../total-commerce-control/repository'
import {PublicSurfaceSections} from '../../total-commerce-control/components/PublicSurfaceSections'
import {DiscoverySearch} from './DiscoverySearch'
import styles from '../catalog-discovery.module.css'
const iconMap:Record<string,typeof Search>={families:UsersRound,'home-services':HeartHandshake,development:Sparkles,kits:PackageOpen,academy:BookOpenCheck,establishments:Building2,hospitality:Hotel,'quality-check':ShieldCheck,'health-partners':HeartPulse,corporates:BriefcaseBusiness}
const defaultEntries:StorefrontKey[]=['families','home-services','development','kits','academy','establishments','hospitality','quality-check']
const text=(v:unknown,f='')=>typeof v==='string'?v:f
export async function MarketplaceIndex({data}:{data:DiscoverySearchData}){
 const schemaKeys:string[]=[...new Set<string>(data.items.map((item)=>String(item.metadata.experience_schema_key||'')).filter(Boolean))]
 const [nativeFilters,surface]=await Promise.all([categoryNativeFilters({locale:data.locale,schemaKeys}),getPublishedSurface('marketplace-index',{locale:data.locale}).catch(()=>null)])
 const c=catalogCopy(data.locale),copy=surface?.copy||{}
 const departments=(surface?.departments?.length?surface.departments:defaultEntries).filter(key=>data.categories.some(cat=>cat.category_key===key))
 const eyebrow=text(copy.eyebrow,'ANGELCARE GLOBAL MARKETPLACE')
 const title=text(copy.title,data.locale==='fr'?'Un univers de services, produits et solutions conçu pour agir':data.locale==='ar'?'عالم من الخدمات والمنتجات والحلول المصممة للتنفيذ':'A universe of services, products and solutions built for action')
 const lead=text(copy.lead,data.locale==='fr'?'Explorez, comparez et engagez le bon parcours avec une visibilité claire sur le territoire, la disponibilité, la confiance et la valeur.':data.locale==='ar'?'استكشف وقارن وابدأ المسار المناسب مع رؤية واضحة للتوفر والثقة والقيمة.':'Explore, compare and start the right journey with clear territory, availability, trust and value.')
 return <main className={styles.marketplace} dir={data.locale==='ar'?'rtl':'ltr'}>
  <section className={styles.indexHero}><div><span>{eyebrow}</span><h1>{title}</h1><p>{lead}</p></div><div className={styles.heroProof}><strong>{data.total}</strong><span>{c.results}</span><i/><small>FR · EN · AR</small></div></section>
  <DiscoverySearch locale={data.locale} categories={data.categories} total={data.total}/>
  <CategoryNativeFilters filters={nativeFilters} locale={data.locale} route={`/angelcare-marketplace/${data.locale}/marketplace/search`}/>
  <section className={styles.departmentGrid}>{departments.map((key,index)=>{const Icon=iconMap[key]||Search;const cat=data.categories.find(c=>c.category_key===key);return <Link key={key} href={`/angelcare-marketplace/${data.locale}/marketplace/category/${key}`} data-theme={cat?.visual_theme||key}><span>{String(index+1).padStart(2,'0')}</span><Icon size={27}/><h2>{cat?.title||key.replaceAll('-',' ')}</h2><p>{cat?.short_description}</p><b>{cat?.item_count||0} {c.results}<ArrowRight size={16}/></b></Link>})}</section>
  <PublicSurfaceSections experience={surface}/>
  <section className={styles.resultSection}><header><div><span>MARKETPLACE INVENTORY</span><h2>{c.all}</h2></div><Link href={`/angelcare-marketplace/${data.locale}/marketplace/search`}>{c.open}<ArrowRight size={17}/></Link></header><div className={styles.cardGrid}>{data.items.slice(0,16).map(item=><CategoryNativeCard key={item.id} item={item} locale={data.locale} schemaKey={String(item.metadata.experience_schema_key||item.category_title||item.kind)}/>)}</div></section>
 </main>
}
