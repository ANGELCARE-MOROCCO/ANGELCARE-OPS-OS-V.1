import { handleProductImportJobResult } from '@/angelcare-marketplace/enterprise-command/api-handlers'
export const dynamic='force-dynamic'
export async function GET(request:Request,{params}:{params:Promise<{jobId:string}>}){const {jobId}=await params;return handleProductImportJobResult(request,jobId)}
