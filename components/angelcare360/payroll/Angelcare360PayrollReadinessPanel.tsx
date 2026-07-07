import type { Angelcare360PayrollReadinessRecord } from '@/types/angelcare360/payroll'

type Angelcare360PayrollReadinessPanelProps = {
  readiness: Angelcare360PayrollReadinessRecord
}

export default function Angelcare360PayrollReadinessPanel({ readiness }: Angelcare360PayrollReadinessPanelProps) {
  const chips = [
    { label: 'Période sélectionnée', value: readiness.periodSelected ? 'Oui' : 'Non' },
    { label: 'Personnel sélectionné', value: readiness.staffSelected ? 'Oui' : 'Non' },
    { label: 'Salaire de base', value: readiness.baseSalaryReady ? 'Prêt' : 'Incomplet' },
    { label: 'Formule exploitable', value: readiness.formulaReady ? 'Oui' : 'Non' },
    { label: 'Calcul possible', value: readiness.canCalculate ? 'Oui' : 'Verrouillé' },
  ]

  return (
    <section style={panelStyle}>
      <div style={headerStyle}>
        <div style={eyebrowStyle}>Calcul / préparation</div>
        <h3 style={titleStyle}>Vérification de la paie</h3>
      </div>

      <div style={gridStyle}>
        {chips.map((chip) => (
          <article key={chip.label} style={chipStyle}>
            <div style={chipLabelStyle}>{chip.label}</div>
            <div style={chipValueStyle}>{chip.value}</div>
          </article>
        ))}
      </div>

      <div style={messageStyle}>
        {readiness.reason || 'Le calcul final de la paie sera activé après validation des règles de rémunération de l’établissement.'}
      </div>
    </section>
  )
}

const panelStyle: React.CSSProperties = {
  display: 'grid',
  gap: 14,
  padding: 18,
  borderRadius: 24,
  border: '1px solid #e2e8f0',
  background: '#fff',
  boxShadow: '0 18px 54px rgba(15,23,42,.05)',
}

const headerStyle: React.CSSProperties = {
  display: 'grid',
  gap: 6,
}

const eyebrowStyle: React.CSSProperties = {
  color: '#d97706',
  textTransform: 'uppercase',
  letterSpacing: 1.1,
  fontSize: 12,
  fontWeight: 900,
}

const titleStyle: React.CSSProperties = {
  margin: 0,
  color: '#0f172a',
  fontSize: 18,
  fontWeight: 950,
}

const gridStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
  gap: 10,
}

const chipStyle: React.CSSProperties = {
  display: 'grid',
  gap: 6,
  padding: 14,
  borderRadius: 18,
  background: '#fffbeb',
  border: '1px solid #fde68a',
}

const chipLabelStyle: React.CSSProperties = {
  color: '#92400e',
  fontSize: 12,
  textTransform: 'uppercase',
  letterSpacing: 0.7,
  fontWeight: 900,
}

const chipValueStyle: React.CSSProperties = {
  color: '#78350f',
  fontWeight: 800,
}

const messageStyle: React.CSSProperties = {
  padding: 14,
  borderRadius: 16,
  background: '#fff7ed',
  color: '#92400e',
  lineHeight: 1.65,
  fontWeight: 600,
}
