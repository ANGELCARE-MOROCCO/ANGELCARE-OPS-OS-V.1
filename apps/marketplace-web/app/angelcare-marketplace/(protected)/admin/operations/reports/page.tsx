import { requireMarketplacePageContext } from '@/angelcare-marketplace/auth/context'
import { ReportRegister } from '@/angelcare-marketplace/operations-execution/components/OperationsEvidenceRegisters'
import { listMissionReportsAdmin } from '@/angelcare-marketplace/operations-execution/repository'
export default async function Page(){const context=await requireMarketplacePageContext('marketplace.operations.view');return <ReportRegister items={await listMissionReportsAdmin(context)}/>}
