import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { createCheckin } from './actions'

export default async function PointagePage() {
  const supabase = await createClient()

  const { data: caregivers } = await supabase
    .from('caregivers')
    .select('*')
    .order('full_name', { ascending: true })

  const { data: missions } = await supabase
    .from('missions')
    .select('*')
    .order('mission_date', { ascending: true })

  const { data: checkins } = await supabase
    .from('caregiver_checkins')
    .select('*')
    .order('event_time', { ascending: false })
    .limit(10)

  return (
    <main style={{ padding: 32, fontFamily: 'Arial, sans-serif', background: '#f8fafc', minHeight: '100vh' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h1 style={{ margin: 0 }}>Pointage terrain</h1>
          <p style={{ color: '#64748b', marginTop: 8 }}>
            Check-in / Check-out des intervenantes AngelCare
          </p>
        </div>

        <Link href="/" style={secondaryButtonStyle}>← Dashboard</Link>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        <section style={panelStyle}>
          <h2 style={titleStyle}>Nouveau pointage</h2>

          <form action={createCheckin} style={{ display: 'grid', gap: 14 }}>
            <select name="caregiver_id" style={inputStyle} required defaultValue="">
              <option value="" disabled>Choisir une intervenante</option>
              {caregivers?.map((caregiver) => (
                <option key={caregiver.id} value={caregiver.id}>
                  {caregiver.full_name} {caregiver.city ? `• ${caregiver.city}` : ''}
                </option>
              ))}
            </select>

            <select name="mission_id" style={inputStyle} defaultValue="">
              <option value="">Aucune mission liée</option>
              {missions?.map((mission) => (
                <option key={mission.id} value={mission.id}>
                  #{mission.id} • {mission.service_type || 'Mission'} • {mission.mission_date || 'Date non définie'}
                </option>
              ))}
            </select>

            <input name="city" placeholder="Ville" style={inputStyle} required />
            <input name="zone" placeholder="Zone / secteur" style={inputStyle} required />

            <select name="event_type" style={inputStyle} required defaultValue="">
              <option value="" disabled>Type de pointage</option>
              <option value="check_in">Check-in</option>
              <option value="check_out">Check-out</option>
            </select>

            <textarea
              name="notes"
              placeholder="Notes éventuelles"
              style={{ ...inputStyle, minHeight: 100 }}
            />

            <button type="submit" style={buttonStyle}>Enregistrer le pointage</button>
          </form>
        </section>

        <section style={panelStyle}>
          <h2 style={titleStyle}>Derniers pointages</h2>

          {checkins && checkins.length > 0 ? (
            <div style={{ display: 'grid', gap: 12 }}>
              {checkins.map((checkin) => (
                <div key={checkin.id} style={rowStyle}>
                  <div>
                    <div style={{ fontWeight: 700 }}>
                      {checkin.event_type === 'check_in' ? '🟢 Check-in' : '⚪ Check-out'}
                    </div>
                    <div style={metaStyle}>
                      Intervenante ID: {checkin.caregiver_id}
                    </div>
                    <div style={metaStyle}>
                      Mission ID: {checkin.mission_id || '—'}
                    </div>
                    <div style={metaStyle}>
                      {checkin.city || 'Ville non définie'} • {checkin.zone || 'Zone non définie'}
                    </div>
                    <div style={metaStyle}>
                      {checkin.notes || 'Aucune note'}
                    </div>
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    <div style={badgeStyle(checkin.event_type)}>{checkin.event_type}</div>
                    <div style={{ height: 8 }} />
                    <div style={metaStyle}>
                      {new Date(checkin.event_time).toLocaleString()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p style={{ color: '#64748b' }}>Aucun pointage enregistré.</p>
          )}
        </section>
      </div>
    </main>
  )
}

const panelStyle: React.CSSProperties = {
  background: 'white',
  borderRadius: 20,
  padding: 20,
  border: '1px solid #e2e8f0',
  boxShadow: '0 10px 30px rgba(15, 23, 42, 0.06)',
}

const titleStyle: React.CSSProperties = {
  marginTop: 0,
  marginBottom: 16,
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '14px 16px',
  borderRadius: 12,
  border: '1px solid #cbd5e1',
  fontSize: 15,
  boxSizing: 'border-box',
}

const rowStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'flex-start',
  gap: 16,
  padding: 14,
  borderRadius: 14,
  border: '1px solid #e2e8f0',
  background: '#fcfdff',
}

const metaStyle: React.CSSProperties = {
  color: '#64748b',
  fontSize: 14,
  marginTop: 4,
}

const buttonStyle: React.CSSProperties = {
  background: '#0f172a',
  color: 'white',
  border: 'none',
  borderRadius: 10,
  padding: '12px 16px',
  fontWeight: 700,
  cursor: 'pointer',
}

const secondaryButtonStyle: React.CSSProperties = {
  background: 'white',
  color: '#0f172a',
  border: '1px solid #cbd5e1',
  borderRadius: 10,
  padding: '12px 16px',
  fontWeight: 700,
  textDecoration: 'none',
}

function badgeStyle(status: string): React.CSSProperties {
  const colors: Record<string, { bg: string; text: string }> = {
    check_in: { bg: '#dcfce7', text: '#166534' },
    check_out: { bg: '#e2e8f0', text: '#334155' },
  }

  const color = colors[status] || { bg: '#e2e8f0', text: '#334155' }

  return {
    display: 'inline-block',
    padding: '6px 10px',
    borderRadius: 999,
    background: color.bg,
    color: color.text,
    fontSize: 12,
    fontWeight: 700,
  }
}
