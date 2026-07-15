import { CareLinkOpsEnterpriseRoutePage } from '@/components/carelink/ops/enterprise/CareLinkOpsEnterpriseRoutePage'

export const dynamic = 'force-dynamic'

export default async function Page() {
  return await CareLinkOpsEnterpriseRoutePage({
    view: 'readiness',
    title: 'Readiness Center',
    subtitle: 'Score readiness, blocages, documents expirés et éligibilité service.',
    apiPath: '/api/carelink/ops/readiness',
  })
}
