
export type ProductionAuditResult = {
  area: string
  status: "pass" | "warning" | "fail"
  detail: string
}

export const contentCommandProductionAudit: ProductionAuditResult[] = [
  { area: "Templates", status: "pass", detail: "API-backed create/edit/delete/clone exists." },
  { area: "Assets", status: "warning", detail: "API endpoints exist; visual cards must be fully hydrated in V63/V64 injection." },
  { area: "Documents", status: "warning", detail: "API endpoints exist; corporate workspace must be fully hydrated." },
  { area: "Tasks", status: "pass", detail: "Task API and approval workflow route exist." },
  { area: "Comments", status: "pass", detail: "Comment API exists." },
  { area: "Uploads", status: "warning", detail: "Upload endpoint added; Supabase bucket must be created manually." },
  { area: "Versions", status: "pass", detail: "Version table and API route added." },
]
