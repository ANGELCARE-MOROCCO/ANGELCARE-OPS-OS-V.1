import {isLocale,world}from '@/angelcare-marketplace/kidflix/catalogue';
import {publicHost}from '@/angelcare-marketplace/kidflix/server';
import {getStorefront,getPreview}from '@/angelcare-marketplace/kidflix/storefronts/server';
export const dynamic='force-dynamic';export const runtime='nodejs';
export async function GET(request:Request){const u=new URL(request.url),locale=u.searchParams.get('locale')||'en';const headers={'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'};
if(!isLocale(locale))return Response.json({error:'INVALID_LANGUAGE'},{status:400,headers});
try{const host=publicHost(request.headers.get('host')||u.host);const family=u.searchParams.get('family')||'';if(!world(family))return Response.json({error:'UNKNOWN_WORLD'},{status:400,headers});return Response.json(await getStorefront(host,locale,family,Object.fromEntries(u.searchParams)),{headers});
}catch{return Response.json({error:'DISCOVERY_UNAVAILABLE'},{status:503,headers});}}
