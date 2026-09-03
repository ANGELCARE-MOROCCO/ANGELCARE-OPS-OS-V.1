import { Suspense } from 'react'
import type { Metadata } from 'next'
import TenantAccessActivationClient from '@/components/angelcare360/access/TenantAccessActivationClient'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'AngelCare 360 · Activation de l’accès',
  description: 'Activation sécurisée de votre accès établissement AngelCare 360.',
}

export default function TenantAccessActivationPage() {
  return (
    <Suspense fallback={<main style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', background: '#f4f7fb', fontFamily: 'Inter, system-ui, sans-serif' }}>Validation du lien sécurisé…</main>}>
      <TenantAccessActivationClient />
    </Suspense>
  )
}
