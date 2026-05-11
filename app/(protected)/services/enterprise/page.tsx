import AppShell, { PageAction } from '@/app/components/erp/AppShell'
import { ServiceOSEnterpriseHub } from '@/components/service-os/ServiceOSEnterpriseHub'
export default function ServiceEnterprisePage(){return <AppShell title="AngelCare Enterprise ServiceOS" subtitle="Unified navigation for configurable services, execution, revenue, expansion and AI strategy." breadcrumbs={[{label:'Services',href:'/services'},{label:'Enterprise ServiceOS'}]} actions={<PageAction href="/services" variant="light">Retour catalogue</PageAction>}><ServiceOSEnterpriseHub /></AppShell>}
