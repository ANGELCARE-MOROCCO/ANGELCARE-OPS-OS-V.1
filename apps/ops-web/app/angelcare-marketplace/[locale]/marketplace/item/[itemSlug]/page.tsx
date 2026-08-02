import {notFound} from 'next/navigation'
import {ItemDetail} from '@/angelcare-marketplace/catalog-discovery/components/ItemDetail'
import {getDiscoveryItem} from '@/angelcare-marketplace/catalog-discovery/repository'
import type {CatalogLocale} from '@/angelcare-marketplace/catalog-discovery/types'
export default async function Page({params}:{params:Promise<{locale:string;itemSlug:string}>}){const {locale,itemSlug}=await params;if(!['fr','en','ar'].includes(locale))notFound();const item=await getDiscoveryItem({locale:locale as CatalogLocale,slug:itemSlug});if(!item)notFound();return <ItemDetail item={item} locale={locale as CatalogLocale}/>}
