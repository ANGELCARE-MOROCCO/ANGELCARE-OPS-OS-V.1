import type { ReactNode } from 'react'
import Angelcare360PeopleChrome from '@/components/angelcare360/people/Angelcare360PeopleChrome'

export const dynamic = 'force-dynamic'

export default function Angelcare360PeopleLayout({ children }: { children: ReactNode }) {
  return <Angelcare360PeopleChrome>{children}</Angelcare360PeopleChrome>
}

