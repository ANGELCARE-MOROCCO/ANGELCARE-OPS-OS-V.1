import { requireMarketplacePageContext } from '@/angelcare-marketplace/auth/context'
import { listTestResults } from '@/angelcare-marketplace/launch-assurance/repository'
import { ResultAuthority } from '@/angelcare-marketplace/launch-assurance/components/QaRegisters'
export default async function Page(){await requireMarketplacePageContext('marketplace.qa.view');const items=(await listTestResults()).filter(x=>x.domain==='performance');return <ResultAuthority items={items} title="Performance assurance"/>}