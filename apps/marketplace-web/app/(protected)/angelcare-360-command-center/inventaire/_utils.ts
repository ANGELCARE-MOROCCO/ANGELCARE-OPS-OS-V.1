import { redirect } from 'next/navigation'
import type { Angelcare360AccessContext } from '@/lib/angelcare360/server/context'
import { getAngelcare360AccessContext, requireAngelcare360Permission } from '@/lib/angelcare360/server/context'

export type MaterialCommandContext = Omit<Angelcare360AccessContext, 'school'> & { school: NonNullable<Angelcare360AccessContext['school']> }

export async function getMaterialCommandContext(): Promise<MaterialCommandContext> {
  const context = await getAngelcare360AccessContext()
  if (!context?.school) redirect('/angelcare-360-command-center')
  await requireAngelcare360Permission('inventaire.view', { context })
  return context as MaterialCommandContext
}
