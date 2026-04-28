import { requireAccess } from '@/lib/auth/requireAccess'

export default async function HrLayout({
  children,
}: {
  children: React.ReactNode
}) {
  await requireAccess('hr.view')

  return <>{children}</>
}