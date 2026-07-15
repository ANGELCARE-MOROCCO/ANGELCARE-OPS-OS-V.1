import { NextRequest } from 'next/server'
import { buildAngelcare360CsvExport, getAngelcare360Export } from '@/lib/angelcare360/exports/export-engine'
import { listOperatorInvoices, listOperatorPayments } from '@/lib/angelcare360/operator/billing'
import { listOperatorClients } from '@/lib/angelcare360/operator/clients'
import { writeOperatorAuditLog } from '@/lib/angelcare360/operator/audit'
import { toRecord } from '@/lib/angelcare360/operator/shared'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

function csvResponse(csv: string, filename: string) {
  return new Response(csv, {
    status: 200,
    headers: {
      'content-type': 'text/csv; charset=utf-8',
      'content-disposition': `attachment; filename="${filename}"`,
      'cache-control': 'no-store',
    },
  })
}

function jsonError(message: string, status = 400) {
  return new Response(JSON.stringify({ ok: false, error: message }), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8' },
  })
}

export async function GET(request: NextRequest) {
  try {
    const exportKey = request.nextUrl.searchParams.get('exportKey') || ''
    if (!exportKey) return jsonError('La clé d’export est requise.', 422)

    const definition = getAngelcare360Export(exportKey)
    if (!definition) return jsonError('L’export demandé est introuvable.', 404)
    if (!definition.csvAvailable) return jsonError(definition.lockedReason || 'Export verrouillé.', 409)

    let rows: Array<Record<string, unknown>> = []
    let filename = 'angelcare360-export.csv'

    if (exportKey === 'operator-clients-csv') {
      rows = (await listOperatorClients()).map((row) => toRecord(row))
      filename = 'angelcare360-clients.csv'
    } else if (exportKey === 'operator-invoices-csv') {
      rows = (await listOperatorInvoices()).map((row) => toRecord(row))
      filename = 'angelcare360-factures.csv'
    } else if (exportKey === 'operator-payments-csv') {
      rows = (await listOperatorPayments()).map((row) => toRecord(row))
      filename = 'angelcare360-paiements.csv'
    } else {
      return jsonError('Cet export CSV n’est pas encore branché.', 409)
    }

    const csv = buildAngelcare360CsvExport(rows)
    await writeOperatorAuditLog({
      module: 'exports',
      action: 'csv.downloaded',
      entityType: 'angelcare360_exports',
      entityId: exportKey,
      severity: 'notice',
      afterData: { exportKey, rowCount: rows.length },
    })
    return csvResponse(csv, filename)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Impossible de générer l’export.'
    const status = /autorisation|accès|connecté/i.test(message) ? 403 : 500
    return jsonError(message, status)
  }
}
