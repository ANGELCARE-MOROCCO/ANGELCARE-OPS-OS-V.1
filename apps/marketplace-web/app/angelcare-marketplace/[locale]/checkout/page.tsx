import {notFound,redirect} from 'next/navigation'
import {CheckoutExperience} from '@/angelcare-marketplace/conversion-universe/components/CheckoutExperience'
import type {CatalogLocale} from '@/angelcare-marketplace/catalog-discovery/types'
const first=(value:string|string[]|undefined)=>Array.isArray(value)?value[0]:value
export default async function Page({params,searchParams}:{params:Promise<{locale:string}>;searchParams:Promise<Record<string,string|string[]|undefined>>}){const {locale}=await params;if(!['fr','en','ar'].includes(locale))notFound();const query=await searchParams;const basketId=first(query.basket);if(!basketId)redirect(`/angelcare-marketplace/${locale}/basket`);const kind=first(query.kind)==='quotation'?'quotation':'transactional';return <CheckoutExperience locale={locale as CatalogLocale} basketId={basketId} kind={kind}/>}
