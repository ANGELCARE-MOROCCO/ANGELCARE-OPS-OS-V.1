import { handleOperatingCaseDossier } from '@/angelcare-marketplace/admin-operating/api-handlers'
export async function GET(request:Request,{params}:{params:Promise<{caseId:string}>}){return handleOperatingCaseDossier(request,(await params).caseId)}
