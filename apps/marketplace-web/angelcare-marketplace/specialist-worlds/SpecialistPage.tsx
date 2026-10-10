import {GlobalPublicShell} from '../public-universe/components/GlobalPublicShell'
import {PublicPageRenderer} from '../public-universe/components/PublicPageRenderer'
import {getPublicPage} from '../public-universe/repository'
import {profileFor} from './content'
import {specialistCatalogue} from './repository'
import {SpecialistLanding} from './SpecialistLanding'
import type {CatalogueState} from './contract'
import type {CatalogLocale} from '../catalog-discovery/types'
export async function SpecialistPage({id,rawLocale}:{id:string;rawLocale:string}){
 const p=profileFor(id);if(!p)throw Error('Unknown specialist destination')
 const locale:CatalogLocale=rawLocale==='ar'?'ar':rawLocale==='en'?'en':'fr'
 // A resolvable published page on this exact nested route keeps precedence.
 const published=await getPublicPage({locale,slug:p.route,territoryCode:'MA-MASTER'})
 if(published)return <GlobalPublicShell locale={locale} navigation={published.navigation} variant="marketplace"><PublicPageRenderer experience={published} locale={locale}/></GlobalPublicShell>
 let catalogue:CatalogueState
 try{catalogue=await specialistCatalogue(p,locale)}catch{catalogue={items:[],status:'error',association:'unassigned'}}
 return <GlobalPublicShell locale={locale} navigation={[]} variant="marketplace"><SpecialistLanding profile={p} locale={locale} catalogue={catalogue}/></GlobalPublicShell>
}
