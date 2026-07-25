import type { ReactNode } from "react"
import ContentCommand360Shell from "@/components/market-os/content-command/ContentCommand360Shell"
import "@/components/market-os/content-command/content-command-360.css"

export default function ContentCommandCenterLayout({ children }: { children: ReactNode }) {
  return <ContentCommand360Shell>{children}</ContentCommand360Shell>
}
