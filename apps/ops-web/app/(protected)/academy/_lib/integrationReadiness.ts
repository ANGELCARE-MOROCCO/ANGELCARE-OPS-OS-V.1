export type IntegrationReadinessItem = {
  key: string
  label: string
  readiness: number
  status: 'ready' | 'partial' | 'blocked'
  nextStep: string
}

export function getAcademyIntegrationReadiness() : IntegrationReadinessItem[] {
  return [
    { key: 'certificates-pdf', label: 'Certificate PDF generation', readiness: 70, status: 'partial', nextStep: 'Connect PDF renderer and final brand template.' },
    { key: 'whatsapp', label: 'WhatsApp reminder queue', readiness: 55, status: 'partial', nextStep: 'Connect Meta/WhatsApp provider after notification queue approval.' },
    { key: 'email', label: 'Email reporting and certificate delivery', readiness: 55, status: 'partial', nextStep: 'Add SMTP/provider credentials and delivery logs.' },
    { key: 'drive', label: 'Google Drive trainee dossier archive', readiness: 40, status: 'partial', nextStep: 'Connect Drive folder mapping and file upload policy.' },
    { key: 'revenue', label: 'Revenue Command Center sync', readiness: 75, status: 'partial', nextStep: 'Map academy sales pipeline into revenue dashboards.' },
    { key: 'partners', label: 'Partner dispatch workflow', readiness: 70, status: 'partial', nextStep: 'Create dispatch approval workflow and partner acceptance status.' },
  ]
}
