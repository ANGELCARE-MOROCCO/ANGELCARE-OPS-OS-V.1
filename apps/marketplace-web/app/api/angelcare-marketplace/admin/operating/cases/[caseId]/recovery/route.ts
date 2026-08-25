import { handleOperatingRecovery } from '@/angelcare-marketplace/admin-operating/api-handlers'
export async function POST(request:Request,{params}:{params:Promise<{caseId:string}>}){return handleOperatingRecovery(request,(await params).caseId)}
