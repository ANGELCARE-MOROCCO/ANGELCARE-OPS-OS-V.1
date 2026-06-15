import { CareLinkOpsEnterpriseRoutePage } from '@/components/carelink/ops/enterprise/CareLinkOpsEnterpriseRoutePage'

export const dynamic = 'force-dynamic'

export default async function Page() {
  return await CareLinkOpsEnterpriseRoutePage({
    view: 'control-room',
    title: 'Control Room',
    subtitle: 'Cockpit opérationnel global, live sync, risque, readiness et audit.',
    apiPath: '/api/carelink/ops/control-room',
  })
}
