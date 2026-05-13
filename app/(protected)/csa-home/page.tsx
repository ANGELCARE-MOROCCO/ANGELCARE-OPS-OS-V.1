import AppShell from '@/app/components/erp/AppShell'
import CsaCommandHome from '@/app/components/csa/CsaCommandHome'

export const dynamic = 'force-dynamic'

export default function Page() {
  return (
    <AppShell
      title="C.S.A Command Home"
      subtitle="Customer Success Authority synchronized with Revenue, Services, Sales, Leads and Families."
      breadcrumbs={[{ label: 'C.S.A Command Home' }]}
    >
      <CsaCommandHome />
    </AppShell>
  )
}
