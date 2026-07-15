import Angelcare360EmptyState from '@/components/angelcare360/states/Angelcare360EmptyState'

type Angelcare360TransportIncidentsWorkspaceProps = {
  lockedReason: string
}

export default function Angelcare360TransportIncidentsWorkspace({ lockedReason }: Angelcare360TransportIncidentsWorkspaceProps) {
  return (
    <Angelcare360EmptyState
      title="Incidents transport verrouillés"
      description={lockedReason}
      actionLabel="Retour au cockpit"
      actionHref="/angelcare-360-command-center/transport"
    />
  )
}

