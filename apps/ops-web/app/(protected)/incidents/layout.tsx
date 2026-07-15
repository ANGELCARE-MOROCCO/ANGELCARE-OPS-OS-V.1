import { requireAccess } from '@/lib/auth/requireAccess'

export default async function IncidentsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  await requireAccess('incidents.view')

  return <>{children}</>
}