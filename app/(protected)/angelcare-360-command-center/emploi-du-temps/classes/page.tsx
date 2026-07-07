import Link from 'next/link'
import { redirect } from 'next/navigation'
import { ANGELCARE360_TIMETABLE_NAVIGATION } from '@/data/angelcare360/timetable-navigation'
import Angelcare360TimetablePageShell from '@/components/angelcare360/timetable/Angelcare360TimetablePageShell'
import { getAngelcare360AccessContext } from '@/lib/angelcare360/server'
import { listAngelcare360TimetableSlots } from '@/lib/angelcare360/server/timetable'
import Angelcare360EmptyState from '@/components/angelcare360/states/Angelcare360EmptyState'

export const dynamic = 'force-dynamic'

export default async function Angelcare360TimetableClassesPage() {
  const context = await getAngelcare360AccessContext()
  if (!context?.school) redirect('/angelcare-360-command-center')

  const slots = await listAngelcare360TimetableSlots({ schoolId: context.school.id, academicYearId: context.academicYear?.id || null })
  const groups = groupByClass(slots)

  return (
    <Angelcare360TimetablePageShell
      title="Emploi du temps par classe"
      subtitle="Planning regroupé par classe avec détection des conflits et liens vers les créneaux."
      badge="Phase 6"
      statusLabel={`${groups.length} classe(s)`}
      contextRow={<Badge label={`Établissement: ${context.school.name}`} />}
      navigationItems={ANGELCARE360_TIMETABLE_NAVIGATION}
    >
      <section style={panelStyle}>
        <div style={panelHeaderStyle}>
          <div>
            <div style={panelEyebrowStyle}>Vue par classe</div>
            <h2 style={panelTitleStyle}>Créneaux groupés</h2>
          </div>
          <Link href="/angelcare-360-command-center/emploi-du-temps" style={toolbarLinkStyle}>
            Retour à l’aperçu
          </Link>
        </div>

        {groups.length === 0 ? (
          <Angelcare360EmptyState title="Aucun créneau" description="Aucun créneau n’est encore disponible pour cette année scolaire." />
        ) : (
          <div style={groupGridStyle}>
            {groups.map((group) => (
              <article key={group.key} style={groupCardStyle}>
                <div style={groupTitleStyle}>{group.label}</div>
                <div style={groupMetaStyle}>{group.slots.length} créneau(x)</div>
                <div style={listGridStyle}>
                  {group.slots.map((slot, index) => {
                    const slotRecord = slot as Record<string, unknown>
                    return (
                    <div key={String(slotRecord.id || `${group.key}-${index}`)} style={tableRowStyle}>
                      <div style={cellStrongStyle}>
                        {String(slotRecord.class_name || '—')}
                        <div style={cellMutedStyle}>{String(slotRecord.section_name || '—')}</div>
                      </div>
                      <div style={cellStrongStyle}>{String(slotRecord.day_of_week || '—')}</div>
                      <div style={cellStrongStyle}>
                        {String(slotRecord.start_time || '—')} - {String(slotRecord.end_time || '—')}
                      </div>
                      <div style={cellStrongStyle}>{String(slotRecord.subject_name || '—')}</div>
                      <div style={cellStrongStyle}>{String(slotRecord.staff_full_name || '—')}</div>
                      <div>
                        <Link href={`/angelcare-360-command-center/emploi-du-temps/classes/${String(slotRecord.class_id || '')}`} style={rowLinkStyle}>
                          Ouvrir
                        </Link>
                      </div>
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

function groupByClass(slots: Array<Record<string, unknown>>) {
  const map = new Map<string, { key: string; label: string; slots: Array<Record<string, unknown>> }>()
  for (const slot of slots) {
    const label = String(slot.class_name || 'Classe non rattachée')
    const key = String(slot.class_id || label)
    const current = map.get(key) || { key, label, slots: [] }
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

const tableShellStyle: React.CSSProperties = {
  display: 'grid',
  gap: 8,
}

const tableRowStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '2fr 0.7fr 1fr 1.2fr 1.2fr 1fr',
  gap: 10,
  padding: 12,
  borderRadius: 18,
  border: '1px solid #dbe4ef',
  background: '#fff',
  alignItems: 'start',
}

const cellStrongStyle: React.CSSProperties = {
  color: '#0f172a',
  fontWeight: 800,
}

const cellMutedStyle: React.CSSProperties = {
  color: '#64748b',
  fontSize: 12,
  fontWeight: 600,
}

const groupGridStyle: React.CSSProperties = {
  display: 'grid',
  gap: 12,
}

const groupCardStyle: React.CSSProperties = {
  display: 'grid',
  gap: 10,
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

const listGridStyle: React.CSSProperties = {
  display: 'grid',
  gap: 8,
}

const rowLinkStyle: React.CSSProperties = {
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
