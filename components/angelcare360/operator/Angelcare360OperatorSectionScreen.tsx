import type { ReactNode } from 'react'
import Angelcare360OperatorPageShell from './Angelcare360OperatorPageShell'

type Props = {
  badge?: string
  statusLabel?: string
  title: string
  subtitle: string
  primaryAction?: ReactNode
  secondaryActions?: ReactNode
  contextRow?: ReactNode
  children: ReactNode
}

export default function Angelcare360OperatorSectionScreen(props: Props) {
  return <Angelcare360OperatorPageShell {...props} />
}

