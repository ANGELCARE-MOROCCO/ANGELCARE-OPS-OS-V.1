import { CareLinkOpsEnterpriseRoutePage } from '@/components/carelink/ops/enterprise/CareLinkOpsEnterpriseRoutePage'

export const dynamic = 'force-dynamic'

export default async function Page() {
  return await CareLinkOpsEnterpriseRoutePage({
    view: 'audit',
    title: 'Audit Center',
    subtitle: 'Trace mission_events, dispatch, mobilité, validation et conformité.',
    apiPath: '/api/carelink/ops/audit',
  })
}
