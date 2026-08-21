import { governRoute } from '@/lib/runtime/governor/route'
import { apiError, envelope, readTable, requireCapitalApiActor } from "@/lib/ac-capital-os/server/mz15-api";
export const dynamic="force-dynamic";
async function GET__angelcareGovernedImpl(){try{await requireCapitalApiActor();const [reports,sections,exports]=await Promise.all([readTable("ac_capital_strategy_reports",200),readTable("ac_capital_strategy_report_sections",400),readTable("ac_capital_report_exports",200)]);return Response.json(envelope({reports,sections,exports}));}catch(reason){return apiError(reason)}}

export const GET = governRoute(
  {
    workloadClass: 'heavy',
    operation: 'GET:/api/ac-capital-os/reports/list',
  },
  GET__angelcareGovernedImpl,
)
