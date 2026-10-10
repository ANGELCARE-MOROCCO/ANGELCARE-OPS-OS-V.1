import {GlobalPublicShell} from '../public-universe/components/GlobalPublicShell'
import {getPublicPage} from '../public-universe/repository'
import {PublicPageRenderer} from '../public-universe/components/PublicPageRenderer'
import {academyCatalogue} from './repository'
import {AcademyProgrammes} from './AcademyProgrammes'
import {AcademyRequest} from './AcademyRequest'
import {cleanBrief,type CatalogueState} from './contract'
import type {CatalogLocale} from '../catalog-discovery/types'
export async function AcademyPage({rawLocale,request=false,brief}:{rawLocale:string;request?:boolean;brief?:unknown}){
 const locale:CatalogLocale=rawLocale==='ar'?'ar':rawLocale==='en'?'en':'fr',route=request?'academy/request':'academy/programs'
 const published=await getPublicPage({locale,slug:route,territoryCode:'MA-MASTER'})
 if(published)return <GlobalPublicShell locale={locale} navigation={published.navigation} variant="marketplace"><PublicPageRenderer experience={published} locale={locale}/></GlobalPublicShell>
 if(request)return <GlobalPublicShell locale={locale} navigation={[]} variant="marketplace"><AcademyRequest locale={locale} brief={cleanBrief(brief)}/></GlobalPublicShell>
 let catalogue:CatalogueState
 try{catalogue=await academyCatalogue(locale)}catch{catalogue={items:[],status:'error',association:'academy'}}
 return <GlobalPublicShell locale={locale} navigation={[]} variant="marketplace"><AcademyProgrammes locale={locale} catalogue={catalogue}/></GlobalPublicShell>
}
