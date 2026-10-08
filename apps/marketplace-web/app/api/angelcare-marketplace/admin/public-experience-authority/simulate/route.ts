import {requireMarketplaceApiContext} from '@/angelcare-marketplace/auth/context'
import {simulatePublicExperienceAction} from '@/angelcare-marketplace/public-experience-authority/action-simulator'
import {apiFailure,apiSuccess,parseJsonObject,requestId} from '@/angelcare-marketplace/server/request'
export async function POST(request:Request){const id=requestId(request);try{await requireMarketplaceApiContext('marketplace.admin.access');const body=await parseJsonObject(request);return apiSuccess(simulatePublicExperienceAction({actionId:String(body.actionId||''),workflowId:typeof body.workflowId==='string'?body.workflowId:null,target:typeof body.target==='string'?body.target:null}),{requestId:id})}catch(error){return apiFailure(error,id)}}
