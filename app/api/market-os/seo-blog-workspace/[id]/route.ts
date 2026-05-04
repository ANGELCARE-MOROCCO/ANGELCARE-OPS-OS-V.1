import { NextResponse } from "next/server"

type RouteContext = {
  params: Promise<{ id: string }>
}

export async function GET(_: Request, context: RouteContext) {
  const { id } = await context.params
  return NextResponse.json({ ok: true, data: null, id })
}

export async function PATCH(req: Request, context: RouteContext) {
  const { id } = await context.params
  const body = await req.json()
  return NextResponse.json({ ok: true, data: { ...body, id } })
}

export async function DELETE(_: Request, context: RouteContext) {
  const { id } = await context.params
  return NextResponse.json({ ok: true, id })
}
