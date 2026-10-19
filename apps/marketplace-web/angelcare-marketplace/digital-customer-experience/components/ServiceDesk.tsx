"use client";
import { BASE } from "../types";

import { useState } from "react";
import {
  array,
  object,
  text,
  number,
  tr,
  type Data,
  type DceRecord,
} from "../types";
import {
  Badge,
  Button,
  Dialog,
  Empty,
  Field,
  Pager,
  Panel,
  State,
  T,
  useUI,
  useWorkingState,
  useQuery,
  mutate,
  useReceiptMutation,
} from "./ui";
import { PolicyDesk } from "./OperationalPolicies";
import { StaffChoice, WorkChoice } from "./ProfessionalTeam";
import { Picker } from "./Editor";
import { PrivateCaseAttachments } from "./PrivateCaseAttachments";
import s from "./workspace.module.css";
export function ServiceDesk() {
  const { locale, boot, notify } = useUI(),
    [page, setPage] = useState(1),
    [search, setSearch] = useState(""),
    [state, setState] = useState(""),
    [selected, setSelected] = useState(""),
    [policies, setPolicies] = useState(false),
    [busy, setBusy] = useState(false),
    q = useQuery<any>(
      { op: "pro_cases", q: search, lifecycle: state, page, pageSize: 30 },
      { rows: [], total: 0 },
    );
  async function process() {
    setBusy(true);
    try {
      const r = await mutate({ action: "pro_process_due" });
      notify(
        tr(
          [
            "Service checks finished: ",
            "Contrôles de service terminés : ",
            "اكتملت فحوص الخدمة: ",
          ],
          locale,
        ) +
          r.checked +
          " / " +
          r.escalated,
      );
      q.reload();
    } catch (e) {
      notify((e as Error).message, true);
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <div className={s.toolbar}>
        <Button onClick={() => setPolicies((v) => !v)} icon="Settings">
          <T
            v={[
              "Policies and response templates",
              "Politiques et modèles de réponse",
              "السياسات وقوالب الرد",
            ]}
          />
        </Button>
        <Button
          disabled={busy || !boot.actor.rights.moderate}
          onClick={process}
          icon="CalendarClock"
        >
          <T
            v={[
              "Evaluate service deadlines",
              "Évaluer les échéances de service",
              "تقييم مواعيد الخدمة",
            ]}
          />
        </Button>
      </div>
      {policies && <PolicyDesk kind="sla_policy" />}
      <Panel
        title={
          <T
            v={[
              "Customer service operations",
              "Opérations de service client",
              "عمليات خدمة العملاء",
            ]}
          />
        }
        subtitle={
          <T
            v={[
              "One dossier connects its received information, ownership, deadlines, communication and private files.",
              "Un dossier relie les informations reçues, le responsable, les échéances, les échanges et les pièces privées.",
              "يربط الملف المعلومات الواردة والمسؤول والمواعيد والمراسلات والملفات الخاصة.",
            ]}
          />
        }
      >
        <div className={s.toolbar}>
          <input
            aria-label="Search service cases"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder={tr(
              [
                "Search received cases",
                "Chercher les dossiers reçus",
                "البحث في الملفات الواردة",
              ],
              locale,
            )}
          />
          <select
            aria-label="Service case status"
            value={state}
            onChange={(e) => {
              setState(e.target.value);
              setPage(1);
            }}
          >
            <option value="">
              {tr(["All states", "Tous les états", "كل الحالات"], locale)}
            </option>
            {["open", "assigned", "waiting_customer", "resolved", "closed"].map(
              (v) => (
                <option key={v}>{v}</option>
              ),
            )}
          </select>
          <Button icon="RefreshCw" onClick={q.reload}>
            <T v={["Refresh", "Actualiser", "تحديث"]} />
          </Button>
        </div>
        <State {...q} retry={q.reload}>
          <div className={s.tableScroll}>
            <table className={s.table}>
              <thead>
                <tr>
                  <th>
                    <T
                      v={["Received dossier", "Dossier reçu", "الملف الوارد"]}
                    />
                  </th>
                  <th>
                    <T v={["State", "État", "الحالة"]} />
                  </th>
                  <th>
                    <T
                      v={[
                        "Priority / service target",
                        "Priorité / objectif de service",
                        "الأولوية / هدف الخدمة",
                      ]}
                    />
                  </th>
                  <th>
                    <T v={["Received", "Reçu", "تاريخ الاستلام"]} />
                  </th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {q.value.rows.map(
                  (r: DceRecord & { service?: any; serviceTeam?: string }) => (
                    <tr key={r.id}>
                      <td>
                        <strong>{r.title}</strong>
                        <small>
                          {r.data.disposed ? (
                            <T
                              v={[
                                "Disposed receipt",
                                "Reçu après suppression",
                                "إيصال بعد الحذف",
                              ]}
                            />
                          ) : (
                            r.serviceTeam || text(r.data.responsibleTeam)
                          )}
                        </small>
                      </td>
                      <td>
                        <Badge
                          tone={
                            ["resolved", "closed"].includes(r.lifecycle)
                              ? "green"
                              : "blue"
                          }
                        >
                          {r.lifecycle}
                        </Badge>
                      </td>
                      <td>
                        <Badge
                          tone={r.data.priority === "urgent" ? "pink" : "blue"}
                        >
                          {text(r.data.priority) || "normal"}
                        </Badge>
                        {r.service && (
                          <small>
                            <Badge
                              tone={
                                r.service.state === "overdue"
                                  ? "pink"
                                  : r.service.state === "approaching"
                                    ? "orange"
                                    : "green"
                              }
                            >
                              {r.service.remainingMinutes} min ·{" "}
                              {r.service.state}
                            </Badge>
                          </small>
                        )}
                      </td>
                      <td>{new Date(r.created_at).toLocaleString(locale)}</td>
                      <td>
                        <Button
                          disabled={r.data.disposed === true}
                          icon="PanelRightOpen"
                          onClick={() => setSelected(r.id)}
                        >
                          <T
                            v={[
                              "Handle dossier",
                              "Traiter le dossier",
                              "معالجة الملف",
                            ]}
                          />
                        </Button>
                      </td>
                    </tr>
                  ),
                )}
              </tbody>
            </table>
          </div>
          {!q.value.total && (
            <Empty
              icon="Inbox"
              title={
                <T
                  v={[
                    "No received case matches",
                    "Aucun dossier reçu correspondant",
                    "لا توجد ملفات واردة مطابقة",
                  ]}
                />
              }
              detail={
                <T
                  v={[
                    "Only genuine received customer dossiers appear here.",
                    "Seuls les dossiers clients réellement reçus apparaissent ici.",
                    "تظهر هنا ملفات العملاء الواردة فعلياً فقط.",
                  ]}
                />
              }
            />
          )}
          <Pager total={q.value.total} page={page} size={30} onPage={setPage} />
        </State>
      </Panel>
      {selected && (
        <ServiceCase
          id={selected}
          onClose={() => {
            setSelected("");
            q.reload();
          }}
        />
      )}
    </>
  );
}
function ServiceCase({ id, onClose }: { id: string; onClose: () => void }) {
  const transact = useReceiptMutation();
  const { boot, locale, notify } = useUI(),
    q = useQuery<any>(
      { op: "pro_case", id },
      {
        record: null,
        operation: null,
        policy: null,
        target: null,
        communications: [],
      },
    ),
    policies = useQuery<any>(
      { op: "pro_work", kind: "sla_policy", status: "active", page: 1 },
      { rows: [] },
    ),
    [draft, setDraft] = useWorkingState<Data | null>(
      "service." + id + ".draft",
      null,
    ),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [subject, setSubject] = useWorkingState("service." + id + ".subject", ""),
    [body, setBody] = useWorkingState("service." + id + ".body", ""),
    [tab, setTab] = useState("dossier"),
    [duplicatePicker, setDuplicatePicker] = useState(false);
  const r = q.value.record as DceRecord | null,
    operation = q.value.operation,
    base: Data = {
      assignedTo: operation?.data.assignedTo || r?.data.assignedTo || "",
      team: operation?.data.team || r?.data.responsibleTeam || "",
      caseType: operation?.data.caseType || "",
      priority: r?.data.priority || "normal",
      status: r?.lifecycle || "open",
      policyId: operation?.data.policyId || q.value.policy?.id || "",
      resolution: r?.data.resolution || "",
      note: "",
      operationRevision: operation?.revision || 0,
      recordRevision: r?.revision || 0,
    },
    d = draft || base,
    patch = (p: Data) => setDraft((old) => ({ ...(old || base), ...p }));
  async function save() {
    if (!r) return;
    setBusy(true);
    setError("");
    try {
      await transact({
        action: "pro_case_update",
        id,
        revision: number(d.recordRevision),
        input: d,
      });
      setDraft(null);
      q.reload();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  async function message() {
    if (!r) return;
    setBusy(true);
    setError("");
    try {
      await transact({
        action: "pro_case_message",
        id,
        input: { subject, body },
      });
      setSubject("");
      setBody("");
      q.reload();
      notify(
        tr(
          [
            "Message queued; delivery has not been claimed.",
            "Message en file ; livraison non déclarée.",
            "أُضيفت الرسالة إلى القائمة؛ لم يُدّعَ تسليمها.",
          ],
          locale,
        ),
      );
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  async function dispatch(w: any) {
    setBusy(true);
    setError("");
    try {
      await transact({
        action: "pro_dispatch_message",
        id: w.id,
        revision: w.revision,
      });
      q.reload();
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
        r?.title || (
          <T v={["Customer dossier", "Dossier client", "ملف العميل"]} />
        )
      }
      onClose={onClose}
    >
      <State {...q} retry={q.reload}>
        {r && (
          <>
            {r.data.source === "explicit_certificate_request" && (
              <div className={s.notice}>
                <strong>
                  <T
                    v={[
                      "Certificate document fulfilment",
                      "Préparation documentaire de certificat",
                      "تجهيز وثيقة الشهادة",
                    ]}
                  />
                </strong>
                <p>
                  <T
                    v={[
                      "This is a linked internal subcase, not new visitor intake. Guest contact, ownership and follow-up belong to the Certificate Request dossier.",
                      "Sous-dossier interne lié, pas une nouvelle demande visiteur. Contact, responsabilité et suivi sont gérés dans la demande de certificat.",
                      "هذا ملف فرعي داخلي مرتبط وليس طلب زائر جديداً. يدار الاتصال والمسؤولية والمتابعة من طلب الشهادة.",
                    ]}
                  />
                </p>
                <a
                  href={
                    BASE +
                    "/certificates?certificate=" +
                    r.data.certificateRequestId
                  }
                >
                  <T
                    v={[
                      "Open certificate request",
                      "Ouvrir la demande de certificat",
                      "فتح طلب الشهادة",
                    ]}
                  />
                </a>
              </div>
            )}
            <div className={s.toolbar}>
              <Badge>{r.lifecycle}</Badge>
              {q.value.target ? (
                <Badge
                  tone={
                    q.value.target.state === "overdue"
                      ? "pink"
                      : q.value.target.state === "approaching"
                        ? "orange"
                        : "green"
                  }
                >
                  {q.value.target.state} · {q.value.target.elapsedMinutes} min ·{" "}
                  {q.value.target.remainingMinutes} min
                </Badge>
              ) : (
                <Badge tone="orange">
                  <T
                    v={[
                      "No matching service policy",
                      "Aucune politique de service correspondante",
                      "لا توجد سياسة خدمة مطابقة",
                    ]}
                  />
                </Badge>
              )}
              {object(operation?.data).escalationStatus && (
                <Badge
                  tone={
                    operation.data.escalationStatus === "assigned"
                      ? "orange"
                      : "pink"
                  }
                >
                  {operation.data.escalationStatus}
                </Badge>
              )}
            </div>
            <div className={s.tabs}>
              {[
                ["dossier", ["Dossier", "Dossier", "الملف"]],
                [
                  "service",
                  [
                    "Assignment and deadlines",
                    "Affectation et échéances",
                    "الإسناد والمواعيد",
                  ],
                ],
                [
                  "communication",
                  [
                    "Customer communication",
                    "Communication client",
                    "مراسلات العميل",
                  ],
                ],
                [
                  "files",
                  ["Private files", "Pièces privées", "الملفات الخاصة"],
                ],
              ].map(([key, label]) => (
                <button
                  key={key as string}
                  className={s.tab}
                  aria-pressed={tab === key}
                  onClick={() => setTab(key as string)}
                >
                  {tr(label as any, locale)}
                </button>
              ))}
            </div>
            {tab === "dossier" && (
              <>
                <Panel
                  title={
                    <T
                      v={[
                        "Received customer information",
                        "Informations reçues du client",
                        "المعلومات الواردة من العميل",
                      ]}
                    />
                  }
                >
                  <p className={s.previewText}>{text(r.data.body)}</p>
                  <small>{new Date(r.created_at).toLocaleString(locale)}</small>
                </Panel>
                <Panel
                  title={
                    <T
                      v={[
                        "Internal follow-up timeline",
                        "Suivi interne chronologique",
                        "التسلسل الزمني للمتابعة الداخلية",
                      ]}
                    />
                  }
                >
                  <div className={s.timeline}>
                    {[
                      ...array(r.data.notes),
                      ...array(operation?.data.notes),
                      ...array(operation?.data.escalations),
                      ...array(r.data.decisions),
                    ].map((n, i) => (
                      <div key={i}>
                        <strong>
                          {text(n.action) || text(n.target) || (
                            <T
                              v={[
                                "Internal note",
                                "Note interne",
                                "ملاحظة داخلية",
                              ]}
                            />
                          )}
                        </strong>
                        <p className={s.previewText}>
                          {text(n.body) || text(n.reason) || text(n.status)}
                        </p>
                        <small>{text(n.createdAt) || text(n.at)}</small>
                      </div>
                    ))}
                  </div>
                </Panel>
              </>
            )}
            {tab === "service" && (
              <>
                <div className={s.formGrid}>
                  <StaffChoice
                    value={text(d.assignedTo)}
                    onChange={(v) => patch({ assignedTo: v })}
                    label={[
                      "Responsible native operator",
                      "Opérateur natif responsable",
                      "الموظف الأصلي المسؤول",
                    ]}
                  />
                  <Field
                    label={
                      <T
                        v={[
                          "Receiving team",
                          "Équipe responsable",
                          "الفريق المسؤول",
                        ]}
                      />
                    }
                  >
                    <input
                      value={text(d.team)}
                      onChange={(e) => patch({ team: e.target.value })}
                    />
                  </Field>
                  <Field
                    label={
                      <T v={["Classification", "Classification", "التصنيف"]} />
                    }
                  >
                    <input
                      value={text(d.caseType)}
                      onChange={(e) => patch({ caseType: e.target.value })}
                    />
                  </Field>
                  <Field label={<T v={["Priority", "Priorité", "الأولوية"]} />}>
                    <select
                      value={text(d.priority)}
                      onChange={(e) => patch({ priority: e.target.value })}
                    >
                      {["low", "normal", "high", "urgent"].map((v) => (
                        <option key={v}>{v}</option>
                      ))}
                    </select>
                  </Field>
                  <Field label={<T v={["Status", "Statut", "الحالة"]} />}>
                    <select
                      value={text(d.status)}
                      onChange={(e) => patch({ status: e.target.value })}
                    >
                      {[
                        "open",
                        "assigned",
                        "waiting_customer",
                        "resolved",
                        "closed",
                      ].map((v) => (
                        <option key={v}>{v}</option>
                      ))}
                    </select>
                  </Field>
                  <WorkChoice
                    kind="sla_policy"
                    value={text(d.policyId)}
                    onChange={(value) => patch({ policyId: value })}
                    label={[
                      "Service target policy",
                      "Politique des objectifs de service",
                      "سياسة أهداف الخدمة",
                    ]}
                  />
                </div>
                <Field
                  label={
                    <T
                      v={[
                        "Duplicate case link",
                        "Lien vers un doublon",
                        "رابط ملف مكرر",
                      ]}
                    />
                  }
                >
                  <div className={s.actions}>
                    <span>
                      {d.mergeInto ? (
                        <T
                          v={[
                            "A case is selected; ownership will be verified on save.",
                            "Un dossier est choisi ; son propriétaire sera vérifié à l’enregistrement.",
                            "تم اختيار ملف؛ ستُتحقق الملكية عند الحفظ.",
                          ]}
                        />
                      ) : (
                        <T
                          v={[
                            "No linked duplicate",
                            "Aucun doublon lié",
                            "لا يوجد ملف مكرر مرتبط",
                          ]}
                        />
                      )}
                    </span>
                    <Button onClick={() => setDuplicatePicker(true)}>
                      <T
                        v={[
                          "Choose received case",
                          "Choisir un dossier reçu",
                          "اختيار ملف وارد",
                        ]}
                      />
                    </Button>
                    {d.mergeInto && (
                      <Button onClick={() => patch({ mergeInto: "" })}>
                        <T v={["Clear", "Effacer", "مسح"]} />
                      </Button>
                    )}
                  </div>
                </Field>
                <Field
                  label={
                    <T v={["Internal note", "Note interne", "ملاحظة داخلية"]} />
                  }
                >
                  <textarea
                    rows={4}
                    value={text(d.note)}
                    onChange={(e) => patch({ note: e.target.value })}
                  />
                </Field>
                <Field
                  label={
                    <T
                      v={[
                        "Resolution / next action",
                        "Résolution / prochaine action",
                        "الحل / الخطوة القادمة",
                      ]}
                    />
                  }
                >
                  <textarea
                    rows={4}
                    value={text(d.resolution)}
                    onChange={(e) => patch({ resolution: e.target.value })}
                  />
                </Field>
                <Button
                  disabled={
                    r?.data.source === "explicit_certificate_request" ||
                    busy ||
                    !boot.actor.rights.moderate
                  }
                  kind="primary"
                  icon="Save"
                  onClick={save}
                >
                  <T
                    v={[
                      "Save case operation",
                      "Enregistrer le suivi",
                      "حفظ متابعة الملف",
                    ]}
                  />
                </Button>
              </>
            )}
            {tab === "communication" && (
              <>
                <div className={s.actions}>
                  <Button
                    onClick={() => {
                      const template = object(
                        object(q.value.policy?.data.replyTemplates)[locale],
                      );
                      setSubject(text(template.subject));
                      setBody(text(template.body));
                    }}
                  >
                    <T
                      v={[
                        "Use policy response template",
                        "Utiliser le modèle de réponse",
                        "استخدام قالب رد السياسة",
                      ]}
                    />
                  </Button>
                </div>
                <Field label={<T v={["Subject", "Objet", "الموضوع"]} />}>
                  <input
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                  />
                </Field>
                <Field
                  label={
                    <T
                      v={[
                        "Customer message",
                        "Message au client",
                        "رسالة العميل",
                      ]}
                    />
                  }
                >
                  <textarea
                    rows={6}
                    value={body}
                    onChange={(e) => setBody(e.target.value)}
                  />
                </Field>
                <Button
                  disabled={
                    busy ||
                    !subject.trim() ||
                    !body.trim() ||
                    !boot.actor.rights.moderate
                  }
                  kind="primary"
                  onClick={message}
                  icon="Send"
                >
                  <T
                    v={[
                      "Queue customer message",
                      "Préparer l’envoi client",
                      "إعداد إرسال للعميل",
                    ]}
                  />
                </Button>
                <div className={s.timeline}>
                  {q.value.communications.map((w: any) => (
                    <div key={w.id}>
                      <strong>{w.title}</strong>
                      <Badge
                        tone={
                          w.status === "provider_accepted"
                            ? "green"
                            : w.status === "queued"
                              ? "blue"
                              : "orange"
                        }
                      >
                        {w.status}
                      </Badge>
                      <p className={s.previewText}>{w.data.body}</p>
                      <small>
                        <T
                          v={[
                            "Inbox delivery: not observed",
                            "Réception en boîte : non observée",
                            "الوصول إلى البريد: غير مرصود",
                          ]}
                        />
                      </small>
                      {w.status === "queued" && (
                        <Button
                          disabled={busy}
                          onClick={() => dispatch(w)}
                          icon="Send"
                        >
                          <T
                            v={[
                              "Dispatch through existing Email OS",
                              "Envoyer via Email OS existant",
                              "الإرسال عبر Email OS الحالي",
                            ]}
                          />
                        </Button>
                      )}
                      {["sending", "delivery_unknown"].includes(w.status) && (
                        <p className={s.notice}>
                          <T
                            v={[
                              "Inspect the existing mail authority before any further send. This message is not automatically retried.",
                              "Inspectez l’autorité mail existante avant tout nouvel envoi. Aucun renvoi automatique.",
                              "افحص مرجع البريد الحالي قبل أي إرسال آخر. لا تتم إعادة الإرسال تلقائياً.",
                            ]}
                          />
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </>
            )}
            {tab === "files" && (
              <PrivateCaseAttachments
                dossier={r}
                onUpdated={() => q.reload()}
              />
            )}
          </>
        )}
        {duplicatePicker && (
          <Picker
            type="record"
            kind="case"
            onSelect={(value) => patch({ mergeInto: value })}
            onClose={() => setDuplicatePicker(false)}
          />
        )}{" "}
        {error && (
          <p role="alert" className={s.notice}>
            {error}
          </p>
        )}
      </State>
    </Dialog>
  );
}
