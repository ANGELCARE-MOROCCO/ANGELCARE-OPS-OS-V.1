
function MarketOSRouteWhiteShell({ children }: { children: React.ReactNode }) {
  return (
    <main data-market-os-root className="min-h-screen bg-white text-slate-950">
      {children}
    </main>
  )
}

import React from 'react'
import MarketingCommandCenter from '@/app/components/market-os/MarketingCommandCenter'

export const dynamic = 'force-dynamic'

export default function MarketOSPage() {
  return <MarketingCommandCenter />
}
