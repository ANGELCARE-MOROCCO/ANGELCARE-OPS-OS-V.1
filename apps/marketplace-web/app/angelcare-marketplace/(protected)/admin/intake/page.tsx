import {requireMarketplacePageContext} from '@/angelcare-marketplace/auth/context'
import {intakeSnapshot} from '@/angelcare-marketplace/operational-intake/repository'
import {IntakeWorkspace} from '@/angelcare-marketplace/operational-intake/IntakeWorkspace'
export const dynamic='force-dynamic'
export default async function Page(){const context=await requireMarketplacePageContext();return <IntakeWorkspace initial={await intakeSnapshot(context,{source:''})} initialSource=""/>}
