import { handleOperatingExceptions } from '@/angelcare-marketplace/admin-operating/api-handlers'
export async function POST(request:Request,{params}:{params:Promise<{caseId:string}>}){return handleOperatingExceptions(request,(await params).caseId)}
