"use client";
import { clientId } from "./client-id";
import { useEffect, useRef, useState } from "react";
import { useNativeCheck, BridgeLaboratory } from "./experience/Interactions";
import { tr } from "../catalogue";
import x from "./experience/experience.module.css";
import { activityDocument } from "../../digital-customer-experience/html-activity";
import {
  asset,
  clampIndex,
  num,
  obj,
  rows,
  str,
  time,
  type Row,
} from "./model";
import {
  action,
  Button,
  Empty,
  ErrorNote,
  Pager,
  Progress,
  Source,
  type PlayerProps,
} from "./shared";
import { local, t } from "./copy";
import s from "./detail.module.css";
export function Assessment({
  m,
  d,
  locale,
  engine,
  state,
  update,
  runAction,
}: PlayerProps) {
  const allQuestions = rows(d.questions),
    order: string[] = Array.isArray(state.questionOrder)
      ? state.questionOrder
      : [],
    questions =
      order.length === allQuestions.length &&
      new Set(order).size === allQuestions.length &&
      order.every((id) => allQuestions.some((q) => q.id === id))
        ? order.map((id) => allQuestions.find((q) => q.id === id)!)
        : allQuestions,
    reviewed: string[] = Array.isArray(state.reviewIds) ? state.reviewIds : [],
    checks = obj(state.questionChecks),
    check = useNativeCheck({ m, d, locale, engine, state, update, runAction }),
    index = clampIndex(state.index, questions.length),
    answers = obj(state.answers),
    result = obj(state.grade),
    graded = typeof result.percent === "number",
    attempts = num(state.attempts),
    limit = num(d.attemptLimit),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(false),
    [now, setNow] = useState(Date.now()),
    controller = useRef<AbortController | null>(null),
    inFlight = useRef(false),
    latest = useRef({ state, answers });
  latest.current = { state, answers };
  const timed = engine === "timed",
    deadline = num(state.deadline),
    seconds =
      timed && deadline
        ? Math.max(0, Math.ceil((deadline - now) / 1000))
        : Math.max(1, num(d.minutes, 10)) * 60,
    started = state.started === true,
    retryAllowed =
      d.retryPolicy !== "disabled" &&
      !(
        d.retryPolicy === "until_pass" &&
        num(result.percent) >= num(d.passingScore, 70)
      ) &&
      (!limit || attempts < limit);
  useEffect(() => () => controller.current?.abort(), []);
  useEffect(() => {
    if (!started || graded || !timed) return;
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [started, graded, timed]);
  async function finish() {
    if (inFlight.current) return;
    inFlight.current = true;
    setBusy(true);
    setError(false);
    controller.current = new AbortController();
    try {
      const grade = runAction
        ? await runAction(
            "grade",
            { answers: latest.current.answers },
            controller.current.signal,
          )
        : await action(
            m.key,
            locale,
            m.releaseId,
            "grade",
            { answers: latest.current.answers },
            controller.current.signal,
          );
      update({
        grade,
        score: grade.percent,
        outcomeReceipt: grade.outcomeReceipt,
        completionReceipt: grade.completionReceipt,
        skills: grade.skills,
        complete: true,
        started: false,
        attempts: attempts + 1,
        deadline: null,
      });
    } catch (e) {
      if ((e as Error).name !== "AbortError") setError(true);
    } finally {
      inFlight.current = false;
      setBusy(false);
    }
  }
  useEffect(() => {
    if (started && timed && seconds === 0 && !graded && !error) void finish();
  }, [seconds, started, timed, graded, error]);
  function start() {
    const ids = allQuestions.map((q) => q.id);
    if (d.shuffle === true)
      for (let i = ids.length - 1; i > 0; i--) {
        const n = Math.floor(Math.random() * (i + 1));
        [ids[i], ids[n]] = [ids[n], ids[i]];
      }
    update({
      questionOrder: ids,
      reviewIds: [],
      questionChecks: {},
      started: true,
      grade: null,
      complete: false,
      answers: {},
      score: null,
      index: 0,
      deadline: timed
        ? Date.now() + Math.max(1, num(d.minutes, 10)) * 60000
        : null,
    });
    setNow(Date.now());
    setError(false);
  }
  function question(q: Row) {
    const id = str(q.id),
      kind = str(q.type),
      labels = local(q, "choices", locale).split("\n").filter(Boolean),
      keys = str(q.choiceKeys).split("\n").filter(Boolean),
      choices =
        kind === "true_false"
          ? [
              { label: t("yes", locale), value: "true" },
              { label: t("no", locale), value: "false" },
            ]
          : labels.map((label, i) => ({ label, value: keys[i] || String(i) }));
    return (
      <fieldset key={id} id={"r5-question-" + id} className={s.question}>
        <legend>{local(q, "prompt", locale)}</legend>
        {q.assetId ? (
          <Source m={m} id={q.assetId} alt={local(q, "prompt", locale)} />
        ) : null}
        {choices.length ? (
          choices.map((c) => (
            <label
              key={c.value}
              className={s.answer}
              data-selected={
                kind === "multi"
                  ? str(answers[id]).split(",").includes(c.value)
                  : answers[id] === c.value
              }
            >
              <input
                disabled={graded || busy}
                type={kind === "multi" ? "checkbox" : "radio"}
                name={"question-" + id}
                value={c.value}
                checked={
                  kind === "multi"
                    ? str(answers[id]).split(",").includes(c.value)
                    : answers[id] === c.value
                }
                onChange={(e) => {
                  const before = str(answers[id]).split(",").filter(Boolean);
                  update({
                    answers: {
                      ...answers,
                      [id]:
                        kind === "multi"
                          ? (e.target.checked
                              ? [...new Set([...before, c.value])]
                              : before.filter((v) => v !== c.value)
                            ).join(",")
                          : c.value,
                    },
                  });
                }}
              />
              <span>{c.label}</span>
            </label>
          ))
        ) : (
          <input
            aria-label={local(q, "prompt", locale)}
            type={kind === "number" ? "number" : "text"}
            maxLength={4000}
            value={answers[id] || ""}
            disabled={graded || busy}
            onChange={(e) =>
              update({ answers: { ...answers, [id]: e.target.value } })
            }
          />
        )}
        <div className={x.actions}>
          <Button
            aria-pressed={reviewed.includes(id)}
            onClick={() =>
              update({
                reviewIds: reviewed.includes(id)
                  ? reviewed.filter((v) => v !== id)
                  : [...reviewed, id],
              })
            }
          >
            {tr(
              ["Mark for review", "Marquer pour révision", "ضع علامة للمراجعة"],
              locale,
            )}{" "}
            {reviewed.includes(id) ? "★" : "☆"}
          </Button>
          {d.feedbackPolicy === "immediate" && !graded ? (
            <Button
              disabled={check.busy || busy || !str(answers[id])}
              onClick={() =>
                void check.run(
                  "check_question",
                  { questionId: id, answer: str(answers[id]) },
                  (r) =>
                    update({
                      questionChecks: {
                        ...checks,
                        [id]: { ...r, answer: str(answers[id]) },
                      },
                    }),
                )
              }
            >
              {tr(
                [
                  "Check this answer",
                  "Vérifier cette réponse",
                  "تحقق من هذه الإجابة",
                ],
                locale,
              )}
            </Button>
          ) : null}
        </div>
        {obj(checks[id]).answer === answers[id] &&
        rows(obj(checks[id]).results).length ? (
          <div role="status" className={x.feedback}>
            {rows(obj(checks[id]).results).map((r) => (
              <p key={r.id}>
                {r.correct ? "✓" : "↻"}{" "}
                {r.explanation ||
                  tr(
                    [
                      r.correct ? "Correct" : "Try again",
                      r.correct ? "Correct" : "Réessayez",
                      r.correct ? "صحيح" : "حاول مجدداً",
                    ],
                    locale,
                  )}
              </p>
            ))}
          </div>
        ) : null}
      </fieldset>
    );
  }
  if (!questions.length) return <Empty locale={locale} />;
  const answered = questions.filter((q) => str(answers[q.id])).length;
  return (
    <div className={s.assessment}>
      <div className={s.quizTop}>
        <span>
          {attempts}
          {limit ? " / " + limit : ""} {t("attempts", locale)}
        </span>
        {timed ? (
          <strong role="timer" aria-label={t("timeLeft", locale)}>
            {time(seconds)}
          </strong>
        ) : null}
        <span>
          {answered} / {questions.length} {t("answered", locale)}
        </span>
      </div>
      {!started && !graded ? (
        <div className={s.startCard}>
          <span className={s.bigIcon}>?</span>
          <h2>{m.title}</h2>
          {local(d, "instructions", locale) ? (
            <p>{local(d, "instructions", locale)}</p>
          ) : null}
          <Button
            primary
            onClick={start}
            disabled={!!limit && attempts >= limit}
          >
            {t("start", locale)}
          </Button>
        </div>
      ) : null}
      {started ? (
        <>
          <Progress
            value={(answered / questions.length) * 100}
            label={answered + " / " + questions.length}
          />
          <nav
            className={x.questionMap}
            aria-label={tr(
              [
                "Question map: answered, unanswered and review markers",
                "Carte des questions : réponses et repères de révision",
                "خريطة الأسئلة: الإجابات وعلامات المراجعة",
              ],
              locale,
            )}
          >
            {questions.map((q, i) => (
              <button
                key={q.id}
                aria-current={index === i ? "step" : undefined}
                data-answered={!!str(answers[q.id])}
                onClick={() => {
                  update({ index: i });
                  document
                    .getElementById("r5-question-" + q.id)
                    ?.scrollIntoView({ block: "center" });
                }}
                aria-label={`${i + 1} · ${str(answers[q.id]) ? t("answered", locale) : tr(["Unanswered", "Sans réponse", "بلا إجابة"], locale)}${reviewed.includes(q.id) ? " ★" : ""}`}
              >
                {i + 1}
                {reviewed.includes(q.id)
                  ? " ★"
                  : str(answers[q.id])
                    ? " ✓"
                    : ""}
              </button>
            ))}
          </nav>
          {engine === "practice"
            ? questions.map(question)
            : question(questions[index])}
          {engine !== "practice" ? (
            <Pager
              index={index}
              count={questions.length}
              onChange={(i) => update({ index: i })}
              locale={locale}
            />
          ) : null}
          <Button
            primary
            onClick={() => void finish()}
            disabled={
              busy || (!seconds ? false : answered !== questions.length)
            }
          >
            {busy ? t("loading", locale) : t("getResult", locale)}
          </Button>
        </>
      ) : null}
      {graded ? (
        <div className={s.result} role="status">
          <span className={s.resultScore}>
            {result.percent}
            <small>%</small>
          </span>
          <div>
            <h2>{t("result", locale)}</h2>
            <p>
              {result.earned} / {result.total}
            </p>
            <small>{t("notGraded", locale)}</small>
          </div>
          {rows(result.results).length ? (
            <details>
              <summary>{t("feedback", locale)}</summary>
              {rows(result.results).map((r) => (
                <article key={r.id}>
                  <strong>
                    {local(
                      questions.find((q) => q.id === r.id) || {},
                      "prompt",
                      locale,
                    )}
                  </strong>
                  <p>
                    {r.correct ? "✓" : "○"} · {r.points}
                  </p>
                  {r.explanation ? <p>{r.explanation}</p> : null}
                </article>
              ))}
            </details>
          ) : null}
          {retryAllowed ? (
            <Button onClick={start}>{t("restart", locale)}</Button>
          ) : (
            <p>{t("retryClosed", locale)}</p>
          )}
        </div>
      ) : null}
      {check.error ? <ErrorNote locale={locale} /> : null}
      {error ? <ErrorNote locale={locale} retry={() => void finish()} /> : null}
    </div>
  );
}
export function Activities(props: PlayerProps) {
  return props.d.engine === "bridge" ? (
    <BridgeLaboratory {...props} />
  ) : (
    <NativeActivities {...props} />
  );
}
function NativeActivities({
  m,
  d,
  locale,
  engine,
  state,
  update,
  runAction,
}: PlayerProps) {
  const tasks = rows(d.tasks),
    type = str(d.engine),
    pair = ["memory", "matching"].includes(type),
    matched = Array.isArray(state.matched) ? state.matched : [],
    selected = Array.isArray(state.selected) ? state.selected : [],
    values = obj(state.values),
    index = clampIndex(state.index, tasks.length),
    current = tasks[index],
    stepped = ["stepper", "simulation"].includes(engine),
    visible = stepped && current ? [current] : tasks,
    [busy, setBusy] = useState(false),
    [error, setError] = useState(false),
    [feedback, setFeedback] = useState<null | boolean>(null),
    [now, setNow] = useState(Date.now()),
    controller = useRef<AbortController | null>(null),
    locked = useRef(false),
    attempts = num(state.attempts),
    [channel] = useState(() => clientId().replaceAll("-", ""));
  const challenge = engine === "challenge",
    deadline = num(state.deadline),
    remaining = deadline
      ? Math.max(0, Math.ceil((deadline - now) / 1000))
      : Math.max(1, num(d.challengeSeconds, 120)),
    done = state.complete === true,
    limit = num(d.attemptLimit),
    closed =
      done ||
      (!!limit && attempts >= limit) ||
      (challenge && deadline > 0 && remaining === 0);
  useEffect(() => () => controller.current?.abort(), []);
  useEffect(() => {
    if (!challenge || !deadline || closed) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [challenge, deadline, closed]);
  function begin() {
    if (challenge && !deadline)
      update({
        deadline: Date.now() + Math.max(1, num(d.challengeSeconds, 120)) * 1000,
      });
  }
  async function check(input: Row) {
    if (locked.current || closed) return;
    locked.current = true;
    begin();
    setBusy(true);
    setError(false);
    controller.current = new AbortController();
    try {
      const result = runAction
        ? await runAction("activity", { input }, controller.current.signal)
        : await action(
            m.key,
            locale,
            m.releaseId,
            "activity",
            { input },
            controller.current.signal,
          );
      setFeedback(result.correct);
      const patch: Row = { attempts: attempts + 1 };
      if (pair) {
        patch.selected = [];
        if (result.correct) {
          patch.matched = [...new Set([...matched, ...input.pair])];
          patch.complete = patch.matched.length === tasks.length;
        }
      } else if (result.correct) {
        if (stepped && index < tasks.length - 1) patch.index = index + 1;
        else patch.complete = true;
      }
      update(patch);
    } catch (e) {
      if ((e as Error).name !== "AbortError") setError(true);
    } finally {
      locked.current = false;
      setBusy(false);
    }
  }
  function pick(id: string) {
    if (closed || busy || matched.includes(id)) return;
    begin();
    const next = selected.includes(id)
      ? selected.filter((x: string) => x !== id)
      : [...selected, id];
    update({ selected: next });
    if (pair && next.length === 2) void check({ pair: next });
  }
  const frame = useRef<HTMLIFrameElement>(null);
  useEffect(() => {
    const listener = (event: MessageEvent) => {
      if (
        event.source !== frame.current?.contentWindow ||
        event.data?.type !== "angelcare.activity.choice" ||
        event.data?.channel !== channel
      )
        return;
      const raw = String(event.data.value || ""),
        i = raw.lastIndexOf("|"),
        id = raw.slice(0, i),
        value = raw.slice(i + 1);
      if (i < 0 || !tasks.some((t) => t.id === id) || !/^\d{1,3}$/.test(value))
        return;
      const next = { ...values, [id]: value };
      update({ values: next });
      void check({ values: next, targetIds: [id] });
    };
    window.addEventListener("message", listener);
    return () => window.removeEventListener("message", listener);
  }, [channel, JSON.stringify(values), busy, closed]);
  if (!tasks.length) return <Empty locale={locale} />;
  let html = "";
  if (obj(d.htmlActivity).enabled === true)
    try {
      html = activityDocument(
        str(d.htmlActivity.markup),
        channel,
        channel,
        obj(m.bindings),
      );
    } catch {}
  return (
    <div className={s.activity}>
      <div className={s.quizTop}>
        <strong>{local(d, "goal", locale) || m.title}</strong>
        <span>
          {attempts}
          {limit ? " / " + limit : ""} {t("attempts", locale)}
        </span>
        {challenge ? <strong role="timer">{time(remaining)}</strong> : null}
      </div>
      {html ? (
        <iframe
          ref={frame}
          title={m.title}
          srcDoc={html}
          sandbox="allow-scripts"
          className={s.activityFrame}
        />
      ) : pair ? (
        <div className={s.memoryGrid}>
          {tasks.map((task) => (
            <button
              key={task.id}
              disabled={
                closed ||
                busy ||
                matched.includes(task.id) ||
                (selected.length >= 2 && !selected.includes(task.id))
              }
              aria-pressed={selected.includes(task.id)}
              data-matched={matched.includes(task.id)}
              onClick={() => pick(task.id)}
            >
              {type === "memory" &&
              !selected.includes(task.id) &&
              !matched.includes(task.id) ? (
                <span className={s.memoryBack}>?</span>
              ) : (
                <>
                  {task.assetId ? (
                    <Source
                      m={m}
                      id={task.assetId}
                      alt={local(task, "prompt", locale)}
                    />
                  ) : null}
                  <strong>{local(task, "prompt", locale)}</strong>
                </>
              )}
              {matched.includes(task.id) ? " ✓" : ""}
            </button>
          ))}
        </div>
      ) : (
        <div className={s.taskGrid}>
          {visible.map((task) => (
            <article key={task.id} className={s.task}>
              <h3>{local(task, "prompt", locale)}</h3>
              {task.assetId ? (
                <Source
                  m={m}
                  id={task.assetId}
                  alt={local(task, "prompt", locale)}
                />
              ) : null}
              {type === "sequence" ? (
                <Button disabled={closed || busy} onClick={() => pick(task.id)}>
                  {selected.includes(task.id)
                    ? selected.indexOf(task.id) + 1
                    : "+"}
                </Button>
              ) : (
                <label>
                  <span className={s.sr}>{t("choose", locale)}</span>
                  <select
                    disabled={closed || busy}
                    value={values[task.id] || ""}
                    onChange={(e) => {
                      begin();
                      update({
                        values: { ...values, [task.id]: e.target.value },
                      });
                    }}
                  >
                    <option value="">{t("choose", locale)}</option>
                    {local(task, "choices", locale)
                      .split("\n")
                      .filter(Boolean)
                      .map((v, i) => (
                        <option key={i} value={String(i)}>
                          {v}
                        </option>
                      ))}
                  </select>
                </label>
              )}
              {local(task, "hint", locale) ? (
                <details>
                  <summary>{t("hint", locale)}</summary>
                  <p>{local(task, "hint", locale)}</p>
                </details>
              ) : null}
            </article>
          ))}
        </div>
      )}
      {!pair && !html ? (
        <Button
          primary
          disabled={busy || closed}
          onClick={() =>
            void check({
              values,
              selected,
              targetIds: visible.map((t) => t.id),
            })
          }
        >
          {t("check", locale)}
        </Button>
      ) : null}
      {pair ? (
        <Progress
          value={(matched.length / tasks.length) * 100}
          label={matched.length + " / " + tasks.length}
        />
      ) : null}
      {stepped ? (
        <Pager
          index={index}
          count={tasks.length}
          locale={locale}
          onChange={(i) => update({ index: i })}
        />
      ) : null}
      {feedback !== null ? (
        <div role="status" className={feedback ? s.success : s.callout}>
          {t(feedback ? "correct" : "tryAgain", locale)}
        </div>
      ) : null}
      {done ? <h2 className={s.success}>{t("completed", locale)}</h2> : null}
      {error ? <ErrorNote locale={locale} /> : null}
      {d.allowRestart !== false &&
      d.retryPolicy !== "disabled" &&
      (!limit || attempts < limit) ? (
        <Button
          disabled={busy}
          onClick={() => {
            update({
              matched: [],
              selected: [],
              values: {},
              index: 0,
              complete: false,
              deadline: null,
            });
            setFeedback(null);
          }}
        >
          {t("restart", locale)}
        </Button>
      ) : null}
    </div>
  );
}
