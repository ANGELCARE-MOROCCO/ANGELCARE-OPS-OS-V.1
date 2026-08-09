import { handleCommerceImport } from '@/angelcare-marketplace/commerce-studio/import-export'
export const POST=(request:Request,{params}:{params:Promise<{resource:string}>})=>params.then(({resource})=>handleCommerceImport(request,resource))
