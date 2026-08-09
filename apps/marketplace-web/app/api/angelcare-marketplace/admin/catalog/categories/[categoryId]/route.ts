import { handleCommerceResource } from '@/angelcare-marketplace/commerce-studio/api-handlers'
const action=(request:Request,{params}:{params:Promise<{categoryId:string}>})=>params.then((value)=>handleCommerceResource(request,'catalog-categories',value.categoryId))
export const GET=action;export const PATCH=action;export const DELETE=action
