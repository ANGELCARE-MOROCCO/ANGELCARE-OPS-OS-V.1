import { requireAccess } from '@/lib/auth/requireAccess'

export default async function AcademyLayout({
  children,
}: {
  children: React.ReactNode
}) {
  await requireAccess('academy.view')

  return <>{children}</>
}