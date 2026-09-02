'use client'

import { useId, useRef, useState, type DragEvent } from 'react'
import { FileUp, RotateCcw, Trash2 } from 'lucide-react'
import styles from './marketplace-file-picker.module.css'

export const CSV_FILE_ACCEPT = '.csv,text/csv'

export function formatMarketplaceFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} o`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toLocaleString('fr-FR', { maximumFractionDigits: 1 })} Ko`
  return `${(bytes / (1024 * 1024)).toLocaleString('fr-FR', { maximumFractionDigits: 1 })} Mo`
}

function acceptsFile(file: File, accept: string) {
  const fileName = file.name.toLowerCase()
  const mime = file.type.toLowerCase()
  return accept.split(',').map((part) => part.trim().toLowerCase()).filter(Boolean).some((part) => {
    if (part.startsWith('.')) return fileName.endsWith(part)
    if (part.endsWith('/*')) return mime.startsWith(part.slice(0, -1))
    return mime === part
  })
}

type MarketplaceFilePickerProps = {
  accept: string
  files: readonly File[]
  onFilesChange: (files: File[]) => void
  label: string
  description: string
  disabled?: boolean
  maxSizeBytes?: number
  multiple?: boolean
  className?: string
  inputAriaLabel?: string
}

export function MarketplaceFilePicker({
  accept,
  files,
  onFilesChange,
  label,
  description,
  disabled = false,
  maxSizeBytes,
  multiple = false,
  className,
  inputAriaLabel,
}: MarketplaceFilePickerProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const descriptionId = useId()
  const [dragActive, setDragActive] = useState(false)
  const [error, setError] = useState('')

  function openPicker() {
    if (disabled) return
    const input = inputRef.current
    if (!input) return
    input.value = ''
    input.click()
  }

  function selectFiles(candidates: File[]) {
    setDragActive(false)
    const selected = multiple ? candidates : candidates.slice(0, 1)
    if (!selected.length) return
    const invalid = selected.find((file) => !acceptsFile(file, accept))
    if (invalid) {
      setError(`Format de fichier non autorisé : ${invalid.name}.`)
      return
    }
    const oversized = maxSizeBytes ? selected.find((file) => file.size > maxSizeBytes) : undefined
    if (oversized) {
      setError(`Le fichier ${oversized.name} dépasse la limite de ${formatMarketplaceFileSize(maxSizeBytes!)}.`)
      return
    }
    const empty = selected.find((file) => file.size === 0)
    if (empty) {
      setError(`Le fichier ${empty.name} est vide.`)
      return
    }
    setError('')
    onFilesChange(selected)
  }

  function onDrop(event: DragEvent<HTMLButtonElement>) {
    event.preventDefault()
    if (disabled) return
    selectFiles(Array.from(event.dataTransfer.files))
  }

  function clear() {
    if (inputRef.current) inputRef.current.value = ''
    setError('')
    onFilesChange([])
  }

  return <div className={`${styles.root}${className ? ` ${className}` : ''}`} data-state={error ? 'invalid' : dragActive ? 'drag-active' : files.length ? 'selected' : 'idle'}>
    <input
      ref={inputRef}
      className={styles.nativeInput}
      type="file"
      accept={accept}
      multiple={multiple}
      disabled={disabled}
      tabIndex={-1}
      aria-label={inputAriaLabel || label}
      aria-describedby={descriptionId}
      onChange={(event) => selectFiles(Array.from(event.currentTarget.files || []))}
    />
    <button
      type="button"
      className={styles.zone}
      disabled={disabled}
      aria-describedby={descriptionId}
      onClick={openPicker}
      onDragEnter={(event) => { event.preventDefault(); if (!disabled) setDragActive(true) }}
      onDragOver={(event) => event.preventDefault()}
      onDragLeave={() => setDragActive(false)}
      onDrop={onDrop}
    >
      <FileUp aria-hidden="true" />
      <strong>{dragActive ? 'Déposez le fichier ici' : files.length ? 'Remplacer le fichier' : label}</strong>
      <span id={descriptionId}>{description}</span>
    </button>
    {files.length ? <div className={styles.selection} role="status" aria-live="polite">
      <div className={styles.fileList}>{files.map((file) => <dl key={`${file.name}:${file.size}:${file.lastModified}`}>
        <div><dt>FILE_NAME</dt><dd>{file.name}</dd></div>
        <div><dt>FILE_SIZE</dt><dd>{formatMarketplaceFileSize(file.size)}</dd></div>
        <div><dt>FILE_TYPE</dt><dd>{file.type || 'type non déclaré'}</dd></div>
        <div><dt>READY_FOR_VALIDATION</dt><dd>YES</dd></div>
      </dl>)}</div>
      <div className={styles.actions}>
        <button type="button" disabled={disabled} onClick={openPicker}><RotateCcw aria-hidden="true" /> Remplacer</button>
        <button type="button" disabled={disabled} onClick={clear}><Trash2 aria-hidden="true" /> Supprimer</button>
      </div>
    </div> : null}
    {error ? <p className={styles.error} role="alert">{error}</p> : null}
  </div>
}
