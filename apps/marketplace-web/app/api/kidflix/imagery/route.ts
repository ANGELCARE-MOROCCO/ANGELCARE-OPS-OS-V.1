import {publicImagery} from '@/angelcare-marketplace/kidflix/imagery/service';
export const runtime='nodejs';export const dynamic='force-dynamic';
export async function GET(request:Request){const u=new URL(request.url),headers={'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'};try{return Response.json(await publicImagery(request.headers.get('host')||u.host,u.searchParams.get('page')||'home'),{headers});}catch{return Response.json({error:'IMAGERY_UNAVAILABLE'},{status:503,headers});}}
