'use client'
import ZoneCErrorState from '@/components/angelcare360/zone-c-finance-reporting/ZoneCErrorState'
export default function ReportsError({ reset }: { error: Error & { digest?: string }; reset: () => void }) { return <ZoneCErrorState domain="reports" reset={reset}/> }
