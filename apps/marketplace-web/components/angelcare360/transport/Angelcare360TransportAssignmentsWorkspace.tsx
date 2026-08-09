import type { Angelcare360TransportAssignmentListRecord } from '@/types/angelcare360/transport'
import Angelcare360TransportDataTable from './Angelcare360TransportDataTable'
import Angelcare360TransportMutationForm from './Angelcare360TransportMutationForm'

type Option = { label: string; value: string }

type Angelcare360TransportAssignmentsWorkspaceProps = {
  schoolId: string
  academicYearId: string
  assignments: Angelcare360TransportAssignmentListRecord[]
  routeOptions: Option[]
  studentOptions: Option[]
  vehicleOptions: Option[]
  stopOptions: Option[]
}

export default function Angelcare360TransportAssignmentsWorkspace({
  schoolId,
  academicYearId,
  assignments,
  routeOptions,
  studentOptions,
  vehicleOptions,
  stopOptions,
}: Angelcare360TransportAssignmentsWorkspaceProps) {
  const createOptions = [...studentOptions]

  return (
    <section style={shellStyle}>
      <Angelcare360TransportMutationForm
        title="Affecter un élève"
        description="L’affectation est unique par élève et année scolaire. Les doublons sont contrôlés côté serveur."
        entity="assignment"
        operation="create"
        submitLabel="Créer l’affectation"
        schoolId={schoolId}
        initialValues={{
          academicYearId,
          status: 'active',
        }}
        fields={[
          { name: 'academicYearId', label: 'Année scolaire', kind: 'text', required: true, helperText: 'Identifiant de l’année active.' },
          { name: 'routeId', label: 'Circuit', kind: 'select', required: true, options: routeOptions },
          { name: 'studentId', label: 'Élève', kind: 'select', required: true, options: createOptions },
          { name: 'vehicleId', label: 'Véhicule', kind: 'select', options: vehicleOptions },
          { name: 'pickupStopId', label: 'Arrêt de ramassage', kind: 'select', options: stopOptions },
          { name: 'dropoffStopId', label: 'Arrêt de dépôt', kind: 'select', options: stopOptions },
          { name: 'assignedOn', label: 'Date d’affectation', kind: 'date' },
          {
            name: 'status',
            label: 'Statut',
            kind: 'select',
            required: true,
            options: [
              { label: 'Actif', value: 'active' },
              { label: 'En attente', value: 'pending' },
              { label: 'Suspendu', value: 'suspended' },
              { label: 'Annulé', value: 'cancelled' },
            ],
          },
        ]}
      />

      <Angelcare360TransportDataTable
        title="Affectations élèves"
        description="La liste est dérivée des affectations actives pour l’année scolaire courante."
        rows={assignments}
        emptyTitle="Aucune affectation"
        emptyDescription="Affectez des élèves aux circuits pour préparer le ramassage et le dépôt."
        columns={[
          { key: 'student', label: 'Élève', render: (row) => <StudentCell row={row} /> },
          { key: 'route', label: 'Circuit', render: (row) => row.route_label || row.route_code || '—' },
          { key: 'vehicle', label: 'Véhicule', render: (row) => row.vehicle_label || row.vehicle_code || '—' },
          { key: 'pickup', label: 'Ramassage', render: (row) => row.pickup_stop_label || '—' },
          { key: 'dropoff', label: 'Dépôt', render: (row) => row.dropoff_stop_label || '—' },
          { key: 'coverage', label: 'Contacts', align: 'right', render: (row) => row.emergency_contact_ready ? 'OK' : 'Manquant' },
          { key: 'status', label: 'Statut', render: (row) => row.status },
        ]}
      />

      {assignments.map((assignment) => (
        <details key={assignment.id} style={detailsStyle}>
          <summary style={summaryStyle}>Modifier {assignment.student_full_name || assignment.student_code}</summary>
          <div style={detailsContentStyle}>
            <Angelcare360TransportMutationForm
              title="Modifier l’affectation"
              description="La mise à jour respecte l’unicité élève/année et journalise l’opération."
              entity="assignment"
              operation="update"
              submitLabel="Enregistrer la modification"
              schoolId={schoolId}
              recordId={assignment.id}
              initialValues={{
                id: assignment.id,
                schoolId,
                academicYearId,
                routeId: assignment.route_id,
                studentId: assignment.student_id,
                vehicleId: assignment.vehicle_id || '',
                pickupStopId: assignment.pickup_stop_id || '',
                dropoffStopId: assignment.dropoff_stop_id || '',
                assignedOn: assignment.assigned_on,
                status: assignment.status,
              }}
              fields={[
                { name: 'academicYearId', label: 'Année scolaire', kind: 'text', required: true },
                { name: 'routeId', label: 'Circuit', kind: 'select', required: true, options: routeOptions },
                { name: 'studentId', label: 'Élève', kind: 'select', required: true, options: studentOptions },
                { name: 'vehicleId', label: 'Véhicule', kind: 'select', options: vehicleOptions },
                { name: 'pickupStopId', label: 'Arrêt de ramassage', kind: 'select', options: stopOptions },
                { name: 'dropoffStopId', label: 'Arrêt de dépôt', kind: 'select', options: stopOptions },
                { name: 'assignedOn', label: 'Date d’affectation', kind: 'date' },
                {
                  name: 'status',
                  label: 'Statut',
                  kind: 'select',
                  required: true,
                  options: [
                    { label: 'Actif', value: 'active' },
                    { label: 'En attente', value: 'pending' },
                    { label: 'Suspendu', value: 'suspended' },
                    { label: 'Annulé', value: 'cancelled' },
                  ],
                },
              ]}
            />
          </div>
        </details>
      ))}
    </section>
  )
}

function StudentCell({ row }: { row: Angelcare360TransportAssignmentListRecord }) {
  return (
    <div style={stackStyle}>
      <div style={titleStyle}>{row.student_full_name || row.student_code || '—'}</div>
      <div style={metaStyle}>{row.class_name || 'Classe inconnue'} · {row.section_name || 'Section inconnue'}</div>
    </div>
  )
}

const shellStyle: React.CSSProperties = {
  display: 'grid',
  gap: 14,
}

const stackStyle: React.CSSProperties = {
  display: 'grid',
  gap: 4,
}

const titleStyle: React.CSSProperties = {
  color: '#0f172a',
  fontWeight: 900,
}

const metaStyle: React.CSSProperties = {
  color: '#64748b',
  fontSize: 12,
  fontWeight: 700,
}

const detailsStyle: React.CSSProperties = {
  borderRadius: 20,
  border: '1px solid #e2e8f0',
  background: '#fff',
  padding: 14,
}

const summaryStyle: React.CSSProperties = {
  cursor: 'pointer',
  fontWeight: 900,
  color: '#0f172a',
}

const detailsContentStyle: React.CSSProperties = {
  marginTop: 12,
}
