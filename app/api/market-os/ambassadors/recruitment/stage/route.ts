import { ambassadorJson, readBody } from "@/lib/market-os/ambassadors/api"
import { moveRecruitmentStage } from "@/lib/market-os/ambassadors/server"

export const dynamic = "force-dynamic"

export async function PATCH(request: Request) {
  return ambassadorJson(await moveRecruitmentStage(await readBody(request)))
}
