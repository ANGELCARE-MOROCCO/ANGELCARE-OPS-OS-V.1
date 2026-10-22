import type { MetadataRoute } from 'next';
import { isLocale } from './contracts';
import { resolveScreen } from './routes';
import { nativeCountry } from './geography';
import { uuid,object,integer } from './validation';
const escape=(value:string)=>value.replace(/[<>&'\"]/g,character=>({'<':'&lt;','>':'&gt;','&':'&amp;',"'":'&apos;','"':'&quot;'}[character]||''));
export function publicOrigin(value:string){const url=new URL(value);if(url.protocol!=='https:'||url.username||url.password||url.pathname!=='/'||url.search||url.hash)throw Error('JOBKIX_PUBLIC_ORIGIN_INVALID');return url.origin;}
/** Preserve the existing robots authority, including a disabled sitemap and all crawl rules. */
export function appendJobkixSitemap(value:MetadataRoute.Robots):MetadataRoute.Robots{
 const original=value.sitemap;if(!original)return value;const list=Array.isArray(original)?original:[original];if(!list.length)return value;
 try{const base=new URL(list[0]),origin=publicOrigin(base.origin),url=origin+'/jobkix/sitemap.xml';return {...value,sitemap:Array.from(new Set([...list,url]))};}catch{return value;}
}
export function safeSitemapPath(path:unknown){
 if(typeof path!=='string'||!path.startsWith('/jobkix/')||/[?%#\\\u0000-\u0020]/.test(path)||path.includes('..'))return null;
 const parts=path.split('/');if(!isLocale(parts[2]))return null;const segments=parts.slice(3),route=resolveScreen(segments);if(!route||route.screen.audience!=='public')return null;
 try{if(['P02','P12'].includes(route.screen.id))uuid(segments[1]);if(['P08','P09'].includes(route.screen.id))nativeCountry(segments[1]);if(route.screen.id==='P09'&&!/^[a-f0-9]{16}$/.test(segments[2]))return null;}catch{return null;}
 if(segments.some(segment=>!/^[a-z0-9-]+$/.test(segment)))return null;return path;
}
export function sitemapPage(value:unknown){const row=object(value);if(!Array.isArray(row.items))throw Error('JOBKIX_SITEMAP_INVALID');return {items:row.items.map(object),total:integer(row.total,'total',0,50000000),page:integer(row.page,'page',1,50000)};}
export function sitemapXml(origin:string,items:Record<string,unknown>[]){const base=publicOrigin(origin);return '<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'+items.flatMap(row=>{const path=safeSitemapPath(row.path);if(!path)return [];const modified=typeof row.modified==='string'&&Number.isFinite(Date.parse(row.modified))?'<lastmod>'+escape(new Date(row.modified).toISOString())+'</lastmod>':'';return ['<url><loc>'+escape(base+path)+'</loc>'+modified+'</url>'];}).join('')+'</urlset>';}
export function sitemapIndexXml(origin:string,total:number){const base=publicOrigin(origin);integer(total,'total',0,50000000);return '<?xml version="1.0" encoding="UTF-8"?><sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'+Array.from({length:Math.ceil(total/1000)},(_,index)=>'<sitemap><loc>'+escape(base+'/jobkix/sitemaps/'+(index+1)+'.xml')+'</loc></sitemap>').join('')+'</sitemapindex>';}
