import { ANGELCARE360_OPERATOR_COLORS } from './Angelcare360OperatorVisualSystem'

type Props = {
  title: string
  message: string
  note?: string
}

export default function Angelcare360OperatorLockedPanel({ title, message, note }: Props) {
  return (
    <section style={cardStyle}>
      <div style={eyebrowStyle}>Fonction verrouillée</div>
      <div style={titleStyle}>{title}</div>
      <p style={messageStyle}>{message}</p>
      {note ? <p style={noteStyle}>{note}</p> : null}
    </section>
  )
}

const cardStyle: React.CSSProperties = {
  borderRadius: 22,
  borderWidth: 1,
  borderStyle: 'solid',
  borderColor: ANGELCARE360_OPERATOR_COLORS.amberBorder,
  background:
    'linear-gradient(180deg, rgba(255,247,237,.99) 0%, rgba(255,251,245,.98) 100%)',
  padding: 16,
  display: 'grid',
  gap: 8,
  boxShadow: '0 16px 42px rgba(15,23,42,.04)',
}

const eyebrowStyle: React.CSSProperties = {
  color: ANGELCARE360_OPERATOR_COLORS.amber,
  textTransform: 'uppercase',
  letterSpacing: 1,
  fontSize: 11,
  fontWeight: 900,
}

const titleStyle: React.CSSProperties = {
  color: ANGELCARE360_OPERATOR_COLORS.amber,
  fontWeight: 950,
  fontSize: 15,
}

const messageStyle: React.CSSProperties = {
  margin: 0,
  color: ANGELCARE360_OPERATOR_COLORS.amber,
  lineHeight: 1.6,
  fontWeight: 650,
}

const noteStyle: React.CSSProperties = {
  margin: 0,
  color: ANGELCARE360_OPERATOR_COLORS.slateMuted,
  lineHeight: 1.6,
  fontWeight: 600,
}
