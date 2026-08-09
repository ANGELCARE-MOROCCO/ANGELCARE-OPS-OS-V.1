import { requireMarketplacePageContext } from '@/angelcare-marketplace/auth/context'
import { QuoteRequestForm } from '@/angelcare-marketplace/family-experience/components/QuoteRequestForm'
import { listChildren, listDiagnostics } from '@/angelcare-marketplace/family-experience/repository'
export default async function Page(){const context=await requireMarketplacePageContext('marketplace.family.requests.create');const [children,diagnostics]=await Promise.all([listChildren(context),listDiagnostics(context)]);return <QuoteRequestForm children={children} diagnostics={diagnostics}/>}
