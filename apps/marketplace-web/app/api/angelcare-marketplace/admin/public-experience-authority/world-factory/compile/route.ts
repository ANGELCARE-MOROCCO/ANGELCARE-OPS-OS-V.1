import {requireMarketplaceApiContext} from '@/angelcare-marketplace/auth/context'
import {compileWorldFactoryCandidate} from '@/angelcare-marketplace/public-experience-authority/world-factory/server'
import type {BuildWorldFactoryInput} from '@/angelcare-marketplace/public-experience-authority/world-factory/types'
import {MarketplaceError} from '@/angelcare-marketplace/server/errors'
import {apiFailure,apiSuccess,parseJsonObject,requestId} from '@/angelcare-marketplace/server/request'
export async function POST(request:Request){const id=requestId(request);try{await requireMarketplaceApiContext('marketplace.admin.access');const body=await parseJsonObject(request);if(!body.data||!body.input)throw new MarketplaceError('VALIDATION_ERROR','data + input requis.');return apiSuccess(compileWorldFactoryCandidate(body.data,body.input as unknown as BuildWorldFactoryInput),{requestId:id})}catch(error){return apiFailure(error,id)}}
