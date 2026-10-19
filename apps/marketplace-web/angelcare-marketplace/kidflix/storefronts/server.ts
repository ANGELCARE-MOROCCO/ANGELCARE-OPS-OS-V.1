import 'server-only';
import {createServiceClient}from '@/lib/supabase/server';
import {card,filters,publicHost,getExperience}from '../server';
import {emptyCatalogue,world,type Locale}from '../catalogue';
import {outputReadiness}from '../../digital-customer-experience/experience-contract';
import {blankFacts,normalize,type StorefrontData,type Item}from './model';
import {defaults}from './themes';
const object=(v:any)=>v&&typeof v==='object'&&!Array.isArray(v)?v:{};
export function project(row:any,locale:Locale):Item|null {
 const r=card(row,locale);if(!r)return null;
 const source=object(row.factsSource),d=object(source.definition),b=object(source.bindings),facts=blankFacts();
 facts.counts=Object.fromEntries(Object.entries(object(d.counts)).filter(([k,n])=>['units','cards','questions','frames','steps','items','modules'].includes(k)&&Number.isSafeInteger(n)&&Number(n)>0)) as Record<string,number>;
 facts.formats=[...new Set(outputReadiness(d,b).filter(o=>o.ready&&o.enabled!==false&&d.downloadAllowed===true).map(o=>o.mime==='application/pdf'?'PDF':'PNG'))];
 const media=object(b.media),mapped=(id:any,prefix:string)=>typeof id==='string'&&typeof media[id]?.url==='string'&&media[id]?.mime?.startsWith(prefix);
 facts.narration=mapped(d.narrationAssetId,'audio/');facts.captions=mapped(d.captionAssetId,'text/');facts.transcript=typeof d.transcript==='string'&&!!d.transcript.trim();facts.editable=r.family==='planners'&&d.editable===true;
 facts.certificate=r.family==='learning'&&d.certificatePolicy?.enabled===true&&Array.isArray(d.certificatePolicy.locales)&&d.certificatePolicy.locales.includes(locale);
 return {...r,formats:facts.formats,facts};
}
export async function getStorefront(host:string,locale:Locale,family:string,input:Record<string,unknown>={},withCurated=true):Promise<StorefrontData>{
 if(!world(family))throw Error('Unknown world');
 const db=await createServiceClient(),r=await db.rpc('ac_kidflix_storefront',{p_host:publicHost(host),p_locale:locale,p_family:family,p_filters:filters(input),p_page:Math.max(1,Math.min(10000,Math.floor(Number(input.page)||1)))});
 if(r.error)throw Error('Discovery unavailable');
 const v=object(r.data),c=object(v.catalogue),rows=(Array.isArray(c.rows)?c.rows:[]).map((r:any)=>project(r,locale)).filter((r:Item|null):r is Item=>!!r),base=defaults(family,locale),edition=v.edition?normalize(v.edition,locale,family):base;
 const result:StorefrontData={edition,configured:v.configured===true,catalogue:{...emptyCatalogue,...c,rows},facets:object(v.facets),curated:[]};
 // Download formats are only offered as filters when backed by native ready outputs.
 // The SQL facet inventory handles all other choices without loading an entire catalogue.
 const formats=Array.from(new Set<string>(rows.flatMap((r:Item)=>r.facts.formats)));if(!Array.isArray(result.facets.format))result.facets.format=formats;
 if(withCurated){const keys=[...new Set([...edition.featured,...edition.collections.flatMap(c=>c.keys)])];
  if(keys.length){const pages=await Promise.all(Array.from({length:Math.ceil(keys.length/24)},(_,i)=>getStorefront(host,locale,family,{keys:keys.join(','),page:i+1},false)));const by=new Map(pages.flatMap(p=>p.catalogue.rows).map(r=>[r.key,r]));result.curated=keys.map(k=>by.get(k)).filter((r):r is Item=>!!r);}
 }
 return result;
}
export async function loadStorefront(host:string,locale:Locale,family:string,input:Record<string,unknown>={}):Promise<StorefrontData>{try{return await getStorefront(host,locale,family,input)}catch{return {catalogue:{...emptyCatalogue,rows:[],error:true},facets:{},edition:defaults(family,locale),configured:false,curated:[]}}}
export async function getPreview(host:string,locale:Locale,key:string){
 const value=await getExperience(host,locale,key);if(!value)return null;
 const m=value.manifest,w=world(m.family);if(!w)return null;
 const data=await getStorefront(host,locale,w.key,{keys:key},false),item=data.catalogue.rows.find(r=>r.key===key);if(!item)return null;
 const images:{url:string;alt:string}[]=item.image?[{url:item.image,alt:item.imageAlt}]:[];
 if(data.edition.preview==='images')for(const unit of Array.isArray(m.definition.units)?m.definition.units:[]){const a=m.bindings.media[unit.assetId];if(a?.mime?.startsWith('image/')&&a.url&&!images.some(i=>i.url===a.url))images.push({url:a.url,alt:a.alt||item.title});if(images.length>=4)break;}
 return {item,images};
}
