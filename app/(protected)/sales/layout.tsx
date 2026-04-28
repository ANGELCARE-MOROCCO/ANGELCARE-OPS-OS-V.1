import { requireAccess } from '@/lib/auth/requireAccess'

export default async function SalesLayout({
  children,
}: {
  children: React.ReactNode
}) {
  await requireAccess('sales.view')

  return <>{children}</>
}