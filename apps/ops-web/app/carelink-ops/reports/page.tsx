import { CareLinkOpsEnterpriseRoutePage } from '@/components/carelink/ops/enterprise/CareLinkOpsEnterpriseRoutePage'

export const dynamic = 'force-dynamic'

export default async function Page() {
  return await CareLinkOpsEnterpriseRoutePage({
    view: 'reports',
    title: 'Reports Validation Center',
    subtitle: 'Validation rapports, qualité, corrections et handoff finance.',
    apiPath: '/api/carelink/ops/reports',
  })
}
