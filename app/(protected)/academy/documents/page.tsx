import AppShell, { PageAction } from '@/app/components/erp/AppShell'
import { createClient } from '@/lib/supabase/server'
import { requireAccess } from '@/lib/auth/requireAccess'
import { DocumentExportCenter } from '../_components/DocumentExportCenter'
import { DOCUMENT_CATALOG } from '../_lib/documentCatalog'

export default async function AcademyDocumentsPage() {
  await requireAccess('academy.view')
  const supabase = await createClient()

  const [{ count: exportsCount }, { count: auditCount }] = await Promise.all([
    supabase.from('academy_document_exports').select('id', { count: 'exact', head: true }),
    supabase.from('academy_audit_logs').select('id', { count: 'exact', head: true }),
  ])

  return (
    <AppShell
      title="Academy Document Governance"
      subtitle="Controlled ISO-style document catalog, PDF-ready exports, purpose capture, references and governance logs."
      breadcrumbs={[{ label: 'Academy', href: '/academy' }, { label: 'Documents' }]}
      actions={<PageAction href="/academy">Academy Command Center</PageAction>}
    >
      <DocumentExportCenter counts={{ templates: DOCUMENT_CATALOG.length, exports: exportsCount || 0, audit: auditCount || 0 }} />
    </AppShell>
  )
}
