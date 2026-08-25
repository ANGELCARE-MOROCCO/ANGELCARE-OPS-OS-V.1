import {handlePromotion} from '@/angelcare-marketplace/enterprise-closure/api-handlers'
export async function PATCH(request:Request,{params}:{params:Promise<{promotionId:string}>}){const{promotionId}=await params;return handlePromotion(request,promotionId)}
