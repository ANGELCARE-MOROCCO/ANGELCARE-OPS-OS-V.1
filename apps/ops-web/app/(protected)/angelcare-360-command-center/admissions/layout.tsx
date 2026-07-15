import type { ReactNode } from 'react'
import { redirect } from 'next/navigation'
import { getAngelcare360AccessContext } from '@/lib/angelcare360/server'
import Angelcare360AdmissionsChrome from '@/components/angelcare360/admissions/Angelcare360AdmissionsChrome'

export default async function Angelcare360AdmissionsLayout({ children }: { children: ReactNode }) {
  const context = await getAngelcare360AccessContext()
  if (!context?.school) redirect('/angelcare-360-command-center')
  return <Angelcare360AdmissionsChrome>{children}</Angelcare360AdmissionsChrome>
}
