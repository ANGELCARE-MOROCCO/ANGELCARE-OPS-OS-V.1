import { handleEnterpriseOrderLine } from '@/angelcare-marketplace/enterprise-closure/api-handlers'
export async function PATCH(request:Request,{params}:{params:Promise<{orderId:string;lineId:string}>}){const{orderId,lineId}=await params;return handleEnterpriseOrderLine(request,orderId,lineId)}
