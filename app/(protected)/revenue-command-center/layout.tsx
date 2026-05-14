import { requireAccess } from '@/lib/auth/requireAccess'
import RevenueCommandUnifiedLayout from './_shared/RevenueCommandUnifiedLayout'
import RevenueLocalStorageRecoveryBridge from './_recovery/RevenueLocalStorageRecoveryBridge'

export default async function RevenueLayout({
  children,
}: {
  children: React.ReactNode
}) {
  await requireAccess('revenue.view')

  return (
    <RevenueCommandUnifiedLayout>
      <RevenueLocalStorageRecoveryBridge />
      {children}
    </RevenueCommandUnifiedLayout>
  )
}
