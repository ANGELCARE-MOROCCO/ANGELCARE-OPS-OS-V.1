import { requireMarketplaceApiContext } from '@/angelcare-marketplace/auth/context'
import { apiFailure, apiSuccess, parseJsonObject, requestId } from '@/angelcare-marketplace/server/request'
import { validateStudioAction } from '@/angelcare-marketplace/studio-action-registry/resolver'
export const runtime='nodejs';export const dynamic='force-dynamic'
export async function POST(request:Request,{params}:{params:Promise<{actionId:string}>}){const id=requestId(request);try{const context=await requireMarketplaceApiContext('marketplace.cms.view');const{actionId}=await params;const body=await parseJsonObject(request);return apiSuccess(await validateStudioAction({version:1,actionId:decodeURIComponent(actionId),target:body.target&&typeof body.target==='object'?body.target as any:null,externalUrl:typeof body.externalUrl==='string'?body.externalUrl:null,newWindow:body.newWindow===true},context),{requestId:id})}catch(error){return apiFailure(error,id)}}
