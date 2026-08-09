import { handleQuoteBasketItems } from '@/angelcare-marketplace/marketplace-core/api-handlers'
export async function POST(request:Request,{params}:{params:Promise<{basketId:string}>}){return handleQuoteBasketItems(request,(await params).basketId)}
