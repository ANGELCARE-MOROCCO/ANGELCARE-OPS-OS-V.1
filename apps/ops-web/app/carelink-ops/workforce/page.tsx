import { CareLinkOpsEnterpriseRoutePage } from '@/components/carelink/ops/enterprise/CareLinkOpsEnterpriseRoutePage'

export const dynamic = 'force-dynamic'

export default async function Page() {
  return await CareLinkOpsEnterpriseRoutePage({
    view: 'workforce',
    title: 'Workforce Control',
    subtitle: 'Capacité, couverture ville/zone, online/offline et readiness workforce.',
    apiPath: '/api/carelink/ops/workforce',
  })
}
