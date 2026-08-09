import { handleCommerceResource } from '@/angelcare-marketplace/commerce-studio/api-handlers'
const action=(request:Request,{params}:{params:Promise<{resource:string}>})=>params.then(({resource})=>handleCommerceResource(request,resource))
export const GET=action;export const POST=action
