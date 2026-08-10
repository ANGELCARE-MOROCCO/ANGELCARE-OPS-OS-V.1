'use client'

import type { ChangeEvent } from 'react'
import styles from './Angelcare360OperatorExperience.module.css'

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
  const commonProps = {
    value,
    disabled,
    'aria-required': field.required || undefined,
    'aria-label': field.label,
  }

  return (
    <label className={styles.field}>
      <span className={styles.fieldLabelRow}>
        <span className={styles.fieldLabel}>
          {field.label}
          {field.required ? <span className={styles.fieldRequired}>*</span> : null}
        </span>
        <span className={styles.fieldKind}>{getKindLabel(field.kind)}</span>
      </span>
      {field.kind === 'textarea' ? (
        <textarea
          {...commonProps}
          onChange={(event: ChangeEvent<HTMLTextAreaElement>) => onChange(field.name, event.target.value)}
          placeholder={field.placeholder}
          rows={field.rows || 4}
          className={styles.fieldInput}
        />
      ) : field.kind === 'select' ? (
        <select
          {...commonProps}
          onChange={(event: ChangeEvent<HTMLSelectElement>) => onChange(field.name, event.target.value)}
          className={styles.fieldInput}
        >
          <option value="">{field.placeholder || 'Sélectionner une valeur'}</option>
          {(field.options || []).map((option) => (
            <option key={option.value} value={option.value} disabled={option.disabled}>
              {option.label}
            </option>
          ))}
        </select>
      ) : field.kind === 'readonly' ? (
        <div className={styles.readonly}>{value || field.placeholder || '—'}</div>
      ) : (
        <input
          {...commonProps}
          type={field.kind}
          onChange={(event: ChangeEvent<HTMLInputElement>) => onChange(field.name, event.target.value)}
          placeholder={field.placeholder}
          className={styles.fieldInput}
        />
      )}
      {field.help ? <span className={styles.fieldHelp}>{field.help}</span> : null}
    </label>
  )
}

function getKindLabel(kind: Angelcare360OperatorFormFieldConfig['kind']) {
  switch (kind) {
    case 'text': return 'Texte'
    case 'textarea': return 'Note structurée'
    case 'number': return 'Valeur'
    case 'date': return 'Échéance'
    case 'select': return 'Sélection'
    case 'readonly': return 'Lecture'
    default: return 'Champ'
  }
}
