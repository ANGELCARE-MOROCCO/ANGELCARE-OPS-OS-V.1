import 'server-only';
import type { Metadata } from 'next';
import { cache } from 'react';
import { storefrontExperience } from '../catalog-discovery/repository';
import type { CatalogLocale, StorefrontKey } from '../catalog-discovery/types';
import { getPublicStorefrontNavigation } from '../public-experience-authority/storefront-navigation';
import { seoMetadata } from './public';
export const storefrontNativeMetadata=cache(async(key:StorefrontKey,locale:string):Promise<Metadata>=>{
 if(!['fr','en','ar'].includes(locale))return {robots:{index:false,follow:false}};
 const safe=locale as CatalogLocale,bodyHook=key==='families'||key==='home-services',path=`/angelcare-marketplace/${locale}/${key}`;
 const native=await storefrontExperience({locale:safe,key}).catch(()=>null);
 return {title:native?.hero.title||getPublicStorefrontNavigation(safe).find(v=>v.key===key)?.label,description:native?.hero.lead||undefined,alternates:{canonical:path},other:{'seo-power-body':bodyHook?'r1':'none'},...(!native?{robots:{index:false,follow:false}}:{})};
});
export async function storefrontMetadata(key:StorefrontKey,locale:string,query:Record<string,unknown>={}){const base=await storefrontNativeMetadata(key,locale);const filtered=Object.keys(query).some(k=>query[k]!==undefined&&query[k]!=='');return seoMetadata('angelcare',`/angelcare-marketplace/${locale}/${key}`,filtered?{...base,robots:{index:false,follow:true}}:base);}
