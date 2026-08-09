import {handleConversionSession} from '@/angelcare-marketplace/conversion-universe/api-handlers'
export async function GET(request:Request,{params}:{params:Promise<{sessionKey:string}>}){return handleConversionSession(request,(await params).sessionKey)};export const PATCH=GET
