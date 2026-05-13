"use client"

import { useState } from 'react'
import { Mic, PhoneOff, Video } from 'lucide-react'
import ConnectLiveRoom from './ConnectLiveRoom'

type Props = {
  roomName: string
  participantName: string
  participantId?: string
}

export default function ConnectMediaLauncher({ roomName, participantName, participantId }: Props) {
  const [callType, setCallType] = useState<'audio' | 'video' | null>(null)

  if (callType) {
    return (
      <div className="fixed inset-0 z-[90] bg-slate-950/80 p-6 backdrop-blur-sm">
        <div className="mx-auto max-w-5xl">
          <ConnectLiveRoom
            roomName={roomName}
            participantName={participantName}
            participantId={participantId}
            type={callType}
            onLeave={() => setCallType(null)}
          />
        </div>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={() => setCallType('audio')}
        className="rounded-2xl border border-slate-200 bg-white p-3 text-slate-700 hover:bg-slate-50"
        title="Start isolated voice call"
      >
        <Mic className="h-4 w-4" />
      </button>
      <button
        onClick={() => setCallType('video')}
        className="rounded-2xl border border-slate-200 bg-white p-3 text-slate-700 hover:bg-slate-50"
        title="Start isolated video call"
      >
        <Video className="h-4 w-4" />
      </button>
    </div>
  )
}
