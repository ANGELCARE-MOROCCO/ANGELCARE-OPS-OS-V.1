import type { Metadata } from 'next'
import { Suspense, type ReactNode } from 'react'
import styles from '@/angelcare-marketplace/design-system/marketplace.module.css'
import { LocalizationRuntime } from '@/angelcare-marketplace/localization-intelligence/components/LocalizationRuntime'

export const metadata: Metadata = {
  title: {
    default: 'ANGELCARE Marketplace 360',
    template: '%s · ANGELCARE Marketplace 360',
  },
  description:
    'Fondation gouvernée du Marketplace Kids 360 ANGELCARE : public, SaaS, opérations, Academy, confiance et expansion territoriale.',
}

export default function AngelCareMarketplaceLayout({ children }: { children: ReactNode }) {
  return <div className={styles.scope}><Suspense fallback={children}><LocalizationRuntime>{children}</LocalizationRuntime></Suspense></div>
}
