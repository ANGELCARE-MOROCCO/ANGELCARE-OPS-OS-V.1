import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import styles from '@/angelcare-marketplace/design-system/marketplace.module.css'

export const metadata: Metadata = {
  title: {
    default: 'ANGELCARE Marketplace 360',
    template: '%s · ANGELCARE Marketplace 360',
  },
  description:
    'Fondation gouvernée du Marketplace Kids 360 ANGELCARE : public, SaaS, opérations, Academy, confiance et expansion territoriale.',
}

export default function AngelCareMarketplaceLayout({ children }: { children: ReactNode }) {
  return <div className={styles.scope}>{children}</div>
}
