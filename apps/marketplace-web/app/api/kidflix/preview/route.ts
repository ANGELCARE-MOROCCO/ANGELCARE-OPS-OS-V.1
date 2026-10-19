import {isLocale,world}from '@/angelcare-marketplace/kidflix/catalogue';
import {publicHost}from '@/angelcare-marketplace/kidflix/server';
import {getStorefront,getPreview}from '@/angelcare-marketplace/kidflix/storefronts/server';
export const dynamic='force-dynamic';export const runtime='nodejs';
export async function GET(request:Request){const u=new URL(request.url),locale=u.searchParams.get('locale')||'en';const headers={'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'};
if(!isLocale(locale))return Response.json({error:'INVALID_LANGUAGE'},{status:400,headers});
try{const host=publicHost(request.headers.get('host')||u.host);const value=await getPreview(host,locale,u.searchParams.get('key')||'');return Response.json(value||{error:'RESOURCE_UNAVAILABLE'},{status:value?200:404,headers});
}catch{return Response.json({error:'DISCOVERY_UNAVAILABLE'},{status:503,headers});}}
