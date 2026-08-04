'use client'

import { Employee360CommandSurface } from '@/app/(protected)/hr/employees/_components/Employee360DossierModal'

export default function Staff360ProductionView({ employeeId }: { employeeId: string }) {
  return (
    <Employee360CommandSurface
      employeeId={employeeId}
      mode="page"
    />
  )
}
