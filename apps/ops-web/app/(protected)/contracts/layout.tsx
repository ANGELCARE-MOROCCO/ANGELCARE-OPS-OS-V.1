import { requireAccess } from '@/lib/auth/requireAccess'

export default async function ContractsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  await requireAccess('contracts.view')

  return <>{children}</>
}