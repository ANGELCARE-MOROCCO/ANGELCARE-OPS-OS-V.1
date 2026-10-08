import type {Data} from '@puckeditor/core'
import {requireMarketplaceApiContext} from '@/angelcare-marketplace/auth/context'
import {asMarketplaceError,MarketplaceError} from '@/angelcare-marketplace/server/errors'
import {apiFailure,apiSuccess,parseJsonObject,requestId} from '@/angelcare-marketplace/server/request'
import {preflightStudioDraft} from '@/angelcare-marketplace/studio-universal/repository'
import {diagnoseStudioDocument,repairStudioDocument} from '@/angelcare-marketplace/studio-universal/document-doctor'

export const runtime='nodejs'
export const dynamic='force-dynamic'
export async function POST(request:Request,{params}:{params:Promise<{pageId:string}>}){const id=requestId(request);try{const context=await requireMarketplaceApiContext('marketplace.cms.blocks.manage'),body=await parseJsonObject(request),{pageId}=await params;if(!body.data||typeof body.data!=='object'||Array.isArray(body.data))throw new MarketplaceError('VALIDATION_ERROR','Un document Puck valide est requis.');const raw=body.data as unknown as Data,local=diagnoseStudioDocument(raw);if(body.repair===true){const repaired=repairStudioDocument(raw);try{const checked=await preflightStudioDraft({pageId,data:repaired.data,context,requestId:id});return apiSuccess({ready:true,local:diagnoseStudioDocument(repaired.data),repairs:repaired.repairs,data:checked.data,policy:checked.policy,issues:[]},{requestId:id})}catch(error){const normalized=asMarketplaceError(error);return apiSuccess({ready:false,local:diagnoseStudioDocument(repaired.data),repairs:repaired.repairs,data:repaired.data,policy:null,issues:Object.entries(normalized.fieldErrors||{}).flatMap(([field,messages])=>messages.map(message=>({field,message})).concat([])),message:normalized.message,code:normalized.code},{requestId:id})}}
 try{const checked=await preflightStudioDraft({pageId,data:raw,context,requestId:id});return apiSuccess({ready:true,local,repairs:[],data:checked.data,policy:checked.policy,issues:[]},{requestId:id})}catch(error){const normalized=asMarketplaceError(error);const issues=Object.entries(normalized.fieldErrors||{}).flatMap(([field,messages])=>messages.map(message=>({field,message})));return apiSuccess({ready:false,local,repairs:[],data:raw,policy:null,issues,message:normalized.message,code:normalized.code},{requestId:id})}}
 catch(error){return apiFailure(error,id)}}
