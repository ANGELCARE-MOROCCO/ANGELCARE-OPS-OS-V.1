import { handleCommerceResource } from '@/angelcare-marketplace/commerce-studio/api-handlers'
const action=(request:Request)=>handleCommerceResource(request,'homepage-placements')
export const GET=action;export const POST=action
