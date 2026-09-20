import { requireMarketplaceApiContext } from '@/angelcare-marketplace/auth/context'
import { MarketplaceError } from '@/angelcare-marketplace/server/errors'
import { apiFailure, apiSuccess, requestId } from '@/angelcare-marketplace/server/request'
import { browseStudioSource } from '@/angelcare-marketplace/studio-source-registry/resolver'

export const runtime='nodejs'
export const dynamic='force-dynamic'
const int=(value:string|null)=>value?Number(value):undefined
function filters(url:URL){const out:Record<string,string>={};let count=0;for(const[key,value]of url.searchParams){if(!key.startsWith('filter.'))continue;if(++count>8)throw new MarketplaceError('VALIDATION_ERROR','Trop de filtres Studio.');const name=key.slice(7).trim();if(!/^[a-zA-Z0-9_]{1,48}$/.test(name))throw new MarketplaceError('VALIDATION_ERROR','Filtre Studio invalide.');out[name]=value.slice(0,120)}return out}
export async function GET(request:Request,{params}:{params:Promise<{sourceId:string}>}){const id=requestId(request);try{const context=await requireMarketplaceApiContext('marketplace.cms.view');const{sourceId}=await params;const url=new URL(request.url);const locale=url.searchParams.get('locale');return apiSuccess(await browseStudioSource(decodeURIComponent(sourceId),{limit:int(url.searchParams.get('limit')),cursor:url.searchParams.get('cursor'),filters:filters(url),context:{locale:locale==='fr'||locale==='en'||locale==='ar'?locale:context.locale,territoryId:url.searchParams.get('territoryId')||context.territoryId,audienceId:url.searchParams.get('audienceId')}},context),{requestId:id})}catch(error){return apiFailure(error,id)}}
