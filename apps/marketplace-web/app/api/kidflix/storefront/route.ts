import {isLocale,world}from '@/angelcare-marketplace/kidflix/catalogue';
import {publicHost}from '@/angelcare-marketplace/kidflix/server';
import {getStorefront,getPreview}from '@/angelcare-marketplace/kidflix/storefronts/server';
import {cleanFilters}from '@/angelcare-marketplace/kidflix/storefront-reference/model';
export const dynamic='force-dynamic';export const runtime='nodejs';
export async function GET(request:Request){const u=new URL(request.url),locale=u.searchParams.get('locale')||'en';const headers={'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'};
if(!isLocale(locale))return Response.json({error:'INVALID_LANGUAGE'},{status:400,headers});
try{const host=publicHost(request.headers.get('host')||u.host);const family=u.searchParams.get('family')||'';if(!world(family))return Response.json({error:'UNKNOWN_WORLD'},{status:400,headers});let input;try{input=family==='documents'?Object.fromEntries(u.searchParams):cleanFilters(Object.fromEntries(u.searchParams),family);}catch{return Response.json({error:'INVALID_FILTER'},{status:400,headers});}return Response.json(await getStorefront(host,locale,family,input),{headers});
}catch(e){return Response.json({error:(e as any)?.setupRequired?'CATALOGUE_SETUP_REQUIRED':'DISCOVERY_UNAVAILABLE'},{status:503,headers});}}
