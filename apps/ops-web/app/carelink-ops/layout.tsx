import 'leaflet/dist/leaflet.css'
import { redirect } from 'next/navigation'
import type { ReactNode } from 'react'
import { CareLinkMobileAccessError, requireCareLinkOpsActor } from '@/lib/carelink/mobile-auth'
import { CareLinkOpsFrame } from '@/components/carelink/ops/CareLinkOpsFrame'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function CareLinkOpsLayout({ children }: { children: ReactNode }) {
  try {
    await requireCareLinkOpsActor()
  } catch (error) {
    if (error instanceof CareLinkMobileAccessError && error.status === 401) redirect('/login')
    redirect('/unauthorized')
  }

  return <CareLinkOpsFrame children={children} />
}
