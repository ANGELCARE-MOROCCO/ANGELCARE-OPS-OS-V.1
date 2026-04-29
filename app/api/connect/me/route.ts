import { NextResponse } from 'next/server'
import { getCurrentAppUser } from '@/lib/auth/session'

export async function GET() {
  const user = await getCurrentAppUser()

  if (!user?.id) {
    return NextResponse.json({ user: null }, { status: 401 })
  }

  const safeUser = user as any

  return NextResponse.json({
    user: {
      id: String(safeUser.id),
      name:
        safeUser.full_name ||
        safeUser.name ||
        safeUser.username ||
        safeUser.email ||
        'AngelCare User',
      full_name: safeUser.full_name || safeUser.name || null,
      username: safeUser.username || null,
      role: safeUser.role || 'Staff',
      department: safeUser.department || 'AngelCare',
    },
  })
}