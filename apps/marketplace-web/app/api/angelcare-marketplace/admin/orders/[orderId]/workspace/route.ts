import { requireMarketplaceApiContext } from '@/angelcare-marketplace/auth/context'
import { orderMegaDossier } from '@/angelcare-marketplace/enterprise-command/repository'
import { createServiceClient } from '@/lib/supabase/server'
import { MarketplaceError } from '@/angelcare-marketplace/server/errors'
import { apiFailure, apiSuccess, requestId } from '@/angelcare-marketplace/server/request'
export const dynamic='force-dynamic'
export async function GET(request:Request,{params}:{params:Promise<{orderId:string}>}) {
  const id=requestId(request)
  try {
    const context=await requireMarketplaceApiContext('marketplace.operations.view')
    const {orderId}=await params;const db=await createServiceClient()
    let query=db.from('angelcare_marketplace_journeys').select('id,customer_account_id').eq('id',orderId)
    if(context.tenantId)query=query.eq('tenant_id',context.tenantId)
    if(context.territoryId)query=query.eq('territory_id',context.territoryId)
    const {data:order,error}=await query.maybeSingle()
    if(error)throw new MarketplaceError('INTERNAL_ERROR','Lecture de la commande impossible.')
    if(!order)throw new MarketplaceError('NOT_FOUND','Commande introuvable dans votre périmètre.')
    const [dossier,addresses]=await Promise.all([orderMegaDossier(orderId,{complete:true}),order.customer_account_id?db.from('angelcare_marketplace_customer_addresses').select('*').eq('customer_account_id',order.customer_account_id).eq('status','active').order('is_default',{ascending:false}).order('updated_at',{ascending:false}):Promise.resolve({data:[],error:null})])
    if(addresses.error)throw new MarketplaceError('INTERNAL_ERROR','Lecture des adresses impossible.')
    return apiSuccess({dossier,addresses:addresses.data||[]},{requestId:id})
  } catch(error) { return apiFailure(error,id) }
}
