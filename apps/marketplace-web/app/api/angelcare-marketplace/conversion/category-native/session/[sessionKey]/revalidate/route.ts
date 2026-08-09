import { handleCategoryNativeRevalidate } from '@/angelcare-marketplace/category-native-experience/api-handlers'
type Context={params:Promise<{ sessionKey: string }>}
export async function POST(request:Request,context:Context){return handleCategoryNativeRevalidate(request,context.params)}
