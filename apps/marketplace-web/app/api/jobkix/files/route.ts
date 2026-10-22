import { requireSameOrigin,failure,PRIVATE_HEADERS } from '@/angelcare-marketplace/jobkix/server/http';
import { uploadDocument } from '@/angelcare-marketplace/jobkix/server/files';
import { applicationDocuments,caseDocuments } from '@/angelcare-marketplace/jobkix/server/repository';
export const runtime='nodejs';
export const dynamic='force-dynamic';
export async function GET(request:Request){try{const params=new URL(request.url).searchParams;return Response.json({ok:true,result:await (params.has('context')?caseDocuments(params):applicationDocuments(params))},{headers:PRIVATE_HEADERS});}catch(error){return failure(error);}}
export async function POST(request:Request){try{requireSameOrigin(request);return Response.json({ok:true,result:await uploadDocument(request)},{headers:PRIVATE_HEADERS});}catch(error){return failure(error);}}
