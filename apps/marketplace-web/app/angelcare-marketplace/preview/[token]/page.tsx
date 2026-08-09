import { notFound } from 'next/navigation'
import { getPreview } from '@/angelcare-marketplace/experience-builder/repository'
import { GlobalPublicShell } from '@/angelcare-marketplace/public-universe/components/GlobalPublicShell'
import { PublicPageRenderer } from '@/angelcare-marketplace/public-universe/components/PublicPageRenderer'

export default async function Page({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  const bundle = await getPreview(token).catch(() => null)
  if (!bundle) notFound()
  const locale = bundle.page.locale
  const experience = { page: bundle.page, blocks: bundle.blocks, navigation: [] }
  return <GlobalPublicShell locale={locale} navigation={[]} preview><PublicPageRenderer experience={experience} locale={locale} /></GlobalPublicShell>
}
