import TrainingHubShell from '@/components/traininghub/TrainingHubShell'
import TrainingHubCatalogueStrategicWorkspace from '@/components/traininghub/TrainingHubCatalogueStrategicWorkspace'
import { requireTrainingHubPageContext } from '../traininghub-page-context'
import { createTrainingHubUserClient } from '@/lib/traininghub/supabase'

export const dynamic = 'force-dynamic'

type QueryResult<T> = { data: T[]; error: string | null }

async function listOrEmpty<T>(query: PromiseLike<{ data: T[] | null; error: any }>): Promise<QueryResult<T>> {
  try {
    const { data, error } = await query
    return { data: Array.isArray(data) ? data : [], error: error?.message || null }
  } catch (error) {
    return { data: [], error: error instanceof Error ? error.message : String(error || 'Erreur inconnue') }
  }
}

export default async function TrainingHubCatalogueStrategiquePage() {
  const context = await requireTrainingHubPageContext()
  const supabase = await createTrainingHubUserClient()

  const [categories, courses, versions, kits, resources, modules, sessions, proposalItems, orderItems, certificates, entitlements] = await Promise.all([
    listOrEmpty<any>(
      supabase
        .from('trn_categories')
        .select('*')
        .order('display_order', { ascending: true, nullsFirst: false })
        .order('code', { ascending: true }),
    ),
    listOrEmpty<any>(
      supabase
        .from('trn_courses')
        .select('*, trn_categories(id, code, name, status)')
        .order('ref', { ascending: true }),
    ),
    listOrEmpty<any>(
      supabase
        .from('trn_course_versions')
        .select('*')
        .order('created_at', { ascending: false, nullsFirst: false })
        .limit(1000),
    ),
    listOrEmpty<any>(
      supabase
        .from('trn_course_kits')
        .select('*')
        .limit(1000),
    ),
    listOrEmpty<any>(
      supabase
        .from('trn_course_resources')
        .select('*')
        .limit(1000),
    ),
    listOrEmpty<any>(
      supabase
        .from('learn_modules')
        .select('*')
        .limit(1000),
    ),
    listOrEmpty<any>(
      supabase
        .from('trn_sessions')
        .select('id, course_id, status, organization_id, scheduled_start_at, delivered_at')
        .limit(2000),
    ),
    listOrEmpty<any>(
      supabase
        .from('bill_proposal_items')
        .select('id, course_id, proposal_id')
        .limit(2000),
    ),
    listOrEmpty<any>(
      supabase
        .from('bill_order_items')
        .select('id, course_id, order_id')
        .limit(2000),
    ),
    listOrEmpty<any>(
      supabase
        .from('trn_certificates')
        .select('id, course_id, session_id, status, issued_at')
        .limit(2000),
    ),
    listOrEmpty<any>(
      supabase
        .from('learn_entitlements')
        .select('id, course_id, module_id, status, organization_id')
        .limit(2000),
    ),
  ])

  const queryWarnings = [categories, courses, versions, kits, resources, modules, sessions, proposalItems, orderItems, certificates, entitlements]
    .map((result) => result.error)
    .filter(Boolean) as string[]

  return (
    <TrainingHubShell
      context={context}
      active="catalogue"
      eyebrow="ANGELCARE TRAININGHUB • CATALOGUE STRATÉGIQUE"
      title="Centre des Programmes & Offres"
      subtitle="Pilotage central des catégories et formations : création, édition, publication, désactivation, archivage, suppression sécurisée, versions et impact sur tout le système formation."
    >
      <TrainingHubCatalogueStrategicWorkspace
        categories={categories.data}
        courses={courses.data}
        versions={versions.data}
        kits={kits.data}
        resources={resources.data}
        modules={modules.data}
        sessions={sessions.data}
        proposalItems={proposalItems.data}
        orderItems={orderItems.data}
        certificates={certificates.data}
        entitlements={entitlements.data}
        queryWarnings={queryWarnings}
      />
    </TrainingHubShell>
  )
}
