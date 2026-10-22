import { workerAuthorized,processOperationalMail } from '@/angelcare-marketplace/jobkix/server/operational-worker';
import { PRIVATE_HEADERS,failure } from '@/angelcare-marketplace/jobkix/server/http';
export const runtime='nodejs';
export const dynamic='force-dynamic';
export async function POST(request:Request){if(!workerAuthorized(request))return Response.json({ok:false},{status:401,headers:PRIVATE_HEADERS});try{return Response.json({ok:true,result:await processOperationalMail()},{headers:PRIVATE_HEADERS});}catch{return failure(new Error('Operational dependency unavailable'));}}
