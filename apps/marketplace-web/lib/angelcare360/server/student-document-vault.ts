import 'server-only'
import { createHash, randomUUID } from 'node:crypto'
import { createClient } from '@/lib/supabase/server'
import { requireAngelcare360Permission } from '@/lib/angelcare360/server/context'

const BUCKET = 'angelcare360-student-documents'
const MAX_BYTES = 15 * 1024 * 1024
type DatabaseClient = Awaited<ReturnType<typeof createClient>>
const ALLOWED = new Set(['application/pdf', 'image/jpeg', 'image/png'])

type VaultFile = { name: string; type: string; size: number; arrayBuffer(): Promise<ArrayBuffer> }

function safeName(input: string) {
  const normalized = input.normalize('NFKD').replace(/[\u0300-\u036f]/g, '')
  const clean = normalized.replace(/[^A-Za-z0-9._-]+/g, '-').replace(/-{2,}/g, '-').replace(/^-|-$/g, '')
  return (clean || 'document').slice(-120)
}

function validMagic(bytes: Uint8Array, mime: string) {
  if (mime === 'application/pdf') return bytes.length >= 5 && String.fromCharCode(...bytes.slice(0, 5)) === '%PDF-'
  if (mime === 'image/png') return bytes.length >= 8 && [137,80,78,71,13,10,26,10].every((v, i) => bytes[i] === v)
  if (mime === 'image/jpeg') return bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff
  return false
}

async function resolveStudent(client: DatabaseClient, schoolId: string, studentId: string) {
  const { data, error } = await client
    .from('angelcare360_students')
    .select('id,student_code,full_name,status')
    .eq('school_id', schoolId)
    .eq('id', studentId)
    .limit(1)
    .maybeSingle()
  if (error) throw new Error(`Impossible de vérifier l’élève: ${error.message}`)
  if (!data) throw new Error('Élève introuvable dans cet établissement.')
  return data
}

async function audit(client: DatabaseClient, payload: Record<string, unknown>) {
  const { error } = await client.from('angelcare360_enterprise_audit_ledger').insert(payload)
  if (error) console.error('SANILA_DOCUMENT_AUDIT_WRITE_FAILED', error.message)
}

export async function uploadAngelcare360StudentDocument(input: {
  studentId: string
  title: string
  category: string
  visibility?: 'internal' | 'family' | 'student' | 'restricted'
  file: VaultFile
}) {
  const context = await requireAngelcare360Permission('documents.create')
  const schoolId = String(context.school!.id)
  const client = await createClient()
  await resolveStudent(client, schoolId, input.studentId)

  if (!input.file || typeof input.file.arrayBuffer !== 'function') throw new Error('Fichier requis.')
  if (!ALLOWED.has(input.file.type)) throw new Error('Format refusé. Formats autorisés: PDF, JPEG, PNG.')
  if (!input.file.size || input.file.size > MAX_BYTES) throw new Error('Le fichier doit être compris entre 1 octet et 15 MiB.')
  if (!input.title.trim()) throw new Error('Le titre du document est requis.')
  if (!input.category.trim()) throw new Error('La catégorie du document est requise.')

  const bytes = new Uint8Array(await input.file.arrayBuffer())
  if (bytes.byteLength !== input.file.size) throw new Error('La taille reçue ne correspond pas à la taille annoncée.')
  if (!validMagic(bytes, input.file.type)) throw new Error('Le contenu du fichier ne correspond pas à son type déclaré.')

  const digest = createHash('sha256').update(bytes).digest('hex')
  const extension = input.file.type === 'application/pdf' ? 'pdf' : input.file.type === 'image/png' ? 'png' : 'jpg'
  const objectId = randomUUID()
  const year = new Date().getUTCFullYear()
  const fileName = `${safeName(input.file.name.replace(/\.[^.]+$/, ''))}.${extension}`
  const objectPath = `${schoolId}/students/${input.studentId}/${year}/${objectId}-${fileName}`
  const documentCode = `DOC-${objectId.slice(0, 8).toUpperCase()}`

  const storageResult = await client.storage.from(BUCKET).upload(objectPath, bytes, {
    contentType: input.file.type,
    cacheControl: 'private, max-age=0, no-store',
    upsert: false,
  })
  if (storageResult.error) throw new Error(`Téléversement refusé: ${storageResult.error.message}`)

  let documentId: string | null = null
  try {
    const { data: doc, error: documentError } = await client
      .from('angelcare360_documents')
      .insert({
        school_id: schoolId,
        document_code: documentCode,
        documentable_type: 'student',
        documentable_id: input.studentId,
        category: input.category.trim(),
        title: input.title.trim(),
        file_name: fileName,
        file_path: objectPath,
        storage_provider: 'private_storage',
        mime_type: input.file.type,
        file_size_bytes: bytes.byteLength,
        visibility: input.visibility || 'internal',
        status: 'active',
        uploaded_by: context.user.id,
        created_by: context.user.id,
        updated_by: context.user.id,
        metadata_json: { sha256: digest, bucket: BUCKET, governed_vault: true },
      })
      .select('id')
      .single()
    if (documentError || !doc) throw new Error(documentError?.message || 'Référence documentaire non créée.')
    documentId = String(doc.id)

    const { error: ledgerError } = await client.from('angelcare360_document_objects').insert({
      school_id: schoolId,
      document_id: documentId,
      subject_type: 'student',
      subject_id: input.studentId,
      bucket_id: BUCKET,
      object_path: objectPath,
      original_file_name: input.file.name,
      safe_file_name: fileName,
      mime_type: input.file.type,
      size_bytes: bytes.byteLength,
      sha256: digest,
      state: 'active',
      uploaded_by: context.user.id,
      metadata_json: { document_code: documentCode },
    })
    if (ledgerError) throw new Error(`Registre objet non créé: ${ledgerError.message}`)

    await audit(client, {
      school_id: schoolId,
      actor_app_user_id: context.user.id,
      actor_role: context.access.accessLevel,
      action_key: 'student_document.uploaded',
      resource_type: 'angelcare360_documents',
      resource_id: documentId,
      after_json: { student_id: input.studentId, document_code: documentCode, mime_type: input.file.type, size_bytes: bytes.byteLength, sha256: digest },
      source: 'student_document_vault',
    })

    return { ok: true as const, documentId, documentCode, sha256: digest }
  } catch (error) {
    if (documentId) {
      await client.from('angelcare360_document_objects').delete().eq('school_id', schoolId).eq('document_id', documentId)
      await client.from('angelcare360_documents').delete().eq('school_id', schoolId).eq('id', documentId)
    }
    const removal = await client.storage.from(BUCKET).remove([objectPath])
    if (removal.error) console.error('SANILA_DOCUMENT_COMPENSATION_FAILED', objectPath, removal.error.message)
    throw error
  }
}

export async function createAngelcare360StudentDocumentSignedUrl(documentId: string) {
  const context = await requireAngelcare360Permission('documents.view')
  const schoolId = String(context.school!.id)
  const client = await createClient()
  const { data, error } = await client
    .from('angelcare360_document_objects')
    .select('document_id,subject_id,bucket_id,object_path,state')
    .eq('school_id', schoolId)
    .eq('document_id', documentId)
    .eq('subject_type', 'student')
    .eq('state', 'active')
    .limit(1)
    .maybeSingle()
  if (error || !data) throw new Error('Document indisponible ou hors de votre périmètre.')
  await resolveStudent(client, schoolId, String(data.subject_id))
  const signed = await client.storage.from(String(data.bucket_id)).createSignedUrl(String(data.object_path), 300, { download: true })
  if (signed.error || !signed.data?.signedUrl) throw new Error(`Lien privé indisponible: ${signed.error?.message || 'erreur inconnue'}`)
  return signed.data.signedUrl
}

export async function deleteAngelcare360StudentDocument(documentId: string) {
  const context = await requireAngelcare360Permission('documents.update')
  const schoolId = String(context.school!.id)
  const client = await createClient()
  const { data, error } = await client
    .from('angelcare360_document_objects')
    .select('document_id,subject_id,bucket_id,object_path,state,sha256')
    .eq('school_id', schoolId)
    .eq('document_id', documentId)
    .eq('subject_type', 'student')
    .limit(1)
    .maybeSingle()
  if (error || !data) throw new Error('Document introuvable.')
  await resolveStudent(client, schoolId, String(data.subject_id))

  const removed = await client.storage.from(String(data.bucket_id)).remove([String(data.object_path)])
  if (removed.error) throw new Error(`Suppression du fichier impossible: ${removed.error.message}`)

  const now = new Date().toISOString()
  const ledger = await client
    .from('angelcare360_document_objects')
    .update({ state: 'deleted', deleted_by: context.user.id, deleted_at: now, updated_at: now })
    .eq('school_id', schoolId)
    .eq('document_id', documentId)
  if (ledger.error) {
    // Object is already removed; retain compatibility row but mark orphan state best-effort.
    await client.from('angelcare360_document_objects').update({ state: 'orphaned', updated_at: now }).eq('school_id', schoolId).eq('document_id', documentId)
    throw new Error(`Fichier supprimé, mais le registre n’a pas pu être clôturé: ${ledger.error.message}`)
  }

  const compat = await client
    .from('angelcare360_documents')
    .update({ status: 'archived', updated_by: context.user.id, updated_at: now })
    .eq('school_id', schoolId)
    .eq('id', documentId)
  if (compat.error) throw new Error(`Registre documentaire non archivé: ${compat.error.message}`)

  await audit(client, {
    school_id: schoolId,
    actor_app_user_id: context.user.id,
    actor_role: context.access.accessLevel,
    action_key: 'student_document.deleted',
    resource_type: 'angelcare360_documents',
    resource_id: documentId,
    before_json: { sha256: data.sha256, object_path: data.object_path },
    after_json: { state: 'deleted' },
    source: 'student_document_vault',
  })
  return { ok: true as const }
}

export async function listGovernedStudentDocuments() {
  const context = await requireAngelcare360Permission('documents.view')
  const schoolId = String(context.school!.id)
  const client = await createClient()
  const { data, error } = await client
    .from('angelcare360_document_objects')
    .select('document_id,subject_id,original_file_name,safe_file_name,mime_type,size_bytes,sha256,state,created_at')
    .eq('school_id', schoolId)
    .eq('subject_type', 'student')
    .neq('state', 'deleted')
    .order('created_at', { ascending: false })
    .limit(400)
  if (error) throw new Error(error.message)
  return data || []
}
