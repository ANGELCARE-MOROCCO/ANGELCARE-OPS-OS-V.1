import { createServiceClient } from '@/lib/supabase/server'
import { requireMarketplaceWorkspaceApiContext } from '@/angelcare-marketplace/auth/context'
import { MarketplaceError } from '@/angelcare-marketplace/server/errors'
import { apiFailure, apiSuccess, requestId } from '@/angelcare-marketplace/server/request'
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'
const BUCKET='ac-sc360-private-evidence'
const allowed=new Set(['application/pdf','image/jpeg','image/png'])
export async function POST(request:Request){
 const id=requestId(request)
 try {
  await requireMarketplaceWorkspaceApiContext('workspace.supplier_command')
  const form=await request.formData()
  const file=form.get('file'),supplier=String(form.get('supplierId')||'')
  if(!(file instanceof File)||!allowed.has(file.type)||file.size>8*1024*1024||file.size===0)
   throw new MarketplaceError('VALIDATION_ERROR','PDF, JPG ou PNG requis (8 Mo maximum).')
  if(!/^[0-9a-f-]{36}$/i.test(supplier))throw new MarketplaceError('VALIDATION_ERROR','Supplier ID UUID requis')
  const db=await createServiceClient()
  const exists=await db.from('angelcare_marketplace_suppliers').select('id').eq('id',supplier).maybeSingle()
  if(exists.error||!exists.data)throw new MarketplaceError('NOT_FOUND','Fournisseur inconnu')
  const ext=file.type==='application/pdf'?'pdf':file.type==='image/png'?'png':'jpg'
  const path=`${supplier}/${crypto.randomUUID()}.${ext}`
  const data=await db.storage.from(BUCKET).upload(path,await file.arrayBuffer(),{contentType:file.type,upsert:false})
  if(data.error)throw new MarketplaceError('CONFIGURATION_ERROR','Private storage unavailable',{cause:data.error})
  return apiSuccess({storagePath:path,size:file.size,mime:file.type},{requestId:id})
 }catch(e){return apiFailure(e,id)}
}
export async function GET(request:Request){
 const id=requestId(request)
 try{
  await requireMarketplaceWorkspaceApiContext('workspace.supplier_command')
  const url=new URL(request.url),documentId=url.searchParams.get('documentId')||'',mediaId=url.searchParams.get('mediaId')||''
  const target=mediaId||documentId
  if(!/^[0-9a-f-]{36}$/i.test(target))throw new MarketplaceError('VALIDATION_ERROR','Evidence reference invalid')
  const db=await createServiceClient()
  const doc=await db.from(mediaId?'ac_sc_offer_media':'ac_sc_documents').select('storage_path').eq('id',target).single()
  if(doc.error||!doc.data)throw new MarketplaceError('NOT_FOUND','Document missing')
  const signed=await db.storage.from(BUCKET).createSignedUrl(doc.data.storage_path,120)
  if(signed.error||!signed.data)throw new MarketplaceError('NOT_READY','Private document unavailable')
  return apiSuccess({url:signed.data.signedUrl,expiresInSeconds:120},{requestId:id})
 }catch(e){return apiFailure(e,id)}
}
