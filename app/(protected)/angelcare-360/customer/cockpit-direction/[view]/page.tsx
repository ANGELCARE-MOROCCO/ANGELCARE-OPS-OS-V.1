import { Ac360DirectionCockpitPage } from '@/components/ac360/customer/direction/Ac360DirectionCockpitPage'
import { directionSubRouteAliases } from '@/lib/ac360/customer-direction-cockpit-model'
import { notFound } from 'next/navigation'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export function generateStaticParams() {
  return Object.keys(directionSubRouteAliases)
    .filter((view) => view !== 'synthese')
    .map((view) => ({ view }))
}

export default async function Ac360DirectionCockpitSubRoute({
  params,
}: {
  params: Promise<{ view: string }>
}) {
  const { view } = await params
  if (!directionSubRouteAliases[view]) notFound()
  return <Ac360DirectionCockpitPage initialView={view} />
}
