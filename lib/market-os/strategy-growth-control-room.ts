export type Strategy = {
  id: string
  title: string
  owner: string
  status: "draft" | "active" | "blocked" | "completed"
  priority: "P0" | "P1" | "P2"
  revenue: number
  budget: number
  progress: number
  risk: "low" | "medium" | "high"
  nextAction: string
}

export const demoStrategies: Strategy[] = [
  {
    id: "1",
    title: "Postpartum Growth System",
    owner: "Marketing Director",
    status: "active",
    priority: "P0",
    revenue: 450000,
    budget: 85000,
    progress: 62,
    risk: "high",
    nextAction: "Launch premium offer campaign",
  },
]
