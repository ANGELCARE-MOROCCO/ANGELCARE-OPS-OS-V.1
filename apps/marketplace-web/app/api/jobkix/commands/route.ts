import { requestJson,failure,PRIVATE_HEADERS } from '@/angelcare-marketplace/jobkix/server/http';
import { commandInput } from '@/angelcare-marketplace/jobkix/server/command-input';
import { executeCommand } from '@/angelcare-marketplace/jobkix/server/repository';
export const runtime='nodejs';
export const dynamic='force-dynamic';
export async function POST(request:Request){
 try{const input=commandInput(await requestJson(request));const result=await executeCommand(input.action,input.payload,input.version,input.key);return Response.json({ok:true,result},{headers:PRIVATE_HEADERS});}
 catch(error){return failure(error);}
}
