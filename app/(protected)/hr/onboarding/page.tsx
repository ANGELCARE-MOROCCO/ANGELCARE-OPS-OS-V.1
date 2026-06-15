import OnboardingCommandCenter, { type OnboardingSeedData } from './_components/OnboardingCommandCenter'
import { createClient } from '@/lib/supabase/server'
import HRModuleCommandBridge from '@/components/hr-production/HRModuleCommandBridge'
import HRRealtimeSyncPanel from '@/components/hr-production/HRRealtimeSyncPanel'

export const dynamic = 'force-dynamic'

async function readTable(table: string, limit = 80) {
  try {
    const supabase = await createClient()
    const { data } = await supabase.from(table).select('*').limit(limit)
    return Array.isArray(data) ? data : []
  } catch {
    return []
  }
}

function nameOf(row: any, fallback: string) {
  return String(row?.full_name || row?.name || row?.title || row?.candidate_name || row?.employee_name || fallback)
}

export default async function Page() {
  const [onboardingRows, employeeRows, candidateRows, taskRows, docRows, activityRows] = await Promise.all([
    readTable('hr_onboarding_journeys'),
    readTable('employees'),
    readTable('hr_candidates'),
    readTable('hr_onboarding_tasks'),
    readTable('hr_onboarding_documents'),
    readTable('hr_onboarding_activity'),
  ])

  const basePeople = onboardingRows.length ? onboardingRows : [...candidateRows, ...employeeRows].slice(0, 18)

  const journeys = basePeople.slice(0, 24).map((row: any, index: number) => {
    const id = String(row?.id || row?.candidate_id || row?.employee_id || `journey-${index + 1}`)
    const title = nameOf(row, ['Imane Lahlou', 'Mehdi Tazi', 'Sara Bennani', 'Yassine Boukili', 'Ahmed Amine', 'Fatima Zahra Ait', 'Omar Kabbaj', 'Nadia Ezzahra'][index % 8])
    const position = String(row?.position || row?.job_title || row?.role || row?.target_role || ['HR Business Partner', 'Business Analyst', 'Customer Care Agent', 'Key Account Manager', 'Software Developer'][index % 5])
    return {
      id,
      title,
      position,
      status: String(row?.status || row?.stage || ['In Progress', 'Document Collection', 'Pre-Boarding', 'Orientation', 'Training & Setup', 'Pending'][index % 6]),
      startDate: String(row?.start_date || row?.created_at || `2025-05-${String(20 + (index % 8)).padStart(2, '0')}`),
      department: String(row?.department || row?.department_name || ['Human Resources', 'Operations', 'Customer Care', 'Sales & Marketing', 'IT'][index % 5]),
      manager: String(row?.manager || row?.manager_name || ['Salma El Alami', 'Ahmed Benali', 'Imane Lahlou'][index % 3]),
      location: String(row?.location || row?.city || 'Casablanca HQ'),
      employmentType: String(row?.employment_type || row?.contract_type || 'Full Time'),
      email: String(row?.email || `${title.toLowerCase().replace(/\s+/g, '.')}@angelcare.ma`),
      phone: String(row?.phone || '+212 6 77 88 99 00'),
      progress: Number(row?.progress || row?.completion_rate || [42, 55, 28, 67, 35, 74][index % 6]),
      owner: String(row?.owner || row?.owner_name || 'Salma El Alami'),
    }
  })

  const seed: OnboardingSeedData = {
    journeys,
    tasks: taskRows,
    documents: docRows,
    activity: activityRows,
  }

  return <>
<OnboardingCommandCenter initialData={seed} />
  </>
}
