import FinanceAuthorityPage from '@/components/angelcare360/customer-finance-authority/FinanceAuthorityPage'
import { requireAngelcare360RouteAccess } from '@/lib/angelcare360/server/route-guard'

export const dynamic = 'force-dynamic'

export default async function Angelcare360FinanceEtatsCompteAuthorityPage() {
  await requireAngelcare360RouteAccess('/angelcare-360-command-center/finance/etats-compte')
  return <FinanceAuthorityPage scene="collections" defaultPlane="statements"/>
}
