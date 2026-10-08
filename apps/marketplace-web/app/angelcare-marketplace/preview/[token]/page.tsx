import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getPreview } from '@/angelcare-marketplace/experience-builder/repository'
import { GlobalPublicShell } from '@/angelcare-marketplace/public-universe/components/GlobalPublicShell'
import { PublicPageRenderer } from '@/angelcare-marketplace/public-universe/components/PublicPageRenderer'

export const metadata: Metadata = { robots: { index: false, follow: false, nocache: true }, referrer: 'no-referrer' }
export const dynamic = 'force-dynamic'

export default async function Page({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  const bundle = await getPreview(token).catch(() => null)
  if (!bundle) notFound()
  const locale = bundle.page.locale
  const experience = { page: bundle.page, blocks: bundle.blocks, navigation: [] }
  const homepage = bundle.page.route_key.startsWith('public.home') || bundle.blocks.some(block => block.block_type === 'homepage_world')
  return <GlobalPublicShell locale={locale} navigation={[]} preview variant={homepage ? 'marketplace' : 'standard'}><PublicPageRenderer experience={experience} locale={locale} /></GlobalPublicShell>
}
