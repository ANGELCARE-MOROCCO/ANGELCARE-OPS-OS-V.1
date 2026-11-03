import { apiFailure,apiSuccess,parseJsonObject,requestId } from '@/angelcare-marketplace/server/request'
import { loadSupplierOpsMax,supplierOpsSearch,supplierOpsDetail,supplierOpsAction,supplierOpsCategories,supplierOpsHealth,supplierOpsStock,supplierOpsFreight } from '@/angelcare-marketplace/supplier-ops-max/server'
export const dynamic='force-dynamic'
export const runtime='nodejs'
export async function GET(request:Request){
 const rid=requestId(request)
 try{
  const query=new URL(request.url).searchParams
  const operation=query.get('operation')||'snapshot'
  const filterKeys=['categoryId','countryCode','startSellPrice','endSellPrice','startWarehouseInventory','verifiedWarehouse','productFlag','productType','supplierId','hasCertification','customization','addMarkStatus','orderBy','sort','size']
  const filters:Record<string,any>={}
  for(const key of filterKeys)if(query.has(key)){const value=query.get(key);filters[key]=['categoryId','countryCode','supplierId','sort'].includes(key)?value:Number(value)}
  const data=operation==='snapshot'?await loadSupplierOpsMax():operation==='search'?await supplierOpsSearch(query.get('provider'),query.get('q'),query.get('page'),filters):
   operation==='detail'?await supplierOpsDetail(query.get('provider'),query.get('productId')):
   operation==='categories'?await supplierOpsCategories():operation==='health'?await supplierOpsHealth():
   operation==='stock'?await supplierOpsStock(query.get('variantId')):
   operation==='freight'?await supplierOpsFreight(Object.fromEntries(query)):null
  if(!data)throw new Error('Unsupported supplier operation')
  return apiSuccess(data,{requestId:rid})
 }catch(error){return apiFailure(error,rid)}
}
export async function POST(request:Request){
 const rid=requestId(request)
 try{return apiSuccess(await supplierOpsAction(await parseJsonObject(request)),{requestId:rid})}
 catch(error){return apiFailure(error,rid)}
}
