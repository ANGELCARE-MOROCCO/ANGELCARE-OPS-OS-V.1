import { requireAccess } from '@/lib/auth/requireAccess'

export default async function FamiliesLayout({
  children,
}: {
  children: React.ReactNode
}) {
  await requireAccess('families.view')

  return <>{children}</>
}