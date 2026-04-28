import { createClient } from '@/lib/supabase/server'

export default async function MissionPrintPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const missionId = Number(id)
  const supabase = await createClient()

  const [
    missionRes,
    routesRes,
    parametersRes,
    parameterDaysRes,
    transportRes,
    allowancesRes,
    programLinesRes,
  ] = await Promise.all([
    supabase.from('missions').select('*').eq('id', missionId).maybeSingle(),
    supabase.from('mission_routes').select('*').eq('mission_id', missionId).order('line_order', { ascending: true }),
    supabase.from('mission_parameters').select('*').eq('mission_id', missionId).maybeSingle(),
    supabase.from('mission_parameter_days').select('*').eq('mission_id', missionId).order('line_order', { ascending: true }),
    supabase.from('mission_transport').select('*').eq('mission_id', missionId).maybeSingle(),
    supabase.from('mission_allowances').select('*').eq('mission_id', missionId).maybeSingle(),
    supabase.from('mission_program_lines').select('*').eq('mission_id', missionId).order('line_order', { ascending: true }),
  ])

  const mission = missionRes.data
  const routes = routesRes.data || []
  const parameters = parametersRes.data
  const parameterDays = parameterDaysRes.data || []
  const transport = transportRes.data
  const allowances = allowancesRes.data
  const programLines = programLinesRes.data || []

  if (!mission) {
    return <main style={{ padding: 32 }}>Mission introuvable</main>
  }

  return (
    <main style={pageStyle}>
      <div style={printTopBarStyle}>
  <div style={printHintStyle}>
    Utilise Cmd + P pour imprimer ou enregistrer en PDF
  </div>
</div>

      <section style={sheetStyle}>
        <div style={headerStyle}>
  <div>
    <div style={brandStyle}>AngelCare</div>
    <div style={subtitleStyle}>Operations Document</div>
  </div>

  <div style={docMetaStyle}>
    <div><strong>ID Mission :</strong> {mission.id}</div>
    <div><strong>Date :</strong> {new Date().toLocaleDateString()}</div>
  </div>
</div>

<h1 style={docTitleStyle}>ORDRE DE MISSION</h1>

        <SectionTitle>1 - Missionnaire</SectionTitle>
        <div style={grid2Style}>
          <PrintLine label="Nom / prénom" value={mission.notes || '.................................'} />
          <PrintLine label="STAFF ID" value={mission.staff_id || '000*'} />
          <PrintLine label="Grade Level" value={mission.grade_level || '00*'} />
          <PrintLine label="Statut" value={mission.staff_status || 'ACTIVE*'} />
          <PrintLine label="Adresse personnelle" value={mission.personal_address || ''} />
          <PrintLine label="Téléphone / Mobile" value={mission.mobile || ''} />
          <PrintLine label="Adresse domicile" value={mission.home_address || ''} />
        </div>

        <SectionTitle>2 - Circuit de la mission</SectionTitle>
        <table style={tableStyle}>
          <thead>
            <tr>
              <th style={thStyle}>Opération</th>
              <th style={thStyle}>Date</th>
              <th style={thStyle}>Aller départ</th>
              <th style={thStyle}>Aller arrivée</th>
              <th style={thStyle}>Retour départ</th>
              <th style={thStyle}>Retour arrivée</th>
            </tr>
          </thead>
          <tbody>
            {routes.length > 0 ? (
              routes.map((route: any, index: number) => (
                <tr key={route.id || index}>
                  <td style={tdStyle}>{route.operation_label || `SESSION ${index + 1}`}</td>
                  <td style={tdStyle}>{route.mission_date || ''}</td>
                  <td style={tdStyle}>{route.outbound_departure || ''}</td>
                  <td style={tdStyle}>{route.outbound_arrival || ''}</td>
                  <td style={tdStyle}>{route.return_departure || ''}</td>
                  <td style={tdStyle}>{route.return_arrival || ''}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td style={tdStyle} colSpan={6}>Aucune ligne renseignée</td>
              </tr>
            )}
          </tbody>
        </table>

        <SectionTitle>3 - Objet de la mission</SectionTitle>
        <div style={grid2Style}>
          <PrintLine label="Motif mission" value={parameters?.mission_reason || ''} />
          <PrintLine label="N° dossier" value={parameters?.dossier_number || ''} />
          <PrintLine label="Type client" value={parameters?.client_type || ''} />
          <PrintLine label="Désignation" value={parameters?.designation || ''} />
          <PrintLine label="Adresse" value={parameters?.client_address || ''} />
          <PrintLine label="Ville" value={parameters?.client_city || ''} />
          <PrintLine label="Nom client" value={parameters?.client_name || ''} />
          <PrintLine label="Profil client" value={parameters?.client_profile || ''} />
        </div>

        <SectionTitle>Paramètre</SectionTitle>
        <div style={grid2Style}>
          <PrintLine label="Forfait" value={parameters?.forfait || ''} />
          <PrintLine label="Option horaire" value={parameters?.hourly_option || ''} />
          <PrintLine label="Type service" value={parameters?.type_service || ''} />
          <PrintLine label="Nombre enfant" value={parameters?.children_range || ''} />
          <PrintLine label="Profil participant(s)" value={parameters?.participant_profile || ''} />
        </div>

        <table style={{ ...tableStyle, marginTop: 12 }}>
          <thead>
            <tr>
              <th style={thStyle}>Date</th>
              <th style={thStyle}>Heure</th>
              <th style={thStyle}>Module / thème</th>
            </tr>
          </thead>
          <tbody>
            {parameterDays.length > 0 ? (
              parameterDays.map((item: any, index: number) => (
                <tr key={item.id || index}>
                  <td style={tdStyle}>{item.session_date || ''}</td>
                  <td style={tdStyle}>{item.session_time || ''}</td>
                  <td style={tdStyle}>{item.module_theme || ''}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td style={tdStyle} colSpan={3}>Aucune ligne paramétrée</td>
              </tr>
            )}
          </tbody>
        </table>

        <SectionTitle>4 - Moyen de transport</SectionTitle>
        <div style={grid2Style}>
          <PrintLine label="Transport assuré par" value={transport?.transport_by || ''} />
          <PrintLine label="Train" value={transport?.train ? 'Oui' : 'Non'} />
          <PrintLine label="Avion" value={transport?.airplane ? 'Oui' : 'Non'} />
          <PrintLine label="Taxi" value={transport?.taxi ? 'Oui' : 'Non'} />
          <PrintLine label="Chauffeur privé" value={transport?.private_driver ? 'Oui' : 'Non'} />
          <PrintLine label="Bus" value={transport?.bus ? 'Oui' : 'Non'} />
          <PrintLine label="Infos taxi" value={transport?.taxi_info || ''} />
          <PrintLine label="Infos train" value={transport?.train_info || ''} />
          <PrintLine label="Billet à commander" value={transport?.ticket_to_order ? 'Oui' : 'Non'} />
          <PrintLine label="Billet à rembourser" value={transport?.ticket_to_reimburse ? 'Oui' : 'Non'} />
        </div>

        <SectionTitle>5 - Indemnités de mission</SectionTitle>
        <div style={grid2Style}>
          <PrintLine label="Collect directe" value={allowances?.direct_collection ? 'Oui' : 'Non'} />
          <PrintLine label="Collect mensuelle" value={allowances?.monthly_collection ? 'Oui' : 'Non'} />
          <PrintLine label="Honoraires par heure" value={allowances?.hourly_fee ? 'Oui' : 'Non'} />
          <PrintLine label="Par mission" value={allowances?.per_mission ? 'Oui' : 'Non'} />
          <PrintLine label="Grade / honoraire" value={allowances?.grade_fee || ''} />
          <PrintLine label="Indemnités repas" value={allowances?.meal_allowance ? 'Oui' : 'Non'} />
          <PrintLine label="Hébergement remboursé" value={allowances?.lodging_reimbursed ? 'Oui' : 'Non'} />
          <PrintLine label="Hébergement non remboursé" value={allowances?.lodging_not_reimbursed ? 'Oui' : 'Non'} />
          <PrintLine label="Notes manuelles" value={allowances?.manual_notes || ''} />
        </div>

        <SectionTitle>6 - Contenu du programme</SectionTitle>
        <table style={tableStyle}>
          <thead>
            <tr>
              <th style={thStyle}>Session</th>
              <th style={thStyle}>Date / Heure</th>
              <th style={thStyle}>Thème / Module</th>
              <th style={thStyle}>C.T</th>
              <th style={thStyle}>M1</th>
              <th style={thStyle}>M2</th>
              <th style={thStyle}>M3</th>
              <th style={thStyle}>S.Break</th>
              <th style={thStyle}>M.Break</th>
              <th style={thStyle}>Code</th>
            </tr>
          </thead>
          <tbody>
            {programLines.length > 0 ? (
              programLines.map((line: any, index: number) => (
                <tr key={line.id || index}>
                  <td style={tdStyle}>{line.session_label || ''}</td>
                  <td style={tdStyle}>{line.session_datetime_label || ''}</td>
                  <td style={tdStyle}>{line.theme_module || ''}</td>
                  <td style={tdStyle}>{line.ct_label || ''}</td>
                  <td style={tdStyle}>{line.m1 || ''}</td>
                  <td style={tdStyle}>{line.m2 || ''}</td>
                  <td style={tdStyle}>{line.m3 || ''}</td>
                  <td style={tdStyle}>{line.short_break || ''}</td>
                  <td style={tdStyle}>{line.meal_break || ''}</td>
                  <td style={tdStyle}>{line.code_atelier || ''}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td style={tdStyle} colSpan={10}>Aucune ligne de programme</td>
              </tr>
            )}
          </tbody>
        </table>

        <div style={signatureWrapStyle}>
          <div style={signatureBoxStyle}>
            <div style={signatureLineStyle} />
            <div>Responsable mission</div>
          </div>
          <div style={signatureBoxStyle}>
            <div style={signatureLineStyle} />
            <div>Responsable composante</div>
          </div>
          <div style={signatureBoxStyle}>
            <div style={signatureLineStyle} />
            <div>Missionnaire</div>
          </div>
        </div>
      </section>
    </main>
  )
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h2 style={sectionTitleStyle}>{children}</h2>
}

function PrintLine({ label, value }: { label: string; value: string }) {
  return (
    <div style={printLineStyle}>
      <strong>{label} :</strong> <span>{value || ' '}</span>
    </div>
  )
}

const pageStyle: React.CSSProperties = {
  background: '#ffffff',
  minHeight: '100vh',
  padding: 20,
}

const printTopBarStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'flex-end',
  marginBottom: 16,
}

const printButtonStyle: React.CSSProperties = {
  background: '#0f172a',
  color: 'white',
  border: 'none',
  borderRadius: 10,
  padding: '12px 16px',
  fontWeight: 700,
  cursor: 'pointer',
}

const sheetStyle: React.CSSProperties = {
  width: '210mm',
  minHeight: '297mm',
  margin: '0 auto',
  background: 'white',
  padding: '16mm',
  boxShadow: '0 10px 30px rgba(0,0,0,0.12)',
  color: '#000',
}

const docTitleStyle: React.CSSProperties = {
  textAlign: 'center',
  marginTop: 0,
  marginBottom: 18,
  fontSize: 26,
  letterSpacing: 1,
}

const sectionTitleStyle: React.CSSProperties = {
  marginTop: 24,
  marginBottom: 12,
  fontSize: 16,
  fontWeight: 800,
  borderBottom: '2px solid #000',
  paddingBottom: 4,
}

const grid2Style: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '1fr 1fr',
  gap: 10,
}

const printLineStyle: React.CSSProperties = {
  fontSize: 13,
  lineHeight: 1.6,
}

const tableStyle: React.CSSProperties = {
  width: '100%',
  borderCollapse: 'collapse',
  marginTop: 8,
  fontSize: 12,
}

const thStyle: React.CSSProperties = {
  border: '1px solid #000',
  padding: 8,
  textAlign: 'left',
  background: '#f1f5f9',
  fontWeight: 700,
}

const tdStyle: React.CSSProperties = {
  border: '1px solid #000',
  padding: 8,
  verticalAlign: 'top',
}

const signatureWrapStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '1fr 1fr 1fr',
  gap: 24,
  marginTop: 36,
}

const signatureBoxStyle: React.CSSProperties = {
  textAlign: 'center',
  fontSize: 13,
}

const signatureLineStyle: React.CSSProperties = {
  borderTop: '1px solid #000',
  marginBottom: 8,
  paddingTop: 8,
}

const printHintStyle: React.CSSProperties = {
  background: '#0f172a',
  color: 'white',
  borderRadius: 10,
  padding: '12px 16px',
  fontWeight: 700,
  fontSize: 14,
}

const headerStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: 20,
  borderBottom: '2px solid #000',
  paddingBottom: 10,
}

const brandStyle: React.CSSProperties = {
  fontSize: 22,
  fontWeight: 900,
  letterSpacing: 1,
}

const subtitleStyle: React.CSSProperties = {
  fontSize: 12,
  color: '#555',
}

const docMetaStyle: React.CSSProperties = {
  fontSize: 12,
  textAlign: 'right',
}