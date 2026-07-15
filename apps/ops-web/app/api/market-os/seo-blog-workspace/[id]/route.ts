import { NextResponse } from "next/server"

export async function GET(_: Request, { params }: { params: { id: string } }) {
  return NextResponse.json({ ok: true, data: null, id: params.id })
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const body = await req.json()
  return NextResponse.json({ ok: true, data: { ...body, id: params.id } })
}

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  return NextResponse.json({ ok: true, id: params.id })
}
