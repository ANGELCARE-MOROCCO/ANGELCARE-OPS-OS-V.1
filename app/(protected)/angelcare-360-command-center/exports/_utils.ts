import { redirect } from 'next/navigation'
import type { Angelcare360AccessContext } from '@/lib/angelcare360/server'
import { getAngelcare360AccessContext, requireAngelcare360Permission } from '@/lib/angelcare360/server'

export type Angelcare360ExportsContext = Omit<Angelcare360AccessContext, 'school'> & {
  school: NonNullable<Angelcare360AccessContext['school']>
}

export async function getAngelcare360ExportsContext(): Promise<Angelcare360ExportsContext> {
  const context = await getAngelcare360AccessContext()
  if (!context?.school) redirect('/angelcare-360-command-center')
  await requireAngelcare360Permission('exports.view', { context })
  return context as Angelcare360ExportsContext
}
