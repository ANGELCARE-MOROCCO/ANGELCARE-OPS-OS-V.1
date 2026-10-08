import type { Data } from '@puckeditor/core'
import { requireMarketplaceApiContext } from '@/angelcare-marketplace/auth/context'
import { apiFailure,apiSuccess,parseJsonObject,requestId } from '@/angelcare-marketplace/server/request'
import { MarketplaceError } from '@/angelcare-marketplace/server/errors'
import { validateStudioPageJson } from '@/angelcare-marketplace/studio-universal/page-json'
import { inspectStudioTrust } from '@/angelcare-marketplace/studio-trust-inspector/analyzer'
export const runtime='nodejs';export const dynamic='force-dynamic'
const text=(value:unknown)=>typeof value==='string'?value.trim():''
export async function POST(request:Request){const id=requestId(request);try{const context=await requireMarketplaceApiContext('marketplace.cms.view');const body=await parseJsonObject(request);if(body.data===undefined)throw new MarketplaceError('VALIDATION_ERROR','Document Studio requis.');const data=validateStudioPageJson(body.data) as Data;const locale=['fr','en','ar'].includes(text(body.locale))?text(body.locale) as 'fr'|'en'|'ar':context.locale;const report=await inspectStudioTrust({data,locale,pageId:text(body.pageId)||null,pageRoute:text(body.pageRoute)||null,itemId:text(body.itemId)||null,collectionId:text(body.collectionId)||null,placementId:text(body.placementId)||null,audienceId:text(body.audienceId)||null,campaignId:text(body.campaignId)||null},context);return apiSuccess({report},{requestId:id})}catch(error){return apiFailure(error,id)}}
