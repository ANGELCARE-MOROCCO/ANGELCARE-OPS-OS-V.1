import { guestCaseRequest } from '@/angelcare-marketplace/jobkix/server/guest-cases';
import { requestJson,failure,PRIVATE_HEADERS } from '@/angelcare-marketplace/jobkix/server/http';
export const runtime='nodejs';
export const dynamic='force-dynamic';
export async function POST(request:Request){try{return Response.json({ok:true,result:await guestCaseRequest(request,await requestJson(request,40000))},{headers:PRIVATE_HEADERS});}catch(error){return failure(error);}}
