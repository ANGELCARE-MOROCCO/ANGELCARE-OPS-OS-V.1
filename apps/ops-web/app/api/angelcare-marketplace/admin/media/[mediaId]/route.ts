import { handleCommerceResource } from '@/angelcare-marketplace/commerce-studio/api-handlers'
const action=(request:Request,{params}:{params:Promise<{mediaId:string}>})=>params.then((value)=>handleCommerceResource(request,'media',value.mediaId))
export const GET=action;export const PATCH=action;export const DELETE=action
