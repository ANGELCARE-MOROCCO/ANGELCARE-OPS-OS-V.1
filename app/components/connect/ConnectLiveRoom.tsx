"use client";

import { useEffect, useState } from "react";
import {
  LiveKitRoom,
  VideoConference,
  ControlBar,
  RoomAudioRenderer,
} from "@livekit/components-react";
import "@livekit/components-styles";
import { Loader2, PhoneOff, Video, Mic, Volume2 } from "lucide-react";

type CallType = "audio" | "video";

type ConnectLiveRoomProps = {
  roomName: string;
  participantName: string;
  participantId?: string;
  type: CallType;
  onLeave: () => void;
};

export default function ConnectLiveRoom({
  roomName,
  participantName,
  participantId,
  type,
  onLeave,
}: ConnectLiveRoomProps) {
  const [token, setToken] = useState<string | null>(null);
  const [url, setUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(false);

  const isVideo = type === "video";

  useEffect(() => {
    let mounted = true;

    async function loadToken() {
      try {
        setLoading(true);
        setError(null);

        const res = await fetch("/api/connect/livekit-token", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ roomName, participantName, participantId }),
        });

        const data = await res.json();

        if (!res.ok) {
          throw new Error(data?.error || "Failed to create LiveKit token");
        }

        if (!mounted) return;
        setToken(data.token);
        setUrl(data.url);
      } catch (err: unknown) {
        if (!mounted) return;
        setError(err instanceof Error ? err.message : "LiveKit connection failed");
      } finally {
        if (mounted) setLoading(false);
      }
    }

    if (roomName && participantName) {
      loadToken();
    } else {
  queueMicrotask(() => {
    setLoading(false);
    setError("Missing room or participant information");
  });
}

    return () => {
      mounted = false;
    };
  }, [roomName, participantName, participantId]);

  function enableSound() {
    setSoundEnabled(true);
  }

  if (loading) {
    return (
      <div className="grid min-h-[420px] place-items-center rounded-3xl border border-white/15 bg-slate-950 text-white">
        <div className="text-center">
          <Loader2 className="mx-auto mb-3 h-8 w-8 animate-spin" />
          <p className="text-sm font-black">Preparing secure AngelCare call…</p>
          <p className="mt-1 text-xs font-semibold text-white/70">Room: {roomName}</p>
        </div>
      </div>
    );
  }

  if (error || !token || !url) {
    return (
      <div className="rounded-3xl border border-rose-300/30 bg-rose-950 p-5 text-white">
        <p className="text-sm font-black">LiveKit connection error</p>
        <p className="mt-1 text-xs font-semibold text-rose-100/80">
          {error || "Missing token or URL"}
        </p>
        <button
          onClick={onLeave}
          className="mt-4 rounded-2xl bg-rose-500 px-4 py-3 text-sm font-black text-white hover:bg-rose-400"
        >
          Close
        </button>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-3xl border border-white/15 bg-slate-950 text-white shadow-2xl shadow-slate-950/40">
      <div className="flex items-center justify-between gap-3 border-b border-white/10 bg-slate-900 px-4 py-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-black text-white">
            AngelCare {isVideo ? "Video" : "Audio"} Room
          </p>
          <p className="truncate text-xs font-semibold text-white/65">{roomName}</p>
        </div>

        <div className="flex items-center gap-2">
          {!soundEnabled && (
            <button
              onClick={enableSound}
              className="inline-flex items-center gap-2 rounded-full bg-amber-400/15 px-3 py-2 text-xs font-black text-amber-100 ring-1 ring-amber-300/30 hover:bg-amber-400/25"
              title="Click once to unlock browser audio playback"
            >
              <Volume2 size={14} />
              Enable sound
            </button>
          )}

          <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-2 text-xs font-black text-white/80 ring-1 ring-white/10">
            {isVideo ? <Video size={16} /> : <Mic size={16} />}
            {type.toUpperCase()}
          </div>
        </div>
      </div>

      <LiveKitRoom
        token={token}
        serverUrl={url}
        connect
        video={isVideo}
        audio
        onDisconnected={onLeave}
        className="min-h-[520px] bg-slate-950"
      >
        <RoomAudioRenderer />

        {isVideo ? (
          <VideoConference />
        ) : (
          <div className="grid min-h-[420px] place-items-center bg-slate-950 p-6 text-center text-white">
            <div>
              <div className="mx-auto mb-4 grid h-20 w-20 place-items-center rounded-full bg-emerald-500/20 ring-1 ring-emerald-300/30">
                <Mic className="h-9 w-9 animate-pulse text-emerald-300" />
              </div>
              <p className="text-lg font-semibold text-white">Audio call connected</p>
              <p className="mt-1 text-sm font-semibold text-white/65">
                Keep this room open while speaking.
              </p>
              <div className="mt-6">
                <ControlBar variation="minimal" />
              </div>
            </div>
          </div>
        )}
      </LiveKitRoom>

      <div className="flex justify-end border-t border-white/10 bg-slate-900 p-3">
        <button
          onClick={onLeave}
          className="inline-flex items-center gap-2 rounded-2xl bg-rose-500 px-4 py-3 text-sm font-black text-white hover:bg-rose-400"
        >
          <PhoneOff size={16} />
          Leave call
        </button>
      </div>
    </div>
  );
}