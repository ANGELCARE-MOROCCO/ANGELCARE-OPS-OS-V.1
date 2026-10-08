import {requireMarketplaceApiContext} from '@/angelcare-marketplace/auth/context'
import {publicExperienceAuthoritySnapshot} from '@/angelcare-marketplace/public-experience-authority/repository'
import {publicExperienceAuthorityReadiness} from '@/angelcare-marketplace/public-experience-authority/readiness'
import {apiFailure,apiSuccess,requestId} from '@/angelcare-marketplace/server/request'
export const dynamic='force-dynamic'
export async function GET(request:Request){const id=requestId(request);try{const context=await requireMarketplaceApiContext('marketplace.admin.access');const snapshot=await publicExperienceAuthoritySnapshot(context);return apiSuccess(publicExperienceAuthorityReadiness(snapshot),{requestId:id})}catch(error){return apiFailure(error,id)}}
