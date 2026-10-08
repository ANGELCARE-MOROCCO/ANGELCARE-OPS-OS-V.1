import type { Data } from '@puckeditor/core'
import { requireMarketplaceApiContext } from '@/angelcare-marketplace/auth/context'
import { inspectStudioDependencies } from '@/angelcare-marketplace/studio-dependency-invalidation/repository'
import { validateStudioPageJson } from '@/angelcare-marketplace/studio-universal/page-json'
import { apiFailure,apiSuccess,parseJsonObject,requestId } from '@/angelcare-marketplace/server/request'
export const runtime='nodejs';export const dynamic='force-dynamic'
export async function POST(request:Request){const rid=requestId(request);try{await requireMarketplaceApiContext('marketplace.cms.view');const body=await parseJsonObject(request);const data=validateStudioPageJson(body.data) as Data;const inspection=await inspectStudioDependencies({data,pageId:typeof body.pageId==='string'?body.pageId:null});return apiSuccess({inspection},{requestId:rid})}catch(error){return apiFailure(error,rid)}}
