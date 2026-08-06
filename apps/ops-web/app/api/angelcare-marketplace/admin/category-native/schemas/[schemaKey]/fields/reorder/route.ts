import { handleSchemaFieldReorder } from '@/angelcare-marketplace/category-native/api-handlers'
type Context={params:Promise<{schemaKey:string}>}
export async function POST(request:Request,context:Context){return handleSchemaFieldReorder(request,context.params)}
