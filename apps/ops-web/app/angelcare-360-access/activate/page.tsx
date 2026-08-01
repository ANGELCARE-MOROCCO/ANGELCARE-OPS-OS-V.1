import { Suspense } from 'react'
import TenantAccessActivationClient from '@/components/angelcare360/access/TenantAccessActivationClient'

export default function TenantAccessActivationPage() {
  return (
    <Suspense fallback={<main style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', background: '#f4f7fb', fontFamily: 'Inter, system-ui, sans-serif' }}>Chargement sécurisé…</main>}>
      <TenantAccessActivationClient />
    </Suspense>
  )
}
