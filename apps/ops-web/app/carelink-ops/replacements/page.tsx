import { CareLinkOpsEnterpriseRoutePage } from '@/components/carelink/ops/enterprise/CareLinkOpsEnterpriseRoutePage'

export const dynamic = 'force-dynamic'

export default async function Page() {
  return await CareLinkOpsEnterpriseRoutePage({
    view: 'replacements',
    title: 'Replacement Control',
    subtitle: 'Demandes de remplacement, matching backup et couverture terrain.',
    apiPath: '/api/carelink/ops/replacements',
  })
}
