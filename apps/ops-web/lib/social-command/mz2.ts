import { engagementBootstrap } from "@/lib/social-command/engagement"
import { listAutomations, listAutomationRuns } from "@/lib/social-command/automation"
import { aiUsageSummary } from "@/lib/social-command/ai"
import { capabilityMatrix, performanceSummary } from "@/lib/social-command/intelligence"
import { webhookHealth } from "@/lib/social-command/webhook"
import type { SocialMZ2Bootstrap } from "@/lib/social-command/types"

export async function mz2Bootstrap(): Promise<SocialMZ2Bootstrap> {
  const [engagement, automations, automationRuns, capabilities, webhook, performance, ai] = await Promise.all([
    engagementBootstrap(), listAutomations(), listAutomationRuns(120), capabilityMatrix(), webhookHealth(), performanceSummary(), aiUsageSummary(),
  ])
  return {
    conversations: engagement.conversations,
    comments: engagement.comments,
    mentions: engagement.mentions,
    automations,
    automationRuns,
    capabilities,
    webhook,
    performance,
    ai: {
      configured: ai.configured,
      operations24h: ai.operations24h,
      failed24h: ai.failed24h,
      lastOperationAt: ai.lastOperationAt,
    },
  }
}
