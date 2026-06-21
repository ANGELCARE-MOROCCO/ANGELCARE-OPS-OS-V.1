'use client'

import { useMemo, useState, type CSSProperties } from 'react'

const defaultTrainingOptions = [
  'Childcare essentials',
  'Montessori basics',
  'First aid',
  'Parent communication',
  'Home service standards',
  'Safety & security',
]

const defaultLanguageOptions = [
  'Arabic',
  'Darija',
  'French',
  'English',
  'Spanish',
  'Amazigh',
]

const defaultSkillOptions = [
  'Meal support',
  'Homework support',
  'Toddler care',
  'Newborn support',
  'Kids animation',
  'Special needs support',
  'Event supervision',
  'School pickup',
]

const documentTypes = [
  'CV / Resume',
  'CIN / Identity',
  'Certificate',
  'Training proof',
  'Reference letter',
  'Interview report',
  'Contract / Offer',
  'Portfolio / Photos',
  'Other attachment',
]

type DynamicListProps = {
  title: string
  name: string
  options: string[]
  placeholder: string
  accent: string
  icon: string
  intro: string
}

type AttachmentRow = {
  type: string
  label: string
  url: string
}

function uid() {
  return Math.random().toString(36).slice(2, 10)
}

function DynamicList({
  title,
  name,
  options,
  placeholder,
  accent,
  icon,
  intro,
}: DynamicListProps) {
  const [items, setItems] = useState<Array<{ id: string; value: string }>>([])
  const [draft, setDraft] = useState('')

  const remainingOptions = useMemo(() => {
    const used = new Set(items.map((item) => item.value.toLowerCase()))
    return options.filter((option) => !used.has(option.toLowerCase()))
  }, [items, options])

  function addValue(value: string) {
    const clean = value.trim()
    if (!clean) return

    setItems((current) => {
      if (current.some((item) => item.value.toLowerCase() === clean.toLowerCase())) return current
      return [...current, { id: uid(), value: clean }]
    })

    setDraft('')
  }

  function removeValue(id: string) {
    setItems((current) => current.filter((item) => item.id !== id))
  }

  return (
    <section style={cardStyle}>
      <div style={headStyle}>
        <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
          <span style={{ ...iconBadgeStyle, background: `${accent}14`, color: accent }}>{icon}</span>
          <div>
            <h4 style={titleStyle}>{title}</h4>
            <p style={subtitleStyle}>{intro}</p>
          </div>
        </div>

        <div style={{ ...countBadgeStyle, background: `${accent}12`, color: accent }}>
          {items.length}
        </div>
      </div>

      <div style={summaryStrip}>
        <span style={summaryPill}>
          <b style={{ color: '#111827' }}>{items.length}</b>&nbsp;selected
        </span>
        <span style={summaryText}>Synced on save</span>
      </div>

      {items.length ? (
        <div style={chipWrapStyle}>
          {items.map((item) => (
            <span key={item.id} style={{ ...chipStyle, borderColor: `${accent}44` }}>
              <input type="hidden" name={name} value={item.value} />
              <span style={{ color: '#111827', fontWeight: 900 }}>{item.value}</span>
              <button
                type="button"
                onClick={() => removeValue(item.id)}
                aria-label={`Remove ${item.value}`}
                style={chipRemoveStyle}
              >
                ×
              </button>
            </span>
          ))}
        </div>
      ) : (
        <div style={emptyStateStyle}>No items added yet.</div>
      )}

      <div style={toolbarGridStyle}>
        <label style={fieldShellStyle}>
          <span style={fieldTopLabel}>Preset library</span>
          <select
            value=""
            onChange={(event) => addValue(event.target.value)}
            style={selectStyle}
          >
            <option value="">Select from presets</option>
            {remainingOptions.map((option) => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
        </label>

        <label style={fieldShellStyle}>
          <span style={fieldTopLabel}>Custom value</span>
          <input
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            placeholder={placeholder}
            style={inputStyle}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.preventDefault()
                addValue(draft)
              }
            }}
          />
        </label>

        <button type="button" onClick={() => addValue(draft)} style={primaryButtonStyle}>
          Add
        </button>
      </div>
    </section>
  )
}

function AttachmentManager() {
  const [rows, setRows] = useState<AttachmentRow[]>([
    { type: 'CV / Resume', label: '', url: '' },
  ])

  function updateRow(index: number, patch: Partial<AttachmentRow>) {
    setRows((current) => current.map((row, rowIndex) => rowIndex === index ? { ...row, ...patch } : row))
  }

  function addRow() {
    setRows((current) => [...current, { type: 'Other attachment', label: '', url: '' }])
  }

  function removeRow(index: number) {
    setRows((current) => current.length <= 1 ? current : current.filter((_, rowIndex) => rowIndex !== index))
  }

  return (
    <section style={cardStyle}>
      <div style={headStyle}>
        <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
          <span style={{ ...iconBadgeStyle, background: '#ecfeff', color: '#0891b2' }}>📎</span>
          <div>
            <h4 style={titleStyle}>Attachment documents</h4>
            <p style={subtitleStyle}>Add one or multiple document links, select document type, and remove them freely.</p>
          </div>
        </div>

        <button type="button" onClick={addRow} style={ghostButtonStyle}>
          + Add attachment
        </button>
      </div>

      <div style={summaryStrip}>
        <span style={summaryPill}>
          <b style={{ color: '#111827' }}>{rows.length}</b>&nbsp;attachment{rows.length === 1 ? '' : 's'}
        </span>
        <span style={summaryText}>Production-ready document references</span>
      </div>

      <div style={{ display: 'grid', gap: 12 }}>
        {rows.map((row, index) => (
          <div key={index} style={attachmentCardStyle}>
            <div style={attachmentHeaderStyle}>
              <strong style={{ color: '#111827', fontSize: 13 }}>Attachment #{index + 1}</strong>
              <button
                type="button"
                onClick={() => removeRow(index)}
                disabled={rows.length <= 1}
                style={removeAttachmentButtonStyle(rows.length <= 1)}
              >
                Remove
              </button>
            </div>

            <div style={attachmentGridStyle}>
              <label style={fieldShellStyle}>
                <span style={fieldTopLabel}>Document type</span>
                <select
                  name="attachment_type"
                  value={row.type}
                  onChange={(event) => updateRow(index, { type: event.target.value })}
                  style={selectStyle}
                >
                  {documentTypes.map((item) => (
                    <option key={item}>{item}</option>
                  ))}
                </select>
              </label>

              <label style={fieldShellStyle}>
                <span style={fieldTopLabel}>Label</span>
                <input
                  name="attachment_label"
                  value={row.label}
                  onChange={(event) => updateRow(index, { label: event.target.value })}
                  placeholder="Example: Updated CV June 2026"
                  style={inputStyle}
                />
              </label>

              <label style={fieldShellStyle}>
                <span style={fieldTopLabel}>Document link URL</span>
                <input
                  name="attachment_url"
                  value={row.url}
                  onChange={(event) => updateRow(index, { url: event.target.value })}
                  placeholder="https://drive.google.com/..."
                  style={inputStyle}
                />
              </label>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}

export default function PlacementDynamicFields() {
  return (
    <div style={wrapperStyle}>
      <DynamicList
        title="Trainings passed"
        name="trainings_passed"
        options={defaultTrainingOptions}
        placeholder="Add custom training..."
        accent="#1657ff"
        icon="🎓"
        intro="Track completed trainings relevant to placement readiness."
      />

      <DynamicList
        title="Spoken languages"
        name="spoken_languages"
        options={defaultLanguageOptions}
        placeholder="Add custom language..."
        accent="#7c3aed"
        icon="🌐"
        intro="Capture communication capabilities for employer matching."
      />

      <DynamicList
        title="Additional skills"
        name="additional_skills"
        options={defaultSkillOptions}
        placeholder="Add custom skill..."
        accent="#14b8a6"
        icon="✨"
        intro="Add practical strengths, service capabilities, and special competencies."
      />

      <AttachmentManager />
    </div>
  )
}

const wrapperStyle: CSSProperties = {
  display: 'grid',
  gap: 18,
}

const cardStyle: CSSProperties = {
  border: '1px solid #e7ecf4',
  borderRadius: 26,
  background: 'linear-gradient(180deg,#ffffff 0%,#fbfdff 100%)',
  padding: 18,
  boxShadow: '0 18px 42px rgba(15,23,42,.055)',
}

const headStyle: CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'flex-start',
  gap: 16,
  marginBottom: 14,
}

const iconBadgeStyle: CSSProperties = {
  width: 46,
  height: 46,
  borderRadius: 16,
  display: 'grid',
  placeItems: 'center',
  fontSize: 20,
  fontWeight: 1000,
  flex: '0 0 auto',
}

const titleStyle: CSSProperties = {
  margin: 0,
  color: '#111827',
  fontSize: 18,
  fontWeight: 1000,
  letterSpacing: '-0.03em',
}

const subtitleStyle: CSSProperties = {
  margin: '5px 0 0',
  color: '#64748b',
  fontSize: 12,
  fontWeight: 800,
  lineHeight: 1.6,
}

const countBadgeStyle: CSSProperties = {
  minWidth: 42,
  height: 42,
  borderRadius: 999,
  display: 'grid',
  placeItems: 'center',
  fontSize: 13,
  fontWeight: 1000,
  padding: '0 12px',
}

const summaryStrip: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 10,
  flexWrap: 'wrap',
  marginBottom: 14,
}

const summaryPill: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  borderRadius: 999,
  border: '1px solid #e7ecf4',
  background: '#fff',
  color: '#64748b',
  padding: '8px 12px',
  fontSize: 12,
  fontWeight: 850,
}

const summaryText: CSSProperties = {
  color: '#64748b',
  fontSize: 12,
  fontWeight: 850,
}

const emptyStateStyle: CSSProperties = {
  border: '1px dashed #dbe3ef',
  borderRadius: 18,
  background: '#f8fafc',
  padding: 16,
  color: '#64748b',
  fontSize: 12,
  fontWeight: 850,
  marginBottom: 14,
}

const chipWrapStyle: CSSProperties = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: 10,
  marginBottom: 14,
}

const chipStyle: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 8,
  border: '1px solid #dbe3ef',
  borderRadius: 999,
  background: '#fff',
  padding: '9px 10px 9px 14px',
  boxShadow: '0 8px 18px rgba(15,23,42,.04)',
}

const chipRemoveStyle: CSSProperties = {
  width: 24,
  height: 24,
  borderRadius: 999,
  border: '1px solid #e2e8f0',
  background: '#f8fafc',
  color: '#64748b',
  fontSize: 14,
  fontWeight: 1000,
  cursor: 'pointer',
  lineHeight: 1,
}

const toolbarGridStyle: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '1fr 1.25fr auto',
  gap: 12,
  alignItems: 'end',
}

const fieldShellStyle: CSSProperties = {
  display: 'grid',
  gap: 7,
}

const fieldTopLabel: CSSProperties = {
  color: '#64748b',
  fontSize: 11,
  fontWeight: 1000,
  textTransform: 'uppercase',
  letterSpacing: '.12em',
}

const selectStyle: CSSProperties = {
  width: '100%',
  minWidth: 0,
  border: '1px solid #dbe3ef',
  borderRadius: 16,
  background: '#fff',
  color: '#111827',
  padding: '13px 14px',
  fontSize: 13,
  fontWeight: 850,
  outline: 'none',
  boxSizing: 'border-box',
}

const inputStyle: CSSProperties = {
  width: '100%',
  minWidth: 0,
  border: '1px solid #dbe3ef',
  borderRadius: 16,
  background: '#fff',
  color: '#111827',
  padding: '13px 14px',
  fontSize: 13,
  fontWeight: 850,
  outline: 'none',
  boxSizing: 'border-box',
}

const primaryButtonStyle: CSSProperties = {
  minHeight: 48,
  border: '1px solid #1657ff',
  borderRadius: 16,
  background: '#1657ff',
  color: '#fff',
  padding: '0 18px',
  fontSize: 13,
  fontWeight: 1000,
  cursor: 'pointer',
  boxShadow: '0 12px 24px rgba(22,87,255,.2)',
}

const ghostButtonStyle: CSSProperties = {
  minHeight: 42,
  border: '1px solid #dbe3ef',
  borderRadius: 14,
  background: '#fff',
  color: '#111827',
  padding: '0 14px',
  fontSize: 12,
  fontWeight: 1000,
  cursor: 'pointer',
  whiteSpace: 'nowrap',
}

const attachmentCardStyle: CSSProperties = {
  border: '1px solid #edf2f7',
  borderRadius: 22,
  background: '#fff',
  padding: 14,
}

const attachmentHeaderStyle: CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  gap: 12,
  marginBottom: 12,
}

const attachmentGridStyle: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '180px 1fr 1.3fr',
  gap: 12,
}

function removeAttachmentButtonStyle(disabled: boolean): CSSProperties {
  return {
    minHeight: 38,
    border: '1px solid #fecaca',
    borderRadius: 12,
    background: disabled ? '#fff' : '#fef2f2',
    color: disabled ? '#94a3b8' : '#b91c1c',
    padding: '0 12px',
    fontSize: 12,
    fontWeight: 1000,
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.55 : 1,
  }
}
