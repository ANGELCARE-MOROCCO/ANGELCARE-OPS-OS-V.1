import { CareLinkOpsEnterpriseRoutePage } from '@/components/carelink/ops/enterprise/CareLinkOpsEnterpriseRoutePage'

export const dynamic = 'force-dynamic'

export default async function Page() {
  return await CareLinkOpsEnterpriseRoutePage({
    view: 'calendar',
    title: 'Calendar Control',
    subtitle: 'Vue calendrier densité, sessions récurrentes, et navigation jour/semaine/mois.',
    apiPath: '/api/carelink/ops/calendar',
  })
}
