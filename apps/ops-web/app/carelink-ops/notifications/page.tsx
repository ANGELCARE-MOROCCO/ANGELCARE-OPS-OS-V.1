import { CareLinkOpsEnterpriseRoutePage } from '@/components/carelink/ops/enterprise/CareLinkOpsEnterpriseRoutePage'

export const dynamic = 'force-dynamic'

export default async function Page() {
  return await CareLinkOpsEnterpriseRoutePage({
    view: 'notifications',
    title: 'Notifications Center',
    subtitle: 'Notifications persistantes, priorités, accusés de réception et mission links.',
    apiPath: '/api/carelink/ops/notifications',
  })
}
