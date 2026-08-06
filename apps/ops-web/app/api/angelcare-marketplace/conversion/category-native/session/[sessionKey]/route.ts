import { handleCategoryNativeSession } from '@/angelcare-marketplace/category-native-experience/api-handlers'
type Context={params:Promise<{ sessionKey: string }>}
export async function GET(request:Request,context:Context){return handleCategoryNativeSession(request,context.params)}
