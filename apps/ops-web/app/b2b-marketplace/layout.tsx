import type { Metadata } from 'next'
import PublicMarketplaceChrome from '@/components/b2b-marketplace/PublicMarketplaceChrome'

export const dynamic = 'force-dynamic'
export const revalidate = 0
export const fetchCache = 'force-no-store'

export const metadata: Metadata = {
  title: 'AngelCare B2B Crèche Marketplace',
  description: 'Catalogue B2B public AngelCare pour crèches, produits, formations, packs et devis de gros.',
}

export default function B2BMarketplaceLayout({ children }: { children: React.ReactNode }) {
  return <PublicMarketplaceChrome>{children}</PublicMarketplaceChrome>
}
