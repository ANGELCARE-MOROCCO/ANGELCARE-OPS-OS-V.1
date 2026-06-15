import { CareLinkOpsEnterpriseRoutePage } from '@/components/carelink/ops/enterprise/CareLinkOpsEnterpriseRoutePage'

export const dynamic = 'force-dynamic'

export default async function Page() {
  return await CareLinkOpsEnterpriseRoutePage({
    view: 'performance',
    title: 'Performance Control',
    subtitle: 'Qualité opérationnelle, no-show, incidents et charge workforce.',
    apiPath: '/api/carelink/ops/performance',
  })
}
