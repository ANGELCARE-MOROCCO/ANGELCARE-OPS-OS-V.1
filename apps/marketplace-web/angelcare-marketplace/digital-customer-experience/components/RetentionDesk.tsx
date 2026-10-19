"use client";
import { ExpiredAttemptCleanup } from "./OperatorDesk";

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
  useQuery,
  mutate,
  useReceiptMutation,
} from "./ui";
import { PolicyDesk } from "./OperationalPolicies";
import { Picker } from "./Editor";
import { WorkStatus, WorkChoice } from "./ProfessionalTeam";
import s from "./workspace.module.css";
export function RetentionDesk() {
  const { boot, locale, notify } = useUI(),
    [page, setPage] = useState(1),
    [prepare, setPrepare] = useState(false),
    [selected, setSelected] = useState(""),
    [hold, setHold] = useState(false),
    q = useQuery<any>(
      { op: "pro_work", kind: "disposal", page },
      { rows: [], total: 0 },
    );
  return (
    <>
      <ExpiredAttemptCleanup />
      <PolicyDesk kind="retention_policy" />
      <Panel
        title={
          <T
            v={[
              "Reviewed disposal plans",
              "Plans de suppression revus",
              "خطط الحذف المراجعة",
            ]}
          />
        }
        subtitle={
          <T
            v={[
              "Inspect exact scope and blockers before execution. Only DCE-owned records and private files are eligible.",
              "Inspectez le périmètre exact et les blocages avant exécution. Seuls les données DCE et fichiers privés sont éligibles.",
              "افحص النطاق والعوائق قبل التنفيذ. تُقبل فقط بيانات DCE والملفات الخاصة المملوكة له.",
            ]}
          />
        }
        actions={
          <>
            <Button
              disabled={!boot.actor.rights.purge}
              icon="LockKeyhole"
              onClick={() => setHold(true)}
            >
              <T
                v={[
                  "Manage a retention hold",
                  "Gérer un gel de conservation",
                  "إدارة حجز الاحتفاظ",
                ]}
              />
            </Button>
            <Button
              disabled={!boot.actor.rights.purge}
              icon="ScanLine"
              onClick={() => setPrepare(true)}
            >
              <T
                v={[
                  "Preview a disposal plan",
                  "Préparer un plan de suppression",
                  "معاينة خطة حذف",
                ]}
              />
            </Button>
          </>
        }
      >
        <State {...q} retry={q.reload}>
          <div className={s.tableScroll}>
            <table className={s.table}>
              <thead>
                <tr>
                  <th>
                    <T
                      v={[
                        "Policy / plan",
                        "Politique / plan",
                        "السياسة / الخطة",
                      ]}
                    />
                  </th>
                  <th>
                    <T
                      v={[
                        "Records / blockers",
                        "Dossiers / blocages",
                        "السجلات / العوائق",
                      ]}
                    />
                  </th>
                  <th>
                    <T
                      v={[
                        "Eligible execution",
                        "Exécution possible",
                        "التنفيذ المؤهل",
                      ]}
                    />
                  </th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {q.value.rows.map((w: any) => (
                  <tr key={w.id}>
                    <td>
                      <strong>{w.title}</strong>
                      <WorkStatus value={w.status} />
                    </td>
                    <td>
                      {w.data.total} · {w.data.blocked}{" "}
                      <T v={["blocked", "bloqués", "محظور"]} />
                      <small>
                        {(number(w.data.bytes) / 1048576).toFixed(2)} MiB
                      </small>
                    </td>
                    <td>
                      {new Date(text(w.data.executeAfter)).toLocaleString(
                        locale,
                      )}
                    </td>
                    <td>
                      <Button
                        onClick={() => setSelected(w.id)}
                        icon="PanelRightOpen"
                      >
                        <T
                          v={["Inspect plan", "Examiner le plan", "فحص الخطة"]}
                        />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {!q.value.total && (
            <Empty
              icon="ShieldCheck"
              title={
                <T
                  v={[
                    "No disposal plan prepared",
                    "Aucun plan de suppression préparé",
                    "لم تُعد خطة حذف بعد",
                  ]}
                />
              }
              detail={
                <T
                  v={[
                    "A policy alone never deletes content.",
                    "Une politique seule ne supprime aucun contenu.",
                    "السياسة وحدها لا تحذف أي محتوى.",
                  ]}
                />
              }
            />
          )}
          <Pager page={page} size={30} total={q.value.total} onPage={setPage} />
        </State>
      </Panel>
      {prepare && (
        <PrepareDisposal
          onClose={() => setPrepare(false)}
          onPrepared={(id) => {
            setPrepare(false);
            setSelected(id);
            q.reload();
          }}
        />
      )}
      {selected && (
        <DisposalPlan
          id={selected}
          onClose={() => {
            setSelected("");
            q.reload();
          }}
        />
      )}
      {hold && <RetentionHold onClose={() => setHold(false)} />}
    </>
  );
}
function PrepareDisposal({
  onClose,
  onPrepared,
}: {
  onClose: () => void;
  onPrepared: (id: string) => void;
}) {
  const transact = useReceiptMutation();
  const [policy, setPolicy] = useState(""),
    [reason, setReason] = useState(""),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    q = useQuery<any>(
      { op: "pro_work", kind: "retention_policy", status: "active", page: 1 },
      { rows: [] },
    );
  async function submit() {
    setBusy(true);
    try {
      const r = await transact({
        action: "pro_prepare_disposal",
        reason,
        input: { policyId: policy },
      });
      onPrepared(r.id);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <Dialog
      title={
        <T
          v={[
            "Prepare exact disposal scope",
            "Préparer le périmètre exact de suppression",
            "إعداد نطاق الحذف الدقيق",
          ]}
        />
      }
      onClose={onClose}
      footer={
        <Button
          disabled={busy || !policy || reason.trim().length < 12}
          onClick={submit}
          kind="primary"
        >
          <T
            v={[
              "Prepare reviewable plan",
              "Préparer le plan à examiner",
              "إعداد خطة قابلة للمراجعة",
            ]}
          />
        </Button>
      }
    >
      <WorkChoice
        kind="retention_policy"
        value={policy}
        onChange={setPolicy}
        label={["Active policy", "Politique active", "السياسة الفعالة"]}
      />
      <Field
        label={
          <T
            v={[
              "Reason and operating context",
              "Motif et contexte opérationnel",
              "السبب والسياق التشغيلي",
            ]}
          />
        }
      >
        <textarea
          rows={5}
          value={reason}
          onChange={(e) => setReason(e.target.value)}
        />
      </Field>
      <p className={s.notice}>
        <T
          v={[
            "This creates a fixed inventory for review. It does not revoke access or delete files.",
            "Cette action crée un inventaire figé à examiner. Aucun accès révoqué ni fichier supprimé.",
            "ينشئ هذا مخزوناً ثابتاً للمراجعة ولا يلغي الوصول أو يحذف الملفات.",
          ]}
        />
      </p>
      {error && <p role="alert">{error}</p>}
    </Dialog>
  );
}
function DisposalPlan({ id, onClose }: { id: string; onClose: () => void }) {
  const transact = useReceiptMutation();
  const { locale, boot } = useUI(),
    [page, setPage] = useState(1),
    [confirm, setConfirm] = useState(""),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [receipt, setReceipt] = useState<any>(null),
    q = useQuery<any>(
      { op: "pro_disposal", id, page },
      { plan: null, rows: [], total: 0 },
    ),
    w = q.value.plan;
  async function act(action: string) {
    setBusy(true);
    setError("");
    try {
      setReceipt(await transact({ action, id }));
      q.reload();
      setConfirm("");
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
        <T
          v={[
            "Disposal scope and execution evidence",
            "Périmètre de suppression et preuves d’exécution",
            "نطاق الحذف وأدلة التنفيذ",
          ]}
        />
      }
      onClose={onClose}
    >
      <State {...q} retry={q.reload}>
        {w && (
          <>
            <div className={s.toolbar}>
              <strong>{w.title}</strong>
              <WorkStatus value={w.status} />
              <Badge>{w.data.total}</Badge>
            </div>
            <p>{text(w.data.reason)}</p>
            <p>
              <T
                v={[
                  "Execution available after:",
                  "Exécution possible après :",
                  "التنفيذ متاح بعد:",
                ]}
              />{" "}
              {new Date(text(w.data.executeAfter)).toLocaleString(locale)}
            </p>
            <div className={s.tableScroll}>
              <table className={s.table}>
                <thead>
                  <tr>
                    <th>
                      <T
                        v={[
                          "Owned data class",
                          "Classe de données DCE",
                          "فئة بيانات DCE",
                        ]}
                      />
                    </th>
                    <th>
                      <T v={["State", "État", "الحالة"]} />
                    </th>
                    <th>
                      <T
                        v={[
                          "Reason / required correction",
                          "Motif / correction nécessaire",
                          "السبب / التصحيح المطلوب",
                        ]}
                      />
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {q.value.rows.map((r: any) => (
                    <tr key={r.id}>
                      <td>
                        {r.target_kind}
                        <details>
                          <summary>
                            <T
                              v={[
                                "Receipt reference",
                                "Référence du reçu",
                                "مرجع الإيصال",
                              ]}
                            />
                          </summary>
                          <code>{r.target_id}</code>
                        </details>
                      </td>
                      <td>
                        <WorkStatus value={r.state} />
                      </td>
                      <td>{r.error || r.reason}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pager
              total={q.value.total}
              page={page}
              size={30}
              onPage={setPage}
            />
            {["scheduled", "failed"].includes(w.status) && (
              <>
                <Field
                  label={
                    <T
                      v={[
                        "Type DELETE to execute the next eligible batch",
                        "Saisissez DELETE pour exécuter le prochain lot éligible",
                        "اكتب DELETE لتنفيذ الدفعة المؤهلة التالية",
                      ]}
                    />
                  }
                >
                  <input
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                  />
                </Field>
                <div className={s.actions}>
                  <Button
                    disabled={
                      busy ||
                      !boot.actor.rights.purge ||
                      confirm !== "DELETE" ||
                      Date.parse(text(w.data.executeAfter)) > Date.now()
                    }
                    kind="danger"
                    icon="Trash"
                    onClick={() => act("pro_execute_disposal")}
                  >
                    <T
                      v={[
                        "Execute eligible batch",
                        "Exécuter le lot éligible",
                        "تنفيذ الدفعة المؤهلة",
                      ]}
                    />
                  </Button>
                  <Button
                    disabled={busy || !boot.actor.rights.purge}
                    onClick={() => act("pro_recheck_disposal")}
                  >
                    <T
                      v={[
                        "Recheck blocked items",
                        "Réexaminer les éléments bloqués",
                        "إعادة فحص العناصر المحظورة",
                      ]}
                    />
                  </Button>
                  <Button
                    disabled={busy || !boot.actor.rights.purge}
                    onClick={() => act("pro_cancel_disposal")}
                  >
                    <T
                      v={[
                        "Cancel remaining plan",
                        "Annuler le reste du plan",
                        "إلغاء بقية الخطة",
                      ]}
                    />
                  </Button>
                </div>
              </>
            )}
            {receipt && (
              <div role="status" className={s.notice}>
                <T
                  v={[
                    "Execution receipt recorded.",
                    "Reçu d’exécution enregistré.",
                    "تم تسجيل إيصال التنفيذ.",
                  ]}
                />{" "}
                {receipt.disposed || 0} · {receipt.filesDeleted || 0} ·{" "}
                {receipt.blocked || 0} · {receipt.filesFailed || 0}
              </div>
            )}
            <p className={s.subtitle}>
              <T
                v={[
                  "Access is revoked before owned file deletion. Holds and later edits are rechecked at execution. Destroyed data has no undo action.",
                  "L’accès est révoqué avant suppression des fichiers propres. Gels et éditions sont revérifiés. Les données détruites ne sont pas restaurables par annulation.",
                  "يُلغى الوصول قبل حذف الملفات المملوكة وتُعاد مراجعة الحجز والتعديلات عند التنفيذ. لا يوجد تراجع للبيانات المتلفة.",
                ]}
              />
            </p>
          </>
        )}
        {error && <p role="alert">{error}</p>}
      </State>
    </Dialog>
  );
}
function RetentionHold({ onClose }: { onClose: () => void }) {
  const transact = useReceiptMutation();
  const [id, setId] = useState(""),
    [kind, setKind] = useState("case"),
    [picker, setPicker] = useState(false),
    [reason, setReason] = useState(""),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    q = useQuery<any>({ op: "record", id }, {});
  async function act(active: boolean) {
    setBusy(true);
    try {
      await transact({
        action: "pro_hold",
        id,
        revision: q.value.revision,
        reason,
        input: { active },
      });
      q.reload();
      setReason("");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <Dialog
      title={
        <T v={["Retention hold", "Gel de conservation", "حجز الاحتفاظ"]} />
      }
      onClose={onClose}
    >
      <div className={s.toolbar}>
        <select
          aria-label="Hold dossier class"
          value={kind}
          onChange={(e) => setKind(e.target.value)}
        >
          {["case", "run", "contribution"].map((v) => (
            <option key={v}>{v}</option>
          ))}
        </select>
        <Button onClick={() => setPicker(true)} icon="Search">
          <T v={["Choose dossier", "Choisir le dossier", "اختيار الملف"]} />
        </Button>
      </div>
      {id && (
        <>
          <strong>{q.value.title}</strong>
          <Badge>
            {object(q.value.data?.retentionHold).active
              ? "Held"
              : "No active hold"}
          </Badge>
          <Field
            label={
              <T
                v={[
                  "Hold / release reason",
                  "Motif du gel / de la levée",
                  "سبب الحجز / رفعه",
                ]}
              />
            }
          >
            <textarea
              rows={4}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
          </Field>
          <div className={s.actions}>
            <Button
              disabled={busy || reason.trim().length < 8}
              onClick={() => act(true)}
            >
              <T v={["Apply hold", "Appliquer le gel", "تطبيق الحجز"]} />
            </Button>
            <Button
              disabled={busy || reason.trim().length < 8}
              onClick={() => act(false)}
            >
              <T v={["Release hold", "Lever le gel", "رفع الحجز"]} />
            </Button>
          </div>
        </>
      )}
      {error && <p role="alert">{error}</p>}
      {picker && (
        <Picker
          type="record"
          kind={kind}
          onSelect={setId}
          onClose={() => setPicker(false)}
        />
      )}
    </Dialog>
  );
}
