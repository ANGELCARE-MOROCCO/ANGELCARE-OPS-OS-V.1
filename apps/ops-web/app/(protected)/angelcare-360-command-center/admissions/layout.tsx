import type { ReactNode } from 'react'
import { redirect } from 'next/navigation'
import { getAngelcare360AccessContext } from '@/lib/angelcare360/server/context'

export default async function Angelcare360AdmissionsArea9Layout({ children }: { children: ReactNode }) {
  const context = await getAngelcare360AccessContext()
  if (!context?.school) redirect('/angelcare-360-command-center')
  return children
}
