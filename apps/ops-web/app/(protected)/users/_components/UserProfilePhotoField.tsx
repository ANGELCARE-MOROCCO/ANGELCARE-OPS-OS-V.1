'use client'

import type { CSSProperties, ChangeEvent } from 'react'
import { useEffect, useId, useMemo, useRef, useState } from 'react'
import { Camera, CheckCircle2, ImagePlus, ShieldCheck, Trash2 } from 'lucide-react'
import {
  MAX_USER_PROFILE_PHOTO_BYTES,
  USER_PROFILE_PHOTO_ACCEPT,
} from '@/lib/users/profile-photo-constants'

export type UserProfilePhotoState = {
  hasPhoto: boolean
  changed: boolean
  removed: boolean
  fileName: string | null
  error: string | null
  previewUrl: string | null
}

type Props = {
  displayName?: string | null
  existingImageUrl?: string | null
  allowRemove?: boolean
  onStateChange?: (state: UserProfilePhotoState) => void
}

function initials(value?: string | null) {
  const result = String(value || 'Staff member')
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('')

  return result || 'AC'
}

export default function UserProfilePhotoField({
  displayName,
  existingImageUrl,
  allowRemove = false,
  onStateChange,
}: Props) {
  const inputId = useId()
  const inputRef = useRef<HTMLInputElement | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [removed, setRemoved] = useState(false)
  const [imageFailed, setImageFailed] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [fileName, setFileName] = useState<string | null>(null)

  const activeImageUrl = useMemo(() => {
    if (removed || imageFailed) return null
    return previewUrl || existingImageUrl || null
  }, [existingImageUrl, imageFailed, previewUrl, removed])

  useEffect(() => {
    setImageFailed(false)
  }, [existingImageUrl, previewUrl])

  useEffect(() => {
    return () => {
      if (previewUrl?.startsWith('blob:')) URL.revokeObjectURL(previewUrl)
    }
  }, [previewUrl])

  useEffect(() => {
    onStateChange?.({
      hasPhoto: Boolean(activeImageUrl),
      changed: Boolean(previewUrl || removed),
      removed,
      fileName,
      error,
      previewUrl: activeImageUrl,
    })
  }, [activeImageUrl, error, fileName, onStateChange, previewUrl, removed])

  function clearPreview() {
    setPreviewUrl((current) => {
      if (current?.startsWith('blob:')) URL.revokeObjectURL(current)
      return null
    })
    setFileName(null)
    if (inputRef.current) inputRef.current.value = ''
  }

  function handleFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    setError(null)

    if (!file) {
      clearPreview()
      return
    }

    if (file.size > MAX_USER_PROFILE_PHOTO_BYTES) {
      clearPreview()
      setError('Photo refusée : la taille maximale autorisée est de 1 Mo.')
      return
    }

    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      clearPreview()
      setError('Photo refusée : utilisez uniquement JPG, PNG ou WebP.')
      return
    }

    setPreviewUrl((current) => {
      if (current?.startsWith('blob:')) URL.revokeObjectURL(current)
      return URL.createObjectURL(file)
    })
    setFileName(file.name)
    setRemoved(false)
    setImageFailed(false)
  }

  function removePhoto() {
    clearPreview()
    setRemoved(true)
    setImageFailed(false)
    setError(null)
  }

  function restorePhoto() {
    setRemoved(false)
    setImageFailed(false)
    setError(null)
  }

  return (
    <div style={shellStyle}>
      <input
        ref={inputRef}
        id={inputId}
        name="profile_photo"
        type="file"
        accept={USER_PROFILE_PHOTO_ACCEPT}
        onChange={handleFile}
        style={hiddenInputStyle}
      />
      <input type="hidden" name="remove_profile_photo" value={removed ? 'true' : 'false'} />

      <div style={portraitStageStyle}>
        <div style={outerRingStyle}>
          <div style={innerRingStyle}>
            {activeImageUrl ? (
              <img
                src={activeImageUrl}
                alt={`Photo professionnelle de ${displayName || 'collaborateur'}`}
                onError={() => setImageFailed(true)}
                style={imageStyle}
              />
            ) : (
              <div style={fallbackStyle}>{initials(displayName)}</div>
            )}
          </div>
        </div>
        <div style={verifiedDotStyle} title="Photo d'identité professionnelle">
          <ShieldCheck size={17} strokeWidth={2.5} />
        </div>
      </div>

      <div style={contentStyle}>
        <div>
          <div style={eyebrowStyle}>Identité visuelle officielle</div>
          <h3 style={titleStyle}>Photo du collaborateur</h3>
          <p style={descriptionStyle}>
            Cette photo apparaît dans le passeport SANILA du dashboard. Utilisez un portrait net, professionnel et centré sur le visage.
          </p>
        </div>

        <div style={ruleStyle}>
          <Camera size={16} />
          <span>JPG, PNG ou WebP</span>
          <i style={separatorStyle} />
          <strong>1 Mo maximum</strong>
        </div>

        {fileName ? (
          <div style={successStyle}>
            <CheckCircle2 size={16} />
            <span>{fileName}</span>
          </div>
        ) : null}

        {error ? <div style={errorStyle}>{error}</div> : null}

        <div style={actionsStyle}>
          <label htmlFor={inputId} style={primaryButtonStyle}>
            <ImagePlus size={17} />
            {activeImageUrl ? 'Remplacer la photo' : 'Choisir une photo'}
          </label>

          {allowRemove && (existingImageUrl || previewUrl) ? (
            removed ? (
              <button type="button" onClick={restorePhoto} style={secondaryButtonStyle}>
                Restaurer
              </button>
            ) : (
              <button type="button" onClick={removePhoto} style={dangerButtonStyle}>
                <Trash2 size={16} />
                Supprimer
              </button>
            )
          ) : previewUrl ? (
            <button type="button" onClick={removePhoto} style={secondaryButtonStyle}>
              Annuler
            </button>
          ) : null}
        </div>
      </div>
    </div>
  )
}

const shellStyle: CSSProperties = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: 22,
  alignItems: 'center',
  padding: 20,
  borderRadius: 24,
  border: '1px solid #dbe7f5',
  background: 'linear-gradient(135deg,#f8fbff 0%,#ffffff 52%,#eef7ff 100%)',
  boxShadow: 'inset 0 1px 0 rgba(255,255,255,.9), 0 18px 44px rgba(15,45,91,.07)',
}

const hiddenInputStyle: CSSProperties = {
  position: 'absolute',
  width: 1,
  height: 1,
  opacity: 0,
  pointerEvents: 'none',
}

const portraitStageStyle: CSSProperties = {
  position: 'relative',
  width: 154,
  height: 154,
  display: 'grid',
  placeItems: 'center',
}

const outerRingStyle: CSSProperties = {
  width: 150,
  height: 150,
  padding: 6,
  borderRadius: 999,
  background: 'linear-gradient(145deg,#ffffff 0%,#bfdbfe 35%,#2563eb 68%,#60a5fa 100%)',
  boxShadow: '0 22px 48px rgba(30,64,175,.22), inset 0 1px 0 rgba(255,255,255,.95)',
  boxSizing: 'border-box',
}

const innerRingStyle: CSSProperties = {
  width: '100%',
  height: '100%',
  padding: 5,
  borderRadius: 999,
  background: '#ffffff',
  boxSizing: 'border-box',
}

const imageStyle: CSSProperties = {
  width: '100%',
  height: '100%',
  display: 'block',
  borderRadius: 999,
  objectFit: 'cover',
  objectPosition: 'center 26%',
  background: '#dbeafe',
}

const fallbackStyle: CSSProperties = {
  width: '100%',
  height: '100%',
  display: 'grid',
  placeItems: 'center',
  borderRadius: 999,
  background: 'linear-gradient(145deg,#0b2f78 0%,#1d4ed8 58%,#38bdf8 100%)',
  color: '#ffffff',
  fontSize: 38,
  fontWeight: 1000,
  letterSpacing: '-.06em',
}

const verifiedDotStyle: CSSProperties = {
  position: 'absolute',
  right: 3,
  bottom: 13,
  width: 38,
  height: 38,
  display: 'grid',
  placeItems: 'center',
  borderRadius: 999,
  border: '4px solid #ffffff',
  background: '#10b981',
  color: '#ffffff',
  boxShadow: '0 10px 24px rgba(5,150,105,.28)',
  boxSizing: 'border-box',
}

const contentStyle: CSSProperties = { minWidth: 0, flex: '1 1 280px', display: 'grid', gap: 12 }
const eyebrowStyle: CSSProperties = { color: '#2563eb', fontSize: 10, fontWeight: 1000, letterSpacing: '.2em', textTransform: 'uppercase' }
const titleStyle: CSSProperties = { margin: '5px 0 0', color: '#0f172a', fontSize: 21, fontWeight: 1000, letterSpacing: '-.03em' }
const descriptionStyle: CSSProperties = { margin: '8px 0 0', color: '#64748b', fontSize: 13, fontWeight: 750, lineHeight: 1.65 }
const ruleStyle: CSSProperties = { display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 8, color: '#334155', fontSize: 12, fontWeight: 900 }
const separatorStyle: CSSProperties = { width: 4, height: 4, borderRadius: 999, background: '#94a3b8' }
const successStyle: CSSProperties = { display: 'flex', alignItems: 'center', gap: 8, padding: '10px 12px', borderRadius: 12, border: '1px solid #a7f3d0', background: '#ecfdf5', color: '#047857', fontSize: 12, fontWeight: 900, overflow: 'hidden' }
const errorStyle: CSSProperties = { padding: '10px 12px', borderRadius: 12, border: '1px solid #fecaca', background: '#fff1f2', color: '#be123c', fontSize: 12, fontWeight: 900, lineHeight: 1.5 }
const actionsStyle: CSSProperties = { display: 'flex', flexWrap: 'wrap', gap: 9 }
const primaryButtonStyle: CSSProperties = { display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8, minHeight: 42, padding: '0 15px', borderRadius: 12, background: 'linear-gradient(135deg,#0b2f78,#2563eb)', color: '#ffffff', fontSize: 12, fontWeight: 950, cursor: 'pointer', boxShadow: '0 12px 26px rgba(37,99,235,.22)' }
const secondaryButtonStyle: CSSProperties = { display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8, minHeight: 42, padding: '0 15px', borderRadius: 12, border: '1px solid #cbd5e1', background: '#ffffff', color: '#334155', fontSize: 12, fontWeight: 950, cursor: 'pointer' }
const dangerButtonStyle: CSSProperties = { ...secondaryButtonStyle, border: '1px solid #fecdd3', background: '#fff1f2', color: '#be123c' }
