import 'server-only';
import { createServiceClient } from '@/lib/supabase/server';
import { getPublishedWebPresence } from '../../web-presence/repository';
import { publicOrigin,sitemapPage,sitemapXml,sitemapIndexXml } from '../sitemap';
import { integer } from '../validation';
const HEADERS={'Content-Type':'application/xml; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'};
export async function publicSitemap(page?:number){
 try{
  const authority=await getPublishedWebPresence('GLOBAL_DOMAIN');if(!authority.configuration.sitemap.enabled)return new Response('Not found',{status:404,headers:{'Cache-Control':'no-store'}});
  const origin=publicOrigin(authority.configuration.identity.canonicalOrigin),db=await createServiceClient(),result=await db.rpc('jobkix_sitemap_page',{p_page:page===undefined?1:integer(page,'page',1,50000)});if(result.error)throw Error('JOBKIX_SITEMAP_UNAVAILABLE');const data=sitemapPage(result.data);
  if(page!==undefined&&page>Math.max(1,Math.ceil(data.total/1000)))return new Response('Not found',{status:404,headers:{'Cache-Control':'no-store'}});
  return new Response(page===undefined?sitemapIndexXml(origin,data.total):sitemapXml(origin,data.items),{headers:HEADERS});
 }catch{return new Response('Sitemap temporarily unavailable',{status:503,headers:{'Cache-Control':'no-store','Retry-After':'300','X-Content-Type-Options':'nosniff'}});}
}
