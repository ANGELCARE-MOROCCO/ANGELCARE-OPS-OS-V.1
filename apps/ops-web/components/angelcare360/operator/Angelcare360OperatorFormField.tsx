'use client'

import { ANGELCARE360_OPERATOR_COLORS, operatorInputStyle } from './Angelcare360OperatorVisualSystem'

export type Angelcare360OperatorFormFieldOption = {
  label: string
  value: string
  disabled?: boolean
}

export type Angelcare360OperatorFormFieldConfig = {
  name: string
  label: string
  kind: 'text' | 'textarea' | 'number' | 'date' | 'select' | 'readonly'
  placeholder?: string
  help?: string
  required?: boolean
  rows?: number
  defaultValue?: string
  options?: Angelcare360OperatorFormFieldOption[]
}

type Props = {
  field: Angelcare360OperatorFormFieldConfig
  value: string
  onChange: (name: string, value: string) => void
  disabled?: boolean
}

export default function Angelcare360OperatorFormField({ field, value, onChange, disabled }: Props) {
  return (
    <label style={fieldWrapStyle}>
      <span style={labelRowStyle}>
        <span style={labelStyle}>
          {field.label}
          {field.required ? <span style={requiredStyle}>*</span> : null}
        </span>
        <span style={kindStyle}>{getKindLabel(field.kind)}</span>
      </span>
      {field.kind === 'textarea' ? (
        <textarea
          value={value}
          onChange={(event) => onChange(field.name, event.target.value)}
          placeholder={field.placeholder}
          rows={field.rows || 4}
          disabled={disabled}
          style={{ ...inputStyle, minHeight: (field.rows || 4) * 22 }}
        />
      ) : field.kind === 'select' ? (
        <select
          value={value}
          onChange={(event) => onChange(field.name, event.target.value)}
          disabled={disabled}
          style={inputStyle}
        >
          <option value="">{field.placeholder || 'Sélectionner une valeur'}</option>
          {(field.options || []).map((option) => (
            <option key={option.value} value={option.value} disabled={option.disabled}>
              {option.label}
            </option>
          ))}
        </select>
      ) : field.kind === 'readonly' ? (
        <div style={readonlyStyle}>{value || field.placeholder || '—'}</div>
      ) : (
        <input
          type={field.kind}
          value={value}
          onChange={(event) => onChange(field.name, event.target.value)}
          placeholder={field.placeholder}
          disabled={disabled}
          style={inputStyle}
        />
      )}
      {field.help ? <span style={helpStyle}>{field.help}</span> : null}
    </label>
  )
}

const fieldWrapStyle: React.CSSProperties = {
  display: 'grid',
  gap: 8,
  padding: 14,
  borderRadius: 20,
  border: `1px solid ${ANGELCARE360_OPERATOR_COLORS.borderSoft}`,
  background: ANGELCARE360_OPERATOR_COLORS.background,
}

const labelRowStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  gap: 8,
  alignItems: 'center',
}

const labelStyle: React.CSSProperties = {
  color: ANGELCARE360_OPERATOR_COLORS.navy,
  fontWeight: 900,
  fontSize: 13,
}

const requiredStyle: React.CSSProperties = {
  marginLeft: 6,
  color: ANGELCARE360_OPERATOR_COLORS.red,
}

const kindStyle: React.CSSProperties = {
  borderRadius: 999,
  padding: '4px 8px',
  background: ANGELCARE360_OPERATOR_COLORS.white,
  border: `1px solid ${ANGELCARE360_OPERATOR_COLORS.borderSoft}`,
  color: ANGELCARE360_OPERATOR_COLORS.slateMuted,
  fontSize: 11,
  fontWeight: 800,
  textTransform: 'uppercase',
  letterSpacing: 0.6,
}

const helpStyle: React.CSSProperties = {
  color: ANGELCARE360_OPERATOR_COLORS.slate,
  fontSize: 12,
  lineHeight: 1.5,
  fontWeight: 600,
}

const readonlyStyle: React.CSSProperties = {
  borderRadius: 14,
  borderWidth: 1,
  borderStyle: 'solid',
  borderColor: ANGELCARE360_OPERATOR_COLORS.border,
  background: ANGELCARE360_OPERATOR_COLORS.white,
  padding: '11px 13px',
  color: ANGELCARE360_OPERATOR_COLORS.navy,
  fontWeight: 700,
  minHeight: 44,
  display: 'flex',
  alignItems: 'center',
}

const inputStyle: React.CSSProperties = {
  ...operatorInputStyle,
  minHeight: 44,
}

function getKindLabel(kind: Angelcare360OperatorFormFieldConfig['kind']) {
  switch (kind) {
    case 'text':
      return 'Texte'
    case 'textarea':
      return 'Texte long'
    case 'number':
      return 'Nombre'
    case 'date':
      return 'Date'
    case 'select':
      return 'Choix'
    case 'readonly':
      return 'Lecture'
    default:
      return 'Champ'
  }
}
