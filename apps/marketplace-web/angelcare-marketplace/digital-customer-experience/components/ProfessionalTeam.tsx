"use client";
import { useEffect, useRef, useState } from "react";
import {
  array,
  object,
  text,
  tr,
  type Data,
  type DceRecord,
  type Tri,
} from "../types";
import { worldTimeZone, toLocalDateInput, zonedDateInput } from "../management";
import { HUMAN_STATUS, type WorkItem } from "../professional-contract";
import {
  applyTextOperations,
  orderedNodes,
  renderText,
  textSpans,
  textDifference,
  type TextNode,
  type TextOperation,
} from "../collaboration";
import {
  Badge,
  Button,
  Dialog,
  Empty,
  Field,
  Icon,
  Pager,
  Panel,
  State,
  Switch,
  T,
  useUI,
  useWorkingState,
  useQuery,
  mutate,
  query,
  useReceiptMutation,
} from "./ui";
import { Picker } from "./Editor";
import s from "./workspace.module.css";
export function WorkStatus({ value }: { value: string }) {
  const { locale } = useUI();
  return (
    <Badge
      tone={
        ["failed", "blocked", "changes_requested"].includes(value)
          ? "pink"
          : ["done", "ready", "provider_accepted", "disposed"].includes(value)
            ? "green"
            : "blue"
      }
    >
      {HUMAN_STATUS[value] ? tr(HUMAN_STATUS[value], locale) : value}
    </Badge>
  );
}
export function StaffChoice({
  value,
  onChange,
  label,
}: {
  value: string;
  onChange: (id: string) => void;
  label: Tri;
}) {
  const [show, setShow] = useState(false),
    q = useQuery<any>({ op: "reference", type: "staff", id: value }, {});
  return (
    <Field label={<T v={label} />}>
      <div className={s.actions}>
        <span>{value ? q.value.title || "…" : "—"}</span>
        <Button icon="Users" onClick={() => setShow(true)}>
          <T v={["Choose", "Choisir", "اختر"]} />
        </Button>
        {value && (
          <Button icon="X" onClick={() => onChange("")}>
            <T v={["Clear", "Effacer", "مسح"]} />
          </Button>
        )}
      </div>
      {show && (
        <Picker
          type="staff"
          onSelect={onChange}
          onClose={() => setShow(false)}
        />
      )}
    </Field>
  );
}
export function EditorialDesk({
  recordId,
  onUpdated,
}: {
  recordId?: string;
  onUpdated?: () => void;
}) {
  const { boot, locale, open, notify } = useUI(),
    [page, setPage] = useState(1),
    [search, setSearch] = useState(""),
    [status, setStatus] = useState(""),
    [mine, setMine] = useState(false),
    [view, setView] = useState("board"),
    [editing, setEditing] = useState<Partial<WorkItem> | null>(null),
    [month, setMonth] = useState(() => new Date().toISOString().slice(0, 7)),
    [day, setDay] = useState("");
  const q = useQuery<any>(
    {
      op: "pro_work",
      kind: "task",
      recordId,
      page,
      q: search,
      status,
      mine,
      month: view === "calendar" ? month : undefined,
      day: view === "calendar" ? day : undefined,
      zone: worldTimeZone(boot.settings),
    },
    { rows: [], total: 0, byStatus: {} },
  );
  return (
    <Panel
      title={
        <T
          v={[
            "Editorial team desk",
            "Bureau éditorial de l’équipe",
            "مكتب فريق التحرير",
          ]}
        />
      }
      subtitle={
        <T
          v={[
            "Responsibilities, deadlines and review dependencies remain connected to each dossier.",
            "Responsables, échéances et dépendances de revue reliés aux dossiers.",
            "المسؤوليات والمواعيد واعتماديات المراجعة مرتبطة بكل ملف.",
          ]}
        />
      }
      actions={
        <Button
          disabled={!boot.actor.rights.manage}
          icon="Plus"
          onClick={() =>
            setEditing({
              kind: "task",
              record_id: recordId || null,
              title: "",
              status: "open",
              data: { priority: "normal", blocking: true, dependencies: [] },
            })
          }
        >
          <T v={["Assign work", "Attribuer un travail", "إسناد عمل"]} />
        </Button>
      }
    >
      <div className={s.toolbar}>
        <input
          aria-label="Search editorial tasks"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          placeholder={tr(
            [
              "Search tasks or dossiers",
              "Chercher tâches ou dossiers",
              "البحث عن مهام أو ملفات",
            ],
            locale,
          )}
        />
        <select
          aria-label="Editorial task status"
          value={status}
          onChange={(e) => {
            setStatus(e.target.value);
            setPage(1);
          }}
        >
          <option value="">
            {tr(["All states", "Tous les états", "كل الحالات"], locale)}
          </option>
          {[
            "open",
            "in_progress",
            "review",
            "changes_requested",
            "done",
            "cancelled",
          ].map((v) => (
            <option key={v} value={v}>
              {tr(HUMAN_STATUS[v], locale)}
            </option>
          ))}
        </select>
        <Switch
          label={<T v={["My work", "Mon travail", "عملي"]} />}
          value={mine}
          onChange={(v) => {
            setMine(v);
            setPage(1);
          }}
        />
        {["board", "table", "calendar"].map((v) => (
          <Button
            key={v}
            kind={view === v ? "primary" : "secondary"}
            onClick={() => setView(v)}
          >
            {tr(
              (
                {
                  board: ["Board", "Tableau", "لوحة"],
                  table: ["List", "Liste", "قائمة"],
                  calendar: ["Calendar", "Calendrier", "تقويم"],
                } as Record<string, Tri>
              )[v],
              locale,
            )}
          </Button>
        ))}
      </div>
      {view === "calendar" && (
        <EditorialCalendar
          month={month}
          day={day}
          counts={q.value.calendar || {}}
          zone={worldTimeZone(boot.settings)}
          onMonth={(value) => {
            setMonth(value);
            setDay("");
            setPage(1);
          }}
          onDay={(value) => {
            setDay(value);
            setPage(1);
          }}
        />
      )}
      <State {...q} retry={q.reload}>
        {view === "board" ? (
          <div className={s.choiceGrid}>
            {[
              "open",
              "in_progress",
              "review",
              "changes_requested",
              "done",
              "cancelled",
            ].map((v) => (
              <div className={s.rowCard} key={v}>
                <h3>
                  <WorkStatus value={v} /> {q.value.byStatus[v] || 0}
                </h3>
                {q.value.rows
                  .filter((w: WorkItem) => w.status === v)
                  .map((w: any) => (
                    <TaskCard
                      key={w.id}
                      item={w}
                      onEdit={() => setEditing(w)}
                      onOpen={() =>
                        w.record_id &&
                        open(w.record_id, "team", w.data.locale as any)
                      }
                    />
                  ))}
              </div>
            ))}
          </div>
        ) : (
          <div className={s.tableScroll}>
            <table className={s.table}>
              <thead>
                <tr>
                  <th>
                    <T
                      v={[
                        "Work / dossier",
                        "Travail / dossier",
                        "العمل / الملف",
                      ]}
                    />
                  </th>
                  <th>
                    <T v={["State", "État", "الحالة"]} />
                  </th>
                  <th>
                    <T v={["Deadline", "Échéance", "الموعد"]} />
                  </th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {[...q.value.rows]
                  .sort((a: any, b: any) =>
                    view === "calendar"
                      ? String(a.data.dueAt || "z").localeCompare(
                          String(b.data.dueAt || "z"),
                        )
                      : 0,
                  )
                  .map((w: any) => (
                    <tr key={w.id}>
                      <td>
                        <strong>{w.title}</strong>
                        <small>{w.record_title}</small>
                      </td>
                      <td>
                        <WorkStatus value={w.status} />
                      </td>
                      <td>
                        {w.data.dueAt
                          ? new Date(w.data.dueAt).toLocaleString(locale)
                          : "—"}
                      </td>
                      <td>
                        <Button onClick={() => setEditing(w)} icon="Pencil">
                          <T v={["Manage", "Gérer", "إدارة"]} />
                        </Button>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        )}
        {!q.value.total && (
          <Empty
            icon="ClipboardCheck"
            title={
              <T
                v={[
                  "The work queue is clear",
                  "La file de travail est vide",
                  "قائمة العمل فارغة",
                ]}
              />
            }
            detail={
              <T
                v={[
                  "Assign an author, a reviewer and a deadline to begin.",
                  "Attribuez un auteur, un réviseur et une échéance.",
                  "عيّن مؤلفاً ومراجعاً وموعداً للبدء.",
                ]}
              />
            }
          />
        )}
        <Pager total={q.value.total} page={page} size={30} onPage={setPage} />
        <p className={s.chartCaption}>
          <T
            v={[
              "Counts cover the full filtered queue. The displayed board or calendar contains the current page.",
              "Les comptes couvrent toute la file filtrée. Le tableau ou calendrier affiche la page courante.",
              "الأعداد تشمل القائمة المصفاة كاملة. تعرض اللوحة أو التقويم الصفحة الحالية.",
            ]}
          />
        </p>
      </State>
      {editing && (
        <TaskEditor
          initial={editing}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            q.reload();
            onUpdated?.();
          }}
        />
      )}
    </Panel>
  );
}
function TaskCard({
  item,
  onEdit,
  onOpen,
}: {
  item: WorkItem & {
    record_title?: string;
    assigned_name?: string;
    reviewer_name?: string;
  };
  onEdit: () => void;
  onOpen: () => void;
}) {
  const { locale } = useUI();
  return (
    <article className={s.outlineItem}>
      <div>
        <strong>{item.title}</strong>
        <small>{item.record_title}</small>
        {item.data.locale && (
          <Badge
            tone={
              item.status === "done" && item.data.reviewCurrent !== true
                ? "orange"
                : "blue"
            }
          >
            {String(item.data.locale).toUpperCase()} ·{" "}
            {item.status === "done"
              ? item.data.reviewCurrent
                ? "Reviewed content matches"
                : "Content changed · review required"
              : "Edition-specific task"}
          </Badge>
        )}
        <small>
          <T v={["Responsible:", "Responsable :", "المسؤول:"]} />{" "}
          {item.assigned_name || "—"}
        </small>
        <small>
          <T v={["Review:", "Revue :", "المراجعة:"]} />{" "}
          {item.reviewer_name || "—"}
        </small>
        <Badge tone={item.data.priority === "urgent" ? "pink" : "blue"}>
          {text(item.data.priority)}
        </Badge>
        {item.data.dueAt && (
          <small
            style={{
              color:
                Date.parse(text(item.data.dueAt)) < Date.now()
                  ? "#c4485b"
                  : undefined,
            }}
          >
            {new Date(text(item.data.dueAt)).toLocaleString(locale)}
          </small>
        )}
        <div className={s.actions}>
          <Button onClick={onEdit} icon="Pencil">
            <T v={["Manage", "Gérer", "إدارة"]} />
          </Button>
          {item.record_id && (
            <Button onClick={onOpen} icon="ArrowUpRight">
              <T v={["Dossier", "Dossier", "الملف"]} />
            </Button>
          )}
        </div>
      </div>
    </article>
  );
}
function TaskEditor({
  initial,
  onClose,
  onSaved,
}: {
  initial: Partial<WorkItem>;
  onClose: () => void;
  onSaved: () => void;
}) {
  const transact = useReceiptMutation();
  const { boot, locale } = useUI(),
    [draft, setDraft, clearDraft] = useWorkingState(
      "task." + (initial.id || initial.record_id || "new"),
      initial,
    ),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [picker, setPicker] = useState(false),
    [dependency, setDependency] = useState(""),
    [dependencyPage, setDependencyPage] = useState(1),
    [dueWall, setDueWall] = useState(() =>
      initial.data?.dueAt
        ? toLocalDateInput(
            text(initial.data.dueAt),
            worldTimeZone(boot.settings),
          )
        : "",
    );
  const d = object(draft.data),
    r = useQuery<any>(
      { op: "reference", type: "record", id: draft.record_id },
      {},
    ),
    deps = useQuery<any>(
      { op: "pro_work", kind: "task", q: dependency, page: dependencyPage },
      { rows: [] },
    ),
    patch = (p: Data) =>
      setDraft((old) => ({ ...old, data: { ...old.data, ...p } }));
  const receipt = useRef(crypto.randomUUID());
  async function save() {
    setBusy(true);
    setError("");
    try {
      await transact({
        action: "pro_save",
        id: draft.id,
        revision: draft.revision || 0,
        input: {
          ...draft,
          data: {
            ...draft.data,
            dueAt: dueWall
              ? zonedDateInput(dueWall, worldTimeZone(boot.settings))
              : null,
          },
        },
      });
      clearDraft();
      onSaved();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <Dialog
      wide
      title={
        <T v={["Editorial assignment", "Mission éditoriale", "مهمة تحريرية"]} />
      }
      onClose={onClose}
      footer={
        <Button
          disabled={busy || !boot.actor.rights.manage}
          onClick={save}
          kind="primary"
          icon="Save"
        >
          <T v={["Save assignment", "Enregistrer la mission", "حفظ المهمة"]} />
        </Button>
      }
    >
      <Button onClick={clearDraft}>
        <T
          v={[
            "Discard recovered draft / use loaded version",
            "Écarter la reprise / utiliser la version chargée",
            "تجاهل المسودة المستعادة واستخدام النسخة المحمّلة",
          ]}
        />
      </Button>
      <div className={s.formGrid}>
        <Field
          label={<T v={["Task title", "Titre de la tâche", "عنوان المهمة"]} />}
        >
          <input
            value={draft.title || ""}
            onChange={(e) => setDraft({ ...draft, title: e.target.value })}
          />
        </Field>
        <Field label={<T v={["Dossier", "Dossier", "الملف"]} />}>
          <div className={s.actions}>
            <strong>{r.value.title || "—"}</strong>
            <Button
              disabled={!!draft.id}
              onClick={() => setPicker(true)}
              icon="Search"
            >
              <T v={["Choose", "Choisir", "اختر"]} />
            </Button>
          </div>
        </Field>
        <StaffChoice
          value={text(d.assignedTo)}
          onChange={(v) => patch({ assignedTo: v })}
          label={[
            "Author / responsible operator",
            "Auteur / opérateur responsable",
            "المؤلف / الموظف المسؤول",
          ]}
        />
        <StaffChoice
          value={text(d.reviewerId)}
          onChange={(v) => patch({ reviewerId: v })}
          label={[
            "Independent reviewer",
            "Réviseur indépendant",
            "المراجع المستقل",
          ]}
        />
        <Field label={<T v={["Deadline", "Échéance", "الموعد النهائي"]} />}>
          <input
            type="datetime-local"
            title={worldTimeZone(boot.settings)}
            value={dueWall}
            onChange={(e) => setDueWall(e.target.value)}
          />
        </Field>
        <Field label={<T v={["Priority", "Priorité", "الأولوية"]} />}>
          <select
            value={text(d.priority) || "normal"}
            onChange={(e) => patch({ priority: e.target.value })}
          >
            {["low", "normal", "high", "urgent"].map((v) => (
              <option key={v}>{v}</option>
            ))}
          </select>
        </Field>
        <Field label={<T v={["State", "État", "الحالة"]} />}>
          <select
            value={draft.status || "open"}
            onChange={(e) => setDraft({ ...draft, status: e.target.value })}
          >
            {[
              "open",
              "in_progress",
              "review",
              "changes_requested",
              "done",
              "cancelled",
            ].map((v) => (
              <option key={v} value={v}>
                {tr(HUMAN_STATUS[v], locale)}
              </option>
            ))}
          </select>
        </Field>
        <Field label={<T v={["Language", "Langue", "اللغة"]} />}>
          <select
            value={text(d.locale)}
            onChange={(e) => patch({ locale: e.target.value })}
          >
            <option value="">—</option>
            {["fr", "en", "ar"].map((v) => (
              <option key={v}>{v}</option>
            ))}
          </select>
        </Field>
        <Field
          label={
            <T
              v={[
                "Section or unit to review",
                "Section ou unité à revoir",
                "القسم أو الوحدة للمراجعة",
              ]}
            />
          }
        >
          <input
            value={text(d.anchor)}
            onChange={(e) => patch({ anchor: e.target.value })}
          />
        </Field>
        <Switch
          label={
            <T
              v={[
                "Block approval until complete",
                "Bloquer l’approbation avant complétion",
                "منع الاعتماد حتى الإكمال",
              ]}
            />
          }
          value={d.blocking === true}
          onChange={(v) => patch({ blocking: v })}
        />
      </div>
      <Field
        label={
          <T
            v={[
              "Brief / requested changes",
              "Consigne / corrections demandées",
              "التعليمات / التعديلات المطلوبة",
            ]}
          />
        }
      >
        <textarea
          rows={5}
          value={text(d.brief)}
          onChange={(e) => patch({ brief: e.target.value })}
        />
      </Field>
      <details className={s.advanced}>
        <summary>
          <T
            v={[
              "Task dependencies",
              "Dépendances entre tâches",
              "اعتماديات المهام",
            ]}
          />
        </summary>
        <input
          aria-label="Search dependency tasks"
          value={dependency}
          onChange={(e) => {
            setDependency(e.target.value);
            setDependencyPage(1);
          }}
        />
        {deps.value.rows
          .filter((w: WorkItem) => w.id !== draft.id)
          .map((w: WorkItem) => (
            <label className={s.checkOptions} key={w.id}>
              <input
                type="checkbox"
                checked={
                  Array.isArray(d.dependencies) && d.dependencies.includes(w.id)
                }
                onChange={(e) =>
                  patch({
                    dependencies: e.target.checked
                      ? [...((d.dependencies as string[]) || []), w.id]
                      : ((d.dependencies as string[]) || []).filter(
                          (id) => id !== w.id,
                        ),
                  })
                }
              />
              {w.title}
            </label>
          ))}
        <Pager
          page={dependencyPage}
          size={30}
          total={deps.value.total || 0}
          onPage={setDependencyPage}
        />
      </details>
      {error && (
        <p role="alert" className={s.notice}>
          {error}
        </p>
      )}
      {picker && (
        <Picker
          type="record"
          kind="experience"
          onSelect={(id) => setDraft({ ...draft, record_id: id })}
          onClose={() => setPicker(false)}
        />
      )}
    </Dialog>
  );
}
export function DossierTeam({
  id,
  onCommitted,
}: {
  id: string;
  onCommitted: (r: DceRecord) => void;
}) {
  const transact = useReceiptMutation();
  const { boot } = useUI(),
    [body, setBody] = useState(""),
    [anchor, setAnchor] = useState(""),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    comments = useQuery<any>(
      { op: "pro_work", kind: "comment", recordId: id, page: 1 },
      { rows: [] },
    ),
    presence = useQuery<any>({ op: "pro_presence", id }, { rows: [] }),
    session = useRef(crypto.randomUUID());
  useEffect(() => {
    let active = true;
    const pulse = () => {
      if (active)
        mutate({
          action: "pro_presence",
          id,
          input: { sessionId: session.current, field: "Team workspace" },
        })
          .then(() => presence.reload())
          .catch(() => {});
    };
    pulse();
    const timer = setInterval(pulse, 15000);
    return () => {
      active = false;
      clearInterval(timer);
      void mutate({
        action: "pro_presence",
        id,
        input: { sessionId: session.current, leave: true },
      }).catch(() => {});
    };
  }, [id]);
  async function comment() {
    setBusy(true);
    try {
      await transact({
        action: "pro_save",
        input: {
          kind: "comment",
          record_id: id,
          title: anchor || "Editorial review",
          status: "open",
          data: { body, anchor },
        },
      });
      setBody("");
      comments.reload();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <div className={s.modePills}>
        {presence.value.rows.map((p: any) => (
          <Badge key={p.session_id}>
            <Icon name="Users" size={13} />
            {p.display_name} · {p.field_path}
          </Badge>
        ))}
      </div>
      <EditorialDesk recordId={id} />
      <Panel
        title={
          <T
            v={[
              "Anchored review discussion",
              "Discussion de revue contextualisée",
              "نقاش مراجعة مرتبط بالسياق",
            ]}
          />
        }
      >
        <Field
          label={
            <T v={["Section / unit", "Section / unité", "القسم / الوحدة"]} />
          }
        >
          <input value={anchor} onChange={(e) => setAnchor(e.target.value)} />
        </Field>
        <Field
          label={
            <T
              v={[
                "Internal review comment",
                "Commentaire interne de revue",
                "تعليق مراجعة داخلي",
              ]}
            />
          }
        >
          <textarea
            rows={4}
            value={body}
            onChange={(e) => setBody(e.target.value)}
          />
        </Field>
        <Button
          disabled={busy || !body.trim() || !boot.actor.rights.manage}
          onClick={comment}
          icon="Send"
        >
          <T v={["Add comment", "Ajouter le commentaire", "إضافة التعليق"]} />
        </Button>
        {error && <p role="alert">{error}</p>}
        <State {...comments} retry={comments.reload}>
          <div className={s.timeline}>
            {comments.value.rows.map((w: WorkItem) => (
              <div key={w.id}>
                <strong>{w.title}</strong>
                <p className={s.previewText}>{text(w.data.body)}</p>
                <small>{new Date(w.created_at).toLocaleString()}</small>
              </div>
            ))}
          </div>
        </State>
      </Panel>
      <SharedText id={id} onCommitted={onCommitted} />
    </>
  );
}
function SharedText({
  id,
  onCommitted,
}: {
  id: string;
  onCommitted: (r: DceRecord) => void;
}) {
  const { locale, boot } = useUI(),
    [language, setLanguage] = useState(locale),
    [field, setField] = useState("body"),
    [nodes, setNodes] = useState<TextNode[]>([]),
    [value, setValue] = useState(""),
    [status, setStatus] = useState(""),
    [error, setError] = useState(""),
    [recovery, setRecovery] = useState(""),
    [generation, setGeneration] = useState<string | null>(null);
  const current = useRef({
      nodes: [] as TextNode[],
      generation: null as string | null,
      pending: [] as TextOperation[],
      ready: false,
    }),
    session = useRef(crypto.randomUUID()),
    input = useRef<HTMLTextAreaElement>(null),
    sending = useRef(false),
    active = useRef(false),
    path = ["data", "locales", language, field],
    key =
      "dce.shared.v1." +
      boot.actor.id +
      "." +
      id +
      "." +
      language +
      "." +
      field;
  const contextKey = useRef(key);
  contextKey.current = key;
  const persist = () => {
    try {
      sessionStorage.setItem(
        key,
        JSON.stringify({
          generation: current.current.generation,
          operations: current.current.pending,
          value: renderText(current.current.nodes),
        }),
      );
    } catch {}
  };
  async function pull() {
    const data = await query<any>({
      op: "pro_text",
      id,
      path: JSON.stringify(path),
    });
    let doc = data.document;
    if (!doc.generation) {
      const joined = await mutate<any>({
        action: "pro_text",
        id,
        input: { path, generation: null, operations: [] },
      });
      doc = joined.document;
    }
    if (!active.current || contextKey.current !== key) return;
    if (
      current.current.ready &&
      current.current.generation !== doc.generation &&
      current.current.pending.length
    ) {
      setError(
        tr(
          [
            "Shared content was replaced. Your local text is retained below.",
            "Le contenu partagé a été remplacé. Votre texte local est conservé ci-dessous.",
            "تم استبدال المحتوى المشترك. النص المحلي محفوظ أدناه.",
          ],
          locale,
        ),
      );
      setRecovery(renderText(current.current.nodes));
      return;
    }
    const merged = applyTextOperations(doc.nodes, current.current.pending);
    current.current = {
      ...current.current,
      nodes: merged,
      generation: doc.generation,
      ready: true,
    };
    setNodes(merged);
    setValue(renderText(merged));
    setGeneration(doc.generation);
    setStatus(current.current.pending.length ? "pending" : "saved");
  }
  async function flush() {
    if (
      sending.current ||
      !current.current.ready ||
      !current.current.pending.length
    )
      return;
    sending.current = true;
    const operations = [...current.current.pending],
      docGeneration = current.current.generation;
    setStatus("saving");
    try {
      const data = await mutate<any>({
        action: "pro_text",
        id,
        input: { path, generation: docGeneration, operations },
      });
      if (!active.current || contextKey.current !== key) return;
      current.current.pending.splice(0, operations.length);
      current.current.nodes = applyTextOperations(
        data.document.nodes,
        current.current.pending,
      );
      current.current.generation = data.document.generation;
      setNodes(current.current.nodes);
      setValue(renderText(current.current.nodes));
      setStatus(current.current.pending.length ? "pending" : "saved");
      if (current.current.pending.length) persist();
      else sessionStorage.removeItem(key);
      onCommitted(data.record);
      setError("");
    } catch (e) {
      if (active.current) {
        setError((e as Error).message);
        setStatus("retained");
        persist();
      }
    } finally {
      sending.current = false;
    }
  }
  useEffect(() => {
    active.current = true;
    current.current = {
      nodes: [],
      generation: null,
      pending: [],
      ready: false,
    };
    setValue("");
    setNodes([]);
    setError("");
    try {
      const saved = JSON.parse(sessionStorage.getItem(key) || "null");
      if (saved?.value) setRecovery(saved.value);
    } catch {}
    pull().catch((e) => setError(e.message));
    const timer = setInterval(() => {
      if (!document.hidden && !sending.current)
        pull().catch((e) => setError(e.message));
    }, 2500);
    return () => {
      active.current = false;
      clearInterval(timer);
    };
  }, [id, language, field]);
  useEffect(() => {
    if (status !== "pending") return;
    const timer = setTimeout(flush, 650);
    return () => clearTimeout(timer);
  }, [value, status]);
  function edit(next: string) {
    try {
      const operations = textDifference(
        current.current.nodes,
        next,
        session.current,
      );
      current.current.pending.push(...operations);
      current.current.nodes = applyTextOperations(
        current.current.nodes,
        operations,
      );
      setNodes(current.current.nodes);
      setValue(renderText(current.current.nodes));
      setStatus("pending");
      persist();
    } catch (e) {
      setError((e as Error).message);
    }
  }
  function format(mark: string) {
    const element = input.current;
    if (!element) return;
    const visible = orderedNodes(current.current.nodes).filter(
        (n) => !n.deleted,
      ),
      start = Array.from(value.slice(0, element.selectionStart)).length,
      end = Array.from(value.slice(0, element.selectionEnd)).length;
    if (end <= start) return;
    const ids = visible.slice(start, end).map((n) => n.id),
      op: TextOperation = {
        type: "format",
        ids,
        ...(visible.slice(start, end).every((n) => n.marks.includes(mark))
          ? { remove: [mark] }
          : { add: [mark] }),
      };
    current.current.pending.push(op);
    current.current.nodes = applyTextOperations(current.current.nodes, [op]);
    setNodes(current.current.nodes);
    setStatus("pending");
    persist();
    void flush();
  }
  return (
    <Panel
      title={
        <T
          v={[
            "Shared multilingual text studio",
            "Atelier de texte partagé multilingue",
            "استوديو النص المشترك متعدد اللغات",
          ]}
        />
      }
      subtitle={
        <T
          v={[
            "Character operations preserve concurrent typing; save acknowledgements distinguish local edits from server receipts.",
            "Les opérations par caractère préservent les saisies simultanées ; chaque enregistrement est confirmé.",
            "تحافظ عمليات الحروف على الكتابة المتزامنة مع تأكيدات حفظ واضحة.",
          ]}
        />
      }
    >
      <div className={s.toolbar}>
        <select
          aria-label="Shared text language"
          value={language}
          onChange={(e) => {
            if (current.current.pending.length) {
              setError(
                tr(
                  [
                    "Save or copy pending text before changing fields.",
                    "Enregistrez ou copiez le texte avant de changer de champ.",
                    "احفظ النص المعلق أو انسخه قبل تغيير الحقول.",
                  ],
                  locale,
                ),
              );
              return;
            }
            setLanguage(e.target.value as any);
          }}
        >
          {["fr", "en", "ar"].map((l) => (
            <option key={l}>{l}</option>
          ))}
        </select>
        <select
          aria-label="Shared text field"
          value={field}
          onChange={(e) => {
            if (!current.current.pending.length) setField(e.target.value);
          }}
        >
          {["body", "summary", "instructions"].map((v) => (
            <option key={v}>{v}</option>
          ))}
        </select>
        <Badge tone={status === "saved" ? "green" : "orange"}>
          {tr(
            (
              {
                saved: [
                  "Saved on server",
                  "Enregistré sur le serveur",
                  "محفوظ على الخادم",
                ],
                saving: ["Saving…", "Enregistrement…", "جار الحفظ…"],
                pending: [
                  "Local changes",
                  "Modifications locales",
                  "تعديلات محلية",
                ],
                retained: [
                  "Retained for recovery",
                  "Conservé pour reprise",
                  "محفوظ للاستعادة",
                ],
              } as Record<string, Tri>
            )[status] || ["Connecting…", "Connexion…", "جار الاتصال…"],
            locale,
          )}
        </Badge>
        {["bold", "italic", "underline"].map((mark) => (
          <Button
            key={mark}
            disabled={!generation || !boot.actor.rights.manage}
            onClick={() => format(mark)}
          >
            {mark}
          </Button>
        ))}
      </div>
      <textarea
        ref={input}
        aria-label="Collaborative content"
        dir={language === "ar" ? "rtl" : "ltr"}
        rows={9}
        value={value}
        disabled={!generation || !boot.actor.rights.manage}
        onChange={(e) => edit(e.target.value)}
      />
      <div className={s.previewText} aria-label="Shared formatted text preview">
        {(textSpans(nodes).length
          ? textSpans(nodes)
          : [{ text: value, bold: false, italic: false, underline: false }]
        ).map((n, i) => (
          <span
            key={i}
            style={{
              fontWeight: n.bold ? 700 : undefined,
              fontStyle: n.italic ? "italic" : undefined,
              textDecoration: n.underline ? "underline" : undefined,
            }}
          >
            {n.text}
          </span>
        ))}
      </div>
      <Button
        disabled={sending.current || !current.current.pending.length}
        onClick={() => void flush()}
        icon="Save"
      >
        <T
          v={[
            "Save retained operations",
            "Enregistrer les opérations conservées",
            "حفظ العمليات المحفوظة",
          ]}
        />
      </Button>
      {error && (
        <p role="alert" className={s.notice}>
          {error}
        </p>
      )}
      {recovery && (
        <details className={s.advanced}>
          <summary>
            <T
              v={[
                "Recovered local text",
                "Texte local récupéré",
                "النص المحلي المستعاد",
              ]}
            />
          </summary>
          <textarea readOnly rows={5} value={recovery} />
          <Button
            onClick={() => {
              edit(recovery);
              setRecovery("");
            }}
          >
            <T
              v={[
                "Apply as a reviewed local edit",
                "Appliquer comme modification locale revue",
                "تطبيق كتعديل محلي تمت مراجعته",
              ]}
            />
          </Button>
        </details>
      )}
    </Panel>
  );
}
export function EditorialNotices() {
  const { open, notify } = useUI(),
    q = useQuery<any>(
      { op: "pro_work", kind: "editorial_notice", status: "unread", page: 1 },
      { rows: [] },
    );
  return (
    <State {...q} retry={q.reload}>
      <div className={s.helpList}>
        {q.value.rows.map((w: WorkItem) => (
          <div key={w.id}>
            <strong>{w.title}</strong>
            <WorkStatus value={text(w.data.state)} />
            <div className={s.actions}>
              {w.record_id && (
                <Button
                  onClick={() =>
                    open(w.record_id!, "team", w.data.locale as any)
                  }
                  icon="ArrowUpRight"
                >
                  <T
                    v={["Open assignment", "Ouvrir la mission", "فتح المهمة"]}
                  />
                </Button>
              )}
              <Button
                onClick={async () => {
                  try {
                    await mutate({ action: "pro_notice_read", id: w.id });
                    q.reload();
                  } catch (e) {
                    notify((e as Error).message, true);
                  }
                }}
              >
                <T v={["Mark read", "Marquer comme lu", "تعليم كمقروء"]} />
              </Button>
            </div>
          </div>
        ))}
      </div>
    </State>
  );
}
export function WorkChoice({
  kind,
  value,
  onChange,
  label,
  status = "active",
}: {
  kind: string;
  value: string;
  onChange: (id: string) => void;
  label: Tri;
  status?: string;
}) {
  const { locale } = useUI(),
    [show, setShow] = useState(false),
    [search, setSearch] = useState(""),
    [page, setPage] = useState(1),
    q = useQuery<any>(
      { op: "pro_work", kind, status, q: search, page },
      { rows: [], total: 0 },
    ),
    selected = useQuery<any>(
      { op: value ? "pro_item" : "pro_empty", id: value },
      { item: null },
    );
  return (
    <Field label={<T v={label} />}>
      <div className={s.actions}>
        <strong>{selected.value.item?.title || "—"}</strong>
        <Button onClick={() => setShow(true)} icon="Search">
          <T v={["Choose", "Choisir", "اختر"]} />
        </Button>
        {value && (
          <Button onClick={() => onChange("")} icon="X">
            <T v={["Clear", "Effacer", "مسح"]} />
          </Button>
        )}
      </div>
      {show && (
        <Dialog title={<T v={label} />} onClose={() => setShow(false)}>
          <input
            value={search}
            aria-label="Search operating policies"
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder={tr(
              ["Search policies", "Chercher une politique", "البحث عن سياسة"],
              locale,
            )}
          />
          <State {...q} retry={q.reload}>
            {q.value.rows.map((w: WorkItem) => (
              <button
                key={w.id}
                className={s.outlineItem}
                onClick={() => {
                  onChange(w.id);
                  setShow(false);
                }}
              >
                {w.title}
              </button>
            ))}
            <Pager
              page={page}
              size={30}
              total={q.value.total}
              onPage={setPage}
            />
          </State>
        </Dialog>
      )}
    </Field>
  );
}

function EditorialCalendar({
  month,
  day,
  counts,
  zone,
  onMonth,
  onDay,
}: {
  month: string;
  day: string;
  counts: Record<string, number>;
  zone: string;
  onMonth: (v: string) => void;
  onDay: (v: string) => void;
}) {
  const { locale } = useUI(),
    [year, m] = month.split("-").map(Number),
    first = new Date(Date.UTC(year, m - 1, 1)),
    start = (first.getUTCDay() + 6) % 7,
    days = new Date(Date.UTC(year, m, 0)).getUTCDate(),
    cells = Array.from(
      { length: Math.ceil((start + days) / 7) * 7 },
      (_, i) => i - start + 1,
    );
  return (
    <div>
      <div className={s.toolbar}>
        <Field
          label={
            <T
              v={[
                "Editorial calendar month",
                "Mois du calendrier éditorial",
                "شهر التقويم التحريري",
              ]}
            />
          }
        >
          <input
            type="month"
            value={month}
            onChange={(e) => {
              if (e.target.value) onMonth(e.target.value);
            }}
          />
        </Field>
        <Badge>{zone}</Badge>
        <Button onClick={() => onDay("")}>
          <T v={["Whole month", "Tout le mois", "الشهر كاملاً"]} />
        </Button>
      </div>
      <div className={s.tableScroll}>
        <table
          className={s.table}
          style={{ minWidth: 650, tableLayout: "fixed" }}
        >
          <thead>
            <tr>
              {Array.from({ length: 7 }, (_, i) => (
                <th key={i}>
                  {new Intl.DateTimeFormat(locale, {
                    weekday: "short",
                    timeZone: "UTC",
                  }).format(new Date(Date.UTC(2026, 0, 5 + i)))}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: cells.length / 7 }, (_, row) => (
              <tr key={row}>
                {cells.slice(row * 7, row * 7 + 7).map((n, i) => {
                  const date = month + "-" + String(n).padStart(2, "0");
                  return (
                    <td key={i}>
                      {n >= 1 && n <= days ? (
                        <button
                          className={s.choice}
                          style={{ width: "100%", minHeight: 64 }}
                          aria-pressed={day === date}
                          onClick={() => onDay(day === date ? "" : date)}
                        >
                          <strong>{n}</strong>
                          <Badge tone={counts[date] ? "blue" : "green"}>
                            {counts[date] || 0}
                          </Badge>
                        </button>
                      ) : null}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
