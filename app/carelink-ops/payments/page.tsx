import { CareLinkOpsEnterpriseRoutePage } from '@/components/carelink/ops/enterprise/CareLinkOpsEnterpriseRoutePage'

export const dynamic = 'force-dynamic'

export default async function Page() {
  return await CareLinkOpsEnterpriseRoutePage({
    view: 'payments',
    title: 'Payments & Allowances',
    subtitle: 'Paiements, allocations, litiges et correction workflow en MAD / DH.',
    apiPath: '/api/carelink/ops/payments',
  })
}
