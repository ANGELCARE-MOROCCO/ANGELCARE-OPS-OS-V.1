import { requireMarketplacePageContext } from '@/angelcare-marketplace/auth/context'
import { familyRequestNeed } from '@/angelcare-marketplace/families-storefront/experience'
import { QuoteRequestForm } from '@/angelcare-marketplace/family-experience/components/QuoteRequestForm'
import { listChildren, listDiagnostics } from '@/angelcare-marketplace/family-experience/repository'
export default async function Page({searchParams}:{searchParams:Promise<Record<string,string|string[]|undefined>>}){const need=familyRequestNeed((await searchParams).need);const context=await requireMarketplacePageContext('marketplace.family.requests.create');const [children,diagnostics]=await Promise.all([listChildren(context),listDiagnostics(context)]);return <QuoteRequestForm children={children} diagnostics={diagnostics} initialNeed={need}/>}
