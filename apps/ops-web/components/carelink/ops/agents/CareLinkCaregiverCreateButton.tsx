'use client'

import { useState } from 'react'
import { CareLinkCaregiverCreateModal } from './CareLinkCaregiverCreateModal'

export function CareLinkCaregiverCreateButton() {
  const [open, setOpen] = useState(false)
  return <><button type="button" onClick={() => setOpen(true)} className="rounded-2xl bg-slate-950 px-5 py-3 text-sm font-black text-white shadow-[0_14px_32px_rgba(15,23,42,0.25)]">+ Nouvelle intervenante</button><CareLinkCaregiverCreateModal open={open} onClose={() => setOpen(false)} /></>
}

export default CareLinkCaregiverCreateButton
