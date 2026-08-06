import { handleCategoryNativeImport } from '@/angelcare-marketplace/category-native/api-handlers'
type Context={params:Promise<{jobId:string}>}
export async function GET(request:Request,context:Context){return handleCategoryNativeImport(request,context.params)}
