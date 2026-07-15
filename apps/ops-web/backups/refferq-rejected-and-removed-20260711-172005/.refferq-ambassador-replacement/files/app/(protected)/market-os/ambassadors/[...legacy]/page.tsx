import { redirect } from "next/navigation"

export const dynamic = "force-dynamic"

export default function LegacyAmbassadorRouteRetired() {
  redirect("/market-os/ambassadors/refferq")
}
