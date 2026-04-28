import { NextResponse } from "next/server";

// Replace demo memory with Prisma once your Connect schema is migrated.
const demoMessages: any[] = [];

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const roomId = searchParams.get("roomId");
  return NextResponse.json({ messages: roomId ? demoMessages.filter(m => m.roomId === roomId) : demoMessages });
}

export async function POST(req: Request) {
  const body = await req.json();
  const message = {
    id: crypto.randomUUID(),
    roomId: body.roomId,
    senderId: body.senderId,
    body: body.body,
    createdAt: new Date().toISOString(),
  };
  demoMessages.push(message);
  return NextResponse.json({ message });
}
