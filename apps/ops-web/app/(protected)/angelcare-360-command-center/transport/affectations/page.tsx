import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import Angelcare360EmptyState from '@/components/angelcare360/states/Angelcare360EmptyState'
import Angelcare360TransportPageShell from '@/components/angelcare360/transport/Angelcare360TransportPageShell'
import Angelcare360TransportAssignmentsWorkspace from '@/components/angelcare360/transport/Angelcare360TransportAssignmentsWorkspace'
import { ANGELCARE360_TRANSPORT_NAVIGATION } from '@/data/angelcare360/transport-navigation'
import { listAngelcare360TransportAssignments, listAngelcare360TransportRoutes, listAngelcare360TransportStops, listAngelcare360TransportVehicles } from '@/lib/angelcare360/server/transport'
import { getAngelcare360TransportContext } from '../_utils'

export const dynamic = 'force-dynamic'

export default async function Angelcare360TransportAssignmentsPage() {
  const context = await getAngelcare360TransportContext()
  const academicYearId = context.academicYear?.id || null
  const client = await createClient()

  const [routes, assignments, vehicles, stops, studentsResponse] = await Promise.all([
    listAngelcare360TransportRoutes({ schoolId: context.school.id }),
    listAngelcare360TransportAssignments({ schoolId: context.school.id, academicYearId }),
    listAngelcare360TransportVehicles({ schoolId: context.school.id }),
    listAngelcare360TransportStops({ schoolId: context.school.id }),
    client
      .from('angelcare360_students')
      .select('id, school_id, student_code, full_name, current_class_id, current_section_id')
      .eq('school_id', context.school.id)
      .eq('status', 'active')
      .order('full_name', { ascending: true }),
  ])

  const students = (studentsResponse.data || []) as Array<{ id: string; student_code: string; full_name: string }>
  const routeOptions = routes.map((route) => ({ label: `${route.route_code} · ${route.label}`, value: route.id }))
  const studentOptions = students.map((student) => ({ label: `${student.student_code} · ${student.full_name}`, value: student.id }))
  const vehicleOptions = vehicles.map((vehicle) => ({ label: `${vehicle.vehicle_code} · ${vehicle.plate_number}`, value: vehicle.id }))
  const stopOptions = stops.map((stop) => ({ label: `${stop.route_code || '—'} · ${stop.label}`, value: stop.id }))

  return (
    <Angelcare360TransportPageShell
      title="Affectations élèves"
      subtitle="Affectation, édition et annulation contrôlée des élèves aux circuits de transport."
      badge="Disponible"
      statusLabel={`${assignments.length} affectation(s)`}
      navigationItems={ANGELCARE360_TRANSPORT_NAVIGATION}
      primaryAction={<Link href="/angelcare-360-command-center/transport" style={secondaryLinkStyle}>Retour au cockpit</Link>}
    >
      {!academicYearId ? (
        <Angelcare360EmptyState
          title="Année scolaire introuvable"
          description="Une année scolaire active est nécessaire pour créer ou modifier une affectation transport."
          actionLabel="Retour au cockpit"
          actionHref="/angelcare-360-command-center/transport"
        />
      ) : (
        <Angelcare360TransportAssignmentsWorkspace
          schoolId={context.school.id}
          academicYearId={academicYearId}
          assignments={assignments}
          routeOptions={routeOptions}
          studentOptions={studentOptions}
          vehicleOptions={vehicleOptions}
          stopOptions={stopOptions}
        />
      )}
    </Angelcare360TransportPageShell>
  )
}

const secondaryLinkStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  borderRadius: 14,
  border: '1px solid #cbd5e1',
  background: '#fff',
  color: '#0f172a',
  padding: '10px 14px',
  textDecoration: 'none',
  fontWeight: 800,
}

