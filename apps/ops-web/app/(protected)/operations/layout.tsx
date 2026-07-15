import { requireAccess } from '@/lib/auth/requireAccess'

export default async function OperationsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  await requireAccess('operations.view')

  return <>{children}</>
}