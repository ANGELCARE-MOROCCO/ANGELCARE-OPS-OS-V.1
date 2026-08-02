import {notFound} from 'next/navigation'
import {BasketExperience} from '@/angelcare-marketplace/conversion-universe/components/BasketExperience'
import {getConversionItem} from '@/angelcare-marketplace/conversion-universe/repository'
import type {CatalogLocale} from '@/angelcare-marketplace/catalog-discovery/types'
export default async function Page({params,searchParams}:{params:Promise<{locale:string}>;searchParams:Promise<Record<string,string|string[]|undefined>>}){const {locale}=await params;if(!['fr','en','ar'].includes(locale))notFound();const query=await searchParams;const value=query.item;const itemSlug=Array.isArray(value)?value[0]:value;const item=itemSlug?await getConversionItem({locale:locale as CatalogLocale,slug:itemSlug}):null;return <BasketExperience locale={locale as CatalogLocale} initialItem={item} kind="quotation"/>}
