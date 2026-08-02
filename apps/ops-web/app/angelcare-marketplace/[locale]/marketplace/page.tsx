import {notFound} from 'next/navigation'
import {MarketplaceIndex} from '@/angelcare-marketplace/catalog-discovery/components/MarketplaceIndex'
import {searchDiscovery} from '@/angelcare-marketplace/catalog-discovery/repository'
import type {CatalogLocale} from '@/angelcare-marketplace/catalog-discovery/types'
export default async function Page({params}:{params:Promise<{locale:string}>}){const {locale}=await params;if(!['fr','en','ar'].includes(locale))notFound();return <MarketplaceIndex data={await searchDiscovery({locale:locale as CatalogLocale,limit:80})}/>}
