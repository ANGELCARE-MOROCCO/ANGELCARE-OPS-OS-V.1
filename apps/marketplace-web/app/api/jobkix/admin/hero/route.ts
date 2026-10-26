import {heroStudioRead,heroStudioCommand,heroAssetUsage} from '@/angelcare-marketplace/jobkix/hero/admin';
import {PRIVATE_HEADERS,failure,requestJson} from '@/angelcare-marketplace/jobkix/server/http';
export const runtime='nodejs';export const dynamic='force-dynamic';
export async function GET(request:Request){try{
 const params=new URL(request.url).searchParams,placement=params.get('placement')||'P00';
 return Response.json({ok:true,result:params.get('usage')?await heroAssetUsage(params.get('usage')||''):await heroStudioRead(placement)},{headers:PRIVATE_HEADERS});
}catch(error){return failure(error);}}
export async function POST(request:Request){try{
 return Response.json({ok:true,result:await heroStudioCommand(await requestJson(request))},{headers:PRIVATE_HEADERS});
}catch(error){return failure(error);}}
