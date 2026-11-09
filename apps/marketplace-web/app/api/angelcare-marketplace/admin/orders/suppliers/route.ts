import { getSupplierContext, supplierSnapshot } from '@/angelcare-marketplace/supplier-command-360/server'
import { apiFailure, apiSuccess, requestId } from '@/angelcare-marketplace/server/request'
export const dynamic='force-dynamic'
export async function GET(request:Request) {
 const id=requestId(request)
 try { await getSupplierContext();return apiSuccess(await supplierSnapshot({complete:true,operationsOnly:true}),{requestId:id}) }
 catch(error){return apiFailure(error,id)}
}
