import Link from 'next/link'
import { redirect } from 'next/navigation'
import { ANGELCARE360_TIMETABLE_NAVIGATION } from '@/data/angelcare360/timetable-navigation'
import Angelcare360TimetablePageShell from '@/components/angelcare360/timetable/Angelcare360TimetablePageShell'
import { getAngelcare360AccessContext } from '@/lib/angelcare360/server'
import { listAngelcare360TimetableSlots } from '@/lib/angelcare360/server/timetable'
import Angelcare360EmptyState from '@/components/angelcare360/states/Angelcare360EmptyState'

export const dynamic = 'force-dynamic'

export default async function Angelcare360TimetableTeachersPage() {
  const context = await getAngelcare360AccessContext()
  if (!context?.school) redirect('/angelcare-360-command-center')

  const slots = await listAngelcare360TimetableSlots({ schoolId: context.school.id, academicYearId: context.academicYear?.id || null })
  const groups = groupByTeacher(slots)

  return (
    <Angelcare360TimetablePageShell
      title="Emploi du temps par enseignant"
      subtitle="Vue regroupée par enseignant avec les créneaux et les éventuels conflits."
      badge="Phase 6"
      statusLabel={`${groups.length} enseignant(s)`}
      contextRow={<Badge label={`Établissement: ${context.school.name}`} />}
      navigationItems={ANGELCARE360_TIMETABLE_NAVIGATION}
    >
      <section style={panelStyle}>
        <div style={panelHeaderStyle}>
          <div>
            <div style={panelEyebrowStyle}>Vue par enseignant</div>
            <h2 style={panelTitleStyle}>Créneaux groupés</h2>
          </div>
          <Link href="/angelcare-360-command-center/emploi-du-temps" style={toolbarLinkStyle}>
            Retour à l’aperçu
          </Link>
        </div>

        {groups.length === 0 ? (
          <Angelcare360EmptyState title="Aucun créneau" description="Aucun créneau n’est encore disponible pour les enseignants." />
        ) : (
          <div style={groupGridStyle}>
            {groups.map((group) => (
              <article key={group.label} style={groupCardStyle}>
                <div style={groupTitleStyle}>{group.label}</div>
                <div style={groupMetaStyle}>{group.slots.length} créneau(x)</div>
                <div style={groupListStyle}>
                  {group.slots.map((slot, index) => {
                    const slotRecord = slot as Record<string, unknown>
                    return (
                    <div key={String(slotRecord.id || `${group.label}-${index}`)} style={slotLineStyle}>
                      <span>{String(slotRecord.day_of_week || '—')}</span>
                      <span>
                        {String(slotRecord.start_time || '—')} - {String(slotRecord.end_time || '—')}
                      </span>
                      <span>{String(slotRecord.class_name || '—')}</span>
                      <span>{String(slotRecord.subject_name || '—')}</span>
                    </div>
                    )
                  })}
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </Angelcare360TimetablePageShell>
  )
}

function groupByTeacher(slots: Array<Record<string, unknown>>) {
  const map = new Map<string, { label: string; slots: Array<Record<string, unknown>> }>()
  for (const slot of slots) {
    const label = String(slot.staff_full_name || 'Enseignant non rattaché')
    const key = String(slot.staff_id || label)
    const current = map.get(key) || { label, slots: [] }
    current.slots.push(slot)
    map.set(key, current)
  }
  return Array.from(map.values()).sort((left, right) => left.label.localeCompare(right.label, 'fr'))
}

function Badge({ label }: { label: string }) {
  return <span style={badgeStyle}>{label}</span>
}

const badgeStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  borderRadius: 999,
  padding: '6px 10px',
  background: '#eff6ff',
  color: '#1e40af',
  fontSize: 12,
  fontWeight: 900,
}

const panelStyle: React.CSSProperties = {
  borderRadius: 24,
  border: '1px solid #dbe4ef',
  background: '#fff',
  boxShadow: '0 16px 44px rgba(15,23,42,.05)',
  padding: 18,
}

const panelHeaderStyle: React.CSSProperties = {
  display: 'flex',
  flexWrap: 'wrap',
  justifyContent: 'space-between',
  gap: 12,
  alignItems: 'start',
  marginBottom: 16,
}

const panelEyebrowStyle: React.CSSProperties = {
  color: '#2563eb',
  textTransform: 'uppercase',
  letterSpacing: 1,
  fontSize: 12,
  fontWeight: 900,
}

const panelTitleStyle: React.CSSProperties = {
  margin: '8px 0 0',
  color: '#0f172a',
  fontSize: 20,
  fontWeight: 950,
}

const toolbarLinkStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  borderRadius: 14,
  border: '1px solid #cbd5e1',
  padding: '10px 14px',
  background: '#fff',
  color: '#0f172a',
  textDecoration: 'none',
  fontWeight: 850,
}

const groupGridStyle: React.CSSProperties = {
  display: 'grid',
  gap: 12,
  gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
}

const groupCardStyle: React.CSSProperties = {
  display: 'grid',
  gap: 8,
  borderRadius: 20,
  border: '1px solid #dbe4ef',
  background: '#fff',
  padding: 16,
}

const groupTitleStyle: React.CSSProperties = {
  color: '#0f172a',
  fontSize: 18,
  fontWeight: 900,
}

const groupMetaStyle: React.CSSProperties = {
  color: '#64748b',
  fontSize: 13,
  fontWeight: 700,
}

const groupListStyle: React.CSSProperties = {
  display: 'grid',
  gap: 8,
}

const slotLineStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '0.8fr 1fr 1.2fr 1fr',
  gap: 8,
  color: '#475569',
  fontSize: 13,
  fontWeight: 600,
}
