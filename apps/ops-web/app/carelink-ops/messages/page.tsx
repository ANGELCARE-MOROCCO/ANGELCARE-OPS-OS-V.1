import { CareLinkOpsEnterpriseRoutePage } from '@/components/carelink/ops/enterprise/CareLinkOpsEnterpriseRoutePage'

export const dynamic = 'force-dynamic'

export default async function Page() {
  return await CareLinkOpsEnterpriseRoutePage({
    view: 'messages',
    title: 'Dispatch Messages',
    subtitle: 'Threads persistants mission liés, broadcast et liaison dispatch agent.',
    apiPath: '/api/carelink/ops/messages',
  })
}
