import type { Angelcare360TransportVehicleListRecord } from '@/types/angelcare360/transport'
import Angelcare360TransportMutationForm from './Angelcare360TransportMutationForm'

type Angelcare360TransportVehicleDrawerProps = {
  schoolId: string
  vehicle?: Angelcare360TransportVehicleListRecord | null
  lockedReason?: string | null
}

export default function Angelcare360TransportVehicleDrawer({ schoolId, vehicle, lockedReason }: Angelcare360TransportVehicleDrawerProps) {
  return (
    <Angelcare360TransportMutationForm
      title={vehicle ? 'Modifier le véhicule' : 'Créer un véhicule'}
      description="La capacité, le chauffeur et le statut sont contrôlés côté serveur."
      entity="vehicle"
      operation={vehicle ? 'update' : 'create'}
      submitLabel={vehicle ? 'Enregistrer la modification' : 'Créer le véhicule'}
      schoolId={schoolId}
      recordId={vehicle?.id}
      lockedReason={lockedReason}
      initialValues={vehicle ? {
        vehicleCode: vehicle.vehicle_code,
        plateNumber: vehicle.plate_number,
        model: vehicle.model || '',
        capacitySeats: vehicle.capacity_seats,
        assignedDriverStaffId: vehicle.assigned_driver_staff_id || '',
        insuranceExpiresOn: vehicle.insurance_expires_on || '',
        status: vehicle.status,
      } : {
        status: 'active',
      }}
      fields={[
        { name: 'vehicleCode', label: 'Code véhicule', kind: 'text', required: true },
        { name: 'plateNumber', label: 'Plaque', kind: 'text', required: true },
        { name: 'model', label: 'Modèle', kind: 'text' },
        { name: 'capacitySeats', label: 'Capacité', kind: 'number', required: true },
        { name: 'assignedDriverStaffId', label: 'Chauffeur', kind: 'text', helperText: 'Identifiant du chauffeur affecté.' },
        { name: 'insuranceExpiresOn', label: 'Assurance jusqu’au', kind: 'date' },
        {
          name: 'status',
          label: 'Statut',
          kind: 'select',
          required: true,
          options: [
            { label: 'Actif', value: 'active' },
            { label: 'En maintenance', value: 'maintenance' },
            { label: 'Indisponible', value: 'unavailable' },
            { label: 'Archivé', value: 'archived' },
          ],
        },
      ]}
    />
  )
}

