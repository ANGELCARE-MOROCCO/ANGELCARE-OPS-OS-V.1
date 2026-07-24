import AppShell from '@/app/components/erp/AppShell'
import { ServiceOSBlueprintForm } from '@/components/service-os/production/ServiceOSBlueprintForm'
import { listServiceOSBlueprints } from '@/lib/service-os/production/repository'
import { SecondaryAction, Services360Hero, Services360Nav, SourceBadge, styles } from '@/components/service-os/Services360UI'

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const blueprint = (await listServiceOSBlueprints()).find((item) => item.id === id || item.code === id)
  return <AppShell title="Blueprint Governance Cockpit" subtitle={blueprint?.title || id} breadcrumbs={[{ label: 'Services', href: '/services' }, { label: 'Blueprints', href: '/services/blueprints' }, { label: id }]}>
    <main className={styles.shell}>
      <Services360Hero eyebrow="Blueprint governance" title={blueprint?.title || 'Service Blueprint'} subtitle={blueprint?.description || 'Controlled production blueprint update.'} actions={<SecondaryAction href="/services/blueprints">Retour aux blueprints</SecondaryAction>} briefTitle="Current architecture passport" briefRows={[{ label: 'Code', value: blueprint?.code || id }, { label: 'Family', value: blueprint?.family || '—' }, { label: 'Status', value: blueprint?.status || '—' }, { label: 'Modules / rules', value: `${blueprint?.modules?.length || 0} / ${blueprint?.rules?.length || 0}` }, { label: 'Cities', value: blueprint?.cities?.length || 0 }]} provenance={[{ label: blueprint ? 'Production blueprint loaded' : 'Blueprint unavailable', tone: blueprint ? 'live' : 'unavailable' }]} />
      <Services360Nav items={[{ label: 'Identity', href: '#blueprint-identity' }, { label: 'Architecture', href: '#blueprint-architecture' }, { label: 'Commercial', href: '#blueprint-commercial' }, { label: 'Coverage', href: '#blueprint-coverage' }]} />
      {blueprint ? <ServiceOSBlueprintForm blueprint={blueprint} /> : <section className={styles.panel}><SourceBadge label="Blueprint not found" tone="unavailable" /></section>}
    </main>
  </AppShell>
}
