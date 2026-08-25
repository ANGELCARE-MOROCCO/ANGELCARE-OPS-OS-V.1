import{handleOrderMega}from '@/angelcare-marketplace/enterprise-command/api-handlers'
export const dynamic='force-dynamic'
export async function GET(request:Request,{params}:{params:Promise<{orderId:string}>}){const{orderId}=await params;return handleOrderMega(request,orderId)}
