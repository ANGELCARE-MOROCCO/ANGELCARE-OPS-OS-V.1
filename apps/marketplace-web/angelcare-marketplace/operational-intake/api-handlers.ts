import {requireCustomerSameOrigin} from '../customer-commerce/customer-access-api'
import {requireMarketplaceApiContext} from '../auth/context'
import {apiSuccess,apiFailure,parseJsonObject,requestId} from '../server/request'
import {MarketplaceError} from '../server/errors'
import {intakeSnapshot,intakeDossier,operateIntake} from './repository'
import type {IntakeSource} from './contracts'
export async function handleIntake(request:Request){const rid=requestId(request);try{const context=await requireMarketplaceApiContext();const url=new URL(request.url);return apiSuccess(await intakeSnapshot(context,Object.fromEntries(url.searchParams)),{requestId:rid})}catch(error){return apiFailure(error,rid)}}
export async function handleIntakeRecord(request:Request,params:Promise<{source:string;id:string}>){const rid=requestId(request);try{const context=await requireMarketplaceApiContext();const {source,id}=await params;if(!['journey','b2b','family','inquiry'].includes(source)||!/^[a-f\d-]{36}$/i.test(id))throw new MarketplaceError('VALIDATION_ERROR','Référence invalide.');if(request.method==='GET')return apiSuccess(await intakeDossier(context,source as IntakeSource,id),{requestId:rid});requireCustomerSameOrigin(request);const body=await parseJsonObject(request);return apiSuccess(await operateIntake({context,source:source as IntakeSource,id,action:String(body.action||''),reason:String(body.reason||''),request,requestId:rid}),{requestId:rid})}catch(error){return apiFailure(error,rid)}}
