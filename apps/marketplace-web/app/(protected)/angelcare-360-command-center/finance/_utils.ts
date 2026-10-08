import { redirect } from 'next/navigation'
import { getAngelcare360AccessContext, requireAngelcare360Permission } from '@/lib/angelcare360/server'

export async function getAngelcare360FinanceContext() {
  const context = await getAngelcare360AccessContext()
  if (!context?.school) redirect('/angelcare-360-command-center')
  await requireAngelcare360Permission('finance.view', { context })
  return context
}
