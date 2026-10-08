import { handleEnterpriseOrderLines } from '@/angelcare-marketplace/enterprise-closure/api-handlers'
export async function POST(request:Request,{params}:{params:Promise<{orderId:string}>}){const{orderId}=await params;return handleEnterpriseOrderLines(request,orderId)}
