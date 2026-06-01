import { getOptionsExport } from '../../../../../lib/saas-factory/options-runtime'
export const dynamic = 'force-dynamic'
export async function GET(request:Request){const url=new URL(request.url);const format=url.searchParams.get('format')==='csv'?'csv':'json';const exported=await getOptionsExport(format);return new Response(exported.body,{headers:{'Content-Type':exported.contentType,'Content-Disposition':`attachment; filename="${exported.filename}"`,'Cache-Control':'no-store'}})}
