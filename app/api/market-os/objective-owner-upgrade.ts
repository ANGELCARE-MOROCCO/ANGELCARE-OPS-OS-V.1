import { createClient } from "@/lib/supabase/server"

export async function assignOwner(objectiveId: string, userId: string) {
  const supabase = await createClient()

  await supabase
    .from("market_strategy_objectives")
    .update({ owner_id: userId })
    .eq("id", objectiveId)
}
