import { handleProposalDecision } from '@/angelcare-marketplace/operations-execution/api-handlers'
export async function POST(request:Request,{params}:{params:Promise<{proposalId:string}>}){return handleProposalDecision(request,(await params).proposalId)}
