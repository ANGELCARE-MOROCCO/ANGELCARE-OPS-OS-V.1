import {requireMarketplaceApiContext} from '../auth/context'
import {apiFailure,apiSuccess,requestId} from '../server/request'
import {networkCapacitySnapshot} from './repository'
export async function handleNetworkCapacitySnapshot(request:Request){const id=requestId(request);try{return apiSuccess(await networkCapacitySnapshot(await requireMarketplaceApiContext('marketplace.providers.view')),{requestId:id})}catch(error){return apiFailure(error,id)}}
