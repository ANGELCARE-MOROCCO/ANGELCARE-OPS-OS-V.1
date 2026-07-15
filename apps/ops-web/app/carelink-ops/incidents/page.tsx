import { CareLinkOpsEnterpriseRoutePage } from '@/components/carelink/ops/enterprise/CareLinkOpsEnterpriseRoutePage'

export const dynamic = 'force-dynamic'

export default async function Page() {
  return await CareLinkOpsEnterpriseRoutePage({
    view: 'incidents',
    title: 'Incident Command Center',
    subtitle: 'Triage, escalade, résolution et suivi opérationnel des incidents terrain.',
    apiPath: '/api/carelink/ops/incidents',
  })
}
