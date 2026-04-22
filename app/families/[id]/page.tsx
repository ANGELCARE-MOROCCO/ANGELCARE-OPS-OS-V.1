import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { archiveFamily } from '../archive-action'

export default async function FamilyDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const familyId = Number(id)
  const supabase = await createClient()

  const [familyRes, leadsRes, missionsRes, notesRes] = await Promise.all([
    supabase.from('families').select('*').eq('id', familyId).maybeSingle(),
    supabase.from('leads').select('*').eq('family_id', familyId).order('id', { ascending: false }),
    supabase.from('missions').select('*').eq('family_id', familyId).order('id', { ascending: false }),
    supabase.from('family_notes').select('*').eq('family_id', familyId).order('created_at', { ascending: false }),
  ])

  const family = familyRes.data
  const leads = leadsRes.data || []
  const missions = missionsRes.data || []
  const notes = notesRes.data || []

  if (familyRes.error) {
    return <main style={{ padding: 32 }}>Erreur : {familyRes.error.message}</main>
  }

  if (!family) {
    return (
      <main style={{ padding: 32, fontFamily: 'Arial, sans-serif' }}>
        <h1>Famille introuvable</h1>
        <Link href="/families" style={secondaryButtonStyle}>← Retour familles</Link>
      </main>
    )
  }

  return (
    <main style={pageStyle}>
      <div style={headerStyle}>
        <div>
          <div style={eyebrowStyle}>AngelCare • Family CRM</div>
          <h1 style={titleStyle}>
            {family.family_name || family.parent_name || `Famille #${family.id}`}
          </h1>
          <p style={subtitleStyle}>
            Vue complète de la famille cliente, besoins, missions liées et relation CRM.
          </p>
        </div>
<form action={archiveFamily}>
  <input type="hidden" name="family_id" value={family.id} />
  <button type="submit" style={archiveButtonStyle}>
    Archiver
  </button>
</form>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
  <Link href="/families" style={secondaryButtonStyle}>← Retour directory</Link>
  <Link href={`/families/edit/${family.id}`} style={secondaryButtonStyle}>Modifier</Link>
</div>
      </div>

      <section style={heroCardStyle}>
        <div style={heroGridStyle}>
          <InfoCard label="ID famille" value={String(family.id)} />
          <InfoCard label="Parent principal" value={family.parent_name || 'Non défini'} />
          <InfoCard label="Téléphone" value={family.phone || 'Non défini'} />
          <InfoCard label="Téléphone secondaire" value={family.secondary_phone || 'Non défini'} />
          <InfoCard label="Ville" value={family.city || 'Non définie'} />
          <InfoCard label="Zone" value={family.zone || 'Non définie'} />
          <InfoCard label="Statut" value={family.status || 'active'} />
          <InfoCard label="Source" value={family.source || 'Non définie'} />
        </div>

        <div style={{ marginTop: 18 }}>
          <div style={smallLabelStyle}>Adresse</div>
          <div style={infoValueStyle}>{family.address || 'Non définie'}</div>
        </div>

        <div style={{ marginTop: 18 }}>
          <div style={smallLabelStyle}>Enfants / âges</div>
          <div style={infoValueStyle}>
            {family.children_count ?? 0} enfant(s) • {family.children_ages || 'Âges non définis'}
          </div>
        </div>

        <div style={{ marginTop: 18 }}>
          <div style={smallLabelStyle}>Créneaux préférés</div>
          <div style={infoValueStyle}>{family.preferred_schedule || 'Non définis'}</div>
        </div>

        <div style={{ marginTop: 18 }}>
          <div style={smallLabelStyle}>Préférences services</div>
          <div style={infoValueStyle}>{family.service_preferences || 'Non définies'}</div>
        </div>

        <div style={{ marginTop: 18 }}>
          <div style={smallLabelStyle}>Besoins spécifiques</div>
          <div style={infoValueStyle}>{family.special_needs || 'Aucun'}</div>
        </div>

        <div style={{ marginTop: 18 }}>
          <div style={smallLabelStyle}>Notes famille</div>
          <div style={infoValueStyle}>{family.notes || 'Aucune note'}</div>
        </div>
      </section>

      <div style={sectionGridStyle}>
        <section style={panelStyle}>
          <h2 style={panelTitleStyle}>Leads liés</h2>
          {leads.length > 0 ? (
            <div style={listGridStyle}>
              {leads.map((lead: any) => (
                <div key={lead.id} style={itemCardStyle}>
                  <div style={{ fontWeight: 800, color: '#0f172a' }}>
                    Lead #{lead.id} • {lead.parent_name || 'Sans nom'}
                  </div>
                  <div style={metaStyle}>
                    {lead.city || 'Ville non définie'} • {lead.phone || 'Téléphone non défini'}
                  </div>
                  <div style={metaStyle}>
                    Statut : {lead.status || 'new'} • Urgence : {lead.urgency || 'normal'}
                  </div>
                  <div style={{ marginTop: 10 }}>
                    <Link href={`/leads/${lead.id}`} style={miniButtonStyle}>
                      Voir lead
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyHint text="Aucun lead lié à cette famille." />
          )}
        </section>

        <section style={panelStyle}>
          <h2 style={panelTitleStyle}>Missions liées</h2>
          {missions.length > 0 ? (
            <div style={listGridStyle}>
              {missions.map((mission: any) => (
                <div key={mission.id} style={itemCardStyle}>
                  <div style={{ fontWeight: 800, color: '#0f172a' }}>
                    Mission #{mission.id} • {mission.service_type || 'Mission AngelCare'}
                  </div>
                  <div style={metaStyle}>
                    {mission.mission_date || 'Date non définie'} • {mission.city || 'Ville non définie'}
                  </div>
                  <div style={metaStyle}>
                    Statut : {mission.status || 'draft'} • Urgence : {mission.urgency || 'normal'}
                  </div>
                  <div style={{ marginTop: 10 }}>
                    <Link href={`/missions/${mission.id}`} style={miniButtonStyle}>
                      Voir mission
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyHint text="Aucune mission liée à cette famille." />
          )}
        </section>

        <section style={panelStyle}>
          <h2 style={panelTitleStyle}>Notes CRM famille</h2>
          {notes.length > 0 ? (
            <div style={listGridStyle}>
              {notes.map((note: any) => (
                <div key={note.id} style={itemCardStyle}>
                  <div style={{ fontWeight: 800, color: '#0f172a' }}>
                    {note.note_type || 'Note'}
                  </div>
                  <div style={metaStyle}>{note.content || '—'}</div>
                  <div style={smallMetaStyle}>
                    {note.created_by || 'Ops'} •{' '}
                    {note.created_at ? new Date(note.created_at).toLocaleString() : '—'}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyHint text="Aucune note CRM pour cette famille." />
          )}
        </section>
      </div>
    </main>
  )
}

function InfoCard({ label, value }: { label: string; value: string }) {
  return (
    <div style={infoCardStyle}>
      <div style={smallLabelStyle}>{label}</div>
      <div style={infoValueStyle}>{value}</div>
    </div>
  )
}

function EmptyHint({ text }: { text: string }) {
  return <div style={emptyHintStyle}>{text}</div>
}

const pageStyle: React.CSSProperties = {
  padding: 32,
  fontFamily: 'Arial, sans-serif',
  background: 'linear-gradient(180deg, #f8fafc 0%, #eef2f7 100%)',
  minHeight: '100vh',
}

const headerStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'flex-start',
  gap: 20,
  flexWrap: 'wrap',
  marginBottom: 24,
}

const eyebrowStyle: React.CSSProperties = {
  display: 'inline-block',
  padding: '6px 10px',
  borderRadius: 999,
  background: '#e2e8f0',
  color: '#334155',
  fontSize: 12,
  fontWeight: 800,
  marginBottom: 10,
}

const titleStyle: React.CSSProperties = {
  margin: 0,
  fontSize: 42,
  lineHeight: 1.05,
  color: '#0f172a',
  fontWeight: 800,
}

const subtitleStyle: React.CSSProperties = {
  color: '#475569',
  margin: '10px 0 0 0',
  fontSize: 18,
}

const heroCardStyle: React.CSSProperties = {
  background: 'rgba(255,255,255,0.96)',
  borderRadius: 24,
  padding: 24,
  border: '1px solid #dbe3ee',
  boxShadow: '0 16px 40px rgba(15, 23, 42, 0.07)',
  marginBottom: 20,
}

const heroGridStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
  gap: 14,
}

const sectionGridStyle: React.CSSProperties = {
  display: 'grid',
  gap: 20,
}

const panelStyle: React.CSSProperties = {
  background: 'rgba(255,255,255,0.96)',
  borderRadius: 24,
  padding: 24,
  border: '1px solid #dbe3ee',
  boxShadow: '0 16px 40px rgba(15, 23, 42, 0.06)',
}

const panelTitleStyle: React.CSSProperties = {
  margin: '0 0 16px 0',
  color: '#0f172a',
  fontSize: 24,
  fontWeight: 800,
}

const listGridStyle: React.CSSProperties = {
  display: 'grid',
  gap: 12,
}

const itemCardStyle: React.CSSProperties = {
  background: '#ffffff',
  border: '1px solid #e2e8f0',
  borderRadius: 16,
  padding: 14,
}

const infoCardStyle: React.CSSProperties = {
  background: '#fcfdff',
  border: '1px solid #e2e8f0',
  borderRadius: 14,
  padding: 14,
}

const smallLabelStyle: React.CSSProperties = {
  color: '#64748b',
  fontSize: 13,
  fontWeight: 700,
  marginBottom: 6,
}

const infoValueStyle: React.CSSProperties = {
  color: '#0f172a',
  fontSize: 15,
  fontWeight: 600,
  lineHeight: 1.5,
}

const metaStyle: React.CSSProperties = {
  color: '#475569',
  fontSize: 14,
  lineHeight: 1.6,
}

const smallMetaStyle: React.CSSProperties = {
  color: '#94a3b8',
  fontSize: 12,
  marginTop: 6,
}

const emptyHintStyle: React.CSSProperties = {
  padding: 16,
  borderRadius: 14,
  border: '1px dashed #cbd5e1',
  background: '#ffffff',
  color: '#64748b',
}

const secondaryButtonStyle: React.CSSProperties = {
  background: 'white',
  color: '#0f172a',
  padding: '12px 16px',
  borderRadius: 12,
  textDecoration: 'none',
  fontWeight: 800,
  border: '1px solid #cbd5e1',
}

const miniButtonStyle: React.CSSProperties = {
  background: '#0f172a',
  color: 'white',
  padding: '8px 12px',
  borderRadius: 10,
  textDecoration: 'none',
  fontWeight: 700,
  fontSize: 13,
}
const archiveButtonStyle: React.CSSProperties = {
  background: '#fff7ed',
  color: '#9a3412',
  padding: '12px 16px',
  borderRadius: 12,
  fontWeight: 800,
  border: '1px solid #fdba74',
  cursor: 'pointer',
}