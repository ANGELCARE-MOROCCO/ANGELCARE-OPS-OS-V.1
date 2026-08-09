import { handleSchemaField } from '@/angelcare-marketplace/category-native/api-handlers'
type Context={params:Promise<{schemaKey:string;fieldId:string}>}
export async function PATCH(request:Request,context:Context){return handleSchemaField(request,context.params)}
