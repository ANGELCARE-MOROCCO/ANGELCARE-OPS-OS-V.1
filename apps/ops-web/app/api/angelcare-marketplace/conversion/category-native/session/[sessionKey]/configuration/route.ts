import { handleCategoryNativeConfigurationUpdate } from '@/angelcare-marketplace/category-native-experience/api-handlers'
type Context={params:Promise<{ sessionKey: string }>}
export async function PATCH(request:Request,context:Context){return handleCategoryNativeConfigurationUpdate(request,context.params)}
