import { Ac360DirectionCockpitPage } from '@/components/ac360/customer/direction/Ac360DirectionCockpitPage'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default function Ac360DirectionCockpitRoute() {
  return <Ac360DirectionCockpitPage initialView="synthese" />
}
