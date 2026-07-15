import type { Angelcare360TransportStopListRecord } from '@/types/angelcare360/transport'
import Angelcare360TransportMutationForm from './Angelcare360TransportMutationForm'

type Angelcare360TransportStopDrawerProps = {
  schoolId: string
  routes: Array<{ label: string; value: string }>
  stop?: Angelcare360TransportStopListRecord | null
  lockedReason?: string | null
}

export default function Angelcare360TransportStopDrawer({ schoolId, routes, stop, lockedReason }: Angelcare360TransportStopDrawerProps) {
  return (
    <Angelcare360TransportMutationForm
      title={stop ? 'Modifier l’arrêt' : 'Créer un arrêt'}
      description="Les arrêts sont rattachés à un circuit, avec ordre de passage et horaire prévu."
      entity="stop"
      operation={stop ? 'update' : 'create'}
      submitLabel={stop ? 'Enregistrer la modification' : 'Créer l’arrêt'}
      schoolId={schoolId}
      recordId={stop?.id}
      lockedReason={lockedReason}
      initialValues={stop ? {
        routeId: stop.route_id,
        stopCode: stop.stop_code,
        label: stop.label,
        orderIndex: stop.order_index,
        latitude: stop.latitude ?? '',
        longitude: stop.longitude ?? '',
        plannedTime: stop.planned_time || '',
        status: stop.status,
      } : {
        status: 'active',
        orderIndex: 1,
      }}
      fields={[
        {
          name: 'routeId',
          label: 'Circuit',
          kind: 'select',
          required: true,
          options: routes,
        },
        { name: 'stopCode', label: 'Code arrêt', kind: 'text', required: true },
        { name: 'label', label: 'Libellé', kind: 'text', required: true },
        { name: 'orderIndex', label: 'Ordre', kind: 'number', required: true },
        { name: 'latitude', label: 'Latitude', kind: 'number', helperText: 'Optionnel.' },
        { name: 'longitude', label: 'Longitude', kind: 'number', helperText: 'Optionnel.' },
        { name: 'plannedTime', label: 'Heure prévue', kind: 'time', helperText: 'HH:MM ou HH:MM:SS.' },
        {
          name: 'status',
          label: 'Statut',
          kind: 'select',
          required: true,
          options: [
            { label: 'Actif', value: 'active' },
            { label: 'Suspendu', value: 'suspended' },
            { label: 'Archivé', value: 'archived' },
          ],
        },
      ]}
    />
  )
}

