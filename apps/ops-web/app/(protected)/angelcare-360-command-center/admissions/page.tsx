import { redirect } from 'next/navigation'
import { getAngelcare360AdmissionsOverview } from '@/lib/angelcare360/server'
import Angelcare360AdmissionsHub from '@/components/angelcare360/admissions/Angelcare360AdmissionsHub'

export const dynamic = 'force-dynamic'

export default async function Angelcare360AdmissionsPage() {
  const overview = await getAngelcare360AdmissionsOverview()
  if (!overview) redirect('/angelcare-360-command-center')

  return <Angelcare360AdmissionsHub overview={overview} />
}

