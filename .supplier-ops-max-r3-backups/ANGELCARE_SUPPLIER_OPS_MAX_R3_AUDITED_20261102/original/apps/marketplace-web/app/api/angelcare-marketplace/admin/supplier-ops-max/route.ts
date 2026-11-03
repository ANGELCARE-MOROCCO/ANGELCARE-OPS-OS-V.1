import { apiFailure,apiSuccess,parseJsonObject,requestId } from '@/angelcare-marketplace/server/request'
import { loadSupplierOpsMax,supplierOpsSearch,supplierOpsDetail,supplierOpsAction } from '@/angelcare-marketplace/supplier-ops-max/server'
export const dynamic='force-dynamic'
export const runtime='nodejs'
export async function GET(request:Request){
 const rid=requestId(request)
 try{
  const query=new URL(request.url).searchParams
  const operation=query.get('operation')||'snapshot'
  const data=operation==='snapshot'?await loadSupplierOpsMax():operation==='search'?await supplierOpsSearch(query.get('provider'),query.get('q'),query.get('page')):
   operation==='detail'?await supplierOpsDetail(query.get('provider'),query.get('productId')):null
  if(!data)throw new Error('Unsupported supplier operation')
  return apiSuccess(data,{requestId:rid})
 }catch(error){return apiFailure(error,rid)}
}
export async function POST(request:Request){
 const rid=requestId(request)
 try{return apiSuccess(await supplierOpsAction(await parseJsonObject(request)),{requestId:rid})}
 catch(error){return apiFailure(error,rid)}
}
