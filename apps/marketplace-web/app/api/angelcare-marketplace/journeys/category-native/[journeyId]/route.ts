import { handleCategoryNativeJourney } from '@/angelcare-marketplace/category-native-experience/api-handlers'
type Context={params:Promise<{ journeyId: string }>}
export async function GET(request:Request,context:Context){return handleCategoryNativeJourney(request,context.params)}
