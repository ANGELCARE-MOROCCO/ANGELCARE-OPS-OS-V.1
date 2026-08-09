import { handleCommerceAction } from '@/angelcare-marketplace/commerce-studio/api-handlers'
export const POST=(request:Request,{params}:{params:Promise<{categoryId:string}>})=>params.then(({categoryId})=>handleCommerceAction(request,'catalog-categories',categoryId,'assign-products'))
