import { requireMarketplacePageContext } from '@/angelcare-marketplace/auth/context'
import { PageHeader } from '@/angelcare-marketplace/design-system/ui'
import { ApprovalCenter } from '@/angelcare-marketplace/sovereign-control/components/ApprovalCenter'
import { listApprovals } from '@/angelcare-marketplace/sovereign-control/repository'

export default async function Page() {
  await requireMarketplacePageContext('marketplace.backoffice.approvals.view')
  return <><PageHeader eyebrow="DECISION AUTHORITY" title="Centre d’approbation" description="Aucune publication, activation ou décision sensible sans propriétaire, preuve et décision enregistrée."/><ApprovalCenter initialApprovals={await listApprovals()} /></>
}
