"use client";
import { useEffect, useRef, useState } from "react";
import { tr } from "../../catalogue";
import { asset, obj, rows, str, type Row } from "../model";
import { action, Button, ErrorNote, Source, type PlayerProps } from "../shared";
import { local, t } from "../copy";
import {
  bridgeConfig,
  bridgeGeometry,
} from "../../../digital-customer-experience/detail-interactions";
import s from "./experience.module.css";
export function useNativeCheck(p: PlayerProps) {
  const [busy, setBusy] = useState(false),
    [error, setError] = useState(false),
    locked = useRef(false),
    controller = useRef<AbortController | null>(null);
  useEffect(() => () => controller.current?.abort(), []);
  return {
    busy,
    error,
    async run(operation: string, input: Row, done: (r: Row) => void) {
      if (locked.current) return;
      locked.current = true;
      setBusy(true);
      setError(false);
      controller.current = new AbortController();
      try {
        const r = p.runAction
          ? await p.runAction(operation, input, controller.current.signal)
          : await action(
              p.m.key,
              p.locale,
              p.m.releaseId,
              operation,
              input,
              controller.current.signal,
            );
        done(r);
      } catch (e) {
        if ((e as Error).name !== "AbortError") setError(true);
      } finally {
        locked.current = false;
        setBusy(false);
      }
    },
  };
}
export function CardClassification(p: PlayerProps) {
  const { m, d, locale: l, state, update } = p,
    rules = rows(d.sortRules),
    rule = rules.find((r) => r.id === state.sortRuleId) || rules[0],
    groups = rows(d.sortGroups).filter((g) => g.ruleId === rule?.id),
    cards = rows(d.cards),
    placements = obj(state.sortPlacements),
    values = obj(placements[rule?.id]),
    grades = obj(state.sortGrades),
    grade = obj(grades[rule?.id]),
    check = useNativeCheck(p);
  if (d.sortingEnabled !== true || !rule) return null;
  function place(id: string, group: string) {
    update({
      sortPlacements: { ...placements, [rule.id]: { ...values, [id]: group } },
      sortGrades: { ...grades, [rule.id]: null },
      started: true,
    });
  }
  const complete = cards.every((c) =>
    groups.some((g) => g.id === values[c.id]),
  );
  return (
    <section
      className={s.classification}
      aria-label={tr(
        ["Classification studio", "Atelier de classement", "ورشة التصنيف"],
        l,
      )}
    >
      <div className={s.sectionHead}>
        <div>
          <span className={s.eyebrow}>
            01 /{" "}
            {tr(
              [
                "REASON & ORGANISE",
                "RAISONNER ET ORGANISER",
                "التفكير والتنظيم",
              ],
              l,
            )}
          </span>
          <h2>
            {tr(
              [
                "One collection. Several ways to think.",
                "Une collection. Plusieurs façons de penser.",
                "مجموعة واحدة وطرق متعددة للتفكير.",
              ],
              l,
            )}
          </h2>
        </div>
        <label>
          {tr(
            ["Classification rule", "Règle de classement", "قاعدة التصنيف"],
            l,
          )}
          <select
            value={rule.id}
            disabled={check.busy}
            onChange={(e) => update({ sortRuleId: e.target.value })}
          >
            {rules.map((r) => (
              <option key={r.id} value={r.id}>
                {local(r, "title", l)}
              </option>
            ))}
          </select>
        </label>
      </div>
      <p>{local(rule, "text", l)}</p>
      <p className={s.muted}>
        {tr(
          [
            "Drag a card into a group, or use its menu. Your choices are checked against the published rule.",
            "Glissez une carte dans un groupe ou utilisez son menu. La vérification suit la règle publiée.",
            "اسحب البطاقة إلى مجموعة أو استخدم قائمتها. تُراجع اختياراتك وفق القاعدة المنشورة.",
          ],
          l,
        )}
      </p>
      <div className={s.sortBoard}>
        {[
          { id: "", title: tr(["To classify", "À classer", "للتصنيف"], l) },
          ...groups,
        ].map((g) => (
          <div
            className={s.sortGroup}
            key={g.id}
            onDragOver={(e) => {
              if (!check.busy) e.preventDefault();
            }}
            onDrop={(e) => {
              e.preventDefault();
              const id = e.dataTransfer.getData("text/plain");
              if (!check.busy && cards.some((c) => c.id === id))
                place(id, g.id);
            }}
          >
            <h3>
              {g.id ? local(g, "title", l) : g.title}
              <small>
                {cards.filter((c) => str(values[c.id]) === g.id).length}
              </small>
            </h3>
            {cards
              .filter((c) => str(values[c.id]) === g.id)
              .map((c) => (
                <article
                  className={s.sortCard}
                  key={c.id}
                  draggable={!check.busy}
                  onDragStart={(e) =>
                    e.dataTransfer.setData("text/plain", c.id)
                  }
                >
                  <Source
                    m={m}
                    id={c.assetId}
                    alt={local(c, "alt", l) || local(c, "title", l)}
                  />
                  <strong>{local(c, "title", l)}</strong>
                  <label>
                    <span className={s.sr}>
                      {tr(["Move card", "Déplacer la carte", "نقل البطاقة"], l)}
                    </span>
                    <select
                      disabled={check.busy}
                      value={str(values[c.id])}
                      onChange={(e) => place(c.id, e.target.value)}
                    >
                      <option value="">
                        {tr(["To classify", "À classer", "للتصنيف"], l)}
                      </option>
                      {groups.map((g) => (
                        <option key={g.id} value={g.id}>
                          {local(g, "title", l)}
                        </option>
                      ))}
                    </select>
                  </label>
                  {rows(grade.results).find((r) => r.id === c.id) ? (
                    <span>
                      {rows(grade.results).find((r) => r.id === c.id)?.correct
                        ? "✓"
                        : "↻"}{" "}
                      {tr(
                        [
                          rows(grade.results).find((r) => r.id === c.id)
                            ?.correct
                            ? "Accepted"
                            : "Reconsider",
                          rows(grade.results).find((r) => r.id === c.id)
                            ?.correct
                            ? "Accepté"
                            : "À revoir",
                          rows(grade.results).find((r) => r.id === c.id)
                            ?.correct
                            ? "مقبول"
                            : "راجع الاختيار",
                        ],
                        l,
                      )}
                    </span>
                  ) : null}
                </article>
              ))}
          </div>
        ))}
      </div>
      <div className={s.actions}>
        <Button
          primary
          disabled={!complete || check.busy}
          onClick={() =>
            void check.run(
              "sort_cards",
              { input: { ruleId: rule.id, values } },
              (r) => update({ sortGrades: { ...grades, [rule.id]: r } }),
            )
          }
        >
          {check.busy
            ? t("loading", l)
            : tr(
                [
                  "Check this classification",
                  "Vérifier ce classement",
                  "تحقق من التصنيف",
                ],
                l,
              )}
        </Button>
        <Button
          disabled={check.busy}
          onClick={() =>
            update({
              sortPlacements: { ...placements, [rule.id]: {} },
              sortGrades: { ...grades, [rule.id]: null },
            })
          }
        >
          {t("restart", l)}
        </Button>
      </div>
      {grade.total ? (
        <p role="status">
          {rows(grade.results).filter((r) => r.correct).length} / {grade.total}{" "}
          ·{" "}
          {grade.correct
            ? tr(["Rule understood", "Règle comprise", "تم فهم القاعدة"], l)
            : tr(
                [
                  "Try another arrangement",
                  "Essayez une autre organisation",
                  "جرّب ترتيباً آخر",
                ],
                l,
              )}
        </p>
      ) : null}
      {check.error ? <ErrorNote locale={l} /> : null}
    </section>
  );
}
export function SoundInvestigation(p: PlayerProps) {
  const { m, d, locale: l, state, update } = p,
    items = rows(d.soundItems),
    sounds = items.filter((i) => i.kind === "audio"),
    images = items.filter((i) => i.kind === "image"),
    saved = obj(state.soundInvestigation),
    matched = rows(saved.matched),
    [audioId, setAudioId] = useState(""),
    [imageId, setImageId] = useState(""),
    [feedback, setFeedback] = useState<boolean | null>(null),
    [failed, setFailed] = useState(""),
    audioRefs = useRef<Record<string, HTMLAudioElement>>({}),
    check = useNativeCheck(p);
  useEffect(
    () => () => Object.values(audioRefs.current).forEach((a) => a.pause()),
    [],
  );
  if (d.soundMatchingEnabled !== true || !sounds.length) return null;
  return (
    <section className={s.soundLab}>
      <div className={s.sectionHead}>
        <div>
          <span className={s.eyebrow}>
            {tr(
              [
                "LISTEN · NOTICE · CONNECT",
                "ÉCOUTER · OBSERVER · RELIER",
                "استمع · لاحظ · اربط",
              ],
              l,
            )}
          </span>
          <h2>
            {tr(
              [
                "Investigate the sound. Find its image.",
                "Explorez le son. Retrouvez son image.",
                "استكشف الصوت وحدد صورته.",
              ],
              l,
            )}
          </h2>
        </div>
        <strong>
          {matched.length} / {sounds.length}
        </strong>
      </div>
      <div className={s.soundColumns}>
        <div>
          <h3>{tr(["Sound sources", "Sources sonores", "مصادر الصوت"], l)}</h3>
          {sounds.map((i, n) => {
            const a = asset(m, i.assetId, "audio/"),
              done = matched.some((r) => r.audioId === i.id);
            return (
              <article className={s.soundCard} key={i.id}>
                <Button
                  disabled={done || check.busy}
                  aria-pressed={audioId === i.id}
                  onClick={() => {
                    setAudioId(i.id);
                    setFeedback(null);
                  }}
                >
                  {done ? "✓" : String(n + 1).padStart(2, "0")}{" "}
                  {local(i, "title", l)}
                </Button>
                {a ? (
                  <audio
                    ref={(node) => {
                      if (node) audioRefs.current[i.id] = node;
                      else delete audioRefs.current[i.id];
                    }}
                    controls
                    preload="none"
                    src={a.url}
                    onPlay={() => {
                      Object.entries(audioRefs.current).forEach(
                        ([id, node]) => {
                          if (id !== i.id) node.pause();
                        },
                      );
                      setAudioId(i.id);
                    }}
                    onError={() => setFailed(i.id)}
                  />
                ) : (
                  <p>{t("unavailable", l)}</p>
                )}
                {failed === i.id ? (
                  <Button
                    onClick={() => {
                      setFailed("");
                      audioRefs.current[i.id]?.load();
                    }}
                  >
                    {t("retry", l)}
                  </Button>
                ) : null}
              </article>
            );
          })}
        </div>
        <div>
          <h3>
            {tr(["Image choices", "Choix visuels", "الخيارات المصورة"], l)}
          </h3>
          <div className={s.imageChoices}>
            {images.map((i) => (
              <button
                key={i.id}
                disabled={check.busy || matched.some((r) => r.imageId === i.id)}
                aria-pressed={imageId === i.id}
                onClick={() => {
                  setImageId(i.id);
                  setFeedback(null);
                }}
              >
                <Source m={m} id={i.coverAssetId} alt={local(i, "title", l)} />
                <span>
                  {local(i, "title", l)}{" "}
                  {matched.some((r) => r.imageId === i.id) ? "✓" : ""}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>
      <Button
        primary
        disabled={
          !audioId ||
          !imageId ||
          check.busy ||
          matched.some((r) => r.audioId === audioId || r.imageId === imageId)
        }
        onClick={() =>
          void check.run(
            "match_audio",
            { input: { audioId, imageId } },
            (r) => {
              setFeedback(r.correct);
              if (r.correct) {
                update({
                  soundInvestigation: {
                    matched: [...matched, { audioId, imageId }],
                  },
                  started: true,
                });
                setAudioId("");
                setImageId("");
              }
            },
          )
        }
      >
        {check.busy
          ? t("loading", l)
          : tr(
              [
                "Check association",
                "Vérifier l’association",
                "تحقق من الارتباط",
              ],
              l,
            )}
      </Button>
      {feedback !== null ? (
        <p role="status">
          {feedback
            ? tr(
                [
                  "Connection found. Continue listening.",
                  "Association trouvée. Poursuivez l’écoute.",
                  "تم العثور على الارتباط. واصل الاستماع.",
                ],
                l,
              )
            : tr(
                [
                  "Listen again and try another image.",
                  "Réécoutez et essayez une autre image.",
                  "استمع مجدداً وجرّب صورة أخرى.",
                ],
                l,
              )}
        </p>
      ) : null}
      {matched.length === sounds.length ? (
        <p role="status">
          {tr(
            [
              "All sound pairs discovered.",
              "Toutes les associations sonores sont découvertes.",
              "تم اكتشاف جميع أزواج الأصوات.",
            ],
            l,
          )}
        </p>
      ) : null}
      <Button
        disabled={check.busy}
        onClick={() => {
          update({ soundInvestigation: { matched: [] } });
          setFeedback(null);
          setAudioId("");
          setImageId("");
        }}
      >
        {t("restart", l)}
      </Button>
      {check.error ? <ErrorNote locale={l} /> : null}
    </section>
  );
}
export function BridgeLaboratory(p: PlayerProps) {
  const { d, locale: l, state, update } = p,
    challenges = rows(d.bridgeChallenges),
    challenge =
      challenges.find((c) => c.id === state.bridgeChallengeId) || challenges[0],
    drafts = obj(state.bridgeDrafts),
    selected: Array<string> = Array.isArray(drafts[challenge?.id])
      ? drafts[challenge.id]
      : [],
    history = rows(state.bridgeTests),
    passed: Array<string> = Array.isArray(state.bridgePassed)
      ? state.bridgePassed
      : [],
    check = useNativeCheck(p);
  if (!challenge) return null;
  const config = bridgeConfig(challenge),
    geometry = bridgeGeometry(config),
    signature = [...selected].sort().join("|"),
    last = history
      .filter(
        (h) => h.challengeId === challenge.id && h.signature === signature,
      )
      .at(-1),
    attempts = history.filter((h) => h.challengeId === challenge.id).length,
    limit = Number(d.attemptLimit) || 0;
  function toggle(id: string) {
    if (check.busy) return;
    update({
      bridgeDrafts: {
        ...drafts,
        [challenge.id]: selected.includes(id)
          ? selected.filter((x) => x !== id)
          : [...selected, id],
      },
      started: true,
    });
  }
  return (
    <section className={s.bridgeLab}>
      <div className={s.sectionHead}>
        <div>
          <span className={s.eyebrow}>
            {tr(
              [
                "BUILD · TEST · COMPARE",
                "CONSTRUIRE · TESTER · COMPARER",
                "ابنِ · اختبر · قارن",
              ],
              l,
            )}
          </span>
          <h2>{local(challenge, "title", l)}</h2>
        </div>
        <select
          aria-label={tr(["Challenge", "Défi", "التحدي"], l)}
          value={challenge.id}
          disabled={check.busy}
          onChange={(e) => update({ bridgeChallengeId: e.target.value })}
        >
          {challenges.map((c) => (
            <option key={c.id} value={c.id}>
              {local(c, "title", l)}
              {passed.includes(c.id) ? " ✓" : ""}
            </option>
          ))}
        </select>
      </div>
      <p>{local(challenge, "text", l)}</p>
      <p className={s.muted}>
        {tr(
          [
            "Classroom network-capacity model: each member carries a share of the load towards two supports. This model does not calculate the safety of real structures.",
            "Modèle pédagogique de capacité de réseau : chaque barre transmet une part de charge vers deux appuis. Ce modèle ne calcule pas la sécurité de structures réelles.",
            "نموذج تعليمي لقدرة الشبكة: ينقل كل عضو جزءاً من الحمل نحو دعامتين. لا يحسب هذا النموذج سلامة المنشآت الحقيقية.",
          ],
          l,
        )}
      </p>
      <div className={s.bridgeStats}>
        <div>
          <span>
            {tr(["Target load", "Charge cible", "الحمل المستهدف"], l)}
          </span>
          <strong>{config.targetLoad}</strong>
        </div>
        <div>
          <span>
            {tr(
              ["Members / budget", "Barres / budget", "الأعضاء / العدد المتاح"],
              l,
            )}
          </span>
          <strong>
            {selected.length} / {config.edgeBudget}
          </strong>
        </div>
        <div>
          <span>
            {tr(["Tested capacity", "Capacité testée", "القدرة المختبرة"], l)}
          </span>
          <strong>{last ? last.capacity : "—"}</strong>
        </div>
      </div>
      <svg
        viewBox={`-0.4 -0.6 ${config.span + 0.8} 2.4`}
        className={s.bridgeCanvas}
        aria-label={tr(
          [
            "Bridge construction canvas; use the member list below for keyboard input.",
            "Canevas du pont ; utilisez la liste des barres ci-dessous au clavier.",
            "لوحة بناء الجسر؛ استخدم قائمة الأعضاء أدناه بلوحة المفاتيح.",
          ],
          l,
        )}
      >
        {geometry.members.map((edge) => {
          const a = geometry.nodes.find((n) => n.id === edge.a)!,
            b = geometry.nodes.find((n) => n.id === edge.b)!;
          return (
            <g
              key={edge.id}
              onClick={() => toggle(edge.id)}
              className={
                selected.includes(edge.id) ? s.memberSelected : s.member
              }
            >
              <line
                x1={a.x}
                y1={1 - a.y}
                x2={b.x}
                y2={1 - b.y}
                strokeWidth=".16"
                stroke="transparent"
              />
              <line
                x1={a.x}
                y1={1 - a.y}
                x2={b.x}
                y2={1 - b.y}
                strokeWidth=".035"
              />
            </g>
          );
        })}
        {geometry.nodes.map((n) => (
          <g key={n.id}>
            <circle cx={n.x} cy={1 - n.y} r=".06" fill="#142845" />
            <text x={n.x} y={1 - n.y - 0.1} textAnchor="middle" fontSize=".12">
              {n.id}
            </text>
          </g>
        ))}
        <text x="0" y="1.3" fontSize=".14">
          ▲
        </text>
        <text x={config.span} y="1.3" textAnchor="end" fontSize=".14">
          ▲
        </text>
        <text
          x={Math.floor(config.span / 2)}
          y="1.4"
          textAnchor="middle"
          fontSize=".18"
        >
          ↓ {config.targetLoad}
        </text>
      </svg>
      <details>
        <summary>
          {tr(
            [
              "Choose members with the keyboard",
              "Choisir les barres au clavier",
              "اختيار الأعضاء بلوحة المفاتيح",
            ],
            l,
          )}
        </summary>
        <div className={s.memberChoices}>
          {geometry.members.map((edge) => (
            <label key={edge.id}>
              <input
                type="checkbox"
                disabled={check.busy}
                checked={selected.includes(edge.id)}
                onChange={() => toggle(edge.id)}
              />
              {edge.a} ↔ {edge.b}
            </label>
          ))}
        </div>
      </details>
      <div className={s.actions}>
        <Button
          primary
          disabled={
            check.busy || !selected.length || (!!limit && attempts >= limit)
          }
          onClick={() =>
            void check.run(
              "activity",
              { input: { challengeId: challenge.id, members: selected } },
              (r) => {
                const next = r.correct
                  ? [...new Set([...passed, challenge.id])]
                  : passed;
                update({
                  bridgeTests: [
                    ...history,
                    {
                      ...r,
                      challengeId: challenge.id,
                      signature,
                      construction: [...selected],
                    },
                  ].slice(-100),
                  bridgePassed: next,
                  complete: challenges.every((c) => next.includes(c.id)),
                });
              },
            )
          }
        >
          {check.busy
            ? t("loading", l)
            : tr(
                ["Test construction", "Tester la construction", "اختبر البناء"],
                l,
              )}
        </Button>
        <Button
          disabled={check.busy}
          onClick={() =>
            update({ bridgeDrafts: { ...drafts, [challenge.id]: [] } })
          }
        >
          {tr(
            ["Clear construction", "Effacer la construction", "مسح البناء"],
            l,
          )}
        </Button>
        <span>
          {attempts}
          {limit ? " / " + limit : ""} {t("attempts", l)}
        </span>
      </div>
      {last ? (
        <p role="status">
          {last.correct
            ? tr(
                [
                  "Target reached within the member budget.",
                  "Objectif atteint dans le budget de barres.",
                  "تم تحقيق الهدف ضمن عدد الأعضاء المتاح.",
                ],
                l,
              )
            : tr(
                [
                  "Revise the load path or reduce the number of members.",
                  "Revoyez le trajet de la charge ou réduisez le nombre de barres.",
                  "راجع مسار الحمل أو قلل عدد الأعضاء.",
                ],
                l,
              )}
        </p>
      ) : null}
      {history.length ? (
        <details open>
          <summary>
            {tr(
              [
                "Compare actual tests",
                "Comparer les essais réalisés",
                "قارن الاختبارات الفعلية",
              ],
              l,
            )}
          </summary>
          <div className={s.tableScroll}>
            <table>
              <thead>
                <tr>
                  {[
                    "#",
                    tr(["Challenge", "Défi", "التحدي"], l),
                    tr(["Members", "Barres", "الأعضاء"], l),
                    tr(["Capacity", "Capacité", "القدرة"], l),
                    tr(["Result", "Résultat", "النتيجة"], l),
                  ].map((x) => (
                    <th key={x}>{x}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {history.map((h, i) => (
                  <tr key={i}>
                    <td>{i + 1}</td>
                    <td>
                      {local(
                        challenges.find((c) => c.id === h.challengeId) || {},
                        "title",
                        l,
                      )}
                    </td>
                    <td>
                      {h.members} / {h.budget}
                    </td>
                    <td>
                      {h.capacity} / {h.targetLoad}
                    </td>
                    <td>{h.correct ? "✓" : "↻"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </details>
      ) : null}
      {check.error ? <ErrorNote locale={l} /> : null}
    </section>
  );
}
