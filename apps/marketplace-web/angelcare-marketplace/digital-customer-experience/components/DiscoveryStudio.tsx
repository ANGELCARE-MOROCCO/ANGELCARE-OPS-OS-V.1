"use client";
import { useState } from "react";
import { FAMILIES } from "../registry";
import { BASE, tr, type Locale } from "../types";
import { Badge, Button, Field, Panel, State, T, useQuery, useUI } from "./ui";
import s from "./workspace.module.css";
export function DiscoveryStudio() {
  const { locale, open, preview } = useUI(),
    [language, setLanguage] = useState<Locale>(locale),
    [family, setFamily] = useState(""),
    [search, setSearch] = useState(""),
    [subject, setSubject] = useState(""),
    [skill, setSkill] = useState(""),
    [slot, setSlot] = useState(""),
    [collection, setCollection] = useState(""),
    [page, setPage] = useState(1),
    q = useQuery<any>(
      {
        op: "depth_discovery",
        locale: language,
        family,
        q: search,
        subject,
        skill,
        slot,
        collection,
        page,
      },
      { rows: [], total: 0 },
    );
  const change =
    (set: (v: string) => void) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      set(e.target.value);
      setPage(1);
    };
  return (
    <Panel
      title={
        <T
          v={[
            "Published discovery collections",
            "Collections de découverte publiées",
            "مجموعات الاكتشاف المنشورة",
          ]}
        />
      }
    >
      <div className={s.formGrid}>
        <Field
          label={
            <T v={["Language edition", "Édition linguistique", "نسخة اللغة"]} />
          }
        >
          <select
            value={language}
            onChange={(e) => {
              setLanguage(e.target.value as Locale);
              setPage(1);
            }}
          >
            {["ar", "fr", "en"].map((l) => (
              <option key={l}>{l}</option>
            ))}
          </select>
        </Field>
        <Field label={<T v={["Family", "Famille", "العائلة"]} />}>
          <select value={family} onChange={change(setFamily)}>
            <option value="">—</option>
            {FAMILIES.map((f) => (
              <option key={f.key} value={f.key}>
                {tr(f.name, locale)}
              </option>
            ))}
          </select>
        </Field>
        <Field label={<T v={["Search", "Rechercher", "بحث"]} />}>
          <input value={search} onChange={change(setSearch)} />
        </Field>
        <Field label={<T v={["Subject", "Matière", "المادة"]} />}>
          <input value={subject} onChange={change(setSubject)} />
        </Field>
        <Field label={<T v={["Skill", "Compétence", "المهارة"]} />}>
          <input value={skill} onChange={change(setSkill)} />
        </Field>
        <Field label={<T v={["Placement", "Emplacement", "الموضع"]} />}>
          <select value={slot} onChange={change(setSlot)}>
            <option value="">—</option>
            {["featured", "collection", "topic", "skill", "seasonal"].map(
              (s) => (
                <option key={s}>{s}</option>
              ),
            )}
          </select>
        </Field>
        <Field
          label={
            <T v={["Collection key", "Clé de collection", "مفتاح المجموعة"]} />
          }
        >
          <input value={collection} onChange={change(setCollection)} />
        </Field>
      </div>
      <State {...q} retry={q.reload}>
        <Badge>{q.value.total}</Badge>
        <div className={s.definitionBoard}>
          {q.value.rows.map((r: any) => (
            <article key={r.id} className={s.rowCard}>
              <h3>{r.title}</h3>
              <p>
                {r.subject} · {r.difficulty}
              </p>
              <div className={s.actions}>
                <Button onClick={() => preview(r.id, r.release_id, language)}>
                  <T
                    v={[
                      "Preview live edition",
                      "Voir l’édition en ligne",
                      "معاينة النسخة المنشورة",
                    ]}
                  />
                </Button>
                <Button onClick={() => open(r.id, "experience")}>
                  <T v={["Edit source", "Éditer la source", "تحرير المصدر"]} />
                </Button>
              </div>
            </article>
          ))}
        </div>
        <div className={s.actions}>
          <Button disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
            ←
          </Button>
          <span>
            {page} / {Math.max(1, Math.ceil(q.value.total / 30))}
          </span>
          <Button
            disabled={page * 30 >= q.value.total}
            onClick={() => setPage((p) => p + 1)}
          >
            →
          </Button>
        </div>
      </State>
    </Panel>
  );
}
