import { requireMarketplacePageContext } from '@/angelcare-marketplace/auth/context'
import { academyCommand } from '@/angelcare-marketplace/academy-engine/repository'
import { AcademyCommand } from '@/angelcare-marketplace/academy-engine/components/AcademyCommand'
export default async function Page(){const context=await requireMarketplacePageContext('marketplace.academy.view');return <AcademyCommand data={await academyCommand(context)}/>}
