import { notFound } from 'next/navigation'
import { requireMarketplacePageContext } from '@/angelcare-marketplace/auth/context'
import { access } from '@/angelcare-marketplace/seo-power/repository'
import { GoogleIntelligenceCommand } from '@/angelcare-marketplace/seo-power/google-intelligence/GoogleIntelligenceCommand'
export const dynamic = 'force-dynamic'
export const metadata = { title: 'Google Intelligence | SEO Power' }
export default async function Page() {
  const ctx = await requireMarketplacePageContext('marketplace.web_presence.view')
  if (!access(ctx).view) notFound()
  return <GoogleIntelligenceCommand />
}
