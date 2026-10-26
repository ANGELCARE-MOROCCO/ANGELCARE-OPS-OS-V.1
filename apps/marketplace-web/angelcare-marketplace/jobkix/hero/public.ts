import 'server-only';
import {cache} from 'react';
import {createServiceClient} from '@/lib/supabase/server';
import {isUUID,validPlacement,validateHero,type HeroDocument,type HeroGallery,type HeroResolvedSlide} from './contracts';
const imageTypes=['image/jpeg','image/png','image/webp','image/avif'];
const safeUrl=(url:unknown):url is string=>typeof url==='string'&&(url.startsWith('/api/angelcare-marketplace/media/')||/^https:\/\/[a-z0-9.-]+\//i.test(url)&&!url.includes('@'));
type Asset={id:string;status:string;rights_status:string;rights_expires_at:string|null;mime_type:string;public_url:string;desktop_url:string|null;mobile_url:string|null;width:number|null;height:number|null};
export const getHeroDocument=cache(async(key:string):Promise<HeroDocument|null>=>{
 if(!validPlacement(key))return null;
 try{
  const db=await createServiceClient(),{data,error}=await db.from('jobkix_hero_placements').select('published').eq('placement_key',key).maybeSingle();
  if(error||!data?.published)return null;
  const doc=validateHero(data.published);return doc.slides.length?doc:null;
 }catch{return null;/* Migration pending or missing: maintain original hero without interruption. */}
});
export const resolveHeroDocument=cache(async(doc:HeroDocument):Promise<HeroGallery|null>=>{
 if(!doc.slides.length)return null;
 const ids=[...new Set(doc.slides.flatMap(s=>[s.assetId,...s.mobileAssetId?[s.mobileAssetId]:[]]))];
 if(!ids.every(isUUID))return null;
 try{
  const db=await createServiceClient(),{data,error}=await db.from('angelcare_marketplace_media_assets').select('id,status,rights_status,rights_expires_at,mime_type,public_url,desktop_url,mobile_url,width,height').in('id',ids);
  if(error)return null;
  const now=Date.now(),assets=new Map<string,Asset>((data||[]).filter((a:Asset)=>a.status==='active'&&['owned','licensed','public_domain'].includes(a.rights_status)&&(!a.rights_expires_at||Date.parse(a.rights_expires_at)>now)&&imageTypes.includes(a.mime_type)&&safeUrl(a.desktop_url||a.public_url)&&Number(a.width)>0&&Number(a.height)>0).map((a:Asset)=>[a.id,a]));
  const slides:HeroResolvedSlide[]=doc.slides.flatMap(slide=>{
   const a=assets.get(slide.assetId);if(!a)return [];
   const mobile=slide.mobileAssetId?assets.get(slide.mobileAssetId):null;
   if(slide.mobileAssetId&&!mobile)return [];
   const url=a.desktop_url||a.public_url,mobileUrl=mobile?(mobile.mobile_url||mobile.desktop_url||mobile.public_url):(a.mobile_url||url);
   if(!safeUrl(url)||!safeUrl(mobileUrl))return [];
   return [{...slide,url,mobileUrl,width:Number(a.width),height:Number(a.height)}];
  });
  return slides.length?{...doc,slides}:null;
 }catch{return null;}
});
export async function publishedHero(key:string,existingApprovedCover:boolean):Promise<HeroGallery|null>{
 if(!validPlacement(key))return null;
 const exact=await getHeroDocument(key);if(exact)return resolveHeroDocument(exact);
 // Existing editorial/employer owned covers take precedence over a generic family default.
 if(existingApprovedCover)return null;
 const family=key.split(':')[0];if(family===key)return null;
 const inherited=await getHeroDocument(family);return inherited?resolveHeroDocument(inherited):null;
}
