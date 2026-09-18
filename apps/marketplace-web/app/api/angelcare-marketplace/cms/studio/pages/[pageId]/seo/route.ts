import { requireMarketplaceApiContext } from '@/angelcare-marketplace/auth/context'
import { apiFailure, apiSuccess, cleanOptionalText, parseJsonObject, requestId } from '@/angelcare-marketplace/server/request'
import { updateStudioSeo } from '@/angelcare-marketplace/studio-universal/governance'

export async function PATCH(request:Request,{params}:{params:Promise<{pageId:string}>}){const id=requestId(request);try{const context=await requireMarketplaceApiContext('marketplace.cms.edit');const body=await parseJsonObject(request);const {pageId}=await params;return apiSuccess(await updateStudioSeo({pageId,seoTitle:typeof body.seoTitle==='string'?(cleanOptionalText(body.seoTitle,240)||''):undefined,seoDescription:typeof body.seoDescription==='string'?(cleanOptionalText(body.seoDescription,500)||''):undefined,context,requestId:id}),{requestId:id})}catch(error){return apiFailure(error,id)}}
