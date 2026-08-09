import { handlePayableDecision } from '@/angelcare-marketplace/provider-workforce/api-handlers'
export async function POST(request:Request,{params}:{params:Promise<{payableId:string}>}){return handlePayableDecision(request,(await params).payableId)}
