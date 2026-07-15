'use client'

import dynamic from 'next/dynamic'

type AnyRecord = Record<string, any>

type Props = {
  missions?: AnyRecord[]
  cities?: AnyRecord[]
  selectedCity?: string
  setSelectedCity?: (value: string) => void
  onOpenMission?: (item: AnyRecord) => void
}

const ClientRadarMap = dynamic(
  () =>
    import('@/components/carelink/ops/CareLinkOpsMissionRadarMapClient').then(
      (mod) => mod.CareLinkOpsMissionRadarMapClient
    ),
  {
    ssr: false,
    loading: () => (
      <div className="grid h-[520px] place-items-center rounded-[28px] border border-slate-200 bg-slate-50">
        <div className="text-center">
          <div className="text-xs font-black uppercase tracking-[0.28em] text-blue-600">
            Loading live radar
          </div>
          <div className="mt-2 text-lg font-black text-slate-900">
            Preparing CareLink mission map…
          </div>
          <div className="mt-1 text-sm font-semibold text-slate-500">
            Mission points, dates, city filters and live status are loading.
          </div>
        </div>
      </div>
    ),
  }
)

export function CareLinkOpsMissionRadarMap(props: Props) {
  return <ClientRadarMap {...props} />
}
