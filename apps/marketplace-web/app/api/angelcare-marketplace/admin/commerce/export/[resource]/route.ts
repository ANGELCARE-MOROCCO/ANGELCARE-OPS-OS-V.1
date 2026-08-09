import { handleCommerceExport } from '@/angelcare-marketplace/commerce-studio/import-export'
export const GET=(request:Request,{params}:{params:Promise<{resource:string}>})=>params.then(({resource})=>handleCommerceExport(request,resource))
