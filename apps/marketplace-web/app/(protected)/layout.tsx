import { requireUser } from '@/lib/ac360-portability/auth-session'

export const dynamic = 'force-dynamic'

export default async function Angelcare360ProtectedBoundary({
  children,
}: {
  children: React.ReactNode
}) {
  await requireUser()
  return children
}
