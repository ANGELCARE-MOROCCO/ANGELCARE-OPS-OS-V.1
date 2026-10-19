"use client";
import { object, text, type Data, type Locale } from "../types";
import { Button, Field, T } from "./ui";
import s from "./workspace.module.css";
export function QuestionControls({
  question: q,
  language,
  base,
  readOnly,
  onChange,
}: {
  question: Data;
  language: Locale;
  base: string;
  readOnly: boolean;
  onChange: (q: Data) => void;
}) {
  if (!["choice", "multi"].includes(text(q.type))) return null;
  const labels = (
      text(object(object(q.locales)[language]).choices) ||
      (language === base ? text(q.choices) : "")
    ).split("\n"),
    source = text(q.choices).split("\n").filter(Boolean),
    keys = text(q.choiceKeys).split("\n").filter(Boolean),
    correct = (text(q.correctKeys) || text(q.answer))
      .split(",")
      .filter(Boolean),
    rows = source.map((_, i) => ({
      key: keys[i] || String(i),
      label: labels[i] || "",
    }));
  function update(next: typeof rows) {
    const old = rows.map((r) => r.key),
      locales: Data = {};
    for (const [l, v] of Object.entries(object(q.locales))) {
      const values = text(object(v).choices).split("\n");
      locales[l] = {
        ...object(v),
        choices: next
          .map((r) =>
            l === language
              ? r.label
              : old.includes(r.key)
                ? values[old.indexOf(r.key)] || ""
                : "",
          )
          .join("\n"),
      };
    }
    locales[language] = {
      ...object(locales[language]),
      choices: next.map((r) => r.label).join("\n"),
    };
    const kept = correct.filter((k) => next.some((r) => r.key === k));
    onChange({
      ...q,
      locales,
      choices:
        language === base
          ? next.map((r) => r.label).join("\n")
          : text(object(locales[base]).choices) || q.choices,
      choiceKeys: next.map((r) => r.key).join("\n"),
      correctKeys: kept.join(","),
      answer: kept.map((k) => next.findIndex((r) => r.key === k)).join(","),
    });
  }
  return (
    <div className={s.rowCard}>
      <h4>
        <T
          v={[
            "Answer choices · stable identities",
            "Choix de réponse · identités stables",
            "خيارات الإجابة · هويات ثابتة",
          ]}
        />
      </h4>
      {rows.map((r, i) => (
        <div className={s.rowCard} key={r.key}>
          <Field
            label={
              <T v={["Choice label", "Libellé du choix", "عنوان الخيار"]} />
            }
          >
            <input
              value={r.label}
              disabled={readOnly}
              onChange={(e) =>
                update(
                  rows.map((row, n) =>
                    n === i ? { ...row, label: e.target.value } : row,
                  ),
                )
              }
            />
          </Field>
          <label>
            <input
              type="checkbox"
              disabled={readOnly || language !== base}
              checked={correct.includes(r.key)}
              onChange={(e) => {
                const chosen =
                  q.type === "choice"
                    ? e.target.checked
                      ? [r.key]
                      : []
                    : e.target.checked
                      ? [...correct, r.key]
                      : correct.filter((k) => k !== r.key);
                onChange({
                  ...q,
                  choiceKeys: rows.map((r) => r.key).join("\n"),
                  correctKeys: chosen.join(","),
                  answer: chosen
                    .map((k) => rows.findIndex((r) => r.key === k))
                    .join(","),
                });
              }}
            />
            <T v={["Correct answer", "Bonne réponse", "إجابة صحيحة"]} />
          </label>
          <div className={s.actions}>
            <Button
              disabled={readOnly || language !== base || i === 0}
              onClick={() => {
                const next = [...rows];
                [next[i - 1], next[i]] = [next[i], next[i - 1]];
                update(next);
              }}
            >
              ↑
            </Button>
            <Button
              disabled={readOnly || language !== base || i === rows.length - 1}
              onClick={() => {
                const next = [...rows];
                [next[i + 1], next[i]] = [next[i], next[i + 1]];
                update(next);
              }}
            >
              ↓
            </Button>
            <Button
              disabled={readOnly || language !== base || rows.length <= 2}
              onClick={() => update(rows.filter((_, n) => i !== n))}
            >
              <T v={["Remove choice", "Retirer le choix", "حذف الخيار"]} />
            </Button>
          </div>
        </div>
      ))}
      <Button
        disabled={readOnly || language !== base || rows.length >= 20}
        onClick={() =>
          update([
            ...rows,
            { key: "choice-" + crypto.randomUUID().slice(0, 12), label: "" },
          ])
        }
      >
        <T v={["Add choice", "Ajouter un choix", "إضافة خيار"]} />
      </Button>
      <p>
        <T
          v={[
            "Change structure and correct answers in the source language; translated labels follow the same choice identities.",
            "Modifiez structure et bonnes réponses dans la langue source ; les libellés traduits suivent les mêmes identités.",
            "عدل البنية والإجابات الصحيحة في اللغة المصدر؛ تتبع التسميات المترجمة نفس الهويات.",
          ]}
        />
      </p>
    </div>
  );
}
