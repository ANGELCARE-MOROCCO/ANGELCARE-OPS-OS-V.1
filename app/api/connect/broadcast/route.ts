import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const body = await req.json();
  return NextResponse.json({
    ok: true,
    broadcast: {
      id: crypto.randomUUID(),
      title: body.title,
      body: body.body,
      priority: body.priority || "normal",
      createdAt: new Date().toISOString(),
    },
  });
}
