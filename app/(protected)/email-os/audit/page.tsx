import AppShell, { PageAction } from '@/app/components/erp/AppShell'
import EmailOsShell from '@/app/components/email-os/EmailOsShell'
export const dynamic = 'force-dynamic'
export default function Page(){return <AppShell title="Email OS" subtitle="AngelCare built-in communication command center." breadcrumbs={[{label:'Email OS'},{label:'audit'}]} actions={<><PageAction href="/email-os/composer">+ Compose</PageAction><PageAction href="/email-os" variant="light">Command</PageAction></>}><EmailOsShell mode="audit" /></AppShell>}
