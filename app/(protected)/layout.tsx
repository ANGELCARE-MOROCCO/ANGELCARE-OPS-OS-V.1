import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/getUser'
import ProtectedShell from './ProtectedShell'

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await getCurrentUser()

  if (!user) {
    redirect('/login')
  }

  return <ProtectedShell>{children}</ProtectedShell>
}
