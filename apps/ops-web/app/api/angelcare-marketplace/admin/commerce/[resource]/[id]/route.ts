import { handleCommerceResource } from '@/angelcare-marketplace/commerce-studio/api-handlers'
const action=(request:Request,{params}:{params:Promise<{resource:string;id:string}>})=>params.then(({resource,id})=>handleCommerceResource(request,resource,id))
export const GET=action;export const PATCH=action;export const DELETE=action
