import { requireAccess } from '@/lib/auth/requireAccess'

export default async function MissionsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  await requireAccess('missions.view')

  return <>{children}</>
}