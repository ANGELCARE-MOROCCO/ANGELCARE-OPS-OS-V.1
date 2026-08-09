import { requireMarketplacePageContext } from '@/angelcare-marketplace/auth/context'
import { listTestSuites } from '@/angelcare-marketplace/launch-assurance/repository'
import { SuiteAuthority } from '@/angelcare-marketplace/launch-assurance/components/QaRegisters'
export default async function Page(){await requireMarketplacePageContext('marketplace.qa.view');return <SuiteAuthority items={await listTestSuites()}/>}