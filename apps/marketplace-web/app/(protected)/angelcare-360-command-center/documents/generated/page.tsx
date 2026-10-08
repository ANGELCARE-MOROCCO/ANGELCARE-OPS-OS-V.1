import FinanceAuthorityPage from '@/components/angelcare360/customer-finance-authority/FinanceAuthorityPage'
import { requireAngelcare360RouteAccess } from '@/lib/angelcare360/server/route-guard'

export const dynamic = 'force-dynamic'

export default async function Angelcare360DocumentsGeneratedAuthorityPage() {
  await requireAngelcare360RouteAccess('/angelcare-360-command-center/documents/generated')
  return <FinanceAuthorityPage scene="documents" defaultPlane="generated"/>
}
