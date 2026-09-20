import {requireMarketplaceApiContext} from '@/angelcare-marketplace/auth/context'
import {getPublicExperienceThemeManifest} from '@/angelcare-marketplace/public-experience-authority/repository'
import {compilePublicExperienceTheme} from '@/angelcare-marketplace/public-experience-authority/theme-compiler'
import type {PublicExperienceMasterDomain} from '@/angelcare-marketplace/public-experience-authority/types'
import type {StorefrontKey} from '@/angelcare-marketplace/catalog-discovery/types'
import {MarketplaceError} from '@/angelcare-marketplace/server/errors'
import {apiFailure,apiSuccess,parseJsonObject,requestId} from '@/angelcare-marketplace/server/request'
export async function POST(request:Request){const id=requestId(request);try{await requireMarketplaceApiContext('marketplace.admin.access');const body=await parseJsonObject(request),templateId=String(body.templateId||'').trim();if(!templateId)throw new MarketplaceError('VALIDATION_ERROR','templateId requis.');const manifest=await getPublicExperienceThemeManifest(templateId);if(!manifest)throw new MarketplaceError('NOT_FOUND','Manifest Public Experience introuvable.');return apiSuccess(compilePublicExperienceTheme({manifest,masterDomain:typeof body.masterDomain==='string'?body.masterDomain as PublicExperienceMasterDomain:null,doctrineKeys:Array.isArray(body.doctrineKeys)?body.doctrineKeys.map(String):manifest.acceptedDoctrineKeys,storefrontKey:typeof body.storefrontKey==='string'?body.storefrontKey as StorefrontKey:null}),{requestId:id})}catch(error){return apiFailure(error,id)}}
