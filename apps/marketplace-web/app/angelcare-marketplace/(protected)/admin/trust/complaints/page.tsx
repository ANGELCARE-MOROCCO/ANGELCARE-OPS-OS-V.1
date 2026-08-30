import { hasMarketplacePermission, requireMarketplacePageContext } from '@/angelcare-marketplace/auth/context'
import { listCapa, listComplaints, listNonConformities } from '@/angelcare-marketplace/trust-quality/repository'
import { ComplaintCommand } from '@/angelcare-marketplace/trust-quality/components/ComplaintCommand'
import { TrustDecisionDesk } from '@/angelcare-marketplace/trust-quality/components/TrustDecisionDesk'
import { ComplaintInvestigationInspector } from '@/angelcare-marketplace/trust-quality/components/TrustContextInspectors'
export default async function Page(){const context=await requireMarketplacePageContext('marketplace.complaints.view');const[items,nonConformities,capa]=await Promise.all([listComplaints(context),listNonConformities(context),listCapa(context)]);return <><ComplaintCommand items={items}/><ComplaintInvestigationInspector complaints={items} nonConformities={nonConformities} capa={capa}/><TrustDecisionDesk kind="complaint" items={items} canManage={hasMarketplacePermission(context,'marketplace.complaints.manage')}/></>}
