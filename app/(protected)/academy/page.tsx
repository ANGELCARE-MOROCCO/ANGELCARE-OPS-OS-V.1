
import AppShell, { PageAction } from '@/app/components/erp/AppShell'
import { ERPPanel, MetricCard, ModuleCard } from '@/app/components/erp/ERPPrimitives'

export default function AcademyPage() {
  return <AppShell title="AngelCare Academy Hub" subtitle="Training programs, certification logic, caregiver capability building and B2B training solutions." breadcrumbs={[{label:'Academy'}]} actions={<PageAction href="/print">Print certificate</PageAction>}><section style={gridStyle}><MetricCard label="Programs" value="3" sub="in-person, online, B2B" icon="🎓"/><MetricCard label="Certification" value="Ready" sub="certificate templates" icon="🏅"/><MetricCard label="Caregiver uplift" value="Core" sub="skills and standards" icon="📚"/></section><ERPPanel title="Academy Modules"><div style={moduleGridStyle}><ModuleCard href="/academy" icon="🏫" title="In-person Training" text="Operational certification-ready classroom programs."/><ModuleCard href="/academy" icon="💻" title="Online Training" text="Remote upskilling and certification path."/><ModuleCard href="/academy" icon="🏢" title="B2B Training" text="Schools, nurseries and institutions training solutions."/></div></ERPPanel></AppShell>
}
const gridStyle: React.CSSProperties = { display:'grid', gridTemplateColumns:'repeat(3,minmax(0,1fr))', gap:14, marginBottom:18 }
const moduleGridStyle: React.CSSProperties = { display:'grid', gridTemplateColumns:'repeat(3,minmax(0,1fr))', gap:14 }
