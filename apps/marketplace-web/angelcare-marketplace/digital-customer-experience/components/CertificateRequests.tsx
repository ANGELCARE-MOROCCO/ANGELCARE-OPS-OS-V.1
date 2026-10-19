"use client";
import { CertificateCorrespondence } from "./CertificateCorrespondence";
import { CertificateRetention } from "./OperatorDesk";

import { useEffect, useState } from "react";
import {
  API,
  object,
  text,
  tr,
  type Data,
  type Tri,
  type DceRecord,
} from "../types";
import { worldTimeZone, zonedDateInput } from "../management";
import { Picker } from "./Editor";
import { PrivateCaseAttachments } from "./PrivateCaseAttachments";
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
  useQuery,
  useReceiptMutation,
} from "./ui";
import s from "./workspace.module.css";
const states: Record<string, Tri> = {
  new: ["New", "Nouvelle", "جديدة"],
  review: ["Under review", "En revue", "قيد المراجعة"],
  awaiting_information: [
    "Awaiting information",
    "Informations attendues",
    "بانتظار المعلومات",
  ],
  approved: ["Approved", "Approuvée", "معتمدة"],
  issued: ["Issued", "Émise", "صادرة"],
  rejected: ["Rejected", "Refusée", "مرفوضة"],
  cancelled: ["Cancelled", "Annulée", "ملغاة"],
  closed: ["Closed", "Clôturée", "مغلقة"],
};
const actions: Record<string, Tri> = {
  review: ["Review", "Examiner", "مراجعة"],
  awaiting_information: [
    "Request information",
    "Demander des informations",
    "طلب معلومات",
  ],
  approve: ["Approve", "Approuver", "اعتماد"],
  reject: ["Reject with reason", "Refuser avec motif", "رفض مع السبب"],
  cancel: ["Cancel", "Annuler", "إلغاء"],
  close: ["Close", "Clôturer", "إغلاق"],
  reopen: ["Reopen", "Rouvrir", "إعادة فتح"],
};
const transitions: Record<string, string[]> = {
  new: ["review", "awaiting_information", "approve", "reject", "cancel"],
  review: ["awaiting_information", "approve", "reject", "cancel"],
  awaiting_information: ["review", "approve", "reject", "cancel"],
  approved: ["reject", "cancel"],
  issued: ["close"],
  rejected: ["close", "reopen"],
  cancelled: ["close", "reopen"],
  closed: ["reopen"],
};
export function CertificateRequests() {
  const { locale } = useUI(),
    [search, setSearch] = useState(""),
    [state, setState] = useState(""),
    [lang, setLang] = useState(""),
    [assigned, setAssigned] = useState(""),
    [overdue, setOverdue] = useState(false),
    [page, setPage] = useState(1),
    [selected, setSelected] = useState("");
  const q = useQuery<any>(
    {
      op: "master_certificates",
      q: search,
      status: state,
      locale: lang,
      assigned,
      overdue: overdue ? "true" : "",
      page,
    },
    { rows: [], total: 0 },
  );
  useEffect(() => {
    const id = new URLSearchParams(location.search).get("certificate");
    if (id) setSelected(id);
  }, []);
  function open(id: string) {
    setSelected(id);
    const u = new URL(location.href);
    if (id) u.searchParams.set("certificate", id);
    else u.searchParams.delete("certificate");
    history.replaceState(null, "", u);
  }
  return (
    <>
      <div className={s.notice}>
        <T
          v={[
            "Only explicit course-certificate requests enter this workspace. Downloads, scores and ordinary activities never create a case here.",
            "Seules les demandes explicites de certificat arrivent ici. Téléchargements, scores et activités ordinaires ne créent aucun dossier.",
            "تصل طلبات شهادات الدورات الصريحة فقط إلى هذه المساحة. لا تنشئ التنزيلات والنتائج والأنشطة العادية ملفات هنا.",
          ]}
        />
      </div>
      <Panel
        title={
          <T
            v={[
              "Certificate request registry",
              "Registre des demandes de certificat",
              "سجل طلبات الشهادات",
            ]}
          />
        }
        subtitle={
          <T
            v={[
              "Course evidence, contact, decisions and private fulfilment in one dossier.",
              "Preuves, contact, décisions et traitement privé dans un dossier.",
              "الأدلة والتواصل والقرارات والمعالجة الخاصة في ملف واحد.",
            ]}
          />
        }
        actions={
          <Button icon="RefreshCw" onClick={q.reload}>
            <T v={["Refresh", "Actualiser", "تحديث"]} />
          </Button>
        }
      >
        <div className={s.toolbar}>
          <input
            aria-label="Search certificate requests"
            placeholder={tr(
              [
                "Reference or course…",
                "Référence ou cours…",
                "المرجع أو الدورة…",
              ],
              locale,
            )}
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />
          <select
            aria-label="Certificate status"
            value={state}
            onChange={(e) => {
              setState(e.target.value);
              setPage(1);
            }}
          >
            <option value="">
              {tr(["All states", "Tous les états", "كل الحالات"], locale)}
            </option>
            {Object.entries(states).map(([k, v]) => (
              <option value={k} key={k}>
                {tr(v, locale)}
              </option>
            ))}
          </select>
          <select
            aria-label="Certificate language"
            value={lang}
            onChange={(e) => {
              setLang(e.target.value);
              setPage(1);
            }}
          >
            <option value="">AR · FR · EN</option>
            {["ar", "fr", "en"].map((l) => (
              <option key={l}>{l}</option>
            ))}
          </select>
          <select
            aria-label="Assignment"
            value={assigned}
            onChange={(e) => {
              setAssigned(e.target.value);
              setPage(1);
            }}
          >
            {[
              ["", "All / Tous / الجميع"],
              ["mine", "Mine / À moi / المسندة إليّ"],
              ["unassigned", "Unassigned / Sans responsable / غير مسندة"],
            ].map(([k, v]) => (
              <option value={k} key={k}>
                {v}
              </option>
            ))}
          </select>
          <label>
            <input
              type="checkbox"
              checked={overdue}
              onChange={(e) => {
                setOverdue(e.target.checked);
                setPage(1);
              }}
            />
            <T v={["Overdue", "En retard", "متأخرة"]} />
          </label>
        </div>
        <State {...q} retry={q.reload}>
          {q.value.rows.length ? (
            <div className={s.tableScroll}>
              <table className={s.table}>
                <thead>
                  <tr>
                    <th>
                      <T
                        v={[
                          "Reference / course",
                          "Référence / cours",
                          "المرجع / الدورة",
                        ]}
                      />
                    </th>
                    <th>
                      <T v={["Language", "Langue", "اللغة"]} />
                    </th>
                    <th>
                      <T v={["State", "État", "الحالة"]} />
                    </th>
                    <th>
                      <T v={["Evidence", "Preuve", "الدليل"]} />
                    </th>
                    <th>
                      <T v={["Follow-up", "Suivi", "المتابعة"]} />
                    </th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {q.value.rows.map((r: any) => (
                    <tr key={r.id}>
                      <td>
                        <strong>{r.reference}</strong>
                        <small>{r.course_title}</small>
                      </td>
                      <td>{r.locale.toUpperCase()}</td>
                      <td>
                        <Badge
                          tone={
                            r.status === "issued"
                              ? "green"
                              : r.status === "new"
                                ? "orange"
                                : "blue"
                          }
                        >
                          {tr(states[r.status] || states.new, locale)}
                        </Badge>
                      </td>
                      <td>
                        {r.evidence.level}
                        <small>
                          {r.evidence.score == null
                            ? "—"
                            : r.evidence.score + "%"}
                        </small>
                      </td>
                      <td>
                        {r.due_at
                          ? new Date(r.due_at).toLocaleString(locale)
                          : "—"}
                      </td>
                      <td>
                        <Button icon="ArrowUpRight" onClick={() => open(r.id)}>
                          <T v={["Open", "Ouvrir", "فتح"]} />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <Empty
              icon="GraduationCap"
              title={
                <T
                  v={[
                    "No matching certificate requests",
                    "Aucune demande correspondante",
                    "لا توجد طلبات مطابقة",
                  ]}
                />
              }
            />
          )}
          <Pager total={q.value.total} page={page} size={30} onPage={setPage} />
        </State>
      </Panel>
      {selected && (
        <CertificateDossier
          key={selected}
          id={selected}
          onClose={() => open("")}
          onUpdated={q.reload}
        />
      )}
    </>
  );
}
function CertificateDossier({
  id,
  onClose,
  onUpdated,
}: {
  id: string;
  onClose: () => void;
  onUpdated: () => void;
}) {
  const { locale, boot } = useUI(),
    [tab, setTab] = useState("evidence"),
    [body, setBody] = useState(""),
    [restored, setRestored] = useState(false),
    [due, setDue] = useState(""),
    [documentId, setDocument] = useState(""),
    [staff, setStaff] = useState(false),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [historyPage, setHistoryPage] = useState(1),
    mutate = useReceiptMutation();
  const q = useQuery<any>(
      { op: "master_certificate", id, historyPage },
      { request: null, history: [], historyTotal: 0 },
    ),
    r = q.value.request,
    caseId = text(object(r?.data).privateCaseId),
    dossier = useQuery<DceRecord | null>(
      caseId
        ? { op: "record", id: caseId }
        : { op: "reference", type: "record" },
      null,
    ),
    files = useQuery<any>(
      caseId
        ? { op: "attachments", caseId }
        : { op: "reference", type: "media" },
      [],
    );
  useEffect(() => {
    try {
      setBody(
        sessionStorage.getItem(
          "dce-certificate-note:r6:" +
            boot.actor.id +
            ":" +
            String(boot.health.scopeKey || "global") +
            ":" +
            id,
        ) || "",
      );
    } catch {}
    setRestored(true);
  }, [id]);
  useEffect(() => {
    if (!restored) return;
    try {
      if (body)
        sessionStorage.setItem(
          "dce-certificate-note:r6:" +
            boot.actor.id +
            ":" +
            String(boot.health.scopeKey || "global") +
            ":" +
            id,
          body,
        );
      else
        sessionStorage.removeItem(
          "dce-certificate-note:r6:" +
            boot.actor.id +
            ":" +
            String(boot.health.scopeKey || "global") +
            ":" +
            id,
        );
    } catch {}
  }, [body, id, restored]);
  async function act(operation: string, data: Data = {}) {
    if (!r) return;
    setBusy(true);
    setError("");
    try {
      await mutate({
        action: "master_certificate_action",
        id: r.id,
        revision: r.revision,
        operation,
        data: { body, ...data },
      });
      if (
        [
          "note",
          "contact",
          "follow_up",
          "reject",
          "cancel",
          "reopen",
          "awaiting_information",
          "replace",
        ].includes(operation)
      )
        setBody("");
      q.reload();
      dossier.reload();
      files.reload();
      onUpdated();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  function close() {
    if (
      !body ||
      confirm(
        tr(
          [
            "Close while retaining your unsent note in this staff session?",
            "Fermer en conservant la note non envoyée dans cette session ?",
            "إغلاق مع الاحتفاظ بالملاحظة غير المرسلة في هذه الجلسة؟",
          ],
          locale,
        ),
      )
    )
      onClose();
  }
  return (
    <Dialog
      drawer
      wide
      title={
        r?.reference ||
        tr(
          ["Certificate request", "Demande de certificat", "طلب شهادة"],
          locale,
        )
      }
      onClose={close}
    >
      <State {...q} retry={q.reload}>
        {r && (
          <>
            <div className={s.tabs} role="tablist">
              {[
                [
                  "evidence",
                  ["Course & evidence", "Cours et preuves", "الدورة والأدلة"],
                ],
                [
                  "contact",
                  [
                    "Contact & assignment",
                    "Contact et attribution",
                    "التواصل والإسناد",
                  ],
                ],
                [
                  "document",
                  ["Private certificate", "Certificat privé", "الشهادة الخاصة"],
                ],
                ["history", ["History", "Historique", "السجل"]],
              ].map(([key, label]) => (
                <button
                  key={key as string}
                  className={s.tab}
                  role="tab"
                  aria-selected={tab === key}
                  onClick={() => setTab(key as string)}
                >
                  {tr(label as any, locale)}
                </button>
              ))}
            </div>
            {tab === "evidence" && (
              <CertificateRetention id={id} revision={r.revision} />
            )}
            {tab === "evidence" && (
              <Panel title={r.course_title}>
                <Badge tone="blue">{tr(states[r.status], locale)}</Badge>
                <h3>{r.learner_name}</h3>
                <p>
                  {r.locale.toUpperCase()} · {r.evidence.level} ·{" "}
                  {r.evidence.score == null ? "—" : r.evidence.score + "%"}
                </p>
                <p>
                  <T
                    v={[
                      "Completion acknowledged by the visitor is kept distinct from a server-graded assessment.",
                      "La fin déclarée par le visiteur reste distincte d’une évaluation côté serveur.",
                      "يبقى الإكمال الذي يقر به الزائر منفصلاً عن تقييم الخادم.",
                    ]}
                  />
                </p>
                <p>{r.evidence.completionEvidence}</p>
                <details className={s.advanced}>
                  <summary>
                    <T
                      v={[
                        "Immutable source references",
                        "Références sources immuables",
                        "مراجع المصادر الثابتة",
                      ]}
                    />
                  </summary>
                  <p>{r.release_id}</p>
                  <p>{text(r.evidence.assessmentReleaseId)}</p>
                  <p>{text(r.evidence.assessmentHash)}</p>
                </details>
              </Panel>
            )}
            {tab === "contact" && (
              <Panel
                title={
                  <T
                    v={[
                      "Protected contact & ownership",
                      "Contact et responsabilité protégés",
                      "التواصل والمسؤولية المحميان",
                    ]}
                  />
                }
              >
                <CertificateCorrespondence request={r} onChange={q.reload} />
                <h3>{r.requester_name}</h3>
                <div className={s.actions}>
                  <a className={s.button} href={"mailto:" + r.email}>
                    {r.email}
                  </a>
                  {r.phone && (
                    <a
                      className={s.button}
                      href={"tel:" + r.phone.replace(/[^+0-9]/g, "")}
                    >
                      {r.phone}
                    </a>
                  )}
                </div>
                <p>
                  <T
                    v={[
                      "Opening an email link proves neither sending nor delivery. Log the actual contact below.",
                      "Ouvrir le lien email ne prouve ni envoi ni livraison. Consignez le contact effectué.",
                      "فتح رابط البريد لا يثبت الإرسال أو التسليم. سجّل التواصل الفعلي أدناه.",
                    ]}
                  />
                </p>
                <div className={s.actions}>
                  <Button
                    disabled={busy}
                    icon="Users"
                    onClick={() => setStaff(true)}
                  >
                    <T
                      v={[
                        "Assign native operator",
                        "Attribuer un opérateur natif",
                        "تعيين موظف أصلي",
                      ]}
                    />
                  </Button>
                  <Button
                    disabled={busy}
                    onClick={() =>
                      void act("assign", { assignedTo: boot.actor.id })
                    }
                  >
                    <T v={["Assign to me", "M’attribuer", "إسناد إليّ"]} />
                  </Button>
                  <Button
                    disabled={busy || !r.assigned_to}
                    onClick={() => void act("assign", { assignedTo: "" })}
                  >
                    <T v={["Unassign", "Désassigner", "إلغاء التعيين"]} />
                  </Button>
                </div>
                <Field
                  label={
                    tr(
                      [
                        "Next follow-up · ",
                        "Prochain suivi · ",
                        "المتابعة القادمة · ",
                      ],
                      locale,
                    ) + worldTimeZone(boot.settings)
                  }
                >
                  <input
                    type="datetime-local"
                    value={due}
                    onChange={(e) => setDue(e.target.value)}
                  />
                </Field>
                <Button
                  disabled={busy || !due || body.trim().length < 3}
                  onClick={() => {
                    try {
                      void act("follow_up", {
                        dueAt: zonedDateInput(
                          due,
                          worldTimeZone(boot.settings),
                        ),
                      });
                    } catch (e) {
                      setError((e as Error).message);
                    }
                  }}
                >
                  <T
                    v={[
                      "Record follow-up",
                      "Enregistrer le suivi",
                      "تسجيل المتابعة",
                    ]}
                  />
                </Button>
                <Button
                  disabled={busy || body.trim().length < 3}
                  onClick={() => void act("contact")}
                >
                  <T
                    v={[
                      "Log actual contact",
                      "Consigner le contact effectué",
                      "تسجيل التواصل الفعلي",
                    ]}
                  />
                </Button>
              </Panel>
            )}
            {tab === "document" && (
              <Panel
                title={
                  <T
                    v={[
                      "Prepare, protect and issue",
                      "Préparer, protéger et émettre",
                      "إعداد وحماية وإصدار",
                    ]}
                  />
                }
              >
                <p>
                  <T
                    v={[
                      "Upload the prepared certificate PDF through the existing private S: authority, then record issuance.",
                      "Téléversez le certificat PDF préparé via l’autorité privée S:, puis enregistrez l’émission.",
                      "ارفع شهادة PDF المعدة عبر جهة S: الخاصة ثم سجل الإصدار.",
                    ]}
                  />
                </p>
                {!caseId ? (
                  <Button
                    disabled={busy}
                    icon="LockKeyhole"
                    onClick={() => void act("prepare_document_case")}
                  >
                    <T
                      v={[
                        "Open protected preparation",
                        "Ouvrir la préparation protégée",
                        "فتح الإعداد المحمي",
                      ]}
                    />
                  </Button>
                ) : (
                  <State {...dossier} retry={dossier.reload}>
                    {dossier.value && (
                      <PrivateCaseAttachments
                        dossier={dossier.value}
                        onUpdated={() => {
                          dossier.reload();
                          files.reload();
                        }}
                      />
                    )}
                  </State>
                )}
                {caseId && (
                  <>
                    <Field
                      label={
                        <T
                          v={[
                            "Verified private certificate PDF",
                            "PDF privé vérifié du certificat",
                            "ملف PDF خاص متحقق للشهادة",
                          ]}
                        />
                      }
                    >
                      <select
                        value={documentId}
                        onChange={(e) => setDocument(e.target.value)}
                      >
                        <option value="">—</option>
                        {(Array.isArray(files.value) ? files.value : [])
                          .filter(
                            (f: any) =>
                              f.mime_type === "application/pdf" &&
                              f.state === "linked",
                          )
                          .map((f: any) => (
                            <option key={f.id} value={f.id}>
                              {f.file_name}
                            </option>
                          ))}
                      </select>
                    </Field>
                    {files.error && <p role="alert">{files.error}</p>}
                    <Button
                      kind="primary"
                      icon="BadgeCheck"
                      disabled={
                        busy ||
                        !boot.actor.rights.publish ||
                        !documentId ||
                        !["approved", "issued", "closed"].includes(r.status) ||
                        (r.status !== "approved" && body.trim().length < 12)
                      }
                      onClick={() => {
                        if (
                          confirm(
                            tr(
                              [
                                "Record issuance of this verified private document?",
                                "Enregistrer l’émission de ce document privé vérifié ?",
                                "تسجيل إصدار هذه الوثيقة الخاصة المتحقق منها؟",
                              ],
                              locale,
                            ),
                          )
                        )
                          void act(
                            r.status === "approved" ? "issue" : "replace",
                            { documentId },
                          );
                      }}
                    >
                      <T
                        v={
                          r.status === "approved"
                            ? [
                                "Issue approved certificate",
                                "Émettre le certificat approuvé",
                                "إصدار الشهادة المعتمدة",
                              ]
                            : [
                                "Replace with reason",
                                "Remplacer avec motif",
                                "استبدال مع السبب",
                              ]
                        }
                      />
                    </Button>
                  </>
                )}
                {object(r.data).issuedDocument && (
                  <a
                    className={s.button}
                    href={
                      API +
                      "/attachments/" +
                      text(object(object(r.data).issuedDocument).documentId)
                    }
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <T
                      v={[
                        "Download issued PDF privately",
                        "Télécharger le PDF émis en privé",
                        "تنزيل PDF المصدر بشكل خاص",
                      ]}
                    />
                  </a>
                )}
              </Panel>
            )}
            {tab === "history" && (
              <>
                <div className={s.timeline}>
                  {q.value.history.map((e: any) => (
                    <div key={e.id}>
                      <strong>{e.action}</strong>
                      <p>{text(e.data.body)}</p>
                      <small>
                        {new Date(e.created_at).toLocaleString(locale)}
                      </small>
                    </div>
                  ))}
                </div>
                <Pager
                  page={historyPage}
                  total={q.value.historyTotal}
                  size={30}
                  onPage={setHistoryPage}
                />
              </>
            )}
            <Field
              label={
                <T
                  v={[
                    "Private note, decision reason or actual contact",
                    "Note privée, motif de décision ou contact effectué",
                    "ملاحظة خاصة أو سبب القرار أو التواصل الفعلي",
                  ]}
                />
              }
            >
              <textarea
                value={body}
                maxLength={4000}
                onChange={(e) => setBody(e.target.value)}
              />
            </Field>
            <small>
              <T
                v={[
                  "Unsent text remains in this staff session on this device.",
                  "Le texte non envoyé reste dans cette session opérateur.",
                  "يبقى النص غير المرسل في جلسة الموظف على هذا الجهاز.",
                ]}
              />
            </small>
            {error && (
              <div role="alert" className={`${s.notice} ${s.alertError}`}>
                {error}
              </div>
            )}
            <div className={s.actions}>
              <Button
                icon="Save"
                disabled={busy || body.trim().length < 3}
                onClick={() => void act("note")}
              >
                <T
                  v={[
                    "Save private note",
                    "Enregistrer la note privée",
                    "حفظ الملاحظة الخاصة",
                  ]}
                />
              </Button>
              {(transitions[r.status] || []).map((a) => (
                <Button
                  key={a}
                  disabled={
                    busy ||
                    (a === "approve" && !boot.actor.rights.publish) ||
                    ([
                      "reject",
                      "cancel",
                      "reopen",
                      "awaiting_information",
                    ].includes(a) &&
                      body.trim().length < 3)
                  }
                  onClick={() => void act(a)}
                >
                  {tr(actions[a], locale)}
                </Button>
              ))}
            </div>
          </>
        )}
      </State>
      {staff && (
        <Picker
          type="staff"
          onSelect={(assignedTo) => void act("assign", { assignedTo })}
          onClose={() => setStaff(false)}
        />
      )}
    </Dialog>
  );
}
