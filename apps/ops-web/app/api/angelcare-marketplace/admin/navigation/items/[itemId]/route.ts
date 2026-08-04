import { handleCommerceResource } from '@/angelcare-marketplace/commerce-studio/api-handlers'
const action=(request:Request,{params}:{params:Promise<{itemId:string}>})=>params.then((value)=>handleCommerceResource(request,'navigation-items',value.itemId))
export const GET=action;export const PATCH=action;export const DELETE=action
