import ParentsPage from '../parents/page'
import { requireAngelcare360RouteAccess } from '@/lib/angelcare360/server/route-guard'

export const dynamic = 'force-dynamic'

type PageProps = { searchParams?: Promise<Record<string, string | string[] | undefined>> }

export default async function Angelcare360FamiliesAliasPage(props: PageProps) {
  await requireAngelcare360RouteAccess('/angelcare-360-command-center/familles')
  return ParentsPage(props)
}
