import {requireMarketplaceApiContext} from '@/angelcare-marketplace/auth/context'
import {publicExperienceAuthoritySnapshot} from '@/angelcare-marketplace/public-experience-authority/repository'
import {apiFailure,apiSuccess,requestId} from '@/angelcare-marketplace/server/request'
export const dynamic='force-dynamic'
export async function GET(request:Request){const id=requestId(request);try{const context=await requireMarketplaceApiContext('marketplace.admin.access');return apiSuccess(await publicExperienceAuthoritySnapshot(context),{requestId:id})}catch(error){return apiFailure(error,id)}}
