import { requireAccess } from '@/lib/auth/requireAccess'

export default async function ServicesLayout({
  children,
}: {
  children: React.ReactNode
}) {
  await requireAccess('services.view')

  return <>{children}</>
}