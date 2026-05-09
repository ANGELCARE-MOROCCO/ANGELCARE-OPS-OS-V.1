import RealWorkspaceShell from "@/components/email-os/real-workspace/RealWorkspaceShell"
import RealEntityWorkspace from "@/components/email-os/real-workspace/RealEntityWorkspace"

export default function Page() {
  return (
    <RealWorkspaceShell>
      <RealEntityWorkspace entity="runtime-events" />
    </RealWorkspaceShell>
  )
}
