"use client";
import { useEffect, useRef, useState, type MutableRefObject } from "react";
import { type Data, type DceRecord } from "../types";
import { mutate, query } from "./ui";
/** Private recovery never saves or publishes the authored dossier. */
export function useServerDraft(
  key: string,
  enabled: boolean,
  dirty: boolean,
  draft: Partial<DceRecord>,
  baseline: MutableRefObject<Partial<DceRecord>>,
) {
  const [candidate, setCandidate] = useState<Data | null>(null),
    [status, setStatus] = useState(""),
    [ready, setReady] = useState(false),
    [tick, setTick] = useState(0),
    revision = useRef(0),
    epoch = useRef(0),
    pending = useRef<Promise<void> | null>(null),
    lastSaved = useRef(""),
    discarding = useRef(false);
  useEffect(() => {
    const e = ++epoch.current;
    setReady(false);
    setCandidate(null);
    setStatus("");
    revision.current = 0;
    lastSaved.current = "";
    discarding.current = false;
    if (!enabled) return;
    query<any>({ op: "depth_draft", key })
      .then((r) => {
        if (epoch.current !== e) return;
        revision.current = r?.revision || 0;
        setCandidate(r?.payload || null);
        setReady(true);
      })
      .catch((err) => {
        if (epoch.current === e) setStatus(err.message);
      });
    return () => {
      epoch.current++;
    };
  }, [key, enabled]);
  useEffect(() => {
    if (!ready || !dirty || !enabled || discarding.current) return;
    const payload = { record: draft, baseline: baseline.current },
      serialized = JSON.stringify(payload);
    if (serialized === lastSaved.current) return;
    const e = epoch.current;
    const timer = setTimeout(() => {
      if (pending.current) return;
      setStatus("");
      const request = mutate<any>({
        action: "depth_save_draft",
        key,
        revision: revision.current,
        payload,
      })
        .then((r) => {
          if (epoch.current === e) {
            revision.current = r.revision;
            lastSaved.current = serialized;
            setStatus("✓");
          }
        })
        .catch((err) => {
          if (epoch.current === e) {
            setStatus(err.message);
            setReady(false);
          }
        })
        .finally(() => {
          if (pending.current === request) pending.current = null;
          if (epoch.current === e) setTick((n) => n + 1);
        });
      pending.current = request;
    }, 900);
    return () => clearTimeout(timer);
  }, [draft, dirty, ready, key, enabled, tick]);
  async function discard() {
    if (!enabled || !ready) return;
    const e = epoch.current;
    discarding.current = true;
    try {
      await pending.current;
      if (epoch.current !== e) return;
      await mutate({
        action: "depth_discard_draft",
        key,
        revision: revision.current,
      });
      if (epoch.current !== e) return;
      revision.current = 0;
      lastSaved.current = "";
      setCandidate(null);
      setStatus("");
    } catch (err) {
      if (epoch.current === e) setStatus((err as Error).message);
    } finally {
      if (epoch.current === e) discarding.current = false;
    }
  }
  return { candidate, status, discard, consume: () => setCandidate(null) };
}
