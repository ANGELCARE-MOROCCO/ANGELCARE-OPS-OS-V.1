import {handleSubscription} from '@/angelcare-marketplace/enterprise-closure/api-handlers'
export async function PATCH(request:Request,{params}:{params:Promise<{subscriptionId:string}>}){const{subscriptionId}=await params;return handleSubscription(request,subscriptionId)}
