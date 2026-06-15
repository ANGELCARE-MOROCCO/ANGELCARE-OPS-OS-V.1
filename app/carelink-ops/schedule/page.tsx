import { CareLinkOpsEnterpriseRoutePage } from '@/components/carelink/ops/enterprise/CareLinkOpsEnterpriseRoutePage'

export const dynamic = 'force-dynamic'

export default async function Page() {
  return await CareLinkOpsEnterpriseRoutePage({
    view: 'schedule',
    title: 'Schedule Control',
    subtitle: 'Planning opérationnel, densité, conflits, disponibilités et remplacements.',
    apiPath: '/api/carelink/ops/schedule',
  })
}
