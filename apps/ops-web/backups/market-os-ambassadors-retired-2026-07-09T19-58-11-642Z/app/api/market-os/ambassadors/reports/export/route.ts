import { ambassadorJson, readBody } from "@/lib/market-os/ambassadors/api"
import { generateAmbassadorReport } from "@/lib/market-os/ambassadors/server"

export const dynamic = "force-dynamic"

export async function GET() {
  const result = await generateAmbassadorReport({ report_type: "ambassadors", title: "Ambassador export" })
  const csv = result.data?.csv || ""
  const filename = result.data?.filename || `angelcare-ambassadors-${new Date().toISOString().slice(0, 10)}.csv`
  return new Response(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  })
}

export async function POST(request: Request) {
  return ambassadorJson(await generateAmbassadorReport(await readBody(request)))
}
