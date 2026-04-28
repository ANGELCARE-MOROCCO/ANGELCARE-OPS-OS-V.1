import { requireAccess } from '@/lib/auth/requireAccess'

export default async function LeadsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  await requireAccess('leads.view')

  return <>{children}</>
}