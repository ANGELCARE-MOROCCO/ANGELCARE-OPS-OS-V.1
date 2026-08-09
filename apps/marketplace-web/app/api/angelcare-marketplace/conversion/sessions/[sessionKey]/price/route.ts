import {handlePriceRevalidation} from '@/angelcare-marketplace/conversion-universe/api-handlers'
export async function POST(request:Request,{params}:{params:Promise<{sessionKey:string}>}){return handlePriceRevalidation(request,(await params).sessionKey)}
