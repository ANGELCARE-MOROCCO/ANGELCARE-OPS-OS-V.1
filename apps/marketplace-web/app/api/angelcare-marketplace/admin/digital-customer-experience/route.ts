import { assertAdminLoginSameOrigin } from '@/angelcare-marketplace/auth/admin/admin-auth'
import { requireMarketplaceApiContext } from '@/angelcare-marketplace/auth/context'
import { apiFailure, apiSuccess } from '@/angelcare-marketplace/server/request'
import { MarketplaceError } from '@/angelcare-marketplace/server/errors'
import { read, command } from '@/angelcare-marketplace/digital-customer-experience/repository'
import type { Command } from '@/angelcare-marketplace/digital-customer-experience/types'
export const dynamic='force-dynamic';export const runtime='nodejs'
function privateResponse(response:Response){response.headers.set('Cache-Control','private, no-store');response.headers.set('Vary','Cookie');return response}
export async function GET(request:Request){try{const context=await requireMarketplaceApiContext('marketplace.digital_experience.view');return privateResponse(apiSuccess(await read(context,Object.fromEntries(new URL(request.url).searchParams))))}catch(e){return privateResponse(apiFailure(e))}}
export async function POST(request:Request){try{const context=await requireMarketplaceApiContext('marketplace.digital_experience.view');const origin=request.headers.get('origin');if(!origin||!assertAdminLoginSameOrigin(request)||request.headers.get('sec-fetch-site')==='cross-site')throw new MarketplaceError('FORBIDDEN','Cross-origin admin mutation refused.');const source=await request.text();if(new TextEncoder().encode(source).length>5*1024*1024)throw new MarketplaceError('VALIDATION_ERROR','Request exceeds 5 MiB.');let body;try{body=JSON.parse(source)}catch{throw new MarketplaceError('VALIDATION_ERROR','Invalid JSON.')}if(!body||typeof body!=='object'||Array.isArray(body)||typeof body.action!=='string')throw new MarketplaceError('VALIDATION_ERROR','A DCE command object is required.');return privateResponse(apiSuccess(await command(context,body as Command)))}catch(e){return privateResponse(apiFailure(e))}}
