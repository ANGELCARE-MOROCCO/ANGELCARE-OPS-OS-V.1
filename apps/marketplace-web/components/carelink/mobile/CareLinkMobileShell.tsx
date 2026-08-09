import { MobileOnlyGate } from './MobileOnlyGate'
import { MobileBottomNav } from './MobileBottomNav'

export function CareLinkMobileShell({ children }: { children: React.ReactNode }) {
  return <MobileOnlyGate><main className="mx-auto min-h-dvh max-w-md bg-[#f8fbff] pb-24 text-slate-950"><div className="min-h-dvh">{children}</div><MobileBottomNav /></main></MobileOnlyGate>
}
