import { CareLinkOpsEnterpriseRoutePage } from '@/components/carelink/ops/enterprise/CareLinkOpsEnterpriseRoutePage'

export const dynamic = 'force-dynamic'

export default async function Page() {
  return await CareLinkOpsEnterpriseRoutePage({
    view: 'service-config',
    title: 'Service Configuration',
    subtitle: 'Templates de mission, checklist, brief terrain et standards service.',
    apiPath: '/api/carelink/ops/service-config',
  })
}
