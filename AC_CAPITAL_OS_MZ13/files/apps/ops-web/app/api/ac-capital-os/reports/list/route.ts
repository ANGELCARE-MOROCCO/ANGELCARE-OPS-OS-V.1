import { listAcCapitalReports } from "../../../../../lib/ac-capital-os/server/reports";

export const dynamic = "force-dynamic";

export async function GET() {
  return Response.json(await listAcCapitalReports());
}
