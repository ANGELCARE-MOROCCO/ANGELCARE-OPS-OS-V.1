import { publicSitemap } from '@/angelcare-marketplace/jobkix/server/sitemap';
export const runtime='nodejs';
export const dynamic='force-dynamic';
export async function GET(){return publicSitemap();}
