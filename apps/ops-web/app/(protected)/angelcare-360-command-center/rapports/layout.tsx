import type { ReactNode } from 'react'
import ZoneCFrame from '@/components/angelcare360/zone-c-finance-reporting/ZoneCFrame'

export default function ReportsLayout({ children }: { children: ReactNode }) {
  return <ZoneCFrame domain="reports">{children}</ZoneCFrame>
}
