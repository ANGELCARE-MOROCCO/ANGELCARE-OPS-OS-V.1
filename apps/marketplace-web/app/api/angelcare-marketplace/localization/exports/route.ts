import {requireMarketplaceWorkspaceApiContext} from '@/angelcare-marketplace/auth/context'
import {buildTranslationExport,CHATGPT_EXPORT_INSTRUCTIONS} from '@/angelcare-marketplace/localization-intelligence/localization-os'
import {apiFailure,parseJsonObject,requestId} from '@/angelcare-marketplace/server/request'

export const dynamic='force-dynamic'
export async function GET(request:Request){
 const id=requestId(request)
 try{
  const context=await requireMarketplaceWorkspaceApiContext('localization.exports','marketplace.localization.csv.export'),url=new URL(request.url),filters={locale:url.searchParams.get('locale')||'',workspace:url.searchParams.get('workspace')||'',route:url.searchParams.get('route')||'',surface:url.searchParams.get('surface')||'',sourceType:url.searchParams.get('sourceType')||'',audience:url.searchParams.get('audience')||'',freshness:url.searchParams.get('freshness')||'',updatedSince:url.searchParams.get('updatedSince')||'',missingOnly:url.searchParams.get('missingOnly')==='true',staleOnly:url.searchParams.get('staleOnly')==='true',publicOnly:url.searchParams.get('publicOnly')==='true'},result=await buildTranslationExport(filters,context)
  if(url.searchParams.get('instructions')==='true')return new Response(CHATGPT_EXPORT_INSTRUCTIONS,{headers:{'content-type':'text/plain; charset=utf-8','content-disposition':`attachment; filename="${result.fileName.replace('.csv','_INSTRUCTIONS.txt')}"`}})
  return new Response(result.csv,{headers:{'content-type':'text/csv; charset=utf-8','content-disposition':`attachment; filename="${result.fileName}"`,'x-localization-row-count':String(result.rowCount)}})
 }catch(error){return apiFailure(error,id)}
}
export async function POST(request:Request){const id=requestId(request);try{const context=await requireMarketplaceWorkspaceApiContext('localization.exports','marketplace.localization.csv.export'),body=await parseJsonObject(request),result=await buildTranslationExport(body,context);return new Response(result.csv,{headers:{'content-type':'text/csv; charset=utf-8','content-disposition':`attachment; filename="${result.fileName}"`,'x-localization-row-count':String(result.rowCount)}})}catch(error){return apiFailure(error,id)}}
