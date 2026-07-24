import AppShell from '@/app/components/erp/AppShell'
import { ServiceOSBlueprintForm } from '@/components/service-os/production/ServiceOSBlueprintForm'
import { SecondaryAction, Services360Hero, Services360Nav, styles } from '@/components/service-os/Services360UI'

export default function Page() {
  return <AppShell title="Blueprint Architecture Studio" subtitle="Create a production ServiceOS blueprint" breadcrumbs={[{ label: 'Services', href: '/services' }, { label: 'Blueprints', href: '/services/blueprints' }, { label: 'Nouveau' }]}>
    <main className={styles.shell}>
      <Services360Hero eyebrow="Blueprint architecture studio" title="Design the operating architecture behind a scalable AngelCare service." subtitle="Configure identity, modules, rules, commercial logic, workflow, staff, documents and city scope using the existing production blueprint save action." actions={<SecondaryAction href="/services/blueprints">Retour aux blueprints</SecondaryAction>} briefTitle="Architecture provisioning" briefRows={[{ label: 'Destination', value: 'serviceos_blueprints' }, { label: 'Action', value: 'saveServiceOSBlueprint' }, { label: 'Currency', value: 'Dh' }, { label: 'Backend changes', value: 'None' }]} provenance={[{ label: 'Production ServiceOS blueprint form', tone: 'live' }]} />
      <Services360Nav items={[{ label: 'Identity', href: '#blueprint-identity' }, { label: 'Architecture', href: '#blueprint-architecture' }, { label: 'Commercial', href: '#blueprint-commercial' }, { label: 'Coverage', href: '#blueprint-coverage' }]} />
      <ServiceOSBlueprintForm />
    </main>
  </AppShell>
}
