import { CareLinkOpsEnterpriseRoutePage } from '@/components/carelink/ops/enterprise/CareLinkOpsEnterpriseRoutePage'

export const dynamic = 'force-dynamic'

export default async function Page() {
  return await CareLinkOpsEnterpriseRoutePage({
    view: 'settings',
    title: 'Operating Standards',
    subtitle: 'Lifecycle rules, thresholds, contacts and mobile sync standards.',
    apiPath: '/api/carelink/ops/settings',
  })
}
