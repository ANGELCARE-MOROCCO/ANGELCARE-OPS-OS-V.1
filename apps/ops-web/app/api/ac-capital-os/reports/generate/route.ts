import { generateAcCapitalReport, type AcCapitalReportType } from "../../../../../lib/ac-capital-os/server/reports";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  const reportType = String(body.reportType || "Founder Capital Brief") as AcCapitalReportType;
  const format = body.format === "html" || body.format === "json" ? body.format : "markdown";
  return Response.json(await generateAcCapitalReport(reportType, format));
}
