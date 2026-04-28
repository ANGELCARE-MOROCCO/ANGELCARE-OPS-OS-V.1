import { requireAccess } from '@/lib/auth/requireAccess'

export default async function RevenueLayout({
  children,
}: {
  children: React.ReactNode
}) {
  await requireAccess('revenue.view')

  return <>{children}</>
}