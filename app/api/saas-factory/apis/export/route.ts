import { exportApis } from '../../../../../lib/saas-factory/apis-runtime'
export const dynamic = 'force-dynamic'
export async function GET(request:Request){const url=new URL(request.url);const format=url.searchParams.get('format')==='csv'?'csv':'json';const exported=await exportApis(format);return new Response(exported.body,{headers:{'Content-Type':exported.contentType,'Content-Disposition':`attachment; filename="${exported.filename}"`,'Cache-Control':'no-store'}})}
