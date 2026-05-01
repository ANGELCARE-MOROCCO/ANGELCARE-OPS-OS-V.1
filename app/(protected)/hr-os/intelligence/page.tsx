import HrOsShell from '@/app/components/hr-os/HrOsShell'
import { HrIntelligenceBoard } from '../_components/HrIntelligencePanels'
import { createClient } from '@/lib/supabase/server'
import { requireAccess } from '@/lib/auth/requireAccess'

export default async function HrOsIntelligencePage() {
  await requireAccess('hr.view')
  const supabase = await createClient()

  let actions: any[] = []
  try {
    const { data } = await supabase
      .from('hr_os_actions')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100)
    actions = data || []
  } catch {
    actions = []
  }

  return (
    <HrOsShell
      title="HR-OS Intelligence Layer"
      subtitle="System-generated risk signals, readiness scoring, next-best-actions and management recommendations across the HR operating system."
      active="intelligence"
    >
      <HrIntelligenceBoard actions={actions} />
    </HrOsShell>
  )
}
