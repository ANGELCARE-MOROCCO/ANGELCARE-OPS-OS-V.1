import TrainingHubLogoutClient from '@/components/traininghub/auth/TrainingHubLogoutClient'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default function TrainingHubLogoutPage({
  searchParams,
}: {
  searchParams?: { next?: string }
}) {
  const next = typeof searchParams?.next === 'string' && searchParams.next.startsWith('/traininghub')
    ? searchParams.next
    : '/traininghub/login'

  return <TrainingHubLogoutClient next={next} />
}
