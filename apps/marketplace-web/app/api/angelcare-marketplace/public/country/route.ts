import {countryForHeaders} from '@/angelcare-marketplace/visitor-country/lookup'
export const runtime='nodejs'
export const dynamic='force-dynamic'
export async function GET(request:Request){const result=await countryForHeaders(request.headers);return Response.json(result,{headers:{'Cache-Control':'private, no-store, max-age=0','Vary':'X-Forwarded-For, X-Real-IP','X-Content-Type-Options':'nosniff'}})}
