import { handleEnterpriseOrder } from '@/angelcare-marketplace/enterprise-closure/api-handlers'
export async function GET(request:Request,{params}:{params:Promise<{orderId:string}>}){const{orderId}=await params;return handleEnterpriseOrder(request,orderId)}
