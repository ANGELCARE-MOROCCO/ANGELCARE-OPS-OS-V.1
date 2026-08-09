import { AccessToken } from "livekit-server-sdk";

export async function createLiveKitToken(params: {
  identity: string;
  name?: string;
  room: string;
  canPublish?: boolean;
  canSubscribe?: boolean;
}) {
  const apiKey = process.env.LIVEKIT_API_KEY;
  const apiSecret = process.env.LIVEKIT_API_SECRET;

  if (!apiKey || !apiSecret) {
    throw new Error("Missing LIVEKIT_API_KEY or LIVEKIT_API_SECRET");
  }

  const token = new AccessToken(apiKey, apiSecret, {
    identity: params.identity,
    name: params.name || params.identity,
  });

  token.addGrant({
    room: params.room,
    roomJoin: true,
    canPublish: params.canPublish ?? true,
    canSubscribe: params.canSubscribe ?? true,
  });

  return token.toJwt();
}
