import {adminRead,adminCommand} from '@/angelcare-marketplace/jobkix/supply/server';
import {PRIVATE_HEADERS,requestJson} from '@/angelcare-marketplace/jobkix/server/http';
import {supplyFailure} from '@/angelcare-marketplace/jobkix/supply/errors';
export const runtime='nodejs';export const dynamic='force-dynamic';
export async function GET(request:Request){try{const u=new URL(request.url);return Response.json({ok:true,result:await adminRead(u.searchParams.get('view')||'overview',u.searchParams)},{headers:PRIVATE_HEADERS});}catch(error){return supplyFailure(error);}}
export async function POST(request:Request){try{return Response.json({ok:true,result:await adminCommand(await requestJson(request))},{headers:PRIVATE_HEADERS});}catch(error){return supplyFailure(error);}}
