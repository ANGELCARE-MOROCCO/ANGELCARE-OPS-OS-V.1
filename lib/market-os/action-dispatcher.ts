export type MarketActionInput = {
  moduleKey: string
  actionKey: string
  actionLabel: string
  targetId?: string | null
  targetTitle?: string | null
  objectiveId?: string | null
  payload?: Record<string, unknown>
}

export async function dispatchMarketAction(input: MarketActionInput) {
  const res = await fetch("/api/market-os/action-events", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      module_key: input.moduleKey,
      action_key: input.actionKey,
      action_label: input.actionLabel,
      target_id: input.targetId || null,
      target_title: input.targetTitle || null,
      objective_id: input.objectiveId || null,
      payload: input.payload || {},
      actor_name: "User",
    }),
  })

  const json = await res.json()
  if (!res.ok) throw new Error(json.error || "Action failed")
  return json.data
}
