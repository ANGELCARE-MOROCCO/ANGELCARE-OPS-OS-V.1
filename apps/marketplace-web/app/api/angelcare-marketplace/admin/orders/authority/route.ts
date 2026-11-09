import { requireMarketplaceApiContext } from '@/angelcare-marketplace/auth/context'
import { apiSuccess, apiFailure, requestId } from '@/angelcare-marketplace/server/request'
import { MarketplaceError } from '@/angelcare-marketplace/server/errors'
import { authoritySnapshot } from '@/angelcare-marketplace/orders360/authority-server'
import { authorityAreas, type AuthorityArea } from '@/angelcare-marketplace/orders360/authority-model'
export const dynamic='force-dynamic'
export async function GET(request:Request){const id=requestId(request);try{const context=await requireMarketplaceApiContext('marketplace.operations.view');const area=new URL(request.url).searchParams.get('area') as AuthorityArea;if(!authorityAreas.includes(area))throw new MarketplaceError('VALIDATION_ERROR','Espace inconnu.');return apiSuccess(await authoritySnapshot(area,context),{requestId:id})}catch(error){return apiFailure(error,id)}}
