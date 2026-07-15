import { CareLinkOpsEnterpriseRoutePage } from '@/components/carelink/ops/enterprise/CareLinkOpsEnterpriseRoutePage'

export const dynamic = 'force-dynamic'

export default async function Page() {
  return await CareLinkOpsEnterpriseRoutePage({
    view: 'compliance',
    title: 'Compliance Control Center',
    subtitle: 'Documents, readiness blockers, training and service eligibility.',
    apiPath: '/api/carelink/ops/compliance',
  })
}
