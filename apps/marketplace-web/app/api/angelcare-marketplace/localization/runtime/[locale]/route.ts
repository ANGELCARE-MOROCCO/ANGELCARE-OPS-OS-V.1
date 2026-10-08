import {apiFailure,apiSuccess,requestId} from '@/angelcare-marketplace/server/request'
import {resolvePublishedDictionary,type RuntimeLocale} from '@/angelcare-marketplace/localization-intelligence/runtime'
import {requireMarketplaceApiContext} from '@/angelcare-marketplace/auth/context'

export const dynamic='force-dynamic'
export async function GET(request:Request,{params}:{params:Promise<{locale:string}>}){const id=requestId(request);try{const{locale}=await params;if(!['fr','en','ar'].includes(locale))return new Response('Locale not supported',{status:404});const requested=new URL(request.url).searchParams.get('scope'),scope=requested==='admin'||requested==='private'?requested:'public';if(scope==='admin')await requireMarketplaceApiContext('marketplace.admin.access');if(scope==='private')await requireMarketplaceApiContext('marketplace.family.access');return apiSuccess(await resolvePublishedDictionary(locale as RuntimeLocale,scope),{requestId:id})}catch(error){return apiFailure(error,id)}}
