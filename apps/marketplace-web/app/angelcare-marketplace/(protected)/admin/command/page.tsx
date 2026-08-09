import { requireMarketplacePageContext } from '@/angelcare-marketplace/auth/context'
import { SovereignCockpit } from '@/angelcare-marketplace/sovereign-control/components/SovereignCockpit'
import { getCommandSummary } from '@/angelcare-marketplace/sovereign-control/repository'
export const metadata={title:'Commandement 360 · ANGELCARE'}
export default async function Page(){await requireMarketplacePageContext('marketplace.backoffice.cockpit.view');return <SovereignCockpit summary={await getCommandSummary()}/>}
