"use client";
import Link from "next/link";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { capability, cleanKeys } from "./contract";
import { usePersonal } from "./store";
import { j } from "./copy";
import { path, tr, type Locale } from "../catalogue";
import { obj, rows, str, time, type Row } from "../detail/model";
import { local } from "../detail/copy";
import { Button, Modal, action, type PlayerProps } from "../detail/shared";
import s from "./journey.module.css";
export function SessionActions({ m, locale }: { m: Row; locale: Locale }) {
  const p = usePersonal(),
    allowed = capability(m).session,
    index = p.data.queue.indexOf(m.key);
  return (
    <div className={s.actions}>
      {allowed ? (
        <button
          className={s.button}
          aria-pressed={index >= 0}
          onClick={() => p.enqueue(m.key)}
        >
          {j(index >= 0 ? "added" : "add", locale)}
        </button>
      ) : null}
      <Link className={s.button} href={path(locale, "/my")}>
        {j("my", locale)}
      </Link>
      {p.data.collections.length ? (
        <select
          className={s.button}
          aria-label={j("collections", locale)}
          value=""
          onChange={(e) =>
            p.change((d) => ({
              ...d,
              collections: d.collections.map((c) =>
                c.id === e.target.value
                  ? { ...c, keys: cleanKeys([...c.keys, m.key], 200) }
                  : c,
              ),
            }))
          }
        >
          <option value="">+ {j("collections", locale)}</option>
          {p.data.collections.map((c) => (
            <option value={c.id} key={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      ) : null}
      {allowed && index > 0 ? (
        <Link
          className={s.button}
          href={path(
            locale,
            "/experience/" + p.data.queue[index - 1] + "?session=1",
          )}
        >
          {j("previous", locale)}
        </Link>
      ) : null}
      {allowed && index >= 0 && index + 1 < p.data.queue.length ? (
        <Link
          className={s.button}
          href={path(
            locale,
            "/experience/" + p.data.queue[index + 1] + "?session=1",
          )}
        >
          {j("next", locale)}
        </Link>
      ) : null}
    </div>
  );
}
export function ResourceSurface({
  props,
  children,
  compact = false,
}: {
  props: PlayerProps;
  children: ReactNode;
  compact?: boolean;
}) {
  const { m, d, state, update, locale } = props,
    c = capability(m),
    readingUnits = rows(d.units),
    readingMarks: string[] = Array.isArray(state.readingMarks)
      ? state.readingMarks
          .map((n: string | number) =>
            typeof n === "number" ? str(readingUnits[n]?.id) : n,
          )
          .filter(Boolean)
      : [],
    [classroom, setClassroom] = useState(false),
    [toolsOpen, setToolsOpen] = useState(false),
    [size, setSize] = useState(1),
    [spacing, setSpacing] = useState(1.7),
    [ruler, setRuler] = useState(false),
    [minutes, setMinutes] = useState(10),
    [remaining, setRemaining] = useState(600),
    [deadline, setDeadline] = useState(0);
  useEffect(() => {
    if (!deadline) return;
    const id = setInterval(() => {
      const v = Math.max(0, Math.ceil((deadline - Date.now()) / 1000));
      setRemaining(v);
      if (v === 0) setDeadline(0);
    }, 250);
    return () => clearInterval(id);
  }, [deadline]);
  const view = (
    <div
      className={ruler ? s.ruler : undefined}
      data-kidflix-reading
      style={
        {
          "--reading-size": size,
          "--reading-spacing": spacing,
        } as React.CSSProperties
      }
    >
      {children}
    </div>
  );
  return (
    <>
      {compact ? <button type="button" className={s.button} data-workspace-session-toggle aria-expanded={toolsOpen} onClick={() => setToolsOpen(v => !v)}>{tr(["Session & reading tools", "Séance et confort de lecture", "أدوات الجلسة والقراءة"], locale)} {toolsOpen ? "−" : "+"}</button> : null}
      <div className={s.surface} hidden={compact && !toolsOpen}>
        <div className={s.toolbar}>
          <SessionActions m={m} locale={locale} />
          {c.classroom ? (
            <button className={s.button} onClick={() => setClassroom(true)}>
              {j("classroom", locale)}
            </button>
          ) : null}
        </div>
        {c.comfort ? (
          <div className={s.actions}>
            <label className={s.field}>
              {j("textSize", locale)}
              <input
                type="range"
                min="0.9"
                max="1.8"
                step="0.1"
                value={size}
                onChange={(e) => setSize(Number(e.target.value))}
              />
            </label>
            <label className={s.field}>
              {j("spacing", locale)}
              <input
                type="range"
                min="1.4"
                max="2.5"
                step="0.1"
                value={spacing}
                onChange={(e) => setSpacing(Number(e.target.value))}
              />
            </label>
            <label className={s.check}>
              <input
                type="checkbox"
                checked={ruler}
                onChange={(e) => setRuler(e.target.checked)}
              />
              {j("ruler", locale)}
            </label>
            <button
              className={s.button}
              onClick={() =>
                update({
                  readingMarks: [
                    ...new Set([
                      ...readingMarks,
                      str(state.readerUnitId) ||
                        str(readingUnits[Number(state.index) || 0]?.id),
                    ]),
                  ].slice(0, 100),
                })
              }
            >
              {j("bookmark", locale)}
            </button>
            {readingMarks.map((n: string) => (
              <button
                key={n}
                className={s.chip}
                onClick={() =>
                  update({
                    index: readingUnits.findIndex((u) => u.id === n),
                    readerUnitId: n,
                  })
                }
              >
                {j("bookmark", locale)}{" "}
                {readingUnits.findIndex((u) => u.id === n) + 1}
              </button>
            ))}
          </div>
        ) : null}
      </div>
      {classroom ? (
        <Modal
          title={m.title + " · " + j("classroom", locale)}
          locale={locale}
          onClose={() => setClassroom(false)}
        >
          <div className={s.surface}>
            <div className={s.toolbar}>
              <strong className={s.timer} role="timer">
                {time(remaining)}
              </strong>
              <label className={s.field}>
                {j("timer", locale)}
                <input
                  type="number"
                  min="1"
                  max="180"
                  value={minutes}
                  onChange={(e) => {
                    const v = Math.max(
                      1,
                      Math.min(180, Number(e.target.value) || 1),
                    );
                    setMinutes(v);
                    if (!deadline) setRemaining(v * 60);
                  }}
                />
              </label>
              <div className={s.actions}>
                <button
                  className={s.button}
                  onClick={() =>
                    deadline
                      ? setDeadline(0)
                      : setDeadline(Date.now() + remaining * 1000)
                  }
                >
                  {j(deadline ? "pause" : "start", locale)}
                </button>
                <button
                  className={s.button}
                  onClick={() => {
                    setDeadline(0);
                    setRemaining(minutes * 60);
                  }}
                >
                  {j("reset", locale)}
                </button>
                <button
                  className={s.button}
                  onClick={() => {
                    setRemaining((v) => v + 60);
                    if (deadline) setDeadline((v) => v + 60000);
                  }}
                >
                  +1 {j("duration", locale)}
                </button>
              </div>
            </div>
            {local(d, "kidflixFacilitator", locale) ? (
              <p>{local(d, "kidflixFacilitator", locale)}</p>
            ) : null}
          </div>
          <SessionActions m={m} locale={locale} />
          <div className={s.classroomView}>{view}</div>
        </Modal>
      ) : (
        view
      )}
    </>
  );
}
export function PrivateTools(props: PlayerProps) {
  const { m, d, locale, state, update } = props,
    [name, setName] = useState(""),
    versions = rows(state.personalVersions);
  if (
    d.continuityPolicy === "none" ||
    ![
      "learning",
      "presentations",
      "planners",
      "forms",
      "tools",
      "community",
      "documents",
    ].includes(m.family)
  )
    return null;
  return (
    <section className={s.surface}>
      <h2>{j("notes", locale)}</h2>
      <textarea
        value={str(state.privateNotes)}
        maxLength={12000}
        onChange={(e) => update({ privateNotes: e.target.value })}
        aria-label={j("notes", locale)}
      />
      {["planners", "forms"].includes(m.family) ? (
        <>
          <h3>{j("version", locale)}</h3>
          <div className={s.actions}>
            <label className={s.field}>
              {j("collection", locale)}
              <input
                value={name}
                maxLength={60}
                onChange={(e) => setName(e.target.value)}
              />
            </label>
            <button
              className={s.button}
              disabled={!name.trim() || versions.length >= 12}
              onClick={() => {
                update({
                  personalVersions: [
                    ...versions,
                    {
                      id: crypto.randomUUID(),
                      title: name.trim(),
                      values: obj(state.values),
                    },
                  ],
                });
                setName("");
              }}
            >
              {j("saveVersion", locale)}
            </button>
          </div>
          {versions.map((v) => (
            <div className={s.row} key={v.id}>
              <span>{v.title}</span>
              <button
                className={s.button}
                onClick={() =>
                  update({
                    values: obj(v.values),
                    complete: false,
                    calculation: null,
                    toolResult: null,
                  })
                }
              >
                {j("resume", locale)}
              </button>
              <button
                className={s.button}
                onClick={() =>
                  update({
                    personalVersions: versions.filter((x) => x.id !== v.id),
                  })
                }
              >
                {j("remove", locale)}
              </button>
            </div>
          ))}
        </>
      ) : null}
    </section>
  );
}
export function MissedPractice({ m, d, locale, state }: PlayerProps) {
  const result = obj(state.grade),
    failed = rows(result.results).filter((x) => x.correct === false),
    questions = rows(d.questions).filter((q) =>
      failed.some((x) => (x.id || x.questionId) === q.id),
    ),
    [answers, setAnswers] = useState<Row>({}),
    [grade, setGrade] = useState<Row | null>(null),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(false),
    controller = useRef<AbortController | null>(null);
  useEffect(() => () => controller.current?.abort(), []);
  if (!capability(m).practice || !questions.length) return null;
  return (
    <section className={s.surface}>
      <h2>{j("practice", locale)}</h2>
      <p>{j("practiceHelp", locale)}</p>
      {questions.map((q) => {
        const labels = local(q, "choices", locale).split("\n").filter(Boolean),
          keys = str(q.choiceKeys).split("\n");
        return (
          <label key={q.id} className={s.field}>
            {local(q, "prompt", locale)}
            {labels.length ? (
              <select
                value={answers[q.id] || ""}
                onChange={(e) =>
                  setAnswers((a) => ({ ...a, [q.id]: e.target.value }))
                }
              >
                <option value="">—</option>
                {labels.map((v, i) => (
                  <option value={keys[i] || String(i)} key={i}>
                    {v}
                  </option>
                ))}
              </select>
            ) : (
              <input
                value={answers[q.id] || ""}
                onChange={(e) =>
                  setAnswers((a) => ({ ...a, [q.id]: e.target.value }))
                }
              />
            )}
          </label>
        );
      })}
      <button
        className={s.button}
        disabled={busy}
        onClick={async () => {
          setBusy(true);
          setError(false);
          controller.current = new AbortController();
          try {
            const g = await action(
              m.key,
              locale,
              m.releaseId,
              "grade",
              { answers },
              controller.current.signal,
            );
            setGrade(g);
          } catch {
            setError(true);
          } finally {
            setBusy(false);
          }
        }}
      >
        {j("practice", locale)}
      </button>
      {error ? <p role="alert">{j("error", locale)}</p> : null}
      {grade ? (
        <div role="status">
          {rows(grade.results)
            .filter((x) =>
              questions.some((q) => q.id === (x.id || x.questionId)),
            )
            .map((x) => (
              <p key={x.id || x.questionId}>
                {x.correct ? "✓" : "○"} {str(x.explanation)}
              </p>
            ))}
        </div>
      ) : null}
    </section>
  );
}
