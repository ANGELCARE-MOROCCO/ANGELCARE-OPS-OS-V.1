"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { activityDocument, composeChoiceLayout } from "../html-activity";
import { array, object, text, type Data, type Locale } from "../types";
import { Badge, Button, Field, Switch, T } from "./ui";
import s from "./workspace.module.css";
export function HtmlActivityEditor({
  data,
  language,
  onChange,
  disabled,
}: {
  data: Data;
  language: Locale;
  onChange: (d: Data) => void;
  disabled: boolean;
}) {
  const p = object(data.htmlActivity),
    [error, setError] = useState(""),
    markup =
      text(object(object(p.locales)[language]).markup) ||
      (language === (data.defaultLocale || "en") ? text(p.markup) : "");
  const set = (value: string, name = "") =>
    onChange({
      htmlActivity: {
        ...p,
        version: 1,
        locales: {
          ...object(p.locales),
          [language]: { markup: value, sourceName: name },
        },
        ...(language === (data.defaultLocale || "en") ? { markup: value } : {}),
      },
    });
  return (
    <section className={s.rowCard}>
      <h3>
        <T
          v={[
            "Controlled HTML activity layout",
            "Composition HTML contrôlée",
            "تخطيط نشاط HTML مضبوط",
          ]}
        />
      </h3>
      <p>
        <T
          v={[
            "Optional layout for choice tasks. Uploaded scripts, styles, URLs and submissions never execute. Native questions and result checking stay available.",
            "Composition facultative pour les choix. Scripts, styles, URLs et soumissions importés ne sont jamais exécutés. Questions et validation natives restent disponibles.",
            "تخطيط اختياري لأنشطة الاختيار. لا تنفذ الشيفرات والأنماط والروابط والإرسال المستورد. تبقى الأسئلة والتحقق الأصليان متاحين.",
          ]}
        />
      </p>
      <Switch
        disabled={disabled}
        label={
          <T
            v={[
              "Use controlled HTML layout",
              "Utiliser la composition HTML contrôlée",
              "استخدام تخطيط HTML مضبوط",
            ]}
          />
        }
        value={p.enabled === true}
        onChange={(enabled) =>
          onChange({ htmlActivity: { ...p, version: 1, enabled } })
        }
      />
      {p.enabled === true && (
        <>
          <div className={s.actions}>
            {["cards", "list", "illustrated"].map((layout) => (
              <Button
                key={layout}
                disabled={disabled || !array(data.tasks).length}
                onClick={() => {
                  if (
                    !markup ||
                    confirm(
                      "Replace this language layout from the current native tasks?",
                    )
                  )
                    set(composeChoiceLayout(data, language, layout as any));
                }}
              >
                <T
                  v={[
                    "Generate native choice layout",
                    "Générer la composition de choix",
                    "توليد تخطيط الخيارات الأصلي",
                  ]}
                />{" "}
                · {layout}
              </Button>
            ))}
          </div>
          <p>
            <T
              v={[
                "Edit task questions and choices in the native editor, then regenerate this language. Correct-answer values never enter the layout.",
                "Modifiez questions et choix dans l’éditeur natif, puis régénérez cette langue. Les bonnes réponses restent hors du HTML.",
                "عدّل الأسئلة والخيارات في المحرر الأصلي ثم أعد توليد هذه اللغة. لا تدخل الإجابات الصحيحة في HTML.",
              ]}
            />
          </p>
          <details>
            <summary>Advanced controlled HTML</summary>
            <Field label={'HTML · data-dce-choice="task-id|0"'}>
              <textarea
                disabled={disabled}
                rows={9}
                value={markup}
                onChange={(e) => set(e.target.value)}
              />
            </Field>
            <input
              aria-label="Import controlled HTML"
              type="file"
              accept=".html,.htm,text/html"
              disabled={disabled}
              onChange={async (e) => {
                const f = e.target.files?.[0];
                if (!f) return;
                if (f.size > 100000) {
                  setError("Maximum HTML size: 100 KB.");
                  return;
                }
                try {
                  set(await f.text(), f.name);
                  setError("");
                } catch {
                  setError(
                    "The file could not be read; existing entries are retained.",
                  );
                }
                e.target.value = "";
              }}
            />
            <p>
              article · section · h2/h3/h4 · p · strong · em · ul/ol/li · button
              · data-dce-choice=&quot;task-id|choice-index&quot;
            </p>
            <Badge>
              Native choice engine · no certificate scoring authority
            </Badge>
          </details>
        </>
      )}
      {error && <p role="alert">{error}</p>}
    </section>
  );
}
export function HtmlActivityPreview({
  data,
  locale,
  onChoice,
  bindings = {},
}: {
  data: Data;
  bindings?: Data;
  locale: Locale;
  onChoice: (id: string, value: string) => void;
}) {
  const frame = useRef<HTMLIFrameElement>(null),
    [error, setError] = useState(""),
    markup = text(object(data.htmlActivity).markup),
    context = useMemo(
      () => ({
        nonce: crypto.randomUUID().replaceAll("-", ""),
        channel: crypto.randomUUID().replaceAll("-", ""),
      }),
      [markup],
    ),
    source = useMemo(
      () => activityDocument(markup, context.nonce, context.channel, bindings),
      [markup, context, bindings],
    );
  useEffect(() => {
    const receive = (e: MessageEvent) => {
      if (
        e.source !== frame.current?.contentWindow ||
        e.origin !== "null" ||
        e.data?.channel !== context.channel ||
        e.data?.type !== "angelcare.activity.choice"
      )
        return;
      const value = e.data.value;
      if (typeof value !== "string" || !/^[-\w]{1,80}\|\d{1,3}$/.test(value))
        return;
      const [id, index] = value.split("|"),
        task = array(data.tasks).find((t) => t.id === id);
      if (
        !task ||
        Number(index) >=
          text(object(object(task.locales)[locale]).choices || task.choices)
            .split("\n")
            .filter(Boolean).length
      ) {
        setError("Map this choice to a declared native task.");
        return;
      }
      onChoice(id, index);
      setError("");
    };
    window.addEventListener("message", receive);
    return () => window.removeEventListener("message", receive);
  }, [context, data.tasks, locale, onChoice]);
  return (
    <>
      <iframe
        ref={frame}
        title="Controlled activity layout"
        sandbox="allow-scripts"
        referrerPolicy="no-referrer"
        srcDoc={source}
        style={{
          width: "100%",
          height: 460,
          border: "1px solid #dbe6f4",
          borderRadius: 14,
        }}
      />
      {error && <p role="alert">{error}</p>}
      <p className={s.subtitle}>
        <T
          v={[
            "Accessible native questions remain below.",
            "Les questions natives accessibles restent ci-dessous.",
            "تبقى الأسئلة الأصلية الميسرة أدناه.",
          ]}
        />
      </p>
    </>
  );
}
