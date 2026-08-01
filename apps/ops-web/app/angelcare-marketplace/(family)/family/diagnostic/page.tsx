import { requireMarketplacePageContext } from '@/angelcare-marketplace/auth/context'
import { DiagnosticWizard } from '@/angelcare-marketplace/family-experience/components/DiagnosticWizard'
import { listChildren } from '@/angelcare-marketplace/family-experience/repository'
export default async function Page(){const context=await requireMarketplacePageContext('marketplace.family.diagnostics.create');return <DiagnosticWizard children={await listChildren(context)}/>}
