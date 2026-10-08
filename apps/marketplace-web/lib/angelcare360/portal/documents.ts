import 'server-only'
import { createHash, randomUUID } from 'node:crypto'
import { createClient } from '@/lib/supabase/server'
import { requirePortalIdentity } from '@/lib/angelcare360/portal/server'
import { requireParentChildCapability } from '@/lib/angelcare360/portal/policy'
import type { Angelcare360PortalKind } from '@/types/angelcare360/role-portals'

const MAX_BYTES=15*1024*1024
const ALLOWED=new Set(['application/pdf','image/jpeg','image/png'])
const STUDENT_BUCKET='angelcare360-student-documents'
type VaultFile={name:string;type:string;size:number;arrayBuffer():Promise<ArrayBuffer>}
function text(value:unknown,fallback=''){const v=String(value??'').trim();return v||fallback}
function safeName(input:string){const normalized=input.normalize('NFKD').replace(/[\u0300-\u036f]/g,'');const clean=normalized.replace(/[^A-Za-z0-9._-]+/g,'-').replace(/-{2,}/g,'-').replace(/^-|-$/g,'');return(clean||'document').slice(-120)}
function validMagic(bytes:Uint8Array,mime:string){if(mime==='application/pdf')return bytes.length>=5&&String.fromCharCode(...bytes.slice(0,5))==='%PDF-';if(mime==='image/png')return bytes.length>=8&&[137,80,78,71,13,10,26,10].every((v,i)=>bytes[i]===v);if(mime==='image/jpeg')return bytes.length>=3&&bytes[0]===0xff&&bytes[1]===0xd8&&bytes[2]===0xff;return false}

async function teacherMayReadStudentAssignmentDocument(db:Awaited<ReturnType<typeof createClient>>,schoolId:string,teacherStaffId:string,document:Record<string,unknown>,object:Record<string,unknown>){
  const metadata=document.metadata_json&&typeof document.metadata_json==='object'&&!Array.isArray(document.metadata_json)?document.metadata_json as Record<string,unknown>:{}
  const objectMetadata=object.metadata_json&&typeof object.metadata_json==='object'&&!Array.isArray(object.metadata_json)?object.metadata_json as Record<string,unknown>:{}
  const assignmentId=text(metadata.assignment_id,text(objectMetadata.assignment_id))
  const studentId=text(object.subject_id,text(document.documentable_id))
  if(!assignmentId||!studentId)return false
  const assignment=await db.from('angelcare360_assignments').select('id,class_id,section_id,subject_id,status').eq('school_id',schoolId).eq('id',assignmentId).limit(1).maybeSingle()
  if(assignment.error||!assignment.data)return false
  let teacherScope=db.from('angelcare360_teacher_assignments').select('id').eq('school_id',schoolId).eq('staff_id',teacherStaffId).eq('class_id',assignment.data.class_id).eq('subject_id',assignment.data.subject_id).eq('status','active')
  if(assignment.data.section_id)teacherScope=teacherScope.eq('section_id',assignment.data.section_id)
  const scope=await teacherScope.limit(1).maybeSingle();if(scope.error||!scope.data)return false
  let enrollment=db.from('angelcare360_class_enrollments').select('id').eq('school_id',schoolId).eq('student_id',studentId).eq('class_id',assignment.data.class_id).in('enrollment_status',['active','enrolled','current']).eq('status','active')
  if(assignment.data.section_id)enrollment=enrollment.eq('section_id',assignment.data.section_id)
  const linked=await enrollment.limit(1).maybeSingle();return !linked.error&&Boolean(linked.data)
}

async function documentAuthority(kind:Angelcare360PortalKind,documentId:string){
  const identity=await requirePortalIdentity(kind);const schoolId=String(identity.school.id);const db=await createClient()
  const {data:doc,error}=await db.from('angelcare360_documents').select('id,documentable_type,documentable_id,title,file_name,status,metadata_json').eq('school_id',schoolId).eq('id',documentId).eq('status','active').limit(1).maybeSingle()
  if(error||!doc)throw new Error('Document indisponible ou hors de votre périmètre.')
  const {data:object, error:objectError}=await db.from('angelcare360_document_objects').select('document_id,subject_type,subject_id,bucket_id,object_path,state,metadata_json').eq('school_id',schoolId).eq('document_id',documentId).eq('state','active').limit(1).maybeSingle()
  if(objectError||!object)throw new Error('Le fichier privé n’est pas enregistré dans le coffre documentaire gouverné.')
  const subjectId=text(doc.documentable_id),objectSubjectId=text(object.subject_id),personId=String(identity.person.id)
  if(kind==='student'&&(subjectId!==personId||objectSubjectId!==personId))throw new Error('Document hors de votre dossier élève.')
  if(kind==='parent'){
    if(subjectId!==personId)await requireParentChildCapability(db,schoolId,personId,subjectId,'view')
    if(objectSubjectId!==personId)await requireParentChildCapability(db,schoolId,personId,objectSubjectId,'view')
  }
  if(kind==='staff'&&(subjectId!==personId||objectSubjectId!==personId))throw new Error('Document hors de votre identité professionnelle.')
  if(kind==='teacher'){
    const ownProfessional=subjectId===personId&&objectSubjectId===personId
    if(!ownProfessional){const allowed=await teacherMayReadStudentAssignmentDocument(db,schoolId,personId,doc as Record<string,unknown>,object as Record<string,unknown>);if(!allowed)throw new Error('Document élève hors de votre périmètre pédagogique.')}
  }
  return{identity,db,schoolId,doc,object}
}

export async function createPortalDocumentSignedUrl(kind:Angelcare360PortalKind,documentId:string){
  const {db,object}=await documentAuthority(kind,documentId)
  const signed=await db.storage.from(String(object.bucket_id)).createSignedUrl(String(object.object_path),300,{download:true})
  if(signed.error||!signed.data?.signedUrl)throw new Error(`Lien privé indisponible: ${signed.error?.message||'erreur inconnue'}`)
  return signed.data.signedUrl
}

export async function uploadStudentAssignmentAttachment(input:{assignmentId:string;file:VaultFile}){
  const identity=await requirePortalIdentity('student');const schoolId=String(identity.school.id),studentId=String(identity.person.id);const db=await createClient()
  const assignment=await db.from('angelcare360_assignments').select('id,class_id,section_id,status,title').eq('school_id',schoolId).eq('id',input.assignmentId).eq('class_id',identity.person.current_class_id).limit(1).maybeSingle()
  if(assignment.error||!assignment.data)throw new Error('Devoir hors de votre classe.')
  if(assignment.data.section_id&&text(assignment.data.section_id)!==text(identity.person.current_section_id))throw new Error('Devoir hors de votre section.')
  if(!['published','active','open','planned'].includes(text(assignment.data.status)))throw new Error('Ce devoir n’accepte plus de fichier.')
  if(!input.file||typeof input.file.arrayBuffer!=='function')throw new Error('Fichier requis.')
  if(!ALLOWED.has(input.file.type))throw new Error('Format refusé. Formats autorisés: PDF, JPEG, PNG.')
  if(!input.file.size||input.file.size>MAX_BYTES)throw new Error('Le fichier doit être compris entre 1 octet et 15 MiB.')
  const bytes=new Uint8Array(await input.file.arrayBuffer());if(bytes.byteLength!==input.file.size)throw new Error('Taille de fichier incohérente.');if(!validMagic(bytes,input.file.type))throw new Error('Le contenu du fichier ne correspond pas à son type déclaré.')
  const digest=createHash('sha256').update(bytes).digest('hex'),extension=input.file.type==='application/pdf'?'pdf':input.file.type==='image/png'?'png':'jpg',objectId=randomUUID(),fileName=`${safeName(input.file.name.replace(/\.[^.]+$/,''))}.${extension}`,objectPath=`${schoolId}/students/${studentId}/assignments/${input.assignmentId}/${objectId}-${fileName}`,documentCode=`DOC-${objectId.slice(0,8).toUpperCase()}`
  const storage=await db.storage.from(STUDENT_BUCKET).upload(objectPath,bytes,{contentType:input.file.type,cacheControl:'private, max-age=0, no-store',upsert:false});if(storage.error)throw new Error(`Téléversement refusé: ${storage.error.message}`)
  let documentId:string|null=null
  try{
    const created=await db.from('angelcare360_documents').insert({school_id:schoolId,document_code:documentCode,documentable_type:'student',documentable_id:studentId,category:'assignment-submission',title:`Remise · ${text(assignment.data.title,'Devoir')}`,file_name:fileName,file_path:objectPath,storage_provider:'private_storage',mime_type:input.file.type,file_size_bytes:bytes.byteLength,visibility:'student',status:'pending',uploaded_by:identity.appUser.id,created_by:identity.appUser.id,updated_by:identity.appUser.id,metadata_json:{sha256:digest,bucket:STUDENT_BUCKET,governed_vault:true,assignment_id:input.assignmentId,source:'student_portal'}}).select('id').single();if(created.error||!created.data)throw new Error(created.error?.message||'Référence documentaire non créée.');documentId=String(created.data.id)
    const object=await db.from('angelcare360_document_objects').insert({school_id:schoolId,document_id:documentId,subject_type:'student',subject_id:studentId,bucket_id:STUDENT_BUCKET,object_path:objectPath,original_file_name:input.file.name,safe_file_name:fileName,mime_type:input.file.type,size_bytes:bytes.byteLength,sha256:digest,state:'pending',uploaded_by:identity.appUser.id,metadata_json:{document_code:documentCode,assignment_id:input.assignmentId,source:'student_portal'}});if(object.error)throw new Error(object.error.message)
    return{ok:true as const,documentId,documentCode,sha256:digest}
  }catch(error){if(documentId){await db.from('angelcare360_document_objects').delete().eq('school_id',schoolId).eq('document_id',documentId);await db.from('angelcare360_documents').delete().eq('school_id',schoolId).eq('id',documentId)}await db.storage.from(STUDENT_BUCKET).remove([objectPath]);throw error}
}


export async function discardPendingStudentAssignmentAttachment(documentId:string){
  const identity=await requirePortalIdentity('student');const schoolId=String(identity.school.id),studentId=String(identity.person.id);const db=await createClient()
  const document=await db.from('angelcare360_documents').select('id,documentable_id,status,file_path,metadata_json').eq('school_id',schoolId).eq('id',documentId).eq('documentable_type','student').eq('documentable_id',studentId).limit(1).maybeSingle()
  if(document.error||!document.data) return {ok:true as const,removed:false}
  if(text(document.data.status)!=='pending') throw new Error('Seul un fichier de remise encore en attente peut être supprimé par ce parcours.')
  const referenced=await db.from('angelcare360_assignment_submissions').select('id').eq('school_id',schoolId).eq('student_id',studentId).contains('metadata_json',{attachment_document_id:documentId}).limit(1).maybeSingle()
  if(referenced.error) throw new Error(referenced.error.message)
  if(referenced.data) throw new Error('Ce fichier est déjà rattaché à une remise enregistrée.')
  const object=await db.from('angelcare360_document_objects').select('bucket_id,object_path').eq('school_id',schoolId).eq('document_id',documentId).limit(1).maybeSingle()
  if(object.error) throw new Error(object.error.message)
  await db.from('angelcare360_document_objects').delete().eq('school_id',schoolId).eq('document_id',documentId)
  await db.from('angelcare360_documents').delete().eq('school_id',schoolId).eq('id',documentId).eq('status','pending')
  if(object.data?.bucket_id&&object.data?.object_path) await db.storage.from(String(object.data.bucket_id)).remove([String(object.data.object_path)])
  return {ok:true as const,removed:true}
}
