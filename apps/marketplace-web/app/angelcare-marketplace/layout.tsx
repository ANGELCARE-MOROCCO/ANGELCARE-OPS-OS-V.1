import type { Metadata } from 'next'
import { Suspense, type ReactNode } from 'react'
import styles from '@/angelcare-marketplace/design-system/marketplace.module.css'
import { LocalizationRuntime } from '@/angelcare-marketplace/localization-intelligence/components/LocalizationRuntime'
import { buildWebPresenceMetadata } from '@/angelcare-marketplace/web-presence/runtime'
import { HotlinePublic } from '@/angelcare-marketplace/hotline-os/components/HotlinePublic'
import { CareOrbitNavigation } from '@/angelcare-marketplace/navigation-care-orbit/CareOrbitNavigation'
import { MarketplaceTelemetry } from '@/angelcare-marketplace/store-xray/MarketplaceTelemetry'

export async function generateMetadata(): Promise<Metadata> {
  return buildWebPresenceMetadata('MARKETPLACE')
}

export default function AngelCareMarketplaceLayout({ children }: { children: ReactNode }) {
  return (
    <div className={styles.scope}>
      <CareOrbitNavigation />
      <HotlinePublic />
      <Suspense fallback={null}><MarketplaceTelemetry /></Suspense>
      <Suspense fallback={children}>
        <LocalizationRuntime>{children}</LocalizationRuntime>
      </Suspense>
    </div>
  )
}
