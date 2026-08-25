import { handleProductImportJobRun } from '@/angelcare-marketplace/enterprise-command/api-handlers'
export const dynamic='force-dynamic'
export async function POST(request:Request,{params}:{params:Promise<{jobId:string}>}){const {jobId}=await params;return handleProductImportJobRun(request,jobId)}
