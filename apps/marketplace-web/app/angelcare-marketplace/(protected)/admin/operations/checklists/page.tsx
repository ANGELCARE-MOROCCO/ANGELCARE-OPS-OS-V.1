import { requireMarketplacePageContext } from '@/angelcare-marketplace/auth/context'
import { ChecklistRegister } from '@/angelcare-marketplace/operations-execution/components/OperationsEvidenceRegisters'
import { listChecklistRunsAdmin } from '@/angelcare-marketplace/operations-execution/repository'
export default async function Page(){const context=await requireMarketplacePageContext('marketplace.operations.view');return <ChecklistRegister items={await listChecklistRunsAdmin(context)}/>}
