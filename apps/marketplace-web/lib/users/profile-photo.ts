import { randomUUID } from 'node:crypto'
import {
  MAX_USER_PROFILE_PHOTO_BYTES,
  STAFF_PROFILE_PHOTO_BUCKET,
  USER_PROFILE_PHOTO_MIME_TYPES,
} from '@/lib/users/profile-photo-constants'

export {
  MAX_USER_PROFILE_PHOTO_BYTES,
  STAFF_PROFILE_PHOTO_BUCKET,
  USER_PROFILE_PHOTO_ACCEPT,
} from '@/lib/users/profile-photo-constants'

const ALLOWED_MIME_TYPES = new Set<string>(USER_PROFILE_PHOTO_MIME_TYPES)
const EXTENSIONS: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
}

export type UserProfilePhotoFile = {
  name: string
  size: number
  type: string
  arrayBuffer: () => Promise<ArrayBuffer>
}

function isUploadFile(value: FormDataEntryValue | null): value is File {
  return Boolean(
    value &&
      typeof value !== 'string' &&
      typeof value.size === 'number' &&
      typeof value.type === 'string' &&
      typeof value.arrayBuffer === 'function',
  )
}

export function readUserProfilePhoto(formData: FormData): UserProfilePhotoFile | null {
  const value = formData.get('profile_photo')
  if (!isUploadFile(value) || value.size === 0) return null
  return value
}

export function validateUserProfilePhoto(file: UserProfilePhotoFile | null) {
  if (!file) return

  if (file.size > MAX_USER_PROFILE_PHOTO_BYTES) {
    throw new Error('La photo du collaborateur ne doit pas dépasser 1 Mo.')
  }

  if (!ALLOWED_MIME_TYPES.has(file.type)) {
    throw new Error('Format photo non autorisé. Utilisez JPG, PNG ou WebP.')
  }
}

export async function uploadUserProfilePhoto(
  supabase: any,
  userId: string,
  file: UserProfilePhotoFile,
) {
  validateUserProfilePhoto(file)

  const extension = EXTENSIONS[file.type]
  const path = `${userId}/${Date.now()}-${randomUUID()}.${extension}`
  const bytes = new Uint8Array(await file.arrayBuffer())

  const { error } = await supabase.storage
    .from(STAFF_PROFILE_PHOTO_BUCKET)
    .upload(path, bytes, {
      cacheControl: '3600',
      contentType: file.type,
      upsert: false,
    })

  if (error) {
    throw new Error(`Impossible d'enregistrer la photo du collaborateur: ${error.message}`)
  }

  return path
}

export async function removeUserProfilePhoto(supabase: any, path?: string | null) {
  if (!path) return
  const { error } = await supabase.storage.from(STAFF_PROFILE_PHOTO_BUCKET).remove([path])
  if (error && !/not found/i.test(error.message)) {
    throw new Error(error.message)
  }
}
