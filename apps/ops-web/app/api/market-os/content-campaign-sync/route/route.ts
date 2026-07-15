import { NextResponse } from "next/server"
import {
  calculateRequirementStatus,
  defaultCampaignContentRequirements,
} from "@/lib/market-os/content-campaign-sync"

export async function GET() {
  const data = defaultCampaignContentRequirements.map((item) => ({
    ...item,
    status: calculateRequirementStatus(item),
  }))

  return NextResponse.json({ ok: true, data })
}
