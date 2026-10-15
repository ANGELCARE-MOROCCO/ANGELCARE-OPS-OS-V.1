import {notFound} from 'next/navigation'
import {CategoryCollection} from '@/angelcare-marketplace/public-discovery/CategoryCollection'
import {Storefront} from '@/angelcare-marketplace/catalog-discovery/components/Storefront'
import {storefrontExperience} from '@/angelcare-marketplace/catalog-discovery/repository'
import type {CatalogLocale,StorefrontKey} from '@/angelcare-marketplace/catalog-discovery/types'
const keys=['families','home-services','development','kits','academy','establishments','hospitality','health-partners','corporates','partner-os','quality-check','professionals'] as const
export default async function Page({params,searchParams}:{params:Promise<{locale:string;categorySlug:string}>;searchParams:Promise<Record<string,string|string[]|undefined>>}){const {locale,categorySlug}=await params;if(!['fr','en','ar'].includes(locale))notFound();if(!keys.includes(categorySlug as StorefrontKey)){if(!/^[a-z0-9][a-z0-9_.-]{0,119}$/i.test(categorySlug))notFound();const s=await searchParams;const value=Array.isArray(s.page)?s.page[0]:s.page;const page=Math.max(1,Math.min(100000,Math.floor(Number(value)||1)));return <CategoryCollection categoryKey={categorySlug} locale={locale as CatalogLocale} page={page}/>}return <Storefront experience={await storefrontExperience({locale:locale as CatalogLocale,key:categorySlug as StorefrontKey})}/>}
