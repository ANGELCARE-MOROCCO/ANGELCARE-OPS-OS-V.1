import { handleCommerceResource } from '@/angelcare-marketplace/commerce-studio/api-handlers'
const action=(request:Request,{params}:{params:Promise<{sectionId:string}>})=>params.then((value)=>handleCommerceResource(request,'homepage-sections',value.sectionId))
export const GET=action;export const PATCH=action;export const DELETE=action
