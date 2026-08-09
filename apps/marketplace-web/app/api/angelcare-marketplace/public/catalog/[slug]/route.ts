import { handlePublicCatalogItem } from '@/angelcare-marketplace/marketplace-core/api-handlers'
export async function GET(request:Request,{params}:{params:Promise<{slug:string}>}){return handlePublicCatalogItem(request,(await params).slug)}
