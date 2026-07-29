import { apiError, envelope, readTable, requireCapitalApiActor } from "@/lib/ac-capital-os/server/mz15-api";
export const dynamic="force-dynamic";
export async function GET(){try{await requireCapitalApiActor();const [reports,sections,exports]=await Promise.all([readTable("ac_capital_strategy_reports",200),readTable("ac_capital_strategy_report_sections",400),readTable("ac_capital_report_exports",200)]);return Response.json(envelope({reports,sections,exports}));}catch(reason){return apiError(reason)}}
