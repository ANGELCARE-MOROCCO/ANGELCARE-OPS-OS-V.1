export type DatasetColumn = {
  key: string
  label: string
  required: boolean
  type: "text" | "date" | "number" | "status" | "email" | "url"
  description: string
}

export type DatasetSchema = {
  id: string
  label: string
  description: string
  targetTable: string
  columns: DatasetColumn[]
}

export const csvDatasetRegistry: DatasetSchema[] = [
  {
    id: "content",
    label: "Content Assets",
    description: "Posts, captions, campaign assets, service sheets and marketing content.",
    targetTable: "market_content_assets",
    columns: [
      { key: "id", label: "ID", required: true, type: "text", description: "Unique content id." },
      { key: "title", label: "Title", required: true, type: "text", description: "Content title." },
      { key: "status", label: "Status", required: true, type: "status", description: "draft, review, approved, scheduled, published, blocked." },
      { key: "owner", label: "Owner", required: true, type: "text", description: "Responsible person." },
      { key: "channel", label: "Channel", required: false, type: "text", description: "Marketing channel." },
      { key: "campaign", label: "Campaign", required: false, type: "text", description: "Linked campaign." },
      { key: "due_date", label: "Due Date", required: false, type: "date", description: "Internal production deadline." },
      { key: "scheduled_date", label: "Scheduled Date", required: false, type: "date", description: "Publishing date." },
    ],
  },
  {
    id: "tasks",
    label: "Operational Tasks",
    description: "Execution tasks assigned to agents or departments.",
    targetTable: "market_content_tasks",
    columns: [
      { key: "id", label: "ID", required: true, type: "text", description: "Unique task id." },
      { key: "title", label: "Title", required: true, type: "text", description: "Task title." },
      { key: "status", label: "Status", required: true, type: "status", description: "todo, doing, done, blocked." },
      { key: "owner", label: "Owner", required: true, type: "text", description: "Task owner." },
      { key: "priority", label: "Priority", required: false, type: "text", description: "Low, Medium, High, Critical." },
      { key: "due_date", label: "Due Date", required: false, type: "date", description: "Task deadline." },
    ],
  },
  {
    id: "partnerships",
    label: "Partnership Pipeline",
    description: "Clinics, pharmacies, institutions and partner opportunities.",
    targetTable: "market_partnerships",
    columns: [
      { key: "id", label: "ID", required: true, type: "text", description: "Unique partner id." },
      { key: "organization", label: "Organization", required: true, type: "text", description: "Partner organization." },
      { key: "city", label: "City", required: false, type: "text", description: "City in Morocco." },
      { key: "status", label: "Status", required: true, type: "status", description: "new, contacted, meeting, negotiation, active, lost." },
      { key: "owner", label: "Owner", required: true, type: "text", description: "Responsible person." },
      { key: "next_action", label: "Next Action", required: false, type: "text", description: "Next operational step." },
    ],
  },
  {
    id: "leads",
    label: "Leads",
    description: "Inbound prospects, service inquiries and potential clients.",
    targetTable: "market_leads",
    columns: [
      { key: "id", label: "ID", required: true, type: "text", description: "Unique lead id." },
      { key: "name", label: "Name", required: true, type: "text", description: "Lead name." },
      { key: "phone", label: "Phone", required: false, type: "text", description: "Phone number." },
      { key: "status", label: "Status", required: true, type: "status", description: "new, contacted, qualified, won, lost." },
      { key: "source", label: "Source", required: false, type: "text", description: "Source channel." },
      { key: "owner", label: "Owner", required: true, type: "text", description: "Responsible person." },
    ],
  },
]

export function getDatasetSchema(id: string) {
  return csvDatasetRegistry.find((dataset) => dataset.id === id)
}