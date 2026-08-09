import { handleExperienceSchemaAction } from '@/angelcare-marketplace/category-native/api-handlers'
type Context={params:Promise<{schemaKey:string;action:string}>}
export async function POST(request:Request,context:Context){return handleExperienceSchemaAction(request,context.params)}
