"use client"

import { useEffect, useRef, useState } from "react"
import { TelnyxRTC } from "@telnyx/webrtc"
import {
  Phone,
  PhoneCall,
  PhoneOff,
  Pause,
  ArrowRightLeft,
  Delete,
  Mic,
  Volume2,
  Minus,
} from "lucide-react"

type CallStatus = "idle" | "calling" | "active" | "hold"

export default function VoicePhoneWidget() {
  const [number, setNumber] = useState("")
  const [transferTo, setTransferTo] = useState("")
  const [status, setStatus] = useState<CallStatus>("idle")
  const [minimized, setMinimized] = useState(false)
  const [seconds, setSeconds] = useState(0)
  const [lead, setLead] = useState<any>(null)
  const [note, setNote] = useState("")
  const [outcome, setOutcome] = useState("completed")
  const [queueStatus, setQueueStatus] = useState("none")
  const [incomingNumber, setIncomingNumber] = useState("")
  const [callControlId, setCallControlId] = useState<string | null>(null)
  const [webrtcReady, setWebrtcReady] = useState(false)
  const [micReady, setMicReady] = useState(false)

  const clientRef = useRef<any>(null)
  const activeCallRef = useRef<any>(null)
  const beepIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const remoteAudioRef = useRef<HTMLAudioElement | null>(null)

  // Prevents the second Telnyx WebRTC bridge leg from creating a duplicate popup
  const bridgeAutoAnswerRef = useRef(false)
  const originalCallerRef = useRef("")
  const handledCallControlIdRef = useRef<string | null>(null)
  const suppressWebrtcPopupRef = useRef(true)

  const stopRadarBeep = () => {
    if (beepIntervalRef.current) {
      clearInterval(beepIntervalRef.current)
      beepIntervalRef.current = null
    }
  }

  const startRadarBeep = () => {
    stopRadarBeep()

    beepIntervalRef.current = setInterval(() => {
      try {
        const AudioContextClass =
          window.AudioContext || (window as any).webkitAudioContext
        const ctx = new AudioContextClass()
        const osc = ctx.createOscillator()
        const gain = ctx.createGain()

        osc.type = "sine"
        osc.frequency.setValueAtTime(1200, ctx.currentTime)
        gain.gain.setValueAtTime(0.32, ctx.currentTime)

        osc.connect(gain)
        gain.connect(ctx.destination)

        osc.start()
        osc.stop(ctx.currentTime + 0.18)

        setTimeout(() => ctx.close(), 300)
      } catch {}
    }, 850)
  }

  const requestMicPermission = async () => {
    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        console.error("Browser does not support getUserMedia")
        setMicReady(false)
        return false
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      stream.getTracks().forEach((track) => track.stop())
      setMicReady(true)
      console.log("Microphone permission granted")
      return true
    } catch (error) {
      setMicReady(false)
      console.error("Microphone permission denied or unavailable:", error)
      return false
    }
  }

  const attachAndPlayRemoteAudio = async (call?: any) => {
    try {
      const audio =
        remoteAudioRef.current ||
        (document.getElementById("telnyx-remote-audio") as HTMLAudioElement | null)

      if (!audio) {
        console.error("Remote audio element not found")
        return
      }

      let remoteStream: MediaStream | null =
        call?.remoteStream ||
        call?.options?.remoteStream ||
        call?.session?.remoteStream ||
        null

      const peerConnection = call?.peerConnection || call?.pc || call?.session?.peerConnection

      if (!remoteStream && peerConnection?.getReceivers) {
        const audioTracks = peerConnection
          .getReceivers()
          .map((receiver: RTCRtpReceiver) => receiver.track)
          .filter((track: MediaStreamTrack | null) => track && track.kind === "audio") as MediaStreamTrack[]

        if (audioTracks.length > 0) {
          remoteStream = new MediaStream(audioTracks)
        }
      }

      if (remoteStream && remoteStream.getAudioTracks().length > 0) {
        audio.srcObject = remoteStream
        console.log("Remote audio stream attached:", remoteStream.getAudioTracks())
      } else {
        console.warn("No remote audio stream found on call object yet")
      }

      audio.autoplay = true
      audio.setAttribute("playsinline", "true")
      audio.muted = false
      audio.volume = 1

      await audio.play().then(() => {
        console.log("Remote audio playback started")
      }).catch((error) => {
        console.warn("Remote audio play blocked or failed:", error)
      })
    } catch (error) {
      console.error("Remote audio attach/play error:", error)
    }
  }

  useEffect(() => {
    requestMicPermission()
  }, [])

  useEffect(() => {
    if (status !== "active" && status !== "hold") return

    const timer = setInterval(() => {
      setSeconds((s) => s + 1)
    }, 1000)

    return () => clearInterval(timer)
  }, [status])

  useEffect(() => {
    const poll = setInterval(async () => {
      if (incomingNumber || status !== "idle") return

      try {
        const res = await fetch("/api/voice/incoming/latest")
        const json = await res.json()
        const call = json.call

        const incomingId = call?.telnyx_call_control_id || null
        const caller = call?.from_number || ""

        if (caller && call?.queue_status === "ringing" && incomingId) {
          if (handledCallControlIdRef.current === incomingId) return

          originalCallerRef.current = caller
          handledCallControlIdRef.current = incomingId
          bridgeAutoAnswerRef.current = false

          setNumber(caller)
          setIncomingNumber(caller)
          setCallControlId(incomingId)
          setQueueStatus("ringing")
          setStatus("calling")
          startRadarBeep()
        }
      } catch (error) {
        console.error("Incoming poll error:", error)
      }
    }, 2000)

    return () => clearInterval(poll)
  }, [incomingNumber, status])

  useEffect(() => {
    const cleaned = number.replace(/\D/g, "")

    if (cleaned.length < 6) {
      setLead(null)
      return
    }

    const timer = setTimeout(async () => {
      try {
        const res = await fetch(
          `/api/voice/leads/lookup?phone=${encodeURIComponent(number)}`
        )
        const json = await res.json()
        setLead(json.lead || null)
      } catch (error) {
        console.error("Lead lookup error:", error)
        setLead(null)
      }
    }, 400)

    return () => clearTimeout(timer)
  }, [number])

  useEffect(() => {
    const username = process.env.NEXT_PUBLIC_TELNYX_SIP_USERNAME
    const password = process.env.NEXT_PUBLIC_TELNYX_SIP_PASSWORD

    if (!username || !password) {
      console.warn("Missing Telnyx WebRTC SIP env credentials")
      setWebrtcReady(false)
      return
    }

    const client = new TelnyxRTC({
  login: username,
  password,
  debug: true,
  audio: true,
} as any)

    clientRef.current = client

    client.on("telnyx.ready", () => {
      console.log("Telnyx WebRTC READY")
      setWebrtcReady(true)
    })

    client.on("telnyx.error", (error: any) => {
      console.error("Telnyx WebRTC error:", error)
      setWebrtcReady(false)
    })

    client.on("telnyx.notification", async (notification: any) => {
      console.log("Telnyx notification:", notification)
      const call = notification.call

      if (notification.type === "callUpdate" && call) {
        activeCallRef.current = call

        if (call.state === "ringing") {
          activeCallRef.current = call

          // This is the second WebRTC leg after transfer.
          // Never show a second popup. Auto-answer it silently.
          if (bridgeAutoAnswerRef.current || suppressWebrtcPopupRef.current) {
            try {
              await call.answer()
              await attachAndPlayRemoteAudio(call)
              setTimeout(() => attachAndPlayRemoteAudio(call), 500)
              setTimeout(() => attachAndPlayRemoteAudio(call), 1500)
            } catch (err) {
              console.error("Bridge auto-answer failed:", err)
            }

            stopRadarBeep()
            setIncomingNumber("")
            setNumber(originalCallerRef.current || number)
            setQueueStatus("active")
            setStatus("active")
            return
          }

          const caller =
            originalCallerRef.current ||
            call.options?.remoteCallerNumber ||
            call.options?.callerNumber ||
            call.options?.remoteCallerName ||
            "Incoming"

          originalCallerRef.current = caller

          setNumber(caller)
          setIncomingNumber(caller)
          setQueueStatus("ringing")
          setStatus("calling")
          startRadarBeep()
        }

        if (call.state === "active") {
          await attachAndPlayRemoteAudio(call)
          setTimeout(() => attachAndPlayRemoteAudio(call), 500)
          setTimeout(() => attachAndPlayRemoteAudio(call), 1500)

          stopRadarBeep()
          setIncomingNumber("")
          setNumber(originalCallerRef.current || number)
          setQueueStatus("active")
          setStatus("active")
        }

        if (call.state === "hangup" || call.state === "destroy") {
          stopRadarBeep()
          setIncomingNumber("")
          setStatus("idle")
          setQueueStatus("none")
          setSeconds(0)
          setCallControlId(null)
          activeCallRef.current = null
          bridgeAutoAnswerRef.current = false
          originalCallerRef.current = ""
          handledCallControlIdRef.current = null
        }
      }
    })

    client.connect()

    return () => {
      stopRadarBeep()
      try {
        client.disconnect()
      } catch {}
    }
  }, [])

  const formatTime = (s: number) => {
    const min = Math.floor(s / 60)
    const sec = s % 60
    return `${String(min).padStart(2, "0")}:${String(sec).padStart(2, "0")}`
  }

  const press = (value: string) => setNumber((prev) => prev + value)
  const backspace = () => setNumber((prev) => prev.slice(0, -1))

  const startCall = async () => {
    if (!number.trim()) return

    await requestMicPermission()

    setSeconds(0)
    setQueueStatus("calling")
    setStatus("calling")

    try {
      const res = await fetch("/api/voice/outbound", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ to: number }),
      })

      const json = await res.json().catch(() => ({}))

      if (!res.ok) {
        console.error("Outbound call failed:", json)
        setQueueStatus("failed")
        setStatus("idle")
        return
      }

      setQueueStatus("ringing")
    } catch (err) {
      console.error("Outbound call failed:", err)
      setQueueStatus("failed")
      setStatus("idle")
    }
  }

  const logCall = async () => {
    if (!number.trim()) return

    await fetch("/api/voice/calls/log", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        direction: incomingNumber ? "inbound" : "outbound",
        from_number: incomingNumber || "VoiceWidget",
        to_number: incomingNumber ? "AngelCare" : number,
        agent_extension: "1001",
        lead_id: lead?.id || null,
        status: outcome,
        queue_status: queueStatus === "none" ? "completed" : queueStatus,
        queue_name: "main_voice_queue",
        duration_seconds: seconds,
        notes: note,
        outcome,
      }),
    })
  }

  const simulateIncoming = () => {
    const demoNumber = "+212600000001"

    setNumber(demoNumber)
    setIncomingNumber(demoNumber)
    setSeconds(0)
    setQueueStatus("queued")
    setStatus("calling")

    startRadarBeep()

    setTimeout(() => {
      setQueueStatus("ringing")
    }, 700)
  }

  const answerIncoming = async () => {
    await requestMicPermission()

    // The next WebRTC ringing event is the bridge leg.
    // Auto-answer it silently and do not show a second popup.
    bridgeAutoAnswerRef.current = true

    const call = activeCallRef.current
    console.log("ACTIVE WEBRTC CALL:", call)
    console.log("CALL CONTROL ID:", callControlId)

    if (call?.answer) {
      await call.answer()
      await attachAndPlayRemoteAudio(call)
      setTimeout(() => attachAndPlayRemoteAudio(call), 500)
      setTimeout(() => attachAndPlayRemoteAudio(call), 1500)
    } else if (callControlId) {
      await fetch("/api/voice/calls/control", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "answer",
          call_control_id: callControlId,
        }),
      })
    } else {
      console.error("Missing WebRTC call object and call_control_id")
      return
    }

    stopRadarBeep()
    setIncomingNumber("")
    setNumber(originalCallerRef.current || number)
    setQueueStatus("active")
    setStatus("active")
  }

  const rejectIncoming = async () => {
    stopRadarBeep()
    bridgeAutoAnswerRef.current = false

    if (activeCallRef.current?.hangup) {
      activeCallRef.current.hangup()
    } else if (callControlId) {
      await fetch("/api/voice/calls/control", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "reject",
          call_control_id: callControlId,
        }),
      })
    }

    await fetch("/api/voice/calls/log", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        direction: "inbound",
        from_number: incomingNumber || number,
        to_number: "AngelCare",
        agent_extension: "1001",
        lead_id: lead?.id || null,
        status: "missed",
        queue_status: "missed",
        queue_name: "main_voice_queue",
        duration_seconds: seconds,
        notes: "Incoming call rejected/missed from Voice Terminal V2",
        outcome: "no_answer",
      }),
    })

    setIncomingNumber("")
    setStatus("idle")
    setQueueStatus("none")
    setNumber("")
    setSeconds(0)
    setCallControlId(null)
    activeCallRef.current = null
    bridgeAutoAnswerRef.current = false
    originalCallerRef.current = ""
    handledCallControlIdRef.current = null
  }

  const hangup = async () => {
    stopRadarBeep()
    bridgeAutoAnswerRef.current = false

    if (activeCallRef.current?.hangup) {
      activeCallRef.current.hangup()
    } else if (callControlId) {
      await fetch("/api/voice/calls/control", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "hangup",
          call_control_id: callControlId,
        }),
      })
    }

    if (status !== "idle") {
      await logCall()
    }

    setStatus("idle")
    setQueueStatus("none")
    setIncomingNumber("")
    setNumber("")
    setTransferTo("")
    setSeconds(0)
    setNote("")
    setOutcome("completed")
    setCallControlId(null)
    activeCallRef.current = null
    bridgeAutoAnswerRef.current = false
    originalCallerRef.current = ""
    handledCallControlIdRef.current = null
  }

  const toggleHold = () => {
    const call = activeCallRef.current

    if (status === "active") {
      if (call?.hold) call.hold()
      setStatus("hold")
      setQueueStatus("hold")
    } else if (status === "hold") {
      if (call?.unhold) call.unhold()
      setStatus("active")
      setQueueStatus("active")
    }
  }

  const transfer = () => {
    if (!transferTo.trim()) return
    setOutcome("transferred")
    setQueueStatus("transferred")
    setTransferTo("")
  }

  const statusLabel = {
    idle: "Prêt",
    calling: "Appel en cours",
    active: "En conversation",
    hold: "En attente",
  }[status]

  return (
    <>
      <audio
        id="telnyx-remote-audio"
        ref={remoteAudioRef}
        autoPlay
        playsInline
        controls={false}
        style={{
          position: "fixed",
          width: 1,
          height: 1,
          opacity: 0,
          pointerEvents: "none",
        }}
      />

      {incomingNumber && (
        <div className="vt-incoming-popup">
          <div className="vt-radar">
            <span />
          </div>

          <div>
            <small>APPEL ENTRANT</small>
            <b>{incomingNumber}</b>
            <p>Signal détecté • Queue main_voice_queue</p>
          </div>

          <div className="vt-popup-actions">
            <button onClick={answerIncoming}>Accepter</button>
            <button onClick={rejectIncoming}>Rejeter</button>
          </div>
        </div>
      )}

      <div className={`voice-terminal ${minimized ? "is-minimized" : ""}`}>
        <div className="vt-topbar">
          <div>
            <div className="vt-title">
              <Phone size={15} />
              Voice Terminal
            </div>
            <div className={`vt-status vt-${status}`}>
              {statusLabel} {status !== "idle" && `• ${formatTime(seconds)}`}
            </div>
          </div>

          <button className="vt-icon-btn" onClick={() => setMinimized(!minimized)}>
            <Minus size={15} />
          </button>
        </div>

        {!minimized && (
          <>
            <div className="vt-display">
              <div className="vt-label">Numéro client / lead</div>
              <div className="vt-number">{number || "+212 ..."}</div>
            </div>

            {lead && (
              <div className="vt-lead-card">
                <b>{lead.parent_name || lead.name || "Lead détecté"}</b>
                <span>{lead.phone}</span>
                <span>{lead.city || "Ville non renseignée"}</span>
                <small>{lead.service_interest || lead.stage || "Besoin à qualifier"}</small>
              </div>
            )}

            <div className="vt-bars">
              <div>
                <span>Agent</span>
                <b>1001</b>
              </div>
              <div>
                <span>Canal</span>
                <b>{webrtcReady ? "WebRTC Live" : "Connecting"}</b>
              </div>
              <div>
                <span>Micro</span>
                <b>{micReady ? "Ready" : "Blocked"}</b>
              </div>
              <div>
                <span>Durée</span>
                <b>{formatTime(seconds)}</b>
              </div>
            </div>

            <div className="vt-input-row">
              <input
                value={number}
                onChange={(e) => setNumber(e.target.value)}
                placeholder="Entrer numéro..."
              />
              <button onClick={backspace}>
                <Delete size={16} />
              </button>
            </div>

            <div className="vt-keypad">
              {["1", "2", "3", "4", "5", "6", "7", "8", "9", "+", "0", "#"].map((key) => (
                <button key={key} onClick={() => press(key)}>
                  {key}
                </button>
              ))}
            </div>

            <div className="vt-inbound-test">
              <button onClick={simulateIncoming}>Simuler appel entrant</button>
            </div>

            <div className="vt-actions">
              {status === "idle" ? (
                <button className="vt-call" onClick={startCall}>
                  <PhoneCall size={17} />
                  Appeler
                </button>
              ) : (
                <button className="vt-hangup" onClick={hangup}>
                  <PhoneOff size={17} />
                  Raccrocher
                </button>
              )}

              <button
                className="vt-secondary"
                onClick={toggleHold}
                disabled={status !== "active" && status !== "hold"}
              >
                <Pause size={16} />
                {status === "hold" ? "Reprendre" : "Hold"}
              </button>
            </div>

            <div className="vt-transfer">
              <input
                value={transferTo}
                onChange={(e) => setTransferTo(e.target.value)}
                placeholder="Transférer vers extension..."
              />
              <button onClick={transfer}>
                <ArrowRightLeft size={16} />
              </button>
            </div>

            <div className="vt-control-panel">
              <div className="vt-queue">
                <span>Queue</span>
                <b>{queueStatus}</b>
              </div>

              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Note rapide après appel..."
              />

              <div className="vt-outcomes">
                {[
                  ["no_answer", "No answer"],
                  ["callback", "Callback"],
                  ["qualified", "Qualified"],
                  ["hot_lead", "Hot lead"],
                  ["transferred", "Transferred"],
                ].map(([value, label]) => (
                  <button
                    key={value}
                    className={outcome === value ? "active" : ""}
                    onClick={() => setOutcome(value)}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <div className="vt-footer">
              <span>
                <Mic size={13} /> {micReady ? "Micro prêt" : "Micro bloqué"}
              </span>
              <span>
                <Volume2 size={13} /> Log Supabase actif
              </span>
            </div>
          </>
        )}
      </div>
    </>
  )
}