import { handleCommerceAction } from '@/angelcare-marketplace/commerce-studio/api-handlers'
export const POST=(request:Request)=>handleCommerceAction(request,'homepage-placements','bulk','reorder')
