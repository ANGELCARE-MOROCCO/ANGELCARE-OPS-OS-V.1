import {requireMarketplaceApiContext} from '@/angelcare-marketplace/auth/context'
import {previewPublicExperienceImpact} from '@/angelcare-marketplace/public-experience-authority/impact-engine'
import type {PublicExperienceDetailScope} from '@/angelcare-marketplace/public-experience-authority/types'
import {MarketplaceError} from '@/angelcare-marketplace/server/errors'
import {apiFailure,apiSuccess,parseJsonObject,requestId} from '@/angelcare-marketplace/server/request'
const scopes=new Set<PublicExperienceDetailScope|'storefront'>(['business_family','doctrine','master_domain','storefront'])
export async function POST(request:Request){const id=requestId(request);try{const context=await requireMarketplaceApiContext('marketplace.admin.access');const body=await parseJsonObject(request),scope=String(body.scope||'') as PublicExperienceDetailScope|'storefront',key=String(body.key||'').trim();if(!scopes.has(scope)||!key)throw new MarketplaceError('VALIDATION_ERROR','Scope / clé impact invalides.');return apiSuccess(await previewPublicExperienceImpact({scope,key},context),{requestId:id})}catch(error){return apiFailure(error,id)}}
