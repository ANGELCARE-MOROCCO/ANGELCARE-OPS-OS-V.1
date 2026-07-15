import { requireAccess } from '@/lib/auth/requireAccess'

export default async function UsersLayout({
  children,
}: {
  children: React.ReactNode
}) {
  await requireAccess('users.view')

  return <>{children}</>
}