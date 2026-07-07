import type { ReactNode } from 'react'
import Angelcare360AdmissionsChrome from '@/components/angelcare360/admissions/Angelcare360AdmissionsChrome'

export default function Angelcare360AdmissionsLayout({ children }: { children: ReactNode }) {
  return <Angelcare360AdmissionsChrome>{children}</Angelcare360AdmissionsChrome>
}

