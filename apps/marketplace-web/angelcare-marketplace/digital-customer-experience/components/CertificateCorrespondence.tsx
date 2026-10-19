"use client";
import { useEffect, useRef, useState } from "react";
import { text, type Data } from "../types";
import {
  Badge,
  Button,
  Field,
  Panel,
  State,
  T,
  useQuery,
  useUI,
  useReceiptMutation,
} from "./ui";
import s from "./workspace.module.css";
export function CertificateCorrespondence({
  request,
  onChange,
}: {
  request: any;
  onChange: () => void;
}) {
  const { boot, notify } = useUI(),
    [subject, setSubject] = useState(""),
    [body, setBody] = useState(""),
    [busy, setBusy] = useState(false),
    [page, setPage] = useState(1),
    [loaded, setLoaded] = useState(false),
    mutate = useReceiptMutation(),
    q = useQuery<any>(
      { op: "depth_certificate_messages", id: request.id, page },
      { rows: [], total: 0 },
    ),
    key = [
      "angelcare.dce.certificate.message.r7",
      boot.actor.id,
      request.id,
    ].join(".");
  useEffect(() => {
    setLoaded(false);
    try {
      const saved = JSON.parse(sessionStorage.getItem(key) || "null");
      setSubject(saved?.subject || "");
      setBody(saved?.body || "");
    } catch {}
    setLoaded(true);
  }, [key]);
  useEffect(() => {
    if (!loaded) return;
    const t = setTimeout(() => {
      try {
        sessionStorage.setItem(key, JSON.stringify({ subject, body }));
      } catch {}
    }, 300);
    return () => clearTimeout(t);
  }, [loaded, key, subject, body]);
  async function prepare() {
    setBusy(true);
    try {
      await mutate({
        action: "depth_certificate_message",
        id: request.id,
        revision: request.revision,
        data: { subject, body },
      });
      setSubject("");
      setBody("");
      sessionStorage.removeItem(key);
      q.reload();
      onChange();
    } catch (e) {
      notify((e as Error).message, true);
    } finally {
      setBusy(false);
    }
  }
  async function dispatch(w: any) {
    setBusy(true);
    try {
      await mutate({
        action: "pro_dispatch_message",
        id: w.id,
        revision: w.revision,
      });
      q.reload();
    } catch (e) {
      notify((e as Error).message, true);
    } finally {
      setBusy(false);
    }
  }
  return (
    <Panel
      title={
        <T
          v={[
            "Certificate correspondence",
            "Correspondance du certificat",
            "مراسلات الشهادة",
          ]}
        />
      }
    >
      <p>
        <T
          v={[
            "Prepare a message, review its exact recipient and content, then explicitly send it through the existing Email OS. A recorded or provider-accepted message does not prove inbox delivery.",
            "Préparez le message, vérifiez destinataire et contenu, puis envoyez explicitement via Email OS. Un message enregistré ou accepté ne prouve pas sa réception en boîte.",
            "جهز الرسالة وراجع المستلم والمحتوى ثم أرسلها صراحة عبر Email OS الحالي. تسجيل الرسالة أو قبول المزود لا يثبت وصولها للبريد.",
          ]}
        />
      </p>
      <Field label={<T v={["Subject", "Objet", "الموضوع"]} />}>
        <input
          maxLength={240}
          value={subject}
          disabled={busy}
          onChange={(e) => setSubject(e.target.value)}
        />
      </Field>
      <Field label={<T v={["Message", "Message", "الرسالة"]} />}>
        <textarea
          maxLength={8000}
          value={body}
          disabled={busy}
          onChange={(e) => setBody(e.target.value)}
        />
      </Field>
      <Button
        disabled={
          busy ||
          !subject.trim() ||
          !body.trim() ||
          Boolean(request.data?.anonymisedAt)
        }
        onClick={() => void prepare()}
      >
        <T
          v={[
            "Prepare for review · does not send",
            "Préparer pour revue · sans envoi",
            "تجهيز للمراجعة · دون إرسال",
          ]}
        />
      </Button>
      <State {...q} retry={q.reload}>
        {q.value.rows.map((w: any) => (
          <article className={s.rowCard} key={w.id}>
            <Badge
              tone={
                w.status === "provider_accepted"
                  ? "green"
                  : w.status === "delivery_unknown"
                    ? "orange"
                    : "blue"
              }
            >
              {w.status}
            </Badge>
            <strong>{w.title}</strong>
            <p>{w.data.recipient}</p>
            <p className={s.previewText}>{w.data.body}</p>
            {w.status === "queued" && (
              <Button disabled={busy} onClick={() => void dispatch(w)}>
                <T
                  v={[
                    "Send this reviewed message",
                    "Envoyer ce message revu",
                    "إرسال هذه الرسالة بعد المراجعة",
                  ]}
                />
              </Button>
            )}
            {["sending", "delivery_unknown"].includes(w.status) && (
              <p>
                <T
                  v={[
                    "Investigate the existing send receipt. Automatic resend is blocked to prevent duplicate messages.",
                    "Vérifiez le reçu d’envoi existant. Le renvoi automatique est bloqué pour éviter les doublons.",
                    "تحقق من إيصال الإرسال الحالي. يمنع الإرسال الآلي مجدداً لتفادي الرسائل المكررة.",
                  ]}
                />
              </p>
            )}
          </article>
        ))}
        <div className={s.actions}>
          <Button disabled={page <= 1} onClick={() => setPage((v) => v - 1)}>
            ←
          </Button>
          <span>
            {page} / {Math.max(1, Math.ceil(q.value.total / 30))}
          </span>
          <Button
            disabled={page * 30 >= q.value.total}
            onClick={() => setPage((v) => v + 1)}
          >
            →
          </Button>
        </div>
      </State>
    </Panel>
  );
}
