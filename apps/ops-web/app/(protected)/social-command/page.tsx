import { redirect } from "next/navigation"
import SocialCommandClient from "./_components/SocialCommandClient"
import { getCurrentUser } from "@/lib/getUser"
import { hasPermission } from "@/lib/auth/permissions"

export const dynamic = "force-dynamic"

export default async function SocialCommandPage() {
  const user = await getCurrentUser()
  if (!user) redirect("/login")
  if (!hasPermission(user, "social-command.view") && !hasPermission(user, "page:/social-command")) redirect("/unauthorized")
  return <SocialCommandClient />
}
