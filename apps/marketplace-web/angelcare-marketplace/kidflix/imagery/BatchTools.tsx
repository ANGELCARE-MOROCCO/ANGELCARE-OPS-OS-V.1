"use client";
import { useState } from "react";
import { query, mutate } from "../../digital-customer-experience/components/ui";
import { PAGES, newId, emptyConfig, type Config } from "./model";
import { WORLDS } from "../catalogue";
import s from "./studio.module.css";
const name = (p: string) =>
  p === "home"
    ? "Homepage"
    : p === "shared"
      ? "Shared navigation"
      : WORLDS.find((w) => w.key === p)?.title[0] || p;
export function BatchTools({
  disabled,
  onComplete,
}: {
  disabled: boolean;
  onComplete: () => void;
}) {
  const [selected, setSelected] = useState<string[]>([]),
    [review, setReview] = useState<any[] | null>(null),
    [results, setResults] = useState<{ page: string; status: string }[]>([]),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  async function inspect() {
    setBusy(true);
    setError("");
    try {
      const pages = [];
      for (const page of selected) {
        const r = await query<any>({ op: "kidflix_imagery", page });
        pages.push({
          page,
          ...r,
          changes: [
            ...new Set([
              ...Object.keys(r.draft.slots),
              ...Object.keys(r.live.slots),
            ]),
          ].filter(
            (k) =>
              JSON.stringify(r.draft.slots[k]) !==
              JSON.stringify(r.live.slots[k]),
          ),
        });
      }
      setReview(pages);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  async function publish() {
    setBusy(true);
    setResults([]);
    for (const r of review || []) {
      if (!r.changes.length) {
        setResults((old) => [
          ...old,
          { page: r.page, status: "No changes; skipped" },
        ]);
        continue;
      }
      try {
        await mutate({
          action: "kidflix_imagery_publish",
          requestId: newId(),
          page: r.page,
          revision: r.record?.revision || 0,
          draftHash: r.draftHash,
          slots: r.changes,
        } as any);
        setResults((old) => [...old, { page: r.page, status: "Published" }]);
      } catch (e) {
        setResults((old) => [
          ...old,
          { page: r.page, status: "Failed: " + (e as Error).message },
        ]);
      }
    }
    setBusy(false);
    onComplete();
  }
  return (
    <details className={s.batch}>
      <summary>Publish saved imagery across selected pages</summary>
      <p>
        Each page is checked independently. Unsaved editor changes are excluded.
      </p>
      <div className={s.batchPages}>
        {PAGES.map((p) => (
          <label key={p}>
            <input
              type="checkbox"
              checked={selected.includes(p)}
              disabled={busy}
              onChange={(e) =>
                setSelected(
                  e.target.checked
                    ? [...selected, p]
                    : selected.filter((x) => x !== p),
                )
              }
            />
            {name(p)}
          </label>
        ))}
      </div>
      <button
        disabled={disabled || busy || !selected.length}
        onClick={() => void inspect()}
      >
        Review {selected.length} saved page drafts
      </button>
      {error ? <p role="alert">{error}</p> : null}
      {review ? (
        <section>
          <h3>Publication review</h3>
          {review.map((r) => (
            <p key={r.page}>
              {name(r.page)} · {r.changes.length} changed placements · revision{" "}
              {r.record?.revision || 0}
            </p>
          ))}
          <button
            className={s.publish}
            disabled={disabled || busy || results.length > 0}
            onClick={() => void publish()}
          >
            Publish reviewed saved imagery
          </button>
          {results.map((r) => (
            <p role="status" key={r.page}>
              {name(r.page)} · {r.status}
            </p>
          ))}
        </section>
      ) : null}
    </details>
  );
}
export function CopyPageImagery({
  page,
  disabled,
}: {
  page: string;
  disabled: boolean;
}) {
  const [target, setTarget] = useState(""),
    [message, setMessage] = useState(""),
    [busy, setBusy] = useState(false);
  async function copy() {
    setBusy(true);
    try {
      const source = await query<any>({ op: "kidflix_imagery", page }),
        dest = await query<any>({ op: "kidflix_imagery", page: target }),
        registry = await import("./registry"),
        allowed = new Set(registry.pageSlots(target).map((s) => s.id)),
        slots = { ...dest.draft.slots };
      let count = 0;
      for (const [id, value] of Object.entries(source.draft.slots)) {
        const next = target + id.slice(page.length);
        if (allowed.has(next)) {
          slots[next] = structuredClone(value);
          count++;
        }
      }
      if (!count)
        throw Error(
          "These pages have no matching configured placements. Assign images individually.",
        );
      await mutate({
        action: "kidflix_imagery_save",
        requestId: newId(),
        page: target,
        revision: dest.record?.revision || 0,
        config: { version: 1, slots },
      } as any);
      setMessage(
        count +
          " compatible placements saved as a draft on " +
          name(target) +
          ". Preview that page before publishing.",
      );
    } catch (e) {
      setMessage((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <details className={s.batch}>
      <summary>Copy saved imagery to another page</summary>
      <p>
        Only compatible semantic placements are copied. The destination remains
        a draft.
      </p>
      <select
        aria-label="Destination page for imagery"
        value={target}
        onChange={(e) => setTarget(e.target.value)}
      >
        <option value="">Choose destination…</option>
        {PAGES.filter(
          (p) => p !== page && p !== "shared" && page !== "shared",
        ).map((p) => (
          <option key={p} value={p}>
            {name(p)}
          </option>
        ))}
      </select>
      <button
        disabled={disabled || busy || !target}
        onClick={() => void copy()}
      >
        Copy compatible placements to draft
      </button>
      {message ? <p role="status">{message}</p> : null}
    </details>
  );
}
