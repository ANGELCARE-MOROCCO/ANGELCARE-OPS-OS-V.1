import { handleOperatingApprovalDecision } from '@/angelcare-marketplace/admin-operating/api-handlers'
export async function POST(request:Request,{params}:{params:Promise<{approvalId:string}>}){return handleOperatingApprovalDecision(request,(await params).approvalId)}
