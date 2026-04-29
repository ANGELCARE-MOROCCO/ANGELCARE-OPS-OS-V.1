"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type React from "react";
import { createClient } from "@/lib/supabase/client";
import ConnectLiveRoom from "./ConnectLiveRoom";
import {
  Bell,
  Headphones,
  LockKeyhole,
  Megaphone,
  MessageCircle,
  Mic,
  Paperclip,
  Phone,
  Radio,
  Search,
  Send,
  ShieldCheck,
  Users,
  Video,
  X,
  Zap,
} from "lucide-react";

type StaffStatus = "online" | "busy" | "away" | "offline";
type RoomType = "direct" | "department" | "ops" | "emergency";
type CallType = "audio" | "video";
type ConnectTab = "rooms" | "staff" | "alerts";
type CallStatus = "ringing" | "accepted" | "rejected" | "ended";

type Staff = {
  id: string;
  name: string;
  role: string;
  department: string;
  status: StaffStatus;
  initials: string;
};

type Room = {
  id: string;
  name: string;
  type: RoomType;
  unread: number;
  priority?: boolean;
};

type Message = {
  id: string;
  roomId: string;
  sender: string;
  body: string;
  at: string;
  mine?: boolean;
  system?: boolean;
};

type CurrentUser = {
  id: string;
  name: string;
  role?: string;
  department?: string;
};

type IncomingCall = {
  id: string;
  from: Staff;
  type: CallType;
  roomName: string;
};

type ActiveCall = {
  id?: string;
  target: string;
  type: CallType;
  startedAt: number;
  roomName?: string;
  status?: CallStatus;
};

type ConnectCallRow = {
  id: string;
  from_user?: string | null;
  from_user_id?: string | null;
  to_user?: string | null;
  to_user_id?: string | null;
  type?: string | null;
  status?: string | null;
  room_name?: string | null;
  created_at?: string | null;
};

const demoStaff: Staff[] = [
  { id: "demo-ceo", name: "CEO Command", role: "CEO", department: "Direction", status: "online", initials: "CE" },
  { id: "demo-ops", name: "Ops Manager", role: "Manager", department: "Operations", status: "busy", initials: "OM" },
  { id: "demo-sdr", name: "SDR Desk 1", role: "Sales", department: "Revenue", status: "online", initials: "S1" },
  { id: "demo-care", name: "Care Coordinator", role: "Coordinator", department: "Missions", status: "away", initials: "CC" },
  { id: "demo-hr", name: "HR Academy", role: "HR", department: "Academy", status: "online", initials: "HR" },
];

const defaultRooms: Room[] = [
  { id: "ops", name: "Ops Command", type: "ops", unread: 0, priority: true },
  { id: "sales", name: "Revenue Floor", type: "department", unread: 0 },
  { id: "missions", name: "Missions Live", type: "department", unread: 0 },
  { id: "emergency", name: "Emergency Escalation", type: "emergency", unread: 0, priority: true },
];

const initialMessages: Message[] = [
  {
    id: "m1",
    roomId: "ops",
    sender: "CEO Command",
    body: "Morning control: keep escalation, revenue, and mission coverage visible here.",
    at: "08:10",
    system: true,
  },
  {
    id: "m2",
    roomId: "ops",
    sender: "Ops Manager",
    body: "All desks active. Waiting for today’s first assignment confirmation.",
    at: "08:13",
  },
  {
    id: "m3",
    roomId: "sales",
    sender: "SDR Desk 1",
    body: "Lead callback queue is ready. Need pricing validation for premium postpartum package.",
    at: "08:19",
  },
];

const statusStyle: Record<StaffStatus, string> = {
  online: "bg-emerald-400 shadow-emerald-400/50",
  busy: "bg-rose-400 shadow-rose-400/50",
  away: "bg-amber-400 shadow-amber-400/50",
  offline: "bg-slate-400 shadow-slate-400/50",
};

function classNames(...v: Array<string | false | undefined | null>) {
  return v.filter(Boolean).join(" ");
}

function getInitials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function formatTime(value?: string | null) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function getStableClientId() {
  if (typeof window === "undefined") return "server";
  const key = "angelcare_connect_client_id";
  const existing = window.localStorage.getItem(key);
  if (existing) return existing;

  const generated =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `client-${Date.now()}-${Math.random().toString(16).slice(2)}`;

  window.localStorage.setItem(key, generated);
  return generated;
}

function makeCallRoomName(type: CallType, fromId: string, toId: string) {
  const stamp = Date.now();
  const safeFrom = fromId.replace(/[^a-zA-Z0-9]/g, "").slice(0, 8) || "from";
  const safeTo = toId.replace(/[^a-zA-Z0-9]/g, "").slice(0, 8) || "to";
  return `angelcare-${type}-${safeFrom}-${safeTo}-${stamp}`;
}

export default function AngelCareConnect() {
  const supabase = useMemo(() => createClient(), []);
  const notifyAudioRef = useRef<HTMLAudioElement | null>(null);
  const ringtoneAudioRef = useRef<HTMLAudioElement | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const [clientId, setClientId] = useState("browser");
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [open, setOpen] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [compact, setCompact] = useState(false);
  const [tab, setTab] = useState<ConnectTab>("rooms");
  const [selectedRoom, setSelectedRoom] = useState("ops");
  const [rooms, setRooms] = useState<Room[]>(defaultRooms);
  const [realStaff, setRealStaff] = useState<Staff[]>([]);
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [draft, setDraft] = useState("");
  const [query, setQuery] = useState("");
  const [incomingCall, setIncomingCall] = useState<IncomingCall | null>(null);
  const [activeCall, setActiveCall] = useState<ActiveCall | null>(null);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [unreadByRoom, setUnreadByRoom] = useState<Record<string, number>>({});
  const [soundUnlocked, setSoundUnlocked] = useState(false);
  const [connectWarning, setConnectWarning] = useState<string | null>(null);

  const visibleStaff = realStaff.length > 0 ? realStaff : demoStaff;
  const senderName = currentUser?.name || "AngelCare User";

  const filteredRooms = useMemo(
    () => rooms.filter((r) => r.name.toLowerCase().includes(query.toLowerCase())),
    [query, rooms]
  );

  const staff = useMemo(
    () =>
      visibleStaff.filter((s) =>
        `${s.name} ${s.role} ${s.department}`.toLowerCase().includes(query.toLowerCase())
      ),
    [query, visibleStaff]
  );

  const roomMessages = messages.filter((m) => m.roomId === selectedRoom);
  const activeRoom = rooms.find((r) => r.id === selectedRoom) || rooms[0] || defaultRooms[0];
  const onlineCount = visibleStaff.filter((s) => s.status === "online").length;
  const totalUnread = Object.values(unreadByRoom).reduce((sum, v) => sum + v, 0);

  const primeAudio = useCallback(() => {
    const audio = notifyAudioRef.current;
    if (!audio) return;
    audio.volume = 0.001;
    audio
      .play()
      .then(() => {
        audio.pause();
        audio.currentTime = 0;
        audio.volume = 1;
        setSoundUnlocked(true);
      })
      .catch(() => {
        audio.volume = 1;
      });
  }, []);

  const playNotifySound = useCallback(() => {
    const audio = notifyAudioRef.current;
    if (!audio) return;
    audio.currentTime = 0;
    audio.play().catch(() => {
      setSoundUnlocked(false);
    });
  }, []);

  const playRingtone = useCallback(() => {
    const audio = ringtoneAudioRef.current;
    if (!audio) return;
    audio.currentTime = 0;
    audio.play().catch(() => {
      setSoundUnlocked(false);
    });
  }, []);

  const stopRingtone = useCallback(() => {
    const audio = ringtoneAudioRef.current;
    if (!audio) return;
    audio.pause();
    audio.currentTime = 0;
  }, []);

  useEffect(() => {
    setClientId(getStableClientId());
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [selectedRoom, messages.length, open]);

  useEffect(() => {
    let mounted = true;

    async function loadCurrentUser() {
      try {
        const response = await fetch("/api/connect/me", {
          method: "GET",
          cache: "no-store",
          credentials: "same-origin",
        });

        if (!response.ok) {
          throw new Error(`Unable to load current user (${response.status})`);
        }

        const payload = await response.json();
        const user = payload?.user;

        if (!user?.id) {
          throw new Error("Current user payload is missing id");
        }

        if (mounted) {
          setCurrentUser({
            id: String(user.id),
            name: user.name || user.full_name || user.username || "AngelCare User",
            role: user.role || "Staff",
            department: user.department || "AngelCare",
          });
        }
      } catch (error) {
        console.error("AngelCare Connect current user load error:", error);
        if (mounted) {
          setCurrentUser(null);
          setConnectWarning("Connect identity could not load from your secure session. Please refresh after login.");
        }
      }
    }

    loadCurrentUser();

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    let mounted = true;

    async function loadStaff() {
      const { data, error } = await supabase
        .from("app_users")
        .select("id, full_name, role, department")
        .order("full_name", { ascending: true });

      if (error) {
        console.error("AngelCare Connect staff load error:", error);
        return;
      }

      const formatted: Staff[] = (data || []).map((u: any) => {
        const name = u.full_name || "Unknown User";
        return {
          id: String(u.id),
          name,
          role: u.role || "Staff",
          department: u.department || "AngelCare",
          status: "online",
          initials: getInitials(name) || "AC",
        };
      });

      if (mounted && formatted.length > 0) setRealStaff(formatted);
    }

    loadStaff();

    return () => {
      mounted = false;
    };
  }, [supabase]);

  useEffect(() => {
    let mounted = true;

    async function loadRooms() {
      const { data, error } = await supabase
        .from("connect_rooms")
        .select("id, name, type")
        .order("name", { ascending: true });

      if (error) {
        console.error("AngelCare Connect rooms load error:", error);
        return;
      }

      const formatted: Room[] = (data || []).map((r: any) => ({
        id: String(r.id),
        name: r.name || "Room",
        type: (r.type || "department") as RoomType,
        unread: 0,
        priority: r.type === "ops" || r.type === "emergency",
      }));

      if (mounted && formatted.length > 0) setRooms(formatted);
    }

    loadRooms();

    return () => {
      mounted = false;
    };
  }, [supabase]);

  useEffect(() => {
    let mounted = true;

    async function loadMessages() {
      setMessagesLoading(true);

      const { data, error } = await supabase
        .from("connect_messages")
        .select("id, room_id, sender_id, sender_name, body, created_at")
        .eq("room_id", selectedRoom)
        .order("created_at", { ascending: true });

      if (error) {
        console.error("AngelCare Connect messages load error:", error);
        if (mounted) {
          setMessages(initialMessages.filter((m) => m.roomId === selectedRoom));
          setMessagesLoading(false);
        }
        return;
      }

      const formatted: Message[] = (data || []).map((m: any) => ({
        id: String(m.id),
        roomId: m.room_id,
        sender: m.sender_name || "Unknown",
        body: m.body || "",
        at: formatTime(m.created_at),
        mine: String(m.sender_id || "") === currentUser?.id || m.sender_name === senderName,
      }));

      if (mounted) {
        setMessages(formatted.length > 0 ? formatted : initialMessages.filter((m) => m.roomId === selectedRoom));
        setMessagesLoading(false);
        setUnreadByRoom((prev) => ({ ...prev, [selectedRoom]: 0 }));
      }
    }

    loadMessages();

    return () => {
      mounted = false;
    };
  }, [selectedRoom, supabase, currentUser?.id, senderName]);

  useEffect(() => {
    const channel = supabase
      .channel(`connect_messages:${selectedRoom}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "connect_messages",
          filter: `room_id=eq.${selectedRoom}`,
        },
        (payload) => {
          const m: any = payload.new;
          const realtimeMessage: Message = {
            id: String(m.id),
            roomId: m.room_id,
            sender: m.sender_name || "Unknown",
            body: m.body || "",
            at: formatTime(m.created_at),
            mine: String(m.sender_id || "") === currentUser?.id || m.sender_name === senderName,
          };

          setMessages((prev) => {
            if (prev.some((x) => x.id === realtimeMessage.id)) return prev;
            return [...prev, realtimeMessage];
          });

          if (!realtimeMessage.mine) playNotifySound();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [selectedRoom, supabase, playNotifySound, currentUser?.id, senderName]);

  useEffect(() => {
    const channel = supabase
      .channel("connect_messages:global")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "connect_messages",
        },
        (payload) => {
          const m: any = payload.new;
          const roomId = String(m.room_id || "");
          const isMine = String(m.sender_id || "") === currentUser?.id || m.sender_name === senderName;
          if (!roomId || roomId === selectedRoom || isMine) return;

          setUnreadByRoom((prev) => ({ ...prev, [roomId]: (prev[roomId] || 0) + 1 }));
          playNotifySound();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [selectedRoom, supabase, playNotifySound, currentUser?.id, senderName]);

  useEffect(() => {
    if (!currentUser) return;

    const channel = supabase
      .channel("connect_calls:signals")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "connect_calls",
        },
        (payload) => {
          const call = payload.new as ConnectCallRow;
          const fromUserId = String(call.from_user_id || "");
          const fromUserName = String(call.from_user || "Unknown Caller");
          const toUserId = String(call.to_user_id || "");
          const toUserName = String(call.to_user || "");
          const isMine = fromUserId === currentUser.id || fromUserName === currentUser.name;
          const isForMe = toUserId === currentUser.id || toUserName === currentUser.name;

          if (isMine || !isForMe) return;

          setIncomingCall({
            id: String(call.id),
            type: (call.type || "audio") as CallType,
            roomName: call.room_name || `connect-${call.id}`,
            from: {
              id: fromUserId || fromUserName,
              name: fromUserName,
              role: "Staff",
              department: "AngelCare",
              status: "online",
              initials: getInitials(fromUserName) || "AC",
            },
          });
          setOpen(true);
          playRingtone();
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "connect_calls",
        },
        (payload) => {
          const call = payload.new as ConnectCallRow;
          const status = String(call.status || "") as CallStatus;
          const fromUserId = String(call.from_user_id || "");
          const fromUserName = String(call.from_user || "");
          const isMyOutgoing = fromUserId === currentUser.id || fromUserName === currentUser.name;

          if (!isMyOutgoing) return;

          if (status === "accepted") {
            setActiveCall((prev) =>
              prev
                ? {
                    ...prev,
                    status: "accepted",
                    roomName: call.room_name || prev.roomName,
                  }
                : prev
            );
          }

          if (status === "rejected" || status === "ended") {
            setActiveCall(null);
            setConnectWarning(status === "rejected" ? "Call rejected." : "Call ended.");
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, currentUser, playRingtone]);

  async function sendMessage() {
    const body = draft.trim();
    if (!body || !selectedRoom) return;

    const now = new Date();
    const optimisticMessage: Message = {
      id: crypto.randomUUID(),
      roomId: selectedRoom,
      sender: senderName,
      body,
      at: now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      mine: true,
    };

    setMessages((prev) => [...prev, optimisticMessage]);
    setDraft("");

    const insertPayload = {
      room_id: selectedRoom,
      sender_id: currentUser?.id || clientId,
      sender_name: senderName,
      body,
      created_at: now.toISOString(),
    };

    const { error } = await supabase.from("connect_messages").insert(insertPayload);

    if (error) {
      console.error("AngelCare Connect send message error:", error);
      const fallbackPayload = {
        room_id: selectedRoom,
        sender_name: senderName,
        body,
        created_at: now.toISOString(),
      };
      await supabase.from("connect_messages").insert(fallbackPayload);
    }
  }

  async function openDirectStaffRoom(person: Staff) {
    if (!currentUser) {
      setConnectWarning("Connect identity is still loading. Try again in one second.");
      return;
    }

    primeAudio();

    const [firstId, secondId] = [currentUser.id, person.id].sort();
    const roomId = `direct-${firstId}-${secondId}`.replace(/[^a-zA-Z0-9-_]/g, "-").slice(0, 120);
    const roomName = `${currentUser.name} ↔ ${person.name}`;

    setRooms((prev) => {
      if (prev.some((room) => room.id === roomId)) return prev;
      return [
        ...prev,
        {
          id: roomId,
          name: roomName,
          type: "direct",
          unread: 0,
        },
      ];
    });

    await supabase
      .from("connect_rooms")
      .upsert({ id: roomId, name: roomName, type: "direct" }, { onConflict: "id" });

    setSelectedRoom(roomId);
    setTab("rooms");
    setOpen(true);
    setDraft("");
    setConnectWarning(`Direct message opened with ${person.name}.`);
  }

  async function startCall(target: string, type: CallType, targetId?: string) {
    if (!currentUser) {
      setConnectWarning("Connect identity is still loading. Try again in one second.");
      return;
    }

    primeAudio();
    stopRingtone();
    setIncomingCall(null);

    const receiverId = targetId || target;
    const roomName = makeCallRoomName(type, currentUser.id, receiverId);
    const createdAt = new Date().toISOString();

    const fullPayload = {
      from_user: currentUser.name,
      from_user_id: currentUser.id,
      to_user: target,
      to_user_id: receiverId,
      type,
      status: "ringing",
      room_name: roomName,
      created_at: createdAt,
    };

    const simplePayload = {
      from_user: currentUser.name,
      to_user: target,
      type,
      status: "ringing",
      room_name: roomName,
      created_at: createdAt,
    };

    let callId: string | undefined;
    let result = await supabase.from("connect_calls").insert(fullPayload).select("id").single();

    if (result.error) {
      result = await supabase.from("connect_calls").insert(simplePayload).select("id").single();
    }

    if (result.error) {
      console.warn("AngelCare Connect call signal not available yet:", result.error);
      setConnectWarning("Call signaling table is not ready yet. Local preview opened.");
    } else {
      callId = result.data?.id;
      setConnectWarning(null);
    }

    setActiveCall({ id: callId, target, type, startedAt: Date.now(), roomName, status: "ringing" });
    setOpen(true);
  }

  async function acceptIncomingCall() {
    if (!incomingCall) return;
    stopRingtone();

    if (incomingCall.id) {
      await supabase
        .from("connect_calls")
        .update({ status: "accepted" })
        .eq("id", incomingCall.id);
    }

    setActiveCall({
      id: incomingCall.id,
      target: incomingCall.from.name,
      type: incomingCall.type,
      startedAt: Date.now(),
      roomName: incomingCall.roomName,
      status: "accepted",
    });
    setIncomingCall(null);
    setOpen(true);
  }

  async function rejectIncomingCall() {
    stopRingtone();

    if (incomingCall?.id) {
      await supabase
        .from("connect_calls")
        .update({ status: "rejected" })
        .eq("id", incomingCall.id);
    }

    setIncomingCall(null);
  }

  async function endActiveCall() {
    if (activeCall?.id) {
      await supabase
        .from("connect_calls")
        .update({ status: "ended" })
        .eq("id", activeCall.id);
    }
    setActiveCall(null);
  }

  function selectRoom(roomId: string) {
    primeAudio();
    setSelectedRoom(roomId);
    setOpen(true);
    setUnreadByRoom((prev) => ({ ...prev, [roomId]: 0 }));
  }

  function openPanel() {
    primeAudio();
    setOpen((v) => !v);
  }

  return (
    <>
      <audio ref={notifyAudioRef} src="/sounds/notify.mp3" preload="auto" />
      <audio ref={ringtoneAudioRef} src="/sounds/incoming.mp3" preload="auto" loop />

      <div className="ac-connect fixed bottom-6 right-6 z-[9999] text-white antialiased">
        <style jsx global>{`
          .ac-connect,
          .ac-connect * {
            color: #ffffff !important;
            -webkit-text-fill-color: currentColor !important;
          }

          .ac-connect input,
          .ac-connect textarea {
            color: #ffffff !important;
            -webkit-text-fill-color: #ffffff !important;
          }

          .ac-connect input::placeholder,
          .ac-connect textarea::placeholder {
            color: rgba(255, 255, 255, 0.68) !important;
            -webkit-text-fill-color: rgba(255, 255, 255, 0.68) !important;
          }

          .ac-connect .ac-tab-active,
          .ac-connect .ac-tab-active * {
            color: #020617 !important;
            -webkit-text-fill-color: #020617 !important;
          }

          .ac-connect .ac-dark-text,
          .ac-connect .ac-dark-text * {
            color: #020617 !important;
            -webkit-text-fill-color: #020617 !important;
          }
        `}</style>

        {open && (
          <div
            className={classNames(
              "mb-4 overflow-hidden rounded-[28px] border border-white/20 bg-slate-950 text-white shadow-2xl shadow-slate-950/50 transition-all duration-300",
              compact
                  ? "h-[104px] w-[420px]"
                  : expanded
                  ? "h-[86vh] w-[92vw] max-w-[1700px]"
                  : "h-[720px] w-[620px]"
            )}
          >
            <div className="relative border-b border-white/10 bg-gradient-to-br from-slate-900 via-slate-950 to-blue-950 p-5 text-white">
              <div className="pointer-events-none absolute inset-0 opacity-10 [background:radial-gradient(circle_at_20%_20%,rgba(59,130,246,.9),transparent_30%),radial-gradient(circle_at_80%_0%,rgba(16,185,129,.75),transparent_25%)]" />
              <div className="relative flex items-center justify-between gap-4">
                <div className="flex min-w-0 items-center gap-3">
                  <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-white/10 ring-1 ring-white/20">
                    <ShieldCheck className="h-6 w-6 text-emerald-300" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="truncate text-lg font-black tracking-tight text-white">AngelCare Connect</h3>
                      <span className="rounded-full bg-emerald-400/20 px-2.5 py-1 text-[10px] font-black text-emerald-100 ring-1 ring-emerald-300/30">
                        LIVE
                      </span>
                      {!soundUnlocked && (
                        <span className="rounded-full bg-amber-400/20 px-2 py-1 text-[10px] font-black text-amber-100 ring-1 ring-amber-300/30">
                          click to enable sound
                        </span>
                      )}
                    </div>
                    <p className="truncate text-sm font-semibold text-slate-200">
                      Internal staff command communication
                    </p>
                    {currentUser && (
                      <p className="mt-1 truncate text-[11px] font-bold text-slate-300">
                        Signed as {currentUser.name}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCompact((v) => !v)}
                    className="grid h-11 w-11 place-items-center rounded-2xl bg-white/10 text-white ring-1 ring-white/10 transition hover:bg-white/20"
                    title={compact ? "Restore panel" : "Compact panel"}
                  >
                    {compact ? "□" : "—"}
                  </button>
                  <button
                    onClick={() => setExpanded((v) => !v)}
                    className="grid h-11 w-11 place-items-center rounded-2xl bg-white/10 text-white ring-1 ring-white/10 transition hover:bg-white/20"
                    title={expanded ? "Reduce panel" : "Expand command center"}
                  >
                    {expanded ? "↘" : "↗"}
                  </button>
                  <button
                    onClick={() => setOpen(false)}
                    className="grid h-11 w-11 place-items-center rounded-2xl bg-white/10 text-white ring-1 ring-white/10 transition hover:bg-white/20"
                    title="Close"
                  >
                    <X size={18} />
                  </button>
                </div>
              </div>

              {!compact && (
                <div className="relative mt-5 grid grid-cols-3 gap-3">
                  <Metric icon={<Users size={15} />} label="Online" value={`${onlineCount}/${visibleStaff.length}`} />
                  <Metric icon={<Radio size={15} />} label="Rooms" value={`${rooms.length}`} />
                  <Metric icon={<Bell size={15} />} label="Alerts" value={`${totalUnread || 0}`} />
                </div>
              )}
            </div>

            {!compact && (
              <div className="flex h-[calc(100%-172px)] flex-col bg-slate-950 text-white">
                {activeCall && (
                  <div className="mx-5 mt-4 overflow-hidden rounded-3xl border border-emerald-300/40 bg-slate-950 text-white shadow-xl shadow-emerald-950/30">
                    <div className="flex items-center justify-between gap-3 border-b border-white/10 bg-emerald-800 p-4">
                      <div className="flex items-center gap-3">
                        <div className="grid h-11 w-11 place-items-center rounded-full bg-emerald-500/20 text-emerald-100 ring-1 ring-emerald-300/30">
                          {activeCall.type === "video" ? <Video size={18} /> : <Phone size={18} />}
                        </div>
                        <div>
                          <p className="text-sm font-black text-white">
                            {activeCall.status === "ringing" ? "Calling" : "Active"} {activeCall.type} call
                          </p>
                          <p className="text-xs font-semibold text-emerald-100">Connected with {activeCall.target}</p>
                          {activeCall.roomName && (
                            <p className="text-[10px] font-bold text-emerald-100/75">Room: {activeCall.roomName}</p>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={endActiveCall}
                        className="rounded-2xl bg-rose-500 px-5 py-3 text-sm font-black text-white hover:bg-rose-400"
                      >
                        End
                      </button>
                    </div>

                    {activeCall.roomName && currentUser ? (
                      <div className="max-h-[520px] overflow-y-auto bg-slate-950 p-3">
                        <ConnectLiveRoom
                          roomName={activeCall.roomName}
                          participantName={currentUser.name}
                          participantId={currentUser.id}
                          type={activeCall.type}
                          onLeave={endActiveCall}
                        />
                      </div>
                    ) : (
                      <div className="p-4 text-sm font-bold text-white/80">Preparing secure media room...</div>
                    )}
                  </div>
                )}

                {connectWarning && (
                  <div className="mx-5 mt-4 rounded-2xl border border-amber-300/40 bg-amber-950 p-3 text-xs font-bold text-amber-100">
                    {connectWarning}
                    <button className="ml-3 underline" onClick={() => setConnectWarning(null)}>dismiss</button>
                  </div>
                )}

                <div className="p-5 pb-3">
                  <div className="flex items-center gap-3 rounded-2xl border border-white/15 bg-slate-900 px-4 py-3 text-white">
                    <Search size={18} className="text-slate-300" />
                    <input
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      placeholder="Search staff, rooms, alerts..."
                      className="w-full bg-transparent text-base font-semibold text-white outline-none placeholder:text-slate-400"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3 px-5">
                  <Tab active={tab === "rooms"} onClick={() => setTab("rooms")} icon={<MessageCircle size={16} />} label="Rooms" />
                  <Tab active={tab === "staff"} onClick={() => setTab("staff")} icon={<Headphones size={16} />} label="Staff" />
                  <Tab active={tab === "alerts"} onClick={() => setTab("alerts")} icon={<Megaphone size={16} />} label="Alerts" />
                </div>

                <div className={classNames("grid min-h-0 flex-1 gap-0 p-5", expanded ? "grid-cols-[300px_1fr]" : "grid-cols-[220px_1fr]")}>
                  <div className="min-h-0 overflow-y-auto rounded-l-3xl border border-white/15 bg-slate-950 p-3 text-white">
                    {tab === "rooms" &&
                      filteredRooms.map((room) => {
                        const unread = unreadByRoom[room.id] || 0;
                        return (
                          <button
                            key={room.id}
                            onClick={() => selectRoom(room.id)}
                            className={classNames(
                              "mb-3 w-full rounded-2xl p-4 text-left text-white transition",
                              selectedRoom === room.id ? "bg-blue-600/35 ring-1 ring-blue-300/40" : "bg-slate-900 hover:bg-slate-800"
                            )}
                          >
                            <div className="flex items-center justify-between gap-2">
                              <span className="truncate text-sm font-black text-white">{room.name}</span>
                              {unread > 0 && (
                                <span className="rounded-full bg-blue-400 px-2 py-0.5 text-xs font-black text-white">
                                  {unread}
                                </span>
                              )}
                            </div>
                            <p className="mt-2 flex items-center gap-1 text-xs font-bold uppercase text-slate-200">
                              {room.priority ? <Zap size={12} /> : <LockKeyhole size={12} />} {room.type}
                            </p>
                          </button>
                        );
                      })}

                    {tab === "staff" &&
                      staff.map((person) => {
                        const isSelf = currentUser?.id === person.id || currentUser?.name === person.name;
                        return (
                          <div key={person.id} className="mb-3 rounded-2xl bg-slate-900 p-3 text-white ring-1 ring-white/10">
                            <div className="flex items-center gap-3">
                              <Avatar person={person} />
                              <div className="min-w-0 flex-1">
                                <p className="truncate text-sm font-black text-white">{person.name}</p>
                                <p className="truncate text-xs font-semibold text-slate-300">
                                  {person.role} · {person.department}
                                </p>
                              </div>
                            </div>
                            <div className="mt-3 grid grid-cols-3 gap-2">
                              <button
                                disabled={isSelf}
                                onClick={() => openDirectStaffRoom(person)}
                                className={classNames(
                                  "rounded-xl px-3 py-2 text-xs font-black text-white",
                                  isSelf ? "cursor-not-allowed bg-white/5 opacity-50" : "bg-slate-700 hover:bg-slate-600"
                                )}
                              >
                                Message
                              </button>
                              <button
                                disabled={isSelf}
                                onClick={() => startCall(person.name, "audio", person.id)}
                                className={classNames(
                                  "rounded-xl px-3 py-2 text-xs font-black text-white",
                                  isSelf ? "cursor-not-allowed bg-white/5 opacity-50" : "bg-white/10 hover:bg-white/20"
                                )}
                              >
                                Audio
                              </button>
                              <button
                                disabled={isSelf}
                                onClick={() => startCall(person.name, "video", person.id)}
                                className={classNames(
                                  "rounded-xl px-3 py-2 text-xs font-black text-white",
                                  isSelf ? "cursor-not-allowed bg-blue-500/20 opacity-50" : "bg-blue-500 hover:bg-blue-400"
                                )}
                              >
                                Video
                              </button>
                            </div>
                          </div>
                        );
                      })}

                    {tab === "alerts" &&
                      [
                        totalUnread > 0 ? `${totalUnread} unread message(s)` : "No unread messages",
                        "CEO broadcast channel ready",
                        "Call signaling + LiveKit media bridge active",
                      ].map((a, i) => (
                        <div key={a} className="mb-3 rounded-2xl border border-amber-300/30 bg-amber-950 p-4 text-white">
                          <p className="text-sm font-black text-amber-100">{a}</p>
                          <p className="mt-1 text-xs font-semibold text-amber-100/80">Signal {i + 1}</p>
                        </div>
                      ))}
                  </div>

                  <div className="flex min-h-0 flex-col rounded-r-3xl border-y border-r border-white/15 bg-slate-900 text-white">
                    <div className="flex items-center justify-between border-b border-white/15 p-4">
                      <div>
                        <p className="text-base font-black text-white">{activeRoom.name}</p>
                        <p className="text-xs font-semibold text-slate-300">Secure internal room</p>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => startCall(activeRoom.name, "audio", activeRoom.id)} className="rounded-xl bg-white/10 p-3 text-white hover:bg-white/20">
                          <Phone size={16} />
                        </button>
                        <button onClick={() => startCall(activeRoom.name, "video", activeRoom.id)} className="rounded-xl bg-white/10 p-3 text-white hover:bg-white/20">
                          <Video size={16} />
                        </button>
                      </div>
                    </div>

                    <div ref={scrollRef} className="min-h-0 flex-1 space-y-4 overflow-y-auto bg-slate-950 p-4 text-white">
                      {messagesLoading ? (
                        <div className="grid h-full place-items-center text-center text-slate-300">
                          <p className="text-sm font-bold">Loading room messages...</p>
                        </div>
                      ) : roomMessages.length === 0 ? (
                        <div className="grid h-full place-items-center text-center text-slate-300">
                          <div>
                            <MessageCircle className="mx-auto mb-3 h-8 w-8" />
                            <p className="text-sm font-bold">No messages in this room yet.</p>
                          </div>
                        </div>
                      ) : (
                        roomMessages.map((m) => <Bubble key={m.id} message={m} />)
                      )}
                    </div>

                    <div className="border-t border-white/15 bg-slate-900 p-4">
                      <div className="flex items-center gap-2 rounded-2xl bg-slate-800 p-2 text-white ring-1 ring-white/15">
                        <button className="rounded-xl p-2 text-slate-200 hover:bg-white/10 hover:text-white">
                          <Paperclip size={17} />
                        </button>
                        <input
                          value={draft}
                          onChange={(e) => setDraft(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") sendMessage();
                          }}
                          placeholder="Type command message..."
                          className="min-w-0 flex-1 bg-transparent text-base font-semibold text-white outline-none placeholder:text-slate-400"
                        />
                        <button className="rounded-xl p-2 text-slate-200 hover:bg-white/10 hover:text-white">
                          <Mic size={17} />
                        </button>
                        <button onClick={sendMessage} className="rounded-xl bg-blue-500 p-3 text-white hover:bg-blue-400">
                          <Send size={17} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {incomingCall && (
          <div className="mb-4 w-[390px] rounded-[28px] border border-white/20 bg-slate-950 p-5 text-white shadow-2xl shadow-slate-950/60">
            <div className="flex items-center gap-3">
              <Avatar person={incomingCall.from} large />
              <div className="min-w-0 flex-1">
                <p className="text-base font-black text-white">Incoming {incomingCall.type} call</p>
                <p className="truncate text-sm font-semibold text-slate-300">
                  {incomingCall.from.name} · {incomingCall.from.department}
                </p>
                <p className="mt-1 text-[10px] font-bold text-slate-400">Room: {incomingCall.roomName}</p>
              </div>
            </div>
            <div className="mt-5 grid grid-cols-2 gap-3">
              <button onClick={rejectIncomingCall} className="rounded-2xl bg-rose-500 px-4 py-3 text-sm font-black text-white hover:bg-rose-400">
                Reject
              </button>
              <button onClick={acceptIncomingCall} className="rounded-2xl bg-emerald-500 px-4 py-3 text-sm font-black text-white hover:bg-emerald-400">
                Accept
              </button>
            </div>
          </div>
        )}

        <button
          onClick={openPanel}
          className="group relative grid h-16 w-16 place-items-center rounded-[24px] bg-gradient-to-br from-blue-500 via-indigo-500 to-slate-900 text-white shadow-2xl shadow-blue-950/40 ring-1 ring-white/20 transition hover:scale-105"
        >
          {(totalUnread > 0 || visibleStaff.length > 0) && (
            <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-emerald-400 px-1 text-[10px] font-black text-slate-950 ring-4 ring-slate-950 ac-dark-text">
              {totalUnread > 0 ? totalUnread : visibleStaff.length}
            </span>
          )}
          <MessageCircle className="h-7 w-7" />
        </button>
      </div>
    </>
  );
}

function Metric({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/15 bg-slate-800/95 p-4 text-white">
      <div className="flex items-center gap-2 text-slate-200">
        {icon}
        <span className="text-xs font-black uppercase tracking-wide">{label}</span>
      </div>
      <p className="mt-2 text-2xl font-black text-white">{value}</p>
    </div>
  );
}

function Tab({ active, onClick, icon, label }: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string }) {
  return (
    <button
      onClick={onClick}
      className={classNames(
        "flex items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-black transition",
        active ? "ac-tab-active bg-white text-slate-950" : "bg-slate-900 text-slate-100 hover:bg-slate-800"
      )}
    >
      {icon}
      {label}
    </button>
  );
}

function Avatar({ person, large }: { person: Staff; large?: boolean }) {
  return (
    <div className={classNames("relative grid shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-slate-700 to-slate-900 font-black text-white ring-1 ring-white/15", large ? "h-14 w-14" : "h-11 w-11")}>
      <span className="text-sm text-white">{person.initials}</span>
      <span className={classNames("absolute -bottom-1 -right-1 h-3.5 w-3.5 rounded-full shadow-lg ring-2 ring-slate-950", statusStyle[person.status])} />
    </div>
  );
}

function Bubble({ message }: { message: Message }) {
  return (
    <div className={classNames("flex", message.mine ? "justify-end" : "justify-start")}>
      <div
        className={classNames(
          "max-w-[92%] rounded-2xl px-4 py-3 text-white shadow-lg",
          message.mine ? "bg-blue-500" : message.system ? "border border-emerald-300/40 bg-emerald-800" : "bg-slate-700"
        )}
      >
        <div className="mb-1 flex items-center justify-between gap-4">
          <span className="text-xs font-black text-white">{message.sender}</span>
          <span className="text-xs font-bold text-slate-200">{message.at}</span>
        </div>
        <p className="text-sm font-semibold leading-relaxed text-white">{message.body}</p>
      </div>
    </div>
  );
}