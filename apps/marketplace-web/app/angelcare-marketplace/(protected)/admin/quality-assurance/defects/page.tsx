import { requireMarketplacePageContext } from '@/angelcare-marketplace/auth/context'
import { listDefects } from '@/angelcare-marketplace/launch-assurance/repository'
import { DefectAuthority } from '@/angelcare-marketplace/launch-assurance/components/QaRegisters'
export default async function Page(){await requireMarketplacePageContext('marketplace.qa.view');return <DefectAuthority items={await listDefects()}/>}