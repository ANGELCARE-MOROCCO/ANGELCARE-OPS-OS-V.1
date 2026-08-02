import {handleConversionConsent} from '@/angelcare-marketplace/conversion-universe/api-handlers'
export async function POST(request:Request,{params}:{params:Promise<{sessionKey:string}>}){return handleConversionConsent(request,(await params).sessionKey)}
