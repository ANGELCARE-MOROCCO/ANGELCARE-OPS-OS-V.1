import { requireMarketplaceApiContext } from '@/angelcare-marketplace/auth/context'
import { MarketplaceError } from '@/angelcare-marketplace/server/errors'
import { apiFailure, apiSuccess, requestId } from '@/angelcare-marketplace/server/request'
import { loadStudioGovernance } from '@/angelcare-marketplace/studio-universal/governance'

export async function GET(request:Request){const id=requestId(request);try{await requireMarketplaceApiContext('marketplace.cms.view');const pageId=new URL(request.url).searchParams.get('pageId')?.trim();if(!pageId)throw new MarketplaceError('VALIDATION_ERROR','pageId est requis.');return apiSuccess(await loadStudioGovernance(pageId),{requestId:id})}catch(error){return apiFailure(error,id)}}
