import { requireSocialCommandActor, requireSocialCommandRoutePermission, socialError, socialOk } from "@/lib/social-command/auth"
import { inspectInstagramWebhookSubscriptions, reconcileInstagramWebhookSubscriptions } from "@/lib/social-command/instagram-webhook"
import { auditSocial } from "@/lib/social-command/repository"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

export async function GET() {
  try {
    const auth = await requireSocialCommandActor()
    if (!auth.ok) return auth.response
    const access = requireSocialCommandRoutePermission(auth.actor, "GET", "instagram-webhook/subscriptions"); if (!access.ok) return access.response
    const snapshot = await inspectInstagramWebhookSubscriptions()
    await auditSocial(auth.actor.id, "instagram_webhook.subscription.inspect", "instagram_webhook_subscription", snapshot.accountId, {
      source: snapshot.source,
      healthy: snapshot.healthy,
      subscribedFields: snapshot.subscribedFields,
      missingFields: snapshot.missingFields,
    })
    return socialOk(snapshot)
  } catch (error) {
    return socialError(error, 502, { code: "INSTAGRAM_WEBHOOK_SUBSCRIPTION_INSPECTION_FAILED" })
  }
}

export async function POST() {
  try {
    const auth = await requireSocialCommandActor()
    if (!auth.ok) return auth.response
    const access = requireSocialCommandRoutePermission(auth.actor, "POST", "instagram-webhook/subscriptions"); if (!access.ok) return access.response
    const result = await reconcileInstagramWebhookSubscriptions()
    await auditSocial(auth.actor.id, "instagram_webhook.subscription.reconcile", "instagram_webhook_subscription", result.snapshot.accountId, {
      source: result.snapshot.source,
      healthy: result.snapshot.healthy,
      subscribedFields: result.snapshot.subscribedFields,
      missingFields: result.snapshot.missingFields,
    })
    return socialOk(result)
  } catch (error) {
    return socialError(error, 502, { code: "INSTAGRAM_WEBHOOK_SUBSCRIPTION_RECONCILIATION_FAILED" })
  }
}
