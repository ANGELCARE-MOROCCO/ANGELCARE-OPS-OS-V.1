'use client'

import { useMemo, useState } from 'react'

type RouteLine = {
  operation_label: string
  mission_date: string
  outbound_departure: string
  outbound_arrival: string
  return_departure: string
  return_arrival: string
}

type ParameterDayLine = {
  session_date: string
  session_time: string
  module_theme: string
}

type ProgramLine = {
  session_label: string
  session_datetime_label: string
  theme_module: string
  ct_label: string
  m1: string
  m2: string
  m3: string
  short_break: string
  meal_break: string
  code_atelier: string
  notes: string
}

function emptyRoute(): RouteLine {
  return {
    operation_label: '',
    mission_date: '',
    outbound_departure: '',
    outbound_arrival: '',
    return_departure: '',
    return_arrival: '',
  }
}

function emptyParameterDay(): ParameterDayLine {
  return {
    session_date: '',
    session_time: '',
    module_theme: '',
  }
}

function emptyProgramLine(): ProgramLine {
  return {
    session_label: '',
    session_datetime_label: '',
    theme_module: '',
    ct_label: '',
    m1: '',
    m2: '',
    m3: '',
    short_break: '',
    meal_break: '',
    code_atelier: '',
    notes: '',
  }
}

export default function MissionBuilderClient({
  initialRoutes,
  initialParameterDays,
  initialProgramLines,
}: {
  initialRoutes: RouteLine[]
  initialParameterDays: ParameterDayLine[]
  initialProgramLines: ProgramLine[]
}) {
  const [routes, setRoutes] = useState<RouteLine[]>(
    initialRoutes.length > 0 ? initialRoutes : [emptyRoute()]
  )
  const [parameterDays, setParameterDays] = useState<ParameterDayLine[]>(
    initialParameterDays.length > 0 ? initialParameterDays : [emptyParameterDay()]
  )
  const [programLines, setProgramLines] = useState<ProgramLine[]>(
    initialProgramLines.length > 0 ? initialProgramLines : [emptyProgramLine()]
  )

  const routesJson = useMemo(() => JSON.stringify(routes), [routes])
  const parameterDaysJson = useMemo(() => JSON.stringify(parameterDays), [parameterDays])
  const programLinesJson = useMemo(() => JSON.stringify(programLines), [programLines])

  return (
    <>
      <section style={panelStyle}>
        <h2 style={panelTitleStyle}>2. Circuit de la mission</h2>

        <input type="hidden" name="routes_json" value={routesJson} />

        <div style={{ display: 'grid', gap: 12 }}>
          {routes.map((item, index) => (
            <div key={index} style={rowCardStyle}>
              <div style={rowHeaderStyle}>
                <div style={rowTitleStyle}>Ligne circuit {index + 1}</div>
                <button
                  type="button"
                  onClick={() =>
                    setRoutes((prev) => prev.length > 1 ? prev.filter((_, i) => i !== index) : prev)
                  }
                  style={dangerGhostButtonStyle}
                >
                  Supprimer
                </button>
              </div>

              <div style={threeColGridStyle}>
                <Field
                  label="Opération"
                  value={item.operation_label}
                  onChange={(value) => updateRoute(setRoutes, index, 'operation_label', value)}
                />
                <Field
                  label="Date"
                  value={item.mission_date}
                  onChange={(value) => updateRoute(setRoutes, index, 'mission_date', value)}
                  type="date"
                />
                <Field
                  label="Aller départ"
                  value={item.outbound_departure}
                  onChange={(value) => updateRoute(setRoutes, index, 'outbound_departure', value)}
                />
                <Field
                  label="Aller arrivée"
                  value={item.outbound_arrival}
                  onChange={(value) => updateRoute(setRoutes, index, 'outbound_arrival', value)}
                />
                <Field
                  label="Retour départ"
                  value={item.return_departure}
                  onChange={(value) => updateRoute(setRoutes, index, 'return_departure', value)}
                />
                <Field
                  label="Retour arrivée"
                  value={item.return_arrival}
                  onChange={(value) => updateRoute(setRoutes, index, 'return_arrival', value)}
                />
              </div>
            </div>
          ))}
        </div>

        <div style={sectionActionBarStyle}>
          <button
            type="button"
            onClick={() => setRoutes((prev) => [...prev, emptyRoute()])}
            style={secondaryButtonStyle}
          >
            + Ajouter ligne circuit
          </button>
        </div>
      </section>

      <section style={panelStyle}>
        <h2 style={panelTitleStyle}>Calendrier / modules paramétrés</h2>

        <input type="hidden" name="parameter_days_json" value={parameterDaysJson} />

        <div style={{ display: 'grid', gap: 12 }}>
          {parameterDays.map((item, index) => (
            <div key={index} style={rowCardStyle}>
              <div style={rowHeaderStyle}>
                <div style={rowTitleStyle}>Paramètre {index + 1}</div>
                <button
                  type="button"
                  onClick={() =>
                    setParameterDays((prev) => prev.length > 1 ? prev.filter((_, i) => i !== index) : prev)
                  }
                  style={dangerGhostButtonStyle}
                >
                  Supprimer
                </button>
              </div>

              <div style={threeColGridStyle}>
                <Field
                  label="Date"
                  value={item.session_date}
                  onChange={(value) => updateParameterDay(setParameterDays, index, 'session_date', value)}
                />
                <Field
                  label="Heure"
                  value={item.session_time}
                  onChange={(value) => updateParameterDay(setParameterDays, index, 'session_time', value)}
                />
                <Field
                  label="Module / thème"
                  value={item.module_theme}
                  onChange={(value) => updateParameterDay(setParameterDays, index, 'module_theme', value)}
                />
              </div>
            </div>
          ))}
        </div>

        <div style={sectionActionBarStyle}>
          <button
            type="button"
            onClick={() => setParameterDays((prev) => [...prev, emptyParameterDay()])}
            style={secondaryButtonStyle}
          >
            + Ajouter ligne paramètre
          </button>
        </div>
      </section>

      <section style={panelStyle}>
        <h2 style={panelTitleStyle}>6. Contenu du programme</h2>

        <input type="hidden" name="program_lines_json" value={programLinesJson} />

        <div style={{ display: 'grid', gap: 12 }}>
          {programLines.map((item, index) => (
            <div key={index} style={rowCardStyle}>
              <div style={rowHeaderStyle}>
                <div style={rowTitleStyle}>Programme {index + 1}</div>
                <button
                  type="button"
                  onClick={() =>
                    setProgramLines((prev) => prev.length > 1 ? prev.filter((_, i) => i !== index) : prev)
                  }
                  style={dangerGhostButtonStyle}
                >
                  Supprimer
                </button>
              </div>

              <div style={threeColGridStyle}>
                <Field
                  label="Session"
                  value={item.session_label}
                  onChange={(value) => updateProgramLine(setProgramLines, index, 'session_label', value)}
                />
                <Field
                  label="Date / heure"
                  value={item.session_datetime_label}
                  onChange={(value) => updateProgramLine(setProgramLines, index, 'session_datetime_label', value)}
                />
                <Field
                  label="Thème / module"
                  value={item.theme_module}
                  onChange={(value) => updateProgramLine(setProgramLines, index, 'theme_module', value)}
                />
                <Field
                  label="C.T"
                  value={item.ct_label}
                  onChange={(value) => updateProgramLine(setProgramLines, index, 'ct_label', value)}
                />
                <Field
                  label="M1"
                  value={item.m1}
                  onChange={(value) => updateProgramLine(setProgramLines, index, 'm1', value)}
                />
                <Field
                  label="M2"
                  value={item.m2}
                  onChange={(value) => updateProgramLine(setProgramLines, index, 'm2', value)}
                />
                <Field
                  label="M3"
                  value={item.m3}
                  onChange={(value) => updateProgramLine(setProgramLines, index, 'm3', value)}
                />
                <Field
                  label="Short break"
                  value={item.short_break}
                  onChange={(value) => updateProgramLine(setProgramLines, index, 'short_break', value)}
                />
                <Field
                  label="Meal break"
                  value={item.meal_break}
                  onChange={(value) => updateProgramLine(setProgramLines, index, 'meal_break', value)}
                />
                <Field
                  label="Code atelier"
                  value={item.code_atelier}
                  onChange={(value) => updateProgramLine(setProgramLines, index, 'code_atelier', value)}
                />
                <TextAreaField
                  label="Notes"
                  value={item.notes}
                  onChange={(value) => updateProgramLine(setProgramLines, index, 'notes', value)}
                />
              </div>
            </div>
          ))}
        </div>

        <div style={sectionActionBarStyle}>
          <button
            type="button"
            onClick={() => setProgramLines((prev) => [...prev, emptyProgramLine()])}
            style={secondaryButtonStyle}
          >
            + Ajouter ligne programme
          </button>
        </div>
      </section>
    </>
  )
}

function updateRoute(
  setState: React.Dispatch<React.SetStateAction<RouteLine[]>>,
  index: number,
  key: keyof RouteLine,
  value: string
) {
  setState((prev) => prev.map((item, i) => (i === index ? { ...item, [key]: value } : item)))
}

function updateParameterDay(
  setState: React.Dispatch<React.SetStateAction<ParameterDayLine[]>>,
  index: number,
  key: keyof ParameterDayLine,
  value: string
) {
  setState((prev) => prev.map((item, i) => (i === index ? { ...item, [key]: value } : item)))
}

function updateProgramLine(
  setState: React.Dispatch<React.SetStateAction<ProgramLine[]>>,
  index: number,
  key: keyof ProgramLine,
  value: string
) {
  setState((prev) => prev.map((item, i) => (i === index ? { ...item, [key]: value } : item)))
}

function Field({
  label,
  value,
  onChange,
  type = 'text',
}: {
  label: string
  value: string
  onChange: (value: string) => void
  type?: string
}) {
  return (
    <label style={fieldWrapStyle}>
      <span style={fieldLabelStyle}>{label}</span>
      <input value={value} onChange={(e) => onChange(e.target.value)} type={type} style={inputStyle} />
    </label>
  )
}

function TextAreaField({
  label,
  value,
  onChange,
}: {
  label: string
  value: string
  onChange: (value: string) => void
}) {
  return (
    <label style={fieldWrapStyle}>
      <span style={fieldLabelStyle}>{label}</span>
      <textarea value={value} onChange={(e) => onChange(e.target.value)} style={textAreaStyle} />
    </label>
  )
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

const rowCardStyle: React.CSSProperties = {
  background: '#ffffff',
  border: '1px solid #e2e8f0',
  borderRadius: 16,
  padding: 14,
}

const rowHeaderStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  gap: 12,
  marginBottom: 10,
}

const rowTitleStyle: React.CSSProperties = {
  color: '#0f172a',
  fontWeight: 800,
}

const threeColGridStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '1fr 1fr 1fr',
  gap: 14,
}

const fieldWrapStyle: React.CSSProperties = {
  display: 'grid',
  gap: 8,
}

const fieldLabelStyle: React.CSSProperties = {
  color: '#475569',
  fontSize: 13,
  fontWeight: 700,
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '12px 14px',
  borderRadius: 12,
  border: '1px solid #cbd5e1',
  fontSize: 14,
  boxSizing: 'border-box',
  background: 'white',
  color: '#0f172a',
}

const textAreaStyle: React.CSSProperties = {
  ...inputStyle,
  minHeight: 110,
  resize: 'vertical',
}

const sectionActionBarStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'flex-end',
  marginTop: 14,
}

const secondaryButtonStyle: React.CSSProperties = {
  background: 'white',
  color: '#0f172a',
  padding: '12px 16px',
  borderRadius: 12,
  fontWeight: 800,
  border: '1px solid #cbd5e1',
  cursor: 'pointer',
}

const dangerGhostButtonStyle: React.CSSProperties = {
  background: '#fff7f7',
  color: '#991b1b',
  border: '1px solid #fecaca',
  borderRadius: 10,
  padding: '8px 12px',
  fontWeight: 700,
  cursor: 'pointer',
}