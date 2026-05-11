import type { CsvDatasetType } from "../sync-types"

export const csvDatasetTableMap: Record<CsvDatasetType, string> = {
  content: "market_content_assets",
  tasks: "market_content_tasks",
  partnerships: "market_partnerships",
  leads: "market_leads",
  recruitment: "hr_candidates",
  academy: "academy_trainees",
  ambassadors: "market_ambassadors",
  analytics: "market_analytics_events",
  media: "market_content_media",
  market_intel: "market_intelligence_signals",
}

export function getTargetTableForDataset(datasetType: CsvDatasetType): string {
  return csvDatasetTableMap[datasetType]
}