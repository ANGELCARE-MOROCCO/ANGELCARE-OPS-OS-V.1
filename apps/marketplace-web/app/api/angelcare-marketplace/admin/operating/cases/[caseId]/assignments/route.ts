import { handleOperatingCaseAssignment } from '@/angelcare-marketplace/admin-operating/api-handlers'
export async function POST(request:Request,{params}:{params:Promise<{caseId:string}>}){return handleOperatingCaseAssignment(request,(await params).caseId)}
