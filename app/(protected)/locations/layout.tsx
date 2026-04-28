import { requireAccess } from '@/lib/auth/requireAccess'

export default async function LocationsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  await requireAccess('locations.view')

  return <>{children}</>
}