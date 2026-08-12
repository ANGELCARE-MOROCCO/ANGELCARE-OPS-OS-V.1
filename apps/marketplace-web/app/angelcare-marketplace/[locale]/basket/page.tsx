import {notFound} from 'next/navigation'
import {BasketExperience} from '@/angelcare-marketplace/conversion-universe/components/BasketExperience'
import {getConversionItem} from '@/angelcare-marketplace/conversion-universe/repository'
import type {CatalogLocale} from '@/angelcare-marketplace/catalog-discovery/types'
import {getPublishedSurface} from '@/angelcare-marketplace/total-commerce-control/repository'
import {PublicSurfaceSections} from '@/angelcare-marketplace/total-commerce-control/components/PublicSurfaceSections'
export default async function Page({params,searchParams}:{params:Promise<{locale:string}>;searchParams:Promise<Record<string,string|string[]|undefined>>}){const {locale}=await params;if(!['fr','en','ar'].includes(locale))notFound();const query=await searchParams;const value=query.item;const itemSlug=Array.isArray(value)?value[0]:value;const safeLocale=locale as CatalogLocale;const [item,surface]=await Promise.all([itemSlug?getConversionItem({locale:safeLocale,slug:itemSlug}):Promise.resolve(null),getPublishedSurface('cart',{locale}).catch(()=>null)]);return <><BasketExperience locale={safeLocale} initialItem={item} kind="transactional"/><PublicSurfaceSections experience={surface}/></>}
