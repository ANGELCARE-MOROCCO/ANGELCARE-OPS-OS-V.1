"use client";
import { useState } from "react";
import {
  Panel,
  Field,
  T,
  useUI,
} from "../../digital-customer-experience/components/ui";
import { DEPTH_FIELDS } from "../../digital-customer-experience/experience-depth";
import { WORLDS, tr } from "../catalogue";
import s from "../../digital-customer-experience/components/workspace.module.css";
export function KidFlixDefaults({
  value,
  onChange,
  readOnly,
}: {
  value: Record<string, Record<string, boolean>>;
  onChange: (v: Record<string, Record<string, boolean>>) => void;
  readOnly: boolean;
}) {
  const { locale } = useUI(),
    [family, setFamily] = useState("documents");
  return (
    <Panel
      title={
        <T
          v={[
            "KidFlix family tool boundaries",
            "Limites des outils par univers KidFlix",
            "حدود أدوات عوالم كيدفليكس",
          ]}
        />
      }
    >
      <p>
        <T
          v={[
            "These boundaries belong to this homepage language edition. Save and publish to apply. A disabled family capability cannot be re-enabled by a resource. Offline and combined printing still need explicit resource permission.",
            "Ces limites appartiennent à cette édition linguistique. Enregistrez et publiez. Une fonction interdite ici ne peut être réactivée dans un dossier. Hors connexion et packs exigent aussi une autorisation du dossier.",
            "تخص هذه الحدود النسخة اللغوية الحالية. احفظ وانشر لتطبيقها. لا يمكن للمورد تجاوز المنع هنا. العمل دون اتصال وحزم الطباعة يتطلبان إذناً صريحاً في المورد.",
          ]}
        />
      </p>
      <Field label={<T v={["Family", "Univers", "العالم"]} />}>
        <select value={family} onChange={(e) => setFamily(e.target.value)}>
          {WORLDS.map((w) => (
            <option key={w.key} value={w.key}>
              {tr(w.title, locale)}
            </option>
          ))}
        </select>
      </Field>
      <div className={s.formGrid}>
        {DEPTH_FIELDS.filter(
          (f) => f.key.startsWith("kidflix") && f.type === "toggle",
        ).map((f) => (
          <Field key={f.key} label={tr(f.label, locale)}>
            <select
              disabled={readOnly}
              value={value[family]?.[f.key] === false ? "disabled" : "allowed"}
              onChange={(e) =>
                onChange({
                  ...value,
                  [family]: {
                    ...value[family],
                    [f.key]: e.target.value === "allowed",
                  },
                })
              }
            >
              <option value="allowed">
                {tr(
                  [
                    "Allow resource setting",
                    "Autoriser le réglage du dossier",
                    "السماح بإعداد المورد",
                  ],
                  locale,
                )}
              </option>
              <option value="disabled">
                {tr(
                  [
                    "Disabled for this family",
                    "Désactivé pour cet univers",
                    "معطل لهذا العالم",
                  ],
                  locale,
                )}
              </option>
            </select>
          </Field>
        ))}
      </div>
    </Panel>
  );
}
