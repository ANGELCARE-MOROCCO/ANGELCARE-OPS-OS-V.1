import { requestJson,failure,PRIVATE_HEADERS } from '@/angelcare-marketplace/jobkix/server/http';
import { adminInput } from '@/angelcare-marketplace/jobkix/server/admin-input';
import { executeAdmin } from '@/angelcare-marketplace/jobkix/server/admin-repository';
export const runtime='nodejs';
export const dynamic='force-dynamic';
export async function POST(request:Request){try{return Response.json({ok:true,result:await executeAdmin(adminInput(await requestJson(request)))},{headers:PRIVATE_HEADERS});}catch(error){return failure(error);}}
