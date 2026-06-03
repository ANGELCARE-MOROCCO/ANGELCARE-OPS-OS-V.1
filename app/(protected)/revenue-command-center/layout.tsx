import { requireAccess } from '@/lib/auth/requireAccess'
import RevenueCommandUnifiedLayout from './_shared/RevenueCommandUnifiedLayout'
import RevenueLocalStorageRecoveryBridge from './_recovery/RevenueLocalStorageRecoveryBridge'
import RevenueEnterpriseOperationsBridge from '@/components/revenue-command-center/RevenueEnterpriseOperationsBridge'

export default async function RevenueLayout({
  children,
}: {
  children: React.ReactNode
}) {
  await requireAccess('revenue.view')

  return (
    <RevenueCommandUnifiedLayout>
      <RevenueLocalStorageRecoveryBridge />
      <RevenueEnterpriseOperationsBridge />
      {children}
    </RevenueCommandUnifiedLayout>
  )
}
