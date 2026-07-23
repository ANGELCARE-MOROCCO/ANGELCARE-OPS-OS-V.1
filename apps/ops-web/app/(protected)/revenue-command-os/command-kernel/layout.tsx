import type { ReactNode } from 'react'
import { CommandKernelProvider } from './_components/CommandKernelContext'
import CommandKernelFrame from './_components/CommandKernelFrame'

export default function Layout({ children }: { children: ReactNode }) {
  return <CommandKernelProvider><CommandKernelFrame>{children}</CommandKernelFrame></CommandKernelProvider>
}
