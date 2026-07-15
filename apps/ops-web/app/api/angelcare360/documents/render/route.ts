import { NextRequest } from 'next/server'
import { Buffer } from 'node:buffer'
import { generateAngelcare360A4PdfBytes, getAngelcare360A4PdfFilename } from '@/lib/angelcare360/documents/pdf'
import {
  buildCustomerExportFileA4Model,
  buildCustomerGeneratedDocumentA4Model,
  buildOperatorInvoiceA4Model,
  buildOperatorReceiptA4Model,
  buildOperatorStatementA4Model,
} from '@/lib/angelcare360/documents/builders'
import { getOperatorInvoiceById, getOperatorPaymentById } from '@/lib/angelcare360/operator/billing'
import { getOperatorClientById } from '@/lib/angelcare360/operator/clients'
import { requireAngelcare360OperatorPermission } from '@/lib/angelcare360/operator/access'
import { getAngelcare360GeneratedDocumentById, getAngelcare360ExportFileById, getAngelcare360DocumentsOverview, getAngelcare360ExportOverview } from '@/lib/angelcare360/server/reports'
import { getAngelcare360AccessContext, requireAngelcare360Permission } from '@/lib/angelcare360/server'
import { recordAngelcare360AuditEventServer } from '@/lib/angelcare360/server/audit'
import { writeOperatorAuditLog } from '@/lib/angelcare360/operator/audit'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

function jsonError(message: string, status = 400) {
  return new Response(JSON.stringify({ ok: false, error: message }), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8' },
  })
}

function pdfResponse(bytes: Uint8Array, filename: string) {
  return new Response(Buffer.from(bytes), {
    status: 200,
    headers: {
      'content-type': 'application/pdf',
      'content-disposition': `inline; filename="${filename}"`,
      'cache-control': 'no-store',
    },
  })
}

export async function GET(request: NextRequest) {
  try {
    const kind = request.nextUrl.searchParams.get('kind') || ''
    const id = request.nextUrl.searchParams.get('id') || ''
    const download = request.nextUrl.searchParams.get('download') === '1'

    if (!kind || !id) return jsonError('La requête d’impression est incomplète.', 422)

    if (kind === 'operator-invoice') {
      await requireAngelcare360OperatorPermission('operator.billing.view')
      const invoice = await getOperatorInvoiceById(id)
      if (!invoice) return jsonError('La facture est introuvable.', 404)
      const invoiceRow = invoice as unknown as Record<string, unknown>
      const model = buildOperatorInvoiceA4Model({
        invoice,
        client: invoice.client || null,
        billingAccount: invoice.billing_account || null,
        subscription: invoice.subscription || null,
      })
      const bytes = await generateAngelcare360A4PdfBytes(model)
      await writeOperatorAuditLog({
        module: 'billing',
        action: 'invoice.printed',
        entityType: 'angelcare360_operator_invoices',
        entityId: id,
        clientId: String(invoiceRow.client_id || ''),
        severity: 'notice',
        metadata: { kind, download },
      })
      return pdfResponse(bytes, getAngelcare360A4PdfFilename(model))
    }

    if (kind === 'operator-receipt') {
      await requireAngelcare360OperatorPermission('operator.billing.view')
      const payment = await getOperatorPaymentById(id)
      if (!payment) return jsonError('Le reçu est introuvable.', 404)
      const paymentRow = payment as unknown as Record<string, unknown>
      const model = buildOperatorReceiptA4Model({
        payment,
        client: payment.client || payment.invoice?.client || null,
        invoice: payment.invoice || null,
      })
      const bytes = await generateAngelcare360A4PdfBytes(model)
      await writeOperatorAuditLog({
        module: 'billing',
        action: 'receipt.printed',
        entityType: 'angelcare360_operator_payments',
        entityId: id,
        clientId: String(paymentRow.client_id || payment.invoice?.client_id || ''),
        severity: 'notice',
        metadata: { kind, download },
      })
      return pdfResponse(bytes, getAngelcare360A4PdfFilename(model))
    }

    if (kind === 'operator-statement') {
      await requireAngelcare360OperatorPermission('operator.billing.view')
      const client = await getOperatorClientById(id)
      if (!client) return jsonError('L’état de compte est introuvable.', 404)
      const model = buildOperatorStatementA4Model({
        client,
        invoices: client.invoices || [],
        payments: client.payments || [],
      })
      const bytes = await generateAngelcare360A4PdfBytes(model)
      await writeOperatorAuditLog({
        module: 'billing',
        action: 'client_statement.printed',
        entityType: 'angelcare360_operator_clients',
        entityId: id,
        clientId: id,
        severity: 'notice',
        metadata: { kind, download },
      })
      return pdfResponse(bytes, getAngelcare360A4PdfFilename(model))
    }

    if (kind === 'customer-generated-document') {
      const context = await getAngelcare360AccessContext()
      if (!context?.school) return jsonError('Aucun établissement actif n’est disponible.', 403)
      await requireAngelcare360Permission('documents.view', { context })
      const document = await getAngelcare360GeneratedDocumentById({ schoolId: context.school.id, id })
      if (!document) return jsonError('Le document généré est introuvable.', 404)
      const overview = await getAngelcare360DocumentsOverview({ schoolId: context.school.id })
      const documentRow = document as Record<string, unknown>
      const metadata = (documentRow.metadata_json as Record<string, unknown> | null) || {}
      const model = buildCustomerGeneratedDocumentA4Model({
        ...documentRow,
        school_name: context.school.name,
        school_id: context.school.id,
        title: documentRow.title,
        category: documentRow.category,
        file_name: documentRow.file_name,
        status: documentRow.status,
        visibility: documentRow.visibility,
        storage_provider: documentRow.storage_provider,
        file_path: documentRow.file_path,
        file_size_bytes: documentRow.file_size_bytes,
        document_code: documentRow.document_code,
        document_state: metadata.document_state || 'active',
        context_label: overview?.schoolName || context.school.name,
      })
      const bytes = await generateAngelcare360A4PdfBytes(model)
      await recordAngelcare360AuditEventServer({
        category: 'documents',
        module: 'documents',
        action: 'generated_document.printed',
        entityType: 'angelcare360_documents',
        entityId: id,
        severity: 'notice',
        afterData: { id, kind, download },
      })
      return pdfResponse(bytes, getAngelcare360A4PdfFilename(model))
    }

    if (kind === 'customer-export-file') {
      const context = await getAngelcare360AccessContext()
      if (!context?.school) return jsonError('Aucun établissement actif n’est disponible.', 403)
      await requireAngelcare360Permission('exports.view', { context })
      const exportFile = await getAngelcare360ExportFileById({ schoolId: context.school.id, id })
      if (!exportFile) return jsonError('Le fichier d’export est introuvable.', 404)
      const overview = await getAngelcare360ExportOverview({ schoolId: context.school.id })
      const exportRow = exportFile as Record<string, unknown>
      const metadata = (exportRow.metadata_json as Record<string, unknown> | null) || {}
      const model = buildCustomerExportFileA4Model({
        ...exportRow,
        school_name: context.school.name,
        school_id: context.school.id,
        export_code: exportRow.export_code,
        file_name: exportRow.file_name,
        export_format: exportRow.export_format,
        status: exportRow.status,
        storage_provider: exportRow.storage_provider,
        file_path: exportRow.file_path,
        file_size_bytes: exportRow.file_size_bytes,
        context_label: overview?.schoolName || context.school.name,
        document_state: metadata.document_state || 'active',
      })
      const bytes = await generateAngelcare360A4PdfBytes(model)
      await recordAngelcare360AuditEventServer({
        category: 'exports',
        module: 'exports',
        action: 'export_file.printed',
        entityType: 'angelcare360_export_files',
        entityId: id,
        severity: 'notice',
        afterData: { id, kind, download },
      })
      return pdfResponse(bytes, getAngelcare360A4PdfFilename(model))
    }

    return jsonError('Le type d’impression demandé est inconnu.', 400)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Impossible de générer le document.'
    const status = /autorisation|accès|connecté/i.test(message) ? 403 : 500
    return jsonError(message, status)
  }
}
