import { NextResponse } from "next/server"
import { createEmailOSCoreDb } from "@/lib/email-os-core/db"
import { makeEmailOSId } from "@/lib/email-os-core/schema"

export async function POST() {
  try {
    const db = createEmailOSCoreDb()

    const permissions = [
      ["admin","email.manage"],
      ["admin","executive.control"],
      ["operations","thread.handle"],
      ["operations","thread.assign"],
      ["support","thread.reply"],
      ["viewer","dashboard.read"]
    ].map(([role, permission]) => ({
      id: makeEmailOSId(),
      role_key: role,
      permission_key: permission,
      permission_scope: "global"
    }))

    await db.from("email_os_core_role_permissions").insert(permissions)

    return NextResponse.json({
      ok: true,
      data: {
        permissions: permissions.length
      }
    })
  } catch {
    return NextResponse.json({ ok: false, error: "Permission seed failed" }, { status: 500 })
  }
}
