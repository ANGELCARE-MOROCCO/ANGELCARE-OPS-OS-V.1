import { handleCsvTemplate } from '@/angelcare-marketplace/category-native/api-handlers'
type Context={params:Promise<{schemaKey:string}>}
export async function GET(request:Request,context:Context){return handleCsvTemplate(request,context.params)}
