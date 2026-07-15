import { requireAccess } from '@/lib/auth/requireAccess'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  await requireAccess('admin.view')

  return <>{children}</>
}