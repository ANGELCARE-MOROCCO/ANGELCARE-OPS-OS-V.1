import type { WhatsAppContextType } from "@/lib/whatsapp-desktop/context-types"
import type { WhatsAppModuleAdapter } from "./base"
import { b2bAdapter } from "./b2b"
import { academyAdapter } from "./academy"
import { trainingHubAdapter } from "./traininghub"
import { customerAdapter } from "./customer"
import { admissionsAdapter } from "./admissions"
import { supportAdapter } from "./support"
import { financeAdapter } from "./finance"
import { recruitmentAdapter } from "./recruitment"
import { refferqAdapter } from "./refferq"
import { operationsAdapter } from "./operations"

export const WHATSAPP_MODULE_ADAPTERS: WhatsAppModuleAdapter[] = [
  b2bAdapter, academyAdapter, trainingHubAdapter, customerAdapter, admissionsAdapter,
  supportAdapter, financeAdapter, recruitmentAdapter, refferqAdapter, operationsAdapter,
]

export function adapterForContext(type: WhatsAppContextType) {
  return WHATSAPP_MODULE_ADAPTERS.find((adapter) => adapter.contextTypes.includes(type)) || null
}
