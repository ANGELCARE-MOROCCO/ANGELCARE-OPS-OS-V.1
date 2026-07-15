import { CareLinkOpsEnterpriseRoutePage } from '@/components/carelink/ops/enterprise/CareLinkOpsEnterpriseRoutePage'

export const dynamic = 'force-dynamic'

export default async function Page() {
  return await CareLinkOpsEnterpriseRoutePage({
    view: 'quality',
    title: 'Quality Operations',
    subtitle: 'Qualité mission, incident rate, report quality et amélioration continue.',
    apiPath: '/api/carelink/ops/quality',
  })
}
