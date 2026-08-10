import Link from 'next/link'
import { redirect } from 'next/navigation'
import { ANGELCARE360_TIMETABLE_NAVIGATION } from '@/data/angelcare360/timetable-navigation'
import Angelcare360TimetablePageShell from '@/components/angelcare360/timetable/Angelcare360TimetablePageShell'
import { getAngelcare360AccessContext } from '@/lib/angelcare360/server'
import { listAngelcare360TimetableSlots } from '@/lib/angelcare360/server/timetable'
import type { Angelcare360TimetableSlotListRecord } from '@/types/angelcare360/attendance'
import Angelcare360EmptyState from '@/components/angelcare360/states/Angelcare360EmptyState'

export const dynamic = 'force-dynamic'

export default async function Angelcare360TimetableTeachersPage() {
  const context = await getAngelcare360AccessContext()
  if (!context?.school) redirect('/angelcare-360-command-center')
  const slots = await listAngelcare360TimetableSlots({ schoolId: context.school.id, academicYearId: context.academicYear?.id || null })
  const groups = groupByTeacher(slots)

  return (
    <Angelcare360TimetablePageShell
      title="Charge enseignants"
      subtitle="Vue coordonnée de la charge, des matières, des classes et des conflits par enseignant."
      badge="Teacher Load Command"
      statusLabel={`${groups.length} enseignant(s)`}
      contextRow={<Badge label={`Établissement: ${context.school.name}`} />}
      navigationItems={ANGELCARE360_TIMETABLE_NAVIGATION}
    >
      <section style={panelStyle}>
        <div style={panelHeaderStyle}>
          <div><div style={panelEyebrowStyle}>Teacher Execution Pulse</div><h2 style={panelTitleStyle}>Charge et disponibilité</h2></div>
          <Link href="/angelcare-360-command-center/emploi-du-temps?plane=conflicts" style={toolbarLinkStyle}>Voir les conflits</Link>
        </div>
        {groups.length === 0 ? (
          <Angelcare360EmptyState title="Aucune affectation" description="Aucun créneau enseignant n’est disponible pour l’année courante." />
        ) : (
          <div style={groupGridStyle}>
            {groups.map((group) => (
              <article key={group.key} style={groupCardStyle}>
                <div style={groupTopStyle}>
                  <div><span style={eyebrowStyle}>Enseignant</span><h3 style={groupTitleStyle}>{group.label}</h3></div>
                  <strong style={loadStyle}>{group.slots.length} créneaux</strong>
                </div>
                <div style={metricGridStyle}>
                  <Metric label="Classes" value={new Set(group.slots.map((slot) => slot.class_id)).size} />
                  <Metric label="Matières" value={new Set(group.slots.map((slot) => slot.subject_id)).size} />
                  <Metric label="Conflits" value={group.slots.reduce((sum, slot) => sum + (slot.conflict_count || 0), 0)} />
                </div>
                <div style={miniScheduleStyle}>
                  {group.slots.slice(0, 6).map((slot) => <div key={slot.id}><b>{dayLabel(slot.day_of_week)}</b><span>{slot.start_time.slice(0, 5)} · {slot.class_code || slot.class_name || 'Classe'} · {slot.subject_name || slot.subject_code || 'Matière'}</span></div>)}
                </div>
                {group.key !== 'unassigned' ? <Link href={`/angelcare-360-command-center/emploi-du-temps/enseignants/${group.key}`} style={openLinkStyle}>Ouvrir le dossier de charge →</Link> : null}
              </article>
            ))}
          </div>
        )}
      </section>
    </Angelcare360TimetablePageShell>
  )
}

function groupByTeacher(slots: Angelcare360TimetableSlotListRecord[]) {
  const map = new Map<string, { key: string; label: string; slots: Angelcare360TimetableSlotListRecord[] }>()
  for (const slot of slots) {
    const key = slot.staff_id || 'unassigned'
    const current = map.get(key) || { key, label: slot.staff_full_name || 'Enseignant non affecté', slots: [] }
    current.slots.push(slot)
    map.set(key, current)
  }
  return [...map.values()].sort((a, b) => a.label.localeCompare(b.label, 'fr'))
}
function dayLabel(day: number) { return ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'][Math.max(0, day - 1)] || `J${day}` }
function Metric({ label, value }: { label: string; value: number }) { return <div style={metricStyle}><span>{label}</span><strong>{value}</strong></div> }
function Badge({ label }: { label: string }) { return <span style={badgeStyle}>{label}</span> }

const panelStyle: React.CSSProperties = { padding: 18 }
const panelHeaderStyle: React.CSSProperties = { display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', alignItems: 'start', marginBottom: 16 }
const panelEyebrowStyle: React.CSSProperties = { color: '#0b7f9f', textTransform: 'uppercase', letterSpacing: 1, fontSize: 10, fontWeight: 900 }
const panelTitleStyle: React.CSSProperties = { margin: '6px 0 0', color: '#0d2b43', fontSize: 20, fontWeight: 950 }
const toolbarLinkStyle: React.CSSProperties = { display: 'inline-flex', alignItems: 'center', minHeight: 38, borderRadius: 11, border: '1px solid #cfe0e9', padding: '8px 11px', background: '#f6fbfd', color: '#155f7b', textDecoration: 'none', fontSize: 11, fontWeight: 900 }
const groupGridStyle: React.CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(320px,1fr))', gap: 12 }
const groupCardStyle: React.CSSProperties = { display: 'grid', gap: 13, padding: 17, borderRadius: 19, border: '1px solid #dbe6ee', background: 'linear-gradient(145deg,#fff,#f9fcfd)', boxShadow: '0 12px 32px rgba(9,40,63,.045)' }
const groupTopStyle: React.CSSProperties = { display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'start' }
const eyebrowStyle: React.CSSProperties = { color: '#0b7f9f', fontSize: 9, textTransform: 'uppercase', letterSpacing: 1, fontWeight: 900 }
const groupTitleStyle: React.CSSProperties = { margin: '5px 0 0', color: '#0c2942', fontSize: 19, fontWeight: 950 }
const loadStyle: React.CSSProperties = { borderRadius: 999, padding: '6px 9px', background: '#ecf7fb', color: '#176b85', fontSize: 10, fontWeight: 900 }
const metricGridStyle: React.CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 7 }
const metricStyle: React.CSSProperties = { display: 'grid', gap: 3, padding: 10, borderRadius: 12, background: '#f3f8fb', border: '1px solid #e2ebf0' }
const miniScheduleStyle: React.CSSProperties = { display: 'grid', gap: 6 }
const openLinkStyle: React.CSSProperties = { display: 'inline-flex', width: 'fit-content', color: '#0a7797', textDecoration: 'none', fontSize: 11, fontWeight: 900 }
const badgeStyle: React.CSSProperties = { display: 'inline-flex', alignItems: 'center', borderRadius: 999, padding: '6px 10px', background: '#edf8fb', color: '#176a84', fontSize: 11, fontWeight: 900 }
