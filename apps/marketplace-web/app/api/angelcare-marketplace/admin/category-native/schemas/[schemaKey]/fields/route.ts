import { handleSchemaFields } from '@/angelcare-marketplace/category-native/api-handlers'
type Context={params:Promise<{schemaKey:string}>}
export async function GET(request:Request,context:Context){return handleSchemaFields(request,context.params)}
export async function POST(request:Request,context:Context){return handleSchemaFields(request,context.params)}
