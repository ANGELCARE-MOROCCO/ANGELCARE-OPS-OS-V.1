import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const body = await req.json();
  return NextResponse.json({
    callLog: {
      id: crypto.randomUUID(),
      callerId: body.callerId,
      receiverId: body.receiverId,
      roomName: body.roomName,
      type: body.type,
      status: body.status,
      createdAt: new Date().toISOString(),
    },
  });
}
