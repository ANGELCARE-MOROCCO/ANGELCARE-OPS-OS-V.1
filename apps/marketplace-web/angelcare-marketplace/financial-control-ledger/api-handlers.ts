import {requireMarketplaceApiContext} from '../auth/context'
import {apiFailure,apiSuccess,requestId} from '../server/request'
import {financialControlLedgerSnapshot} from './repository'
export async function handleFinancialControlLedgerSnapshot(request:Request){const rid=requestId(request);try{return apiSuccess(await financialControlLedgerSnapshot(await requireMarketplaceApiContext('marketplace.finance.view')),{requestId:rid})}catch(error){return apiFailure(error,rid)}}
