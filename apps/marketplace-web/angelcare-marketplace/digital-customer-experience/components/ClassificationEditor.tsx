"use client";
import { array, text, tr, type Data, type Locale } from "../types";
import { classificationAnswer } from "../detail-experience";
import { Field } from "./ui";
export function ClassificationEditor({
  data,
  value,
  locale,
  readOnly,
  onChange,
}: {
  data: Data;
  value: unknown;
  locale: Locale;
  readOnly: boolean;
  onChange: (value: string) => void;
}) {
  const answers = classificationAnswer(value);
  return (
    <Field
      label={tr(
        [
          "Accepted groups · kept private",
          "Groupes acceptés · confidentiels",
          "المجموعات المقبولة · خاصة",
        ],
        locale,
      )}
    >
      {array(data.sortRules).map((rule) => (
        <fieldset key={text(rule.id)}>
          <legend>{text(rule.title) || text(rule.id)}</legend>
          {array(data.sortGroups)
            .filter((g) => g.ruleId === rule.id)
            .map((group) => (
              <label
                key={text(group.id)}
                style={{ display: "flex", gap: 8, padding: 8 }}
              >
                <input
                  type="checkbox"
                  disabled={readOnly}
                  checked={(answers[text(rule.id)] || []).includes(
                    text(group.id),
                  )}
                  onChange={(e) => {
                    const key = text(rule.id),
                      old = answers[key] || [];
                    onChange(
                      JSON.stringify({
                        ...answers,
                        [key]: e.target.checked
                          ? [...new Set([...old, text(group.id)])]
                          : old.filter((id) => id !== group.id),
                      }),
                    );
                  }}
                />
                {text(group.title) || text(group.id)}
              </label>
            ))}
        </fieldset>
      ))}
    </Field>
  );
}
