import OpsosLogoutClient from '@/components/auth/OpsosLogoutClient'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default function OpsosLogoutPage({
  searchParams,
}: {
  searchParams?: { next?: string }
}) {
  const next = typeof searchParams?.next === 'string' && searchParams.next.startsWith('/')
    ? searchParams.next
    : '/login'

  return <OpsosLogoutClient next={next} />
}
