import { redirect } from 'next/navigation'
import type { Angelcare360AccessContext } from '@/lib/angelcare360/server'
import { getAngelcare360AccessContext, requireAngelcare360Permission } from '@/lib/angelcare360/server'

export type Angelcare360ReportsContext = Omit<Angelcare360AccessContext, 'school'> & {
  school: NonNullable<Angelcare360AccessContext['school']>
}

export async function getAngelcare360ReportsContext(): Promise<Angelcare360ReportsContext> {
  const context = await getAngelcare360AccessContext()
  if (!context?.school) redirect('/angelcare-360-command-center')
  await requireAngelcare360Permission('rapports.view', { context })
  return context as Angelcare360ReportsContext
}
