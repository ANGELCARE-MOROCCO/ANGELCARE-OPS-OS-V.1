import { CommandKernelProvider } from './_components/CommandKernelContext'
import CommandKernelFrame from './_components/CommandKernelFrame'
export default function Layout({children}:{children:any}){return <CommandKernelProvider><CommandKernelFrame>{children}</CommandKernelFrame></CommandKernelProvider>}
