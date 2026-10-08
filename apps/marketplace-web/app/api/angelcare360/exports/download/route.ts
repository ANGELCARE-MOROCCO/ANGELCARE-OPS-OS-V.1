import { publicAngelcare360Error } from '@/lib/angelcare360/server/public-error'
import { NextRequest } from 'next/server'
import { Buffer } from 'node:buffer'
import { buildAngelcare360CsvExport, getAngelcare360Export } from '@/lib/angelcare360/exports/export-engine'
import { buildAngelcare360Xlsx } from '@/lib/angelcare360/exports/xlsx'
import { generateAngelcare360A4PdfBytes } from '@/lib/angelcare360/documents/pdf'
import { listOperatorInvoices, listOperatorPayments } from '@/lib/angelcare360/operator/billing'
import { listOperatorClients } from '@/lib/angelcare360/operator/clients'
import { writeOperatorAuditLog } from '@/lib/angelcare360/operator/audit'
import { toRecord } from '@/lib/angelcare360/operator/shared'
import { createClient } from '@/lib/supabase/server'
import { getAngelcare360AccessContext, requireAngelcare360Permission } from '@/lib/angelcare360/server'
import { recordAngelcare360AuditEventServer } from '@/lib/angelcare360/server/audit'
import type { Angelcare360ExportFormat } from '@/types/angelcare360/exports'

export const runtime='nodejs'; export const dynamic='force-dynamic'
const PAGE_SIZE=900
type DatabaseClient = Awaited<ReturnType<typeof createClient>>

function response(bytes:BodyInit, contentType:string, filename:string){return new Response(bytes,{status:200,headers:{'content-type':contentType,'content-disposition':`attachment; filename="${filename}"`,'cache-control':'no-store'}})}
function jsonError(message:string,status=400){return new Response(JSON.stringify({ok:false,error:message}),{status,headers:{'content-type':'application/json; charset=utf-8'}})}
function exportRows(value: unknown): Array<Record<string, unknown>> {
  if (!Array.isArray(value)) return []

  return value.filter(
    (row): row is Record<string, unknown> =>
      typeof row === 'object'
      && row !== null
      && !Array.isArray(row),
  )
}

async function paged(
  client: DatabaseClient,
  table: string,
  select: string,
  schoolId: string,
  order = 'id',
) {
  const rows: Array<Record<string, unknown>> = []

  for (
    let from = 0;
    from < 50000;
    from += PAGE_SIZE
  ) {
    const { data, error } = await client
      .from(table)
      .select(select)
      .eq('school_id', schoolId)
      .order(order, { ascending: true })
      .range(from, from + PAGE_SIZE - 1)

    if (error) {
      throw new Error(error.message)
    }

    const batch = exportRows(data)

    rows.push(...batch)

    if (batch.length < PAGE_SIZE) {
      break
    }
  }

  return rows
}
function pdfModel(title:string, reference:string, schoolName:string, rows:Array<Record<string,unknown>>){const columns=[...new Set(rows.slice(0,50).flatMap(r=>Object.keys(r)))].slice(0,8);return {templateKey:'enterprise-export',title,family:'Exports établissement',owner:'customer' as const,referenceCode:reference,version:'1.0',issueDate:new Date().toISOString().slice(0,10),confidentiality:'internal' as const,preparedBy:'SANILA Operating System',schoolName,summaryLines:[`${rows.length} ligne(s) exportée(s).`],table:{headers:columns,rows:rows.map(r=>columns.map(c=>String(r[c]??'')))},footerNote:'Export généré à partir des données autorisées de l’établissement.'}}

export async function GET(request:NextRequest){try{
  const exportKey=request.nextUrl.searchParams.get('exportKey')||''; const format=request.nextUrl.searchParams.get('format')||'csv'; if(!exportKey)return jsonError('La clé d’export est requise.',422)
  const definition=getAngelcare360Export(exportKey); if(!definition)return jsonError('L’export demandé est introuvable.',404)
  if(!definition.supportedFormats.includes(format as Angelcare360ExportFormat))return jsonError('Ce format n’est pas disponible pour cet export.',409)
  let rows:Array<Record<string,unknown>>=[]; let base='sanila-export'; let customerSchoolName='SANILA'
  if(definition.scope==='operator'){
    if(exportKey==='operator-clients-csv'){rows=(await listOperatorClients()).map(toRecord);base='sanila-clients'}
    else if(exportKey==='operator-invoices-csv'){rows=(await listOperatorInvoices()).map(toRecord);base='sanila-factures'}
    else if(exportKey==='operator-payments-csv'){rows=(await listOperatorPayments()).map(toRecord);base='sanila-paiements'}
    else return jsonError('Export opérateur non branché.',409)
  }else{
    const context=await getAngelcare360AccessContext(); if(!context?.school)return jsonError('Aucun établissement actif.',403); await requireAngelcare360Permission('exports.view',{context}); customerSchoolName=context.school.name; const db=await createClient()
    if(exportKey==='customer-students-csv'){rows=await paged(db,'angelcare360_students','id,student_code,full_name,first_name,last_name,current_class_id,current_section_id,admission_status,status,created_at',context.school.id,'student_code');base='sanila-eleves'}
    else if(exportKey==='customer-attendance-csv'){rows=await paged(db,'angelcare360_attendance_records','id,attendance_session_id,student_id,attendance_status,minutes_late,justification_required,note,status,created_at',context.school.id,'id');base='sanila-presences'}
    else return jsonError('Export établissement non branché.',409)
  }
  if(format==='json') return response(JSON.stringify({exportKey,rows},null,2),'application/json; charset=utf-8',`${base}.json`)
  if(format==='csv') {const csv=buildAngelcare360CsvExport(rows); await log(definition.scope,exportKey,rows.length,'csv'); return response(csv,'text/csv; charset=utf-8',`${base}.csv`)}
  if(format==='xlsx'){const bytes=await buildAngelcare360Xlsx(rows,definition.title); await log(definition.scope,exportKey,rows.length,'xlsx'); return response(Buffer.from(bytes),'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',`${base}.xlsx`)}
  if(format==='pdf_a4'){const bytes=await generateAngelcare360A4PdfBytes(pdfModel(definition.title,`EXP-${new Date().toISOString().slice(0,10).replaceAll('-','')}`,customerSchoolName,rows)); await log(definition.scope,exportKey,rows.length,'pdf'); return response(Buffer.from(bytes),'application/pdf',`${base}.pdf`)}
  return jsonError('Format inconnu.',400)
  async function log(scope:string,key:string,count:number,kind:string){if(scope==='operator')await writeOperatorAuditLog({module:'exports',action:`${kind}.downloaded`,entityType:'angelcare360_exports',entityId:key,severity:'notice',afterData:{exportKey:key,rowCount:count}});else await recordAngelcare360AuditEventServer({category:'exports',module:'exports',action:`${kind}.downloaded`,entityType:'angelcare360_exports',entityId:key,severity:'notice',afterData:{exportKey:key,rowCount:count}})}
}catch(error){const message=publicAngelcare360Error(error);return jsonError(message,/autorisation|accès|connecté/i.test(message)?403:500)}}
