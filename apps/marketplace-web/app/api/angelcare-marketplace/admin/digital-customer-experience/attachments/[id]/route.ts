import { requireMarketplaceApiContext } from '@/angelcare-marketplace/auth/context'
import { apiFailure } from '@/angelcare-marketplace/server/request'
import { privateAttachmentDelivery } from '@/angelcare-marketplace/digital-customer-experience/attachments'
export const dynamic='force-dynamic';export const runtime='nodejs'
export async function GET(_request:Request,{params}:{params:Promise<{id:string}>}){try{const c=await requireMarketplaceApiContext('marketplace.digital_experience.moderate');return await privateAttachmentDelivery(c,(await params).id)}catch(e){const r=apiFailure(e);r.headers.set('Cache-Control','private, no-store');r.headers.set('Vary','Cookie');return r}}
