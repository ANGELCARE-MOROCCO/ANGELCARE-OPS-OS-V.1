import { handleExperienceSchema } from '@/angelcare-marketplace/category-native/api-handlers'
type Context={params:Promise<{schemaKey:string}>}
export async function GET(request:Request,context:Context){return handleExperienceSchema(request,context.params)}
export async function PATCH(request:Request,context:Context){return handleExperienceSchema(request,context.params)}
