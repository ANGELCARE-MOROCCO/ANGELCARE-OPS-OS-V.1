import { requireAccess } from '@/lib/auth/requireAccess'

export default async function PintLayout({
  children,
}: {
  children: React.ReactNode
}) {
  await requireAccess('print.view')

  return <>{children}</>
}