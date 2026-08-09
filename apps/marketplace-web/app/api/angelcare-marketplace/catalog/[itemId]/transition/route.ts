import { handleCatalogTransition } from '@/angelcare-marketplace/marketplace-core/api-handlers'
export async function POST(request:Request,{params}:{params:Promise<{itemId:string}>}){return handleCatalogTransition(request,(await params).itemId)}
