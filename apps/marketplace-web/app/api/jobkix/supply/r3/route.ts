import {r3Read,r3Command,templateFor,roundtripTemplate} from '@/angelcare-marketplace/jobkix/supply/r3/admin';
import {PRIVATE_HEADERS,requestJson,failure} from '@/angelcare-marketplace/jobkix/server/http';
import {supplyAdmin} from '@/angelcare-marketplace/jobkix/supply/server';
export const runtime='nodejs';export const dynamic='force-dynamic';
export async function GET(request:Request){try{
 await supplyAdmin();const u=new URL(request.url),type=u.searchParams.get('template');
 if(type){const result=type==='roundtrip'?await roundtripTemplate():templateFor(type);return new Response(result.csv,{headers:{...PRIVATE_HEADERS,'Content-Type':'text/csv; charset=utf-8','Content-Disposition':`attachment; filename="${result.filename}"`}})}
 return Response.json({ok:true,result:await r3Read(u.searchParams.get('view')||'health')},{headers:PRIVATE_HEADERS});
}catch(e){return failure(e)}}
export async function POST(request:Request){let authorized=false;try{await supplyAdmin();authorized=true;const data=await requestJson(request,2500000);return Response.json({ok:true,result:await r3Command(data)},{headers:PRIVATE_HEADERS})}catch(e){if(authorized){const message=(e instanceof Error?e.message:String(e)).slice(0,300);return Response.json({ok:false,error:{code:'R3_OPERATION_FAILED',message}},{status:422,headers:PRIVATE_HEADERS})}return failure(e)}}
