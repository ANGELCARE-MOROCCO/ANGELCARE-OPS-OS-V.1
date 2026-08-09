import { redirect } from 'next/navigation'
import { AdminLoginExperience } from '@/angelcare-marketplace/auth/admin/AdminLoginExperience'
import { getMarketplaceContext, hasMarketplacePermission } from '@/angelcare-marketplace/auth/context'

export const dynamic = 'force-dynamic'
export const metadata = {
  title: 'Marketplace Admin · ANGELCARE',
  robots: { index: false, follow: false },
}

function safeReturnTo(value: unknown): string {
  const candidate = typeof value === 'string' ? value : ''
  return candidate.startsWith('/angelcare-marketplace/admin') && !candidate.startsWith('//')
    ? candidate
    : '/angelcare-marketplace/admin'
}

export default async function MarketplaceAdminLoginPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const query = await searchParams
  const returnTo = safeReturnTo(query.returnTo)
  const context = await getMarketplaceContext().catch(() => null)
  if (context && hasMarketplacePermission(context, 'marketplace.admin.access')) redirect(returnTo)
  return <AdminLoginExperience returnTo={returnTo} />
}
