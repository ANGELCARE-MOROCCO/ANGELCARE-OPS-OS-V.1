import { createClient } from '@/lib/supabase/server'

function rows(res: any): any[] {
  return Array.isArray(res?.data) ? res.data : []
}

export async function getHRPhase13Data() {
  const supabase = await createClient()

  const [launch, adoption, docs, training] = await Promise.all([
    supabase.from('hr_launch_checks').select('*').order('created_at', { ascending: false }).limit(300),
    supabase.from('hr_adoption_tracker').select('*').order('created_at', { ascending: false }).limit(300),
    supabase.from('hr_documentation_items').select('*').order('created_at', { ascending: false }).limit(300),
    supabase.from('hr_operator_training_items').select('*').order('created_at', { ascending: false }).limit(300),
  ])

  const data = {
    launch: rows(launch),
    adoption: rows(adoption),
    docs: rows(docs),
    training: rows(training),
  }

  const open = (x: any) => !['completed', 'done', 'closed', 'ready'].includes(String(x?.status || '').toLowerCase())

  return {
    ...data,
    metrics: [
      { label: 'Launch checks', value: data.launch.length, detail: 'Production launch items', tone: '#2563eb' },
      { label: 'Open launch items', value: data.launch.filter(open).length, detail: 'Still needs review', tone: '#dc2626' },
      { label: 'Adoption items', value: data.adoption.length, detail: 'User adoption controls', tone: '#059669' },
      { label: 'Documentation', value: data.docs.length, detail: 'Operating docs', tone: '#7c3aed' },
      { label: 'Training items', value: data.training.length, detail: 'Operator enablement', tone: '#ea580c' },
    ],
  }
}
