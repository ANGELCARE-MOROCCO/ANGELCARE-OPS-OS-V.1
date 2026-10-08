import { AdminLoginExperience } from '@/angelcare-marketplace/auth/admin/AdminLoginExperience'

function safeReturnTo(value: unknown): string {
  const candidate = typeof value === 'string' ? value.trim() : ''
  if (!candidate.startsWith('/angelcare-marketplace/admin')) return '/angelcare-marketplace/admin'
  if (candidate.startsWith('//') || candidate.includes('://')) return '/angelcare-marketplace/admin'
  return candidate
}

export default async function MarketplaceAdminLoginPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>
}) {
  const params = searchParams ? await searchParams : {}
  const returnTo = Array.isArray(params.returnTo) ? params.returnTo[0] : params.returnTo
  return <AdminLoginExperience returnTo={safeReturnTo(returnTo)} />
}
