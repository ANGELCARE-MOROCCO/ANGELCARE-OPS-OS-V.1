"use client";
import { translationCoverage, labelValue } from "../management";
import { useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  BASE,
  tr,
  canWriteKind,
  type DceRecord,
  type Kind,
  type Page,
} from "../types";
import { FAMILIES, familyByKey } from "../registry";
import {
  Badge,
  Button,
  Empty,
  Icon,
  Pager,
  Panel,
  State,
  T,
  useUI,useWorkingState,
  useQuery,
  mutate,
} from "./ui";
import { ExperienceCard } from "./Dashboard";
import s from "./workspace.module.css";
export function Registry({
  kind = "experience",
  initialFamily,
  mode = "table",
  createKind,
  children,
  topic,
}: {
  topic?: string;
  kind?: Kind;
  initialFamily?: string;
  mode?: string;
  createKind?: Kind;
  children?: React.ReactNode;
}) {
  const { locale, boot, open, create, notify, refresh } = useUI(),
    params = useSearchParams(),
    [q, setQ] = useWorkingState("registry."+kind+".q",""),
    [family, setFamily] = useWorkingState("registry."+kind+".family",
      initialFamily || params?.get("family") || "",
    ),
    [lifecycle, setLifecycle] = useWorkingState("registry."+kind+".state",""),
    [page, setPage] = useWorkingState("registry."+kind+".page",1),
    [view, setView] = useWorkingState("registry."+kind+".layout",mode),
    [selected, setSelected] = useState<string[]>([]),
    [busy, setBusy] = useState(false);
  const canWrite = canWriteKind(boot.actor.rights, kind),
    canCreate =
      canWrite && !["case", "contribution", "run", "grant"].includes(kind);
  const request = useQuery<Page<DceRecord>>(
    {
      kind,
      q,
      family,
      ...(kind === "experience" ? { view: lifecycle || "all" } : { lifecycle }),
      context: params?.get("context") || undefined,
      page,
      pageSize: 24,
      topic: topic || params?.get("topic") || undefined,
    },
    { rows: [], total: 0, page: 1, pageSize: 24 },
  );
  async function archive() {
    if (!selected.length) return;
    if (
      !confirm(
        tr(
          [
            "Archive selected unreferenced drafts? Live and referenced records remain protected.",
            "Archiver les brouillons sélectionnés sans dépendance ? Les dossiers liés restent protégés.",
            "أرشفة المسودات المحددة؟ تبقى السجلات المرتبطة محمية.",
          ],
          locale,
        ),
      )
    )
      return;
    setBusy(true);
    let done = 0;
    const errors: string[] = [];
    for (const id of selected) {
      const r = request.value.rows.find((r) => r.id === id);
      try {
        await mutate({ action: "archive", id, revision: r?.revision });
        done++;
      } catch (e) {
        errors.push((e as Error).message);
      }
    }
    setSelected([]);
    setBusy(false);
    notify(
      `${done} ${tr(["archived", "archivés", "مؤرشف"], locale)}${errors.length ? " · " + errors[0] : ""}`,
      errors.length > 0,
    );
    request.reload();
    await refresh();
  }
  return (
    <>
      <div className={s.toolbar}>
        <input
          aria-label="Search registry"
          placeholder={tr(
            [
              "Search name or stable key…",
              "Nom ou clé stable…",
              "الاسم أو المعرف الثابت…",
            ],
            locale,
          )}
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setPage(1);
          }}
        />
        {["experience", "template"].includes(kind) && (
          <select
            aria-label="Family filter"
            value={family}
            onChange={(e) => {
              setFamily(e.target.value);
              setPage(1);
            }}
          >
            <option value="">
              {tr(
                ["All 16 families", "Les 16 familles", "كل العائلات الـ16"],
                locale,
              )}
            </option>
            {FAMILIES.map((f) => (
              <option value={f.key} key={f.key}>
                {tr(f.name, locale)}
              </option>
            ))}
          </select>
        )}
        <select
          aria-label="Lifecycle filter"
          value={lifecycle}
          onChange={(e) => {
            setLifecycle(e.target.value);
            setPage(1);
          }}
        >
          <option value="">
            {tr(["All states", "Tous les états", "كل الحالات"], locale)}
          </option>
          {(kind==='experience'?['released','draft','review','approved','scheduled','archived']:kind==='case'?['open','assigned','waiting_customer','resolved','closed']:kind==='contribution'?['pending','approved','hidden','rejected']:['draft','review','approved','archived']).map((v) => (
            <option value={v} key={v}>
              {v==='draft'&&kind==='experience'?tr(['Working drafts · may have live editions','Brouillons de travail · éditions publiées possibles','مسودات عمل · قد توجد نسخ منشورة'],locale):labelValue(v, locale)}
            </option>
          ))}
        </select>
        <Button
          icon={view === "cards" ? "List" : "LayoutGrid"}
          onClick={() => setView((v) => (v === "cards" ? "table" : "cards"))}
        >
          <T v={["View", "Vue", "العرض"]} />
        </Button>
        <Button
          kind="primary"
          icon="Plus"
          disabled={!canCreate || !boot.activated}
          onClick={() => create(createKind || kind, family || undefined)}
        >
          <T v={["Create", "Créer", "إنشاء"]} />
        </Button>
      </div>
      {children}
      {selected.length > 0 && (
        <div className={s.notice}>
          <strong>
            {selected.length} <T v={["selected", "sélectionnés", "محدد"]} />
          </strong>
          <Button onClick={archive} disabled={busy || !canWrite} icon="Archive">
            <T
              v={[
                "Archive eligible drafts",
                "Archiver les brouillons éligibles",
                "أرشفة المسودات المؤهلة",
              ]}
            />
          </Button>
          <Button onClick={() => setSelected([])}>
            <T v={["Clear selection", "Annuler la sélection", "مسح التحديد"]} />
          </Button>
        </div>
      )}
      <Panel>
        <State {...request} retry={request.reload}>
          {request.value.rows.length ? (
            view === "cards" ? (
              <div className={s.mediaGrid}>
                {request.value.rows.map((r) => (
                  <ExperienceCard key={r.id} record={r} />
                ))}
              </div>
            ) : (
              <div className={s.tableScroll}>
                <table className={s.table}>
                  <thead>
                    <tr>
                      <th>
                        <input
                          aria-label="Select current page"
                          type="checkbox"
                          checked={
                            request.value.rows.length > 0 &&
                            request.value.rows.every((r) =>
                              selected.includes(r.id),
                            )
                          }
                          onChange={(e) =>
                            setSelected(
                              e.target.checked
                                ? request.value.rows.map((r) => r.id)
                                : [],
                            )
                          }
                        />
                      </th>
                      <th>
                        <T
                          v={[
                            "Dossier / key",
                            "Dossier / clé",
                            "الملف / المعرف",
                          ]}
                        />
                      </th>
                      <th>
                        <T
                          v={[
                            "Family / topic",
                            "Famille / thème",
                            "العائلة / الموضوع",
                          ]}
                        />
                      </th>
                      <th>
                        <T v={["State", "État", "الحالة"]} />
                      </th>
                      <th>
                        <T
                          v={["Language coverage", "Traductions", "الترجمات"]}
                        />
                      </th>
                      <th>
                        <T v={["Updated", "Modifié", "آخر تعديل"]} />
                      </th>
                      <th />
                    </tr>
                  </thead>
                  <tbody>
                    {request.value.rows.map((r) => {
                      const f = familyByKey(r.family || "");
                      return (
                        <tr key={r.id}>
                          <td>
                            <input
                              aria-label={"Select " + r.title}
                              type="checkbox"
                              checked={selected.includes(r.id)}
                              onChange={(e) =>
                                setSelected((old) =>
                                  e.target.checked
                                    ? [...old, r.id]
                                    : old.filter((v) => v !== r.id),
                                )
                              }
                            />
                          </td>
                          <td>
                            <button
                              className={s.link}
                              onClick={() => open(r.id)}
                            >
                              {r.title}
                            </button>
                            <small>
                              {r.key} · r{r.revision}
                            </small>
                          </td>
                          <td>
                            {f && (
                              <span
                                className={s.familyDot}
                                style={{
                                  background: f.color + "14",
                                  color: f.color,
                                }}
                              >
                                <Icon name={f.icon} size={15} />
                              </span>
                            )}
                            {f ? tr(f.name, locale) : r.kind}
                            <small>
                              {boot.topics.find((t) => t.id === r.topic)
                                ?.title || "—"}
                            </small>
                          </td>
                          <td>
                            <Badge
                              tone={
                                r.published_release_id
                                  ? "green"
                                  : r.lifecycle === "review"
                                    ? "orange"
                                    : "blue"
                              }
                            >
                              {r.published_release_id ? "released · " : ""}
                              {r.lifecycle}
                            </Badge>
                          </td>
                          <td>
                            <span className={s.modePills}>
                              {["fr", "en", "ar"].map((l) => (
                                <Badge
                                  key={l}
                                  tone={
                                    translationCoverage(r, l).complete
                                      ? "green"
                                      : "orange"
                                  }
                                >
                                  {l} · {translationCoverage(r, l).filled}/
                                  {translationCoverage(r, l).total}
                                </Badge>
                              ))}
                            </span>
                          </td>
                          <td>
                            {new Date(r.updated_at).toLocaleDateString(locale)}
                            <small>{r.updated_by}</small>
                          </td>
                          <td>
                            <Button
                              icon="ArrowUpRight"
                              onClick={() => open(r.id)}
                            >
                              <T v={["Open", "Ouvrir", "فتح"]} />
                            </Button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )
          ) : (
            <Empty
              title={
                <T
                  v={[
                    "No matching dossiers",
                    "Aucun dossier correspondant",
                    "لا توجد ملفات مطابقة",
                  ]}
                />
              }
              detail={
                <T
                  v={[
                    "Change the filters or prepare a new governed draft.",
                    "Modifiez les filtres ou préparez un nouveau brouillon.",
                    "غيّر الفلاتر أو جهّز مسودة جديدة.",
                  ]}
                />
              }
              action={
                <Button
                  onClick={() =>
                    create(createKind || kind, family || undefined)
                  }
                  disabled={!canCreate || !boot.activated}
                >
                  <T
                    v={["Create a dossier", "Créer un dossier", "إنشاء ملف"]}
                  />
                </Button>
              }
            />
          )}
          <Pager
            total={request.value.total}
            page={page}
            size={24}
            onPage={setPage}
          />
        </State>
      </Panel>
    </>
  );
}
export function Categories() {
  const { locale, boot, open, create } = useUI();
  const q = useQuery<Page<DceRecord>>(
    { op: "inventory", kind: "topic" },
    { rows: [], total: 0, page: 1, pageSize: 100 },
  );
  return (
    <div className={s.twoColumns}>
      <Panel
        title={
          <T
            v={[
              "Topic hierarchy & coverage",
              "Hiérarchie & couverture",
              "تسلسل المواضيع والتغطية",
            ]}
          />
        }
        actions={
          <Button
            kind="primary"
            icon="Plus"
            disabled={!boot.actor.rights.manage}
            onClick={() => create("topic")}
          >
            <T v={["New topic", "Nouveau thème", "موضوع جديد"]} />
          </Button>
        }
      >
        <State {...q} retry={q.reload}>
          {q.value.rows.map((t) => (
            <div
              className={s.journeyStep}
              key={t.id}
              style={{
                marginBottom: 8,
                marginInlineStart: t.data.parentId ? 18 : 0,
              }}
            >
              <span
                className={s.familyDot}
                style={{
                  color: String(t.data.color || "#056cff"),
                  background: String(t.data.color || "#056cff") + "13",
                }}
              >
                <Icon name={String(t.data.icon || "Folder")} />
              </span>
              <div style={{ flex: 1 }}>
                <button
                  className={s.link}
                  style={{
                    border: 0,
                    background: "none",
                    textAlign: "start",
                    color: "#1c3e78",
                    fontWeight: 600,
                  }}
                  onClick={() => open(t.id)}
                >
                  {t.title}
                </button>
                <small style={{ display: "block" }}>
                  {t.data.parentId
                    ? q.value.rows.find((x) => x.id === t.data.parentId)
                        ?.title +
                      " → " +
                      t.title
                    : t.key}
                </small>
              </div>
              <Badge>
                {Number((boot.summary.byTopic as any)?.[t.id] || 0)}
              </Badge>
              <Button onClick={() => open(t.id)} icon="Pencil">
                <T v={["Manage", "Gérer", "إدارة"]} />
              </Button>
            </div>
          ))}
          {!q.value.rows.length && (
            <Empty
              title={
                <T
                  v={[
                    "Initialize your child/family topics",
                    "Initialisez les thèmes enfants/familles",
                    "هيّئ مواضيع الأطفال والأسرة",
                  ]}
                />
              }
              detail={
                <T
                  v={[
                    "World initialization creates editable topic drafts.",
                    "L’initialisation crée des thèmes modifiables.",
                    "تنشئ التهيئة مواضيع قابلة للتعديل.",
                  ]}
                />
              }
            />
          )}
        </State>
      </Panel>
      <Panel
        title={
          <T
            v={[
              "16 functional families",
              "16 familles fonctionnelles",
              "16 عائلة وظيفية",
            ]}
          />
        }
        subtitle={
          <T
            v={[
              "Topic describes the subject. Family describes what the user does.",
              "Le thème décrit le sujet. La famille décrit l’action.",
              "الموضوع يحدد المحتوى، والعائلة تحدد النشاط.",
            ]}
          />
        }
      >
        <div className={s.helpList}>
          {FAMILIES.map((f) => (
            <details key={f.key}>
              <summary
                style={{ cursor: "pointer", fontWeight: 600, color: f.color }}
              >
                {f.number}. {tr(f.name, locale)}
              </summary>
              <div className={s.modePills}>
                {f.modes.map((m) => (
                  <Badge key={m}>{m}</Badge>
                ))}
              </div>
              <small>{f.actions.join(" · ")}</small>
              <Link
                className={`${s.button} ${s.ghost}`}
                href={BASE + "/experiences?family=" + f.key}
              >
                <T
                  v={[
                    "Open family registry",
                    "Voir cette famille",
                    "عرض سجل العائلة",
                  ]}
                />
              </Link>
            </details>
          ))}
        </div>
      </Panel>
    </div>
  );
}
