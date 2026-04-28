import { requireAccess } from '@/lib/auth/requireAccess'

export default async function CaregiversLayout({
  children,
}: {
  children: React.ReactNode
}) {
  await requireAccess('caregivers.view')

  return <>{children}</>
}