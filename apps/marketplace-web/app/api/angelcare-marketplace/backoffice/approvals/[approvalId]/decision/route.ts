import { handleApprovalDecision } from '@/angelcare-marketplace/sovereign-control/api-handlers'
export async function POST(request:Request,{params}:{params:Promise<{approvalId:string}>}){return handleApprovalDecision(request,(await params).approvalId)}
