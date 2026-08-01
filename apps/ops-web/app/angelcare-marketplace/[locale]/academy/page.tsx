import type { MarketplaceRequestContext } from '@/angelcare-marketplace/domain/types'
import { listPrograms } from '@/angelcare-marketplace/academy-engine/repository'
import { getMarketplaceContext } from '@/angelcare-marketplace/auth/context'
import { PublicAcademyExperience } from '@/angelcare-marketplace/academy-engine/components/PublicAcademyExperience'
export default async function Page({params}:{params:Promise<{locale:string}>}){const {locale}=await params;const context=await getMarketplaceContext();const safeLocale=locale==='ar'||locale==='en'?locale:'fr';const fallback:MarketplaceRequestContext={actor:{id:'public',email:null,displayName:'Public',sourceRole:'public'},roleKeys:[],permissions:[],assignments:[],territoryId:null,tenantId:null,locale:safeLocale,sessionReference:null};return <PublicAcademyExperience programs={await listPrograms(context||fallback)} locale={safeLocale}/>}
