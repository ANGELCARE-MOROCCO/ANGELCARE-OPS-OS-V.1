import { handleCategoryNativeFilters } from '@/angelcare-marketplace/category-native-experience/api-handlers'
export async function GET(request:Request){return handleCategoryNativeFilters(request)}
