import{handleCustomerMega}from '@/angelcare-marketplace/enterprise-command/api-handlers'
export const dynamic='force-dynamic'
export async function GET(request:Request,{params}:{params:Promise<{customerId:string}>}){const{customerId}=await params;return handleCustomerMega(request,customerId)}
