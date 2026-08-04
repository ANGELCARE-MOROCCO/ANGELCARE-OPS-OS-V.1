import { handleCommerceAction } from '@/angelcare-marketplace/commerce-studio/api-handlers'
const handler=(request:Request,{params}:{params:Promise<{resource:string;id:string;action:string}>})=>params.then(({resource,id,action})=>handleCommerceAction(request,resource,id,action))
export const POST=handler;export const PATCH=handler
