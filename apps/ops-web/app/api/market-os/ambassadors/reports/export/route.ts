import { readBody, withAmbassadorActor } from "@/lib/market-os/ambassadors/api"
import { generateAmbassadorReport } from "@/lib/market-os/ambassadors/server"

export const dynamic = "force-dynamic"

export async function GET(request: Request) {
  return withAmbassadorActor(request, async (actor) => {
    const url = new URL(request.url)
    const reportType = url.searchParams.get("report_type") || "ambassadors"
    const result = await generateAmbassadorReport(actor, { report_type: reportType, title: `Ambassador ${reportType} export` })
    if (!result.ok || !result.data) return result
    return new Response(result.data.csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${result.data.filename}"`,
        "Cache-Control": "no-store, private",
      },
    })
  })
}

export async function POST(request: Request) {
  return withAmbassadorActor(request, async (actor) => generateAmbassadorReport(actor, await readBody(request)))
}
