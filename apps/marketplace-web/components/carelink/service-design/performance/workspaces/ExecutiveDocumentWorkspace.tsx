import { performanceData } from '../load'
import { ServiceDocumentStudio } from '@/components/carelink/service-design/documents/ServiceDocumentStudio'
import { blankServiceDocumentSource } from '@/components/carelink/service-design/documents/sourceNormalization'

export default async function ExecutiveDocumentWorkspace() {
  const data = await performanceData()
  const raw = data as unknown as Record<string, unknown>
  const readiness = Array.isArray(raw.readinessControls) ? raw.readinessControls as Array<Record<string, unknown>> : []
  const health = Array.isArray(raw.healthChecks) ? raw.healthChecks as Array<Record<string, unknown>> : []
  const signals = Array.isArray(raw.qualitySignals) ? raw.qualitySignals as Array<Record<string, unknown>> : []
  const source = {
    ...blankServiceDocumentSource('executive'),
    title: 'Rapport exécutif HomeService Design OS',
    subtitle: 'Performance, qualité, readiness et souveraineté opérationnelle',
    reference: `HSD-EXEC-${new Date().toISOString().slice(0, 10).replaceAll('-', '')}`,
    version: 'Live',
    status: 'Prévisualisation exécutive',
    generatedAt: new Date().toISOString(),
    executiveSummary: 'Rapport de gouvernance produit depuis les indicateurs réellement disponibles. Les valeurs absentes restent explicitement non renseignées.',
    metrics: [
      { label: 'Readiness', value: `${readiness.filter((item) => String(item.status) === 'passed').length}/${readiness.length || 24}`, detail: 'Contrôles avec preuve' },
      { label: 'Santé opérationnelle', value: String(health.filter((item) => ['healthy', 'passed'].includes(String(item.status))).length), detail: 'Contrôles sains' },
      { label: 'Signaux qualité', value: String(signals.length), detail: 'Signaux actuellement chargés' },
    ],
    warnings: readiness.filter((item) => !['passed', 'not_applicable'].includes(String(item.status))).slice(0, 12).map((item) => String(item.name || item.label || item.code || 'Contrôle readiness non satisfait')),
    lineage: [{ label: 'Source', value: 'HomeService Performance Dashboard' }, { label: 'Généré le', value: new Date().toLocaleString('fr-FR') }],
    raw,
  }
  return <ServiceDocumentStudio sourceKind="executive" initialSource={source} initialTemplateId="complete-service-dossier" />
}
