import type { ReactNode } from 'react'
import { redirect } from 'next/navigation'
import { getAngelcare360AccessContext } from '@/lib/angelcare360/server'
import Angelcare360PeopleChrome from '@/components/angelcare360/people/Angelcare360PeopleChrome'

export const dynamic = 'force-dynamic'

export default async function Angelcare360PeopleLayout({ children }: { children: ReactNode }) {
  const context = await getAngelcare360AccessContext()
  if (!context?.school) redirect('/angelcare-360-command-center')
  return <Angelcare360PeopleChrome>{children}</Angelcare360PeopleChrome>
}
