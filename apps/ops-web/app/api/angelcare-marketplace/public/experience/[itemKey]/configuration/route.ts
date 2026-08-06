import { handlePublicCategoryNativeConfiguration } from '@/angelcare-marketplace/category-native-experience/api-handlers'
type Context={params:Promise<{ itemKey: string }>}
export async function GET(request:Request,context:Context){return handlePublicCategoryNativeConfiguration(request,context.params)}
