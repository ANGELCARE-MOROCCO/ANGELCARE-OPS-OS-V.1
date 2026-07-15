import { buildAngelcare360Csv } from './csv'
import { getAngelcare360ExportDefinition, listAngelcare360ExportDefinitions } from './export-registry'
import type { Angelcare360ExportDefinition, Angelcare360ExportResult } from '@/types/angelcare360/exports'

export function listAngelcare360Exports() {
  return listAngelcare360ExportDefinitions()
}

export function getAngelcare360Export(exportKey: string): Angelcare360ExportDefinition | null {
  return getAngelcare360ExportDefinition(exportKey)
}

export function buildAngelcare360CsvExport(rows: Array<Record<string, unknown>>, columns?: string[]) {
  return buildAngelcare360Csv(rows, columns)
}

export function buildAngelcare360LockedExportResult(reason: string): Angelcare360ExportResult {
  return {
    ok: false,
    locked: true,
    reason,
  }
}

