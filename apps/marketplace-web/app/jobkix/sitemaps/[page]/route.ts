import { publicSitemap } from '@/angelcare-marketplace/jobkix/server/sitemap';
export const runtime='nodejs';
export const dynamic='force-dynamic';
export async function GET(_request:Request,{params}:{params:Promise<{page:string}>}){const {page}=await params,match=page.match(/^([1-9][0-9]{0,4})\.xml$/);if(!match||Number(match[1])>50000)return new Response('Not found',{status:404,headers:{'Cache-Control':'no-store'}});return publicSitemap(Number(match[1]));}
