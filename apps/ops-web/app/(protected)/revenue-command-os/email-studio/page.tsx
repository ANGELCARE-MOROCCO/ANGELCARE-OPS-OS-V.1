import { resolveRevenueOsActor } from '@/lib/revenue-command-os/access'
import RevenueEmailStudio from './_components/RevenueEmailStudio'

export const dynamic = 'force-dynamic'

export default async function RevenueEmailStudioPage() {
  await resolveRevenueOsActor('revenue_os.email_studio.use', {
    aliases: ['revenue_os.view', 'revenue.view'],
    message: 'Accès au Revenue Email Studio requis.',
  })

  return <RevenueEmailStudio />
}
