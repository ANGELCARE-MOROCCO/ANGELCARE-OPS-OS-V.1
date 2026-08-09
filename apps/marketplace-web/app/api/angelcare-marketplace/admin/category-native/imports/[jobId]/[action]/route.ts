import { handleCategoryNativeImportAction } from '@/angelcare-marketplace/category-native/api-handlers'
type Context={params:Promise<{jobId:string;action:string}>}
export async function POST(request:Request,context:Context){return handleCategoryNativeImportAction(request,context.params)}
