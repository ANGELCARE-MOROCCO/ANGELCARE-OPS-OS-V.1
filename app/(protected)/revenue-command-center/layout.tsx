import { requireAccess } from '@/lib/auth/requireAccess'
import RevenueCommandUnifiedLayout from './_shared/RevenueCommandUnifiedLayout'

export default async function RevenueLayout({
  children,
}: {
  children: React.ReactNode
}) {
  await requireAccess('revenue.view')

  return <RevenueCommandUnifiedLayout>{children}</RevenueCommandUnifiedLayout>
}
