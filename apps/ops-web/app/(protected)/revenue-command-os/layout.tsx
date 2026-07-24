import { requireAccess } from '@/lib/auth/requireAccess'
import { resolveRevenueOsActor } from '@/lib/revenue-command-os/access'
import { readRevenueOsFoundation } from '@/lib/revenue-command-os/repository'
import { RevenueOsProvider } from './_components/RevenueOsContext'
import RevenueOsShell from './_components/RevenueOsShell'

export const dynamic = 'force-dynamic'

export default async function RevenueCommandOsLayout({ children }: { children: React.ReactNode }) {
  await requireAccess(['revenue_os.view', 'revenue.view'])
  const actor = await resolveRevenueOsActor('revenue_os.view', { aliases: ['revenue.view'] })
  const { bootstrap } = await readRevenueOsFoundation(actor.tenantId)

  return (
    <RevenueOsProvider initialBootstrap={bootstrap}>
      <RevenueOsShell>{children}</RevenueOsShell>
    </RevenueOsProvider>
  )
}
