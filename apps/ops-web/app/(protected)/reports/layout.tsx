import { requireAccess } from '@/lib/auth/requireAccess'

export default async function ReportsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  await requireAccess('reports.view')

  return <>{children}</>
}