export type ImportQueueItem = {
  id: string
  dataset: string
  status: "pending" | "approved" | "rejected" | "processing"
  createdAt: string
}

export const importQueueSeed: ImportQueueItem[] = [
  {
    id: "QUEUE-001",
    dataset: "content",
    status: "pending",
    createdAt: new Date().toISOString(),
  },
]