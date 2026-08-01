'use client'

import type { ReactNode } from 'react'
import SovereignPortal from './sovereign/SovereignPortal'

type Props = {
  open: boolean
  title: string
  subtitle?: string
  onClose: () => void
  children: ReactNode
  footer?: ReactNode
  variant?: 'default' | 'finance' | 'commercial' | 'support' | 'infrastructure' | 'governance' | 'danger'
}

export default function Angelcare360OperatorDrawer({ open,title,subtitle,onClose,children,footer,variant='default' }:Props){
  const tone = variant === 'default' ? 'neutral' : variant === 'infrastructure' ? 'tenant' : variant === 'support' ? 'service' : variant
  return <SovereignPortal open={open} title={title} subtitle={subtitle} onClose={onClose} footer={footer} tone={tone} size={variant==='danger'?'mission':'operational'}>{children}</SovereignPortal>
}
