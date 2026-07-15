import { NextRequest, NextResponse } from "next/server";
import { AccessToken } from "livekit-server-sdk";
import { getCurrentAppUser } from "@/lib/auth/session";

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentAppUser();
    if (!user?.id) {
      return NextResponse.json(
        { ok: false, data: null, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { roomName, participantName, participantId } = await req.json();

    if (!roomName || !participantName) {
      return NextResponse.json(
        { ok: false, data: null, error: "Missing roomName or participantName" },
        { status: 400 }
      );
    }

    if (participantId && String(participantId) !== String(user.id)) {
      return NextResponse.json(
        { ok: false, data: null, error: "Cannot request a LiveKit token for another Connect user" },
        { status: 403 }
      );
    }

    const apiKey = process.env.LIVEKIT_API_KEY;
    const apiSecret = process.env.LIVEKIT_API_SECRET;
    const livekitUrl = process.env.NEXT_PUBLIC_LIVEKIT_URL;

    if (!apiKey || !apiSecret || !livekitUrl) {
      return NextResponse.json(
        { ok: false, data: null, error: "LiveKit environment variables missing. Calls can ring and be recorded, but media cannot connect until LiveKit is configured." },
        { status: 500 }
      );
    }

    const token = new AccessToken(apiKey, apiSecret, {
      identity: String(user.id),
      name: participantName,
    });

    token.addGrant({
      roomJoin: true,
      room: roomName,
      canPublish: true,
      canSubscribe: true,
      canPublishData: true,
    });

    const data = {
      token: await token.toJwt(),
      url: livekitUrl,
    };
    return NextResponse.json({ ok: true, data, ...data, error: null });
  } catch (error) {
    return NextResponse.json(
      { ok: false, data: null, error: error instanceof Error ? error.message : "Failed to create LiveKit token" },
      { status: 500 }
    );
  }
}
