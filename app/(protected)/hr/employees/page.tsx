import { getHREmployeesCommandData } from '@/lib/hr-production/employees-command'
import EmployeesCommandCenter from './_components/EmployeesCommandCenter'

export const dynamic = 'force-dynamic'

export default async function Page() {
  const command = await getHREmployeesCommandData()
  return <EmployeesCommandCenter command={command} />
}
