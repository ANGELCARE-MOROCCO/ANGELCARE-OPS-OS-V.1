import type { Angelcare360TransportRouteListRecord } from '@/types/angelcare360/transport'
import Angelcare360TransportMutationForm from './Angelcare360TransportMutationForm'

type Angelcare360TransportRouteDrawerProps = {
  schoolId: string
  route?: Angelcare360TransportRouteListRecord | null
  lockedReason?: string | null
}

export default function Angelcare360TransportRouteDrawer({ schoolId, route, lockedReason }: Angelcare360TransportRouteDrawerProps) {
  return (
    <Angelcare360TransportMutationForm
      title={route ? 'Modifier le circuit' : 'Créer un circuit'}
      description="Les modifications sont validées côté serveur avec journal d’audit et contrôle de capacité."
      entity="route"
      operation={route ? 'update' : 'create'}
      submitLabel={route ? 'Enregistrer la modification' : 'Créer le circuit'}
      schoolId={schoolId}
      recordId={route?.id}
      lockedReason={lockedReason}
      initialValues={route ? {
        routeCode: route.route_code,
        label: route.label,
        routeType: route.route_type,
        responsibleStaffId: route.responsible_staff_id || '',
        assistantStaffId: route.accompagnateur_staff_id || '',
        vehicleId: route.vehicle_id || '',
        capacitySeats: route.capacity_seats ?? '',
        status: route.status,
      } : {
        status: 'draft',
        routeType: 'school_bus',
      }}
      fields={[
        { name: 'routeCode', label: 'Code circuit', kind: 'text', required: true, helperText: 'Unique par établissement.' },
        { name: 'label', label: 'Libellé', kind: 'text', required: true, helperText: 'Nom lisible du circuit.' },
        { name: 'routeType', label: 'Type de circuit', kind: 'text', helperText: 'Ex. navette, scolaire, mixte.' },
        { name: 'responsibleStaffId', label: 'Chauffeur', kind: 'text', helperText: 'Identifiant du membre du personnel chauffeur.' },
        { name: 'assistantStaffId', label: 'Accompagnateur', kind: 'text', helperText: 'Identifiant du membre du personnel accompagnateur.' },
        { name: 'vehicleId', label: 'Véhicule', kind: 'text', helperText: 'Identifiant du véhicule affecté au circuit.' },
        { name: 'capacitySeats', label: 'Capacité', kind: 'number', helperText: 'Nombre de places du circuit.' },
        {
          name: 'status',
          label: 'Statut',
          kind: 'select',
          required: true,
          options: [
            { label: 'Brouillon', value: 'draft' },
            { label: 'Actif', value: 'active' },
            { label: 'Suspendu', value: 'suspended' },
            { label: 'Archivé', value: 'archived' },
          ],
        },
      ]}
    />
  )
}

