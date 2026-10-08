import { hasMarketplacePermission, requireMarketplacePageContext } from '@/angelcare-marketplace/auth/context'
import { listAssessments, listBadges, listEvidence } from '@/angelcare-marketplace/trust-quality/repository'
import { Quality360Command } from '@/angelcare-marketplace/trust-quality/components/Quality360Command'
import { TrustDecisionDesk } from '@/angelcare-marketplace/trust-quality/components/TrustDecisionDesk'
import { QualityAssessmentInspector } from '@/angelcare-marketplace/trust-quality/components/TrustContextInspectors'
export default async function Page(){const context=await requireMarketplacePageContext('marketplace.quality.view');const[items,evidence,badges]=await Promise.all([listAssessments(context),listEvidence(context),listBadges(context)]);return <><Quality360Command items={items}/><QualityAssessmentInspector assessments={items} evidence={evidence} badges={badges}/><TrustDecisionDesk kind="assessment" items={items} canManage={hasMarketplacePermission(context,'marketplace.quality.assessments.manage')}/></>}
