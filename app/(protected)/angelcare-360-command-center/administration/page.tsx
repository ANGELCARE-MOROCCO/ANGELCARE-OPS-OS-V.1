import { redirect } from 'next/navigation'
import { getAngelcare360AdministrationContext } from '@/lib/angelcare360/server'
import Angelcare360AdministrationHub from '@/components/angelcare360/administration/Angelcare360AdministrationHub'

export const dynamic = 'force-dynamic'

export default async function Angelcare360AdministrationPage() {
  const state = await getAngelcare360AdministrationContext()
  if (!state?.context?.school || !state.overview) {
    redirect('/angelcare-360-command-center')
  }

  return <Angelcare360AdministrationHub overview={state.overview} />
}

