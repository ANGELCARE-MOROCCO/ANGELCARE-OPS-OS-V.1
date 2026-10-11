import { isAuthEmailWorkerAuthorized, processOneAuthEmail, readAuthEmailStatus } from '@/angelcare-marketplace/customer-commerce/auth-email-native/worker'
export const runtime='nodejs'
export const dynamic='force-dynamic'
export const maxDuration=180
function response(body:unknown,status=200){return Response.json(body,{status,headers:{'Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff'}})}
export async function POST(request:Request):Promise<Response>{
 if(!isAuthEmailWorkerAuthorized(request))return response({error:'unauthorized'},401)
 try{return response(await processOneAuthEmail())}catch{return response({error:'AUTH_EMAIL_WORKER_UNAVAILABLE'},503)}
}
export async function GET(request:Request):Promise<Response>{
 if(!isAuthEmailWorkerAuthorized(request))return response({error:'unauthorized'},401)
 try{return response(await readAuthEmailStatus())}catch{return response({error:'AUTH_EMAIL_LEDGER_UNAVAILABLE'},503)}
}
