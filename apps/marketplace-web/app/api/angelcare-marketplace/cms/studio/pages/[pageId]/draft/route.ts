import type { Data } from '@puckeditor/core'
import { requireMarketplaceApiContext } from '@/angelcare-marketplace/auth/context'
import { MarketplaceError } from '@/angelcare-marketplace/server/errors'
import { apiFailure, apiSuccess, cleanOptionalText, parseJsonObject, requestId } from '@/angelcare-marketplace/server/request'
import { saveStudioDraft } from '@/angelcare-marketplace/studio-universal/repository'

export async function PUT(request:Request,{params}:{params:Promise<{pageId:string}>}){const id=requestId(request);try{const context=await requireMarketplaceApiContext('marketplace.cms.blocks.manage');const body=await parseJsonObject(request);if(!body.data||typeof body.data!=='object'||Array.isArray(body.data))throw new MarketplaceError('VALIDATION_ERROR','Un document Puck valide est requis.');const {pageId}=await params;return apiSuccess(await saveStudioDraft({pageId,data:body.data as unknown as Data,context,requestId:id,reason:cleanOptionalText(body.reason,500)||undefined}),{requestId:id})}catch(error){return apiFailure(error,id)}}
