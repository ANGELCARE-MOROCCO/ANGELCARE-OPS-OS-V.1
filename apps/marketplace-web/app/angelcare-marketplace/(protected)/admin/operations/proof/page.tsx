import { requireMarketplacePageContext } from '@/angelcare-marketplace/auth/context'
import { ProofRegister } from '@/angelcare-marketplace/operations-execution/components/OperationsEvidenceRegisters'
import { listMissionProofAdmin } from '@/angelcare-marketplace/operations-execution/repository'
export default async function Page(){const context=await requireMarketplacePageContext('marketplace.operations.view');return <ProofRegister items={await listMissionProofAdmin(context)}/>}
