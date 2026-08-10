'use client'

import JustificationReviewDesk from '@/components/angelcare360/zone-b-presence/JustificationReviewDesk'
import type { Angelcare360AttendanceJustificationListRecord } from '@/types/angelcare360/attendance'

type Props = {
  schoolId: string
  items: Angelcare360AttendanceJustificationListRecord[]
  canCreate: boolean
  canApprove: boolean
  selectedId?: string | null
}

export default function Angelcare360JustificationsWorkspace({ schoolId, items, canApprove }: Props) {
  return <JustificationReviewDesk items={items} schoolId={schoolId} canApprove={canApprove} />
}
