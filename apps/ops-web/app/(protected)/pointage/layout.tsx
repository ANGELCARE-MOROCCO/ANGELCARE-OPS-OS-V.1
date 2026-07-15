import { requireAccess } from '@/lib/auth/requireAccess'

export default async function PointageLayout({
  children,
}: {
  children: React.ReactNode
}) {
  await requireAccess('pointage.view')

  return <>{children}</>
}