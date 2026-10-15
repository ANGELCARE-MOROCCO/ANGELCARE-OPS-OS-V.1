import type {DiscoverySearch, CatalogLocale} from '../types'
import {GlobalPublicShell} from '../../public-universe/components/GlobalPublicShell'
import {getPublishedSurface} from '../../total-commerce-control/repository'
import {PublicSurfaceSections} from '../../total-commerce-control/components/PublicSurfaceSections'
import {Gateway} from '../../public-discovery/Gateway'
import {gatewayData,safeMedia} from '../../public-discovery/data'
export async function MarketplaceIndex({data,locale:givenLocale}:{data?:DiscoverySearch;locale?:CatalogLocale}){
 const locale=givenLocale||data?.locale||'fr';const [native,surface]=await Promise.all([gatewayData(locale),getPublishedSurface('marketplace-index',{locale}).catch(()=>null)])
 const copy=surface?.copy||{},text=(v:unknown)=>typeof v==='string'?v:''
 const legacy=/Un univers de services|A universe of services|عالم من الخدمات/.test(text(copy.title))
 const hero={title:legacy?undefined:text(copy.title)||undefined,lead:legacy?undefined:text(copy.lead)||undefined,eyebrow:text(copy.eyebrow)||undefined,image:safeMedia(copy.hero_media_url)||undefined,order:Array.isArray(surface?.departments)?surface.departments:[]}
 return <GlobalPublicShell locale={locale} navigation={[]} variant="marketplace"><Gateway locale={locale} data={native} hero={hero}/><PublicSurfaceSections experience={surface}/></GlobalPublicShell>
}
