import { requestJson,failure,PRIVATE_HEADERS } from '@/angelcare-marketplace/jobkix/server/http';
import { downloadDocument } from '@/angelcare-marketplace/jobkix/server/files';
import { rpc } from '@/angelcare-marketplace/jobkix/server/repository';
import { uuid } from '@/angelcare-marketplace/jobkix/validation';
import { JobkixFault } from '@/angelcare-marketplace/jobkix/contracts';
import { requireJobkixSession } from '@/angelcare-marketplace/jobkix/server/identity';
export const runtime='nodejs';
export const dynamic='force-dynamic';
export async function GET(request:Request,{params}:{params:Promise<{id:string}>}){try{return await downloadDocument(uuid((await params).id),new URL(request.url).searchParams.get('administration'));}catch(error){return failure(error);}}
export async function PATCH(request:Request,{params}:{params:Promise<{id:string}>}){try{const input=await requestJson(request);await requireJobkixSession();if(typeof input.archived!=='boolean')throw new JobkixFault('INVALID_INPUT');return Response.json({ok:true,result:await rpc('jobkix_file_archive',{p_file:uuid((await params).id),p_archived:input.archived})},{headers:PRIVATE_HEADERS});}catch(error){return failure(error);}}
