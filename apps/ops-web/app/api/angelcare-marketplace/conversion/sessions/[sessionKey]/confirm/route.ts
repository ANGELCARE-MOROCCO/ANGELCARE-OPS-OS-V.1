import {handleConversionConfirmation} from '@/angelcare-marketplace/conversion-universe/api-handlers'
export async function POST(request:Request,{params}:{params:Promise<{sessionKey:string}>}){return handleConversionConfirmation(request,(await params).sessionKey)}
