import {notFound} from 'next/navigation'
import {Storefront} from '@/angelcare-marketplace/catalog-discovery/components/Storefront'
import {storefrontExperience} from '@/angelcare-marketplace/catalog-discovery/repository'
import type {CatalogLocale,StorefrontKey} from '@/angelcare-marketplace/catalog-discovery/types'
const keys=['families','home-services','development','kits','academy','establishments','hospitality','health-partners','corporates','partner-os','quality-check','professionals'] as const
export default async function Page({params}:{params:Promise<{locale:string;categorySlug:string}>}){const {locale,categorySlug}=await params;if(!['fr','en','ar'].includes(locale)||!keys.includes(categorySlug as StorefrontKey))notFound();return <Storefront experience={await storefrontExperience({locale:locale as CatalogLocale,key:categorySlug as StorefrontKey})}/>}
