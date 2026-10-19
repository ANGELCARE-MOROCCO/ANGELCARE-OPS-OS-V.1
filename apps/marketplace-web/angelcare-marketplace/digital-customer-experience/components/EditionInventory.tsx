"use client";
import { useState, type ReactNode } from "react";
import { FAMILIES } from "../registry";
import { tr, type Locale } from "../types";
import {
  Badge,
  Button,
  Empty,
  Pager,
  Panel,
  State,
  T,
  useUI,
  useWorkingState,
  useQuery,
} from "./ui";
import s from "./workspace.module.css";
export function EditionInventory({ children }: { children: ReactNode }) {
  const { locale, open } = useUI(),
    [view, setView] = useWorkingState("editions.view", "dossiers"),
    [lang, setLang] = useWorkingState<Locale>("editions.language","ar"),
    [state, setState] = useWorkingState("editions.state","all"),
    [family, setFamily] = useWorkingState("editions.family",""),
    [search, setSearch] = useWorkingState("editions.search",""),
    [page, setPage] = useWorkingState("editions.page",1);
  const q = useQuery<any>(
    view === "editions"
      ? {
          op: "master_edition_inventory",
          locale: lang,
          state,
          family,
          q: search,
          page,
        }
      : { op: "reference", type: "record" },
    { rows: [], total: 0 },
  );
  return (
    <>
      <div className={s.tabs} role="tablist">
        {[
          ["dossiers", ["Dossiers", "Dossiers", "الملفات"]],
          [
            "editions",
            [
              "Independent language editions",
              "Éditions linguistiques indépendantes",
              "النسخ اللغوية المستقلة",
            ],
          ],
        ].map(([key, label]) => (
          <button
            key={key as string}
            className={s.tab}
            role="tab"
            aria-selected={view === key}
            onClick={() => setView(key as string)}
          >
            {tr(label as any, locale)}
          </button>
        ))}
      </div>
      {view === "dossiers" ? (
        children
      ) : (
        <Panel
          title={
            <T
              v={[
                "Publication by language",
                "Publication par langue",
                "النشر حسب اللغة",
              ]}
            />
          }
          subtitle={
            <T
              v={[
                "Arabic can be live while French stays draft and English is absent. Each edition has its own approval and immutable history.",
                "L’arabe peut être publié, le français en brouillon et l’anglais absent. Chaque édition a son approbation et son historique immuable.",
                "يمكن نشر العربية مع بقاء الفرنسية مسودة وغياب الإنجليزية. لكل نسخة اعتماد وسجل ثابت مستقل.",
              ]}
            />
          }
        >
          <div className={s.toolbar}>
            <input
              aria-label="Search language editions"
              value={search}
              placeholder={tr(
                ["Name or key…", "Nom ou clé…", "الاسم أو المعرف…"],
                locale,
              )}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
            />
            <select
              aria-label="Edition language"
              value={lang}
              onChange={(e) => {
                setLang(e.target.value as Locale);
                setPage(1);
              }}
            >
              {["ar", "fr", "en"].map((l) => (
                <option key={l}>{l}</option>
              ))}
            </select>
            <select
              aria-label="Edition state"
              value={state}
              onChange={(e) => {
                setState(e.target.value);
                setPage(1);
              }}
            >
              {["all", "live", "draft", "absent"].map((v) => (
                <option key={v}>{v}</option>
              ))}
            </select>
            <select
              aria-label="Edition family"
              value={family}
              onChange={(e) => {
                setFamily(e.target.value);
                setPage(1);
              }}
            >
              <option value="">
                {tr(
                  ["All families", "Toutes les familles", "جميع العائلات"],
                  locale,
                )}
              </option>
              {FAMILIES.map((f) => (
                <option key={f.key} value={f.key}>
                  {tr(f.name, locale)}
                </option>
              ))}
            </select>
            <Button icon="RefreshCw" onClick={q.reload}>
              <T v={["Refresh", "Actualiser", "تحديث"]} />
            </Button>
          </div>
          <State {...q} retry={q.reload}>
            {q.value.rows.length ? (
              <div className={s.tableScroll}>
                <table className={s.table}>
                  <thead>
                    <tr>
                      <th>
                        <T v={["Dossier", "Dossier", "الملف"]} />
                      </th>
                      <th>
                        <T v={["Language", "Langue", "اللغة"]} />
                      </th>
                      <th>
                        <T v={["Publication", "Publication", "النشر"]} />
                      </th>
                      <th>
                        <T
                          v={[
                            "Draft review",
                            "Revue du brouillon",
                            "مراجعة المسودة",
                          ]}
                        />
                      </th>
                      <th />
                    </tr>
                  </thead>
                  <tbody>
                    {q.value.rows.map((r: any) => (
                      <tr key={r.id}>
                        <td>
                          <strong>{r.title}</strong>
                          <small>{r.family}</small>
                        </td>
                        <td>
                          {lang.toUpperCase()} · {r.present ? "✓" : "—"}
                        </td>
                        <td>
                          <Badge tone={r.activeReleaseId ? "green" : "orange"}>
                            {r.activeReleaseId
                              ? tr(["Live", "Publiée", "منشورة"], locale)
                              : tr(
                                  [
                                    "Not published",
                                    "Non publiée",
                                    "غير منشورة",
                                  ],
                                  locale,
                                )}
                          </Badge>
                        </td>
                        <td>{r.draftState}</td>
                        <td>
                          <Button
                            icon="ArrowUpRight"
                            onClick={() => open(r.id, "delivery", lang)}
                          >
                            <T
                              v={[
                                "Manage editions",
                                "Gérer les éditions",
                                "إدارة النسخ",
                              ]}
                            />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <Empty
                title={
                  <T
                    v={[
                      "No matching editions",
                      "Aucune édition correspondante",
                      "لا توجد نسخ مطابقة",
                    ]}
                  />
                }
              />
            )}
            <Pager
              page={page}
              total={q.value.total}
              size={30}
              onPage={setPage}
            />
          </State>
        </Panel>
      )}
    </>
  );
}
