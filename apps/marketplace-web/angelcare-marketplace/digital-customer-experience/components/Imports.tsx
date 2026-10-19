"use client";
import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { FAMILIES } from "../registry";
import { sheetCollections } from "../operator-sheets";
import { TASKS, type ImportTask } from "../imports";
import { tr } from "../types";
import {
  Badge,
  Button,
  Empty,
  Field,
  Panel,
  Pager,
  State,
  T,
  useUI,
  useQuery,
  useReceiptMutation,
  useWorkingState,
  query,
  download,
} from "./ui";
import { Editor } from "./Editor";
import { BatchProgress } from "./OperatorDesk";
import s from "./workspace.module.css";
export function Imports() {
  const { locale, boot, notify, refresh } = useUI(),
    params = useSearchParams(),
    context = params?.get("context") || "",
    [family, setFamily] = useWorkingState(
      "imports." + context + ".family",
      params?.get("family") || "documents",
    ),
    [task, setTask] = useWorkingState<ImportTask>(
      "imports." + context + ".task",
      "create",
    ),
    [collection, setCollection] = useState("root"),
    [source, setSource] = useState(""),
    [name, setName] = useState(""),
    [batch, setBatch] = useWorkingState("imports." + context + ".batch", ""),
    [jobId, setJobId] = useWorkingState(
      "imports." + context + ".job",
      params?.get("job") || "",
    ),
    [page, setPage] = useState(1),
    [batchPage, setBatchPage] = useState(1),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [correction, setCorrection] = useState<any>(null),
    mutate = useReceiptMutation(),
    contextRecord = useQuery<any>(
      context
        ? { op: "record", id: context }
        : { op: "reference", type: "record" },
      null,
    ),
    batches = useQuery<any>(
      { op: "operator_batches", page: batchPage },
      { rows: [], total: 0 },
    ),
    job = useQuery<any>(
      jobId ? { op: "job", id: jobId, page } : { op: "jobs", page: 1 },
      { rows: [], total: 0, job: {} },
    );
  const [exportCursor, setExportCursor] = useState(""),
    [exportBoundary, setExportBoundary] = useState(""),
    [exportPart, setExportPart] = useState(1);
  const scopeFamily = contextRecord.value?.family || family,
    parts = sheetCollections(scopeFamily, task),
    part = parts.includes(collection) ? collection : parts[0];
  useEffect(() => {
    setExportCursor("");
    setExportBoundary("");
    setExportPart(1);
  }, [scopeFamily, task, part, context]);
  async function pack() {
    try {
      const p = await query<any>({
        op: "template",
        family: scopeFamily,
        task,
        collection: part,
      });
      download(p.fileName, p.csv, "text/csv;charset=utf-8");
      download(
        p.fileName.replace(".csv", "-EXAMPLE.csv"),
        p.exampleCsv,
        "text/csv;charset=utf-8",
      );
      download(
        p.fileName.replace(".csv", "-GUIDE.md"),
        p.guideMarkdown,
        "text/markdown;charset=utf-8",
      );
    } catch (e) {
      setError((e as Error).message);
    }
  }
  async function prepare() {
    setBusy(true);
    setError("");
    try {
      const b = await mutate({
        action: "operator_batch_create",
        family: scopeFamily,
        task,
        source,
        sourceName: name,
      });
      setBatch(b.batch.id);
      setJobId("");
      batches.reload();
      notify(
        tr(
          [
            "Source saved. Continue preparation below; nothing has been published.",
            "Source enregistrée. Continuez la préparation ci-dessous ; rien n’est publié.",
            "تم حفظ المصدر. تابع التحضير أدناه؛ لم يُنشر شيء.",
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
  async function line(id: string, action: string) {
    setBusy(true);
    try {
      await mutate({ action, id });
      job.reload();
      await refresh();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      {context && (
        <Panel title={contextRecord.value?.title || "Dossier context"}>
          <p>
            <T
              v={[
                "Family is scoped to this dossier. The CSV key still identifies the exact target; no hidden context is written to imported records. Leave this context to prepare a different family.",
                "La famille suit ce dossier. La clé CSV désigne toujours la cible exacte ; aucun contexte caché n’est écrit. Quittez le contexte pour changer de famille.",
                "تتبع العائلة هذا الملف. يحدد مفتاح CSV الهدف الدقيق ولا يكتب سياق خفي. غادر السياق لتغيير العائلة.",
              ]}
            />
          </p>
        </Panel>
      )}
      <div className={s.twoColumns}>
        <Panel
          title={
            <T
              v={[
                "1 · Choose the exact editorial task",
                "1 · Choisir la tâche éditoriale précise",
                "1 · اختيار المهمة التحريرية الدقيقة",
              ]}
            />
          }
        >
          <div className={s.formGrid}>
            <Field label={<T v={["Family", "Famille", "العائلة"]} />}>
              <select
                disabled={!!context}
                value={scopeFamily}
                onChange={(e) => setFamily(e.target.value)}
              >
                {FAMILIES.map((f) => (
                  <option key={f.key} value={f.key}>
                    {tr(f.name, locale)}
                  </option>
                ))}
              </select>
            </Field>
            <Field label={<T v={["Task", "Tâche", "المهمة"]} />}>
              <select
                value={task}
                onChange={(e) => setTask(e.target.value as ImportTask)}
              >
                {TASKS.map((t) => (
                  <option key={t}>{t}</option>
                ))}
              </select>
            </Field>
            <Field
              label={
                <T
                  v={[
                    "Worksheet / collection",
                    "Feuille / collection",
                    "ورقة / مجموعة",
                  ]}
                />
              }
            >
              <select
                value={part}
                onChange={(e) => setCollection(e.target.value)}
              >
                {parts.map((c) => (
                  <option key={c} value={c}>
                    {c === "root"
                      ? tr(
                          [
                            "Root dossier / shared settings",
                            "Dossier racine / réglages partagés",
                            "الملف الرئيسي / الإعدادات المشتركة",
                          ],
                          locale,
                        )
                      : tr(
                          FAMILIES.find(
                            (f) => f.key === scopeFamily,
                          )!.collections.find((part) => part.key === c)!.label,
                          locale,
                        )}
                  </option>
                ))}
              </select>
            </Field>
          </div>
          <p>
            <T
              v={[
                "Start with the root creation sheet. Add one lesson/card/question per content row, then use translation or media sheets for stable units. No nested JSON is required.",
                "Commencez par la création racine. Ajoutez une leçon/carte/question par ligne de contenu, puis les feuilles de traduction ou média des unités stables. Aucun JSON imbriqué requis.",
                "ابدأ بورقة إنشاء المورد. أضف درساً أو بطاقة أو سؤالاً بكل صف، ثم استخدم أوراق الترجمة والوسائط للوحدات الثابتة. لا حاجة لكتابة JSON متداخل.",
              ]}
            />
          </p>
          <div className={s.actions}>
            <Button icon="Download" onClick={pack}>
              <T
                v={[
                  "CSV + example + readable guide",
                  "CSV + exemple + guide lisible",
                  "CSV + مثال + دليل واضح",
                ]}
              />
            </Button>
            <Button
              disabled={!boot.actor.rights.export}
              onClick={async () => {
                try {
                  const r = await query<any>({
                    op: "export",
                    afterId: exportCursor,
                    beforeDate: exportBoundary,
                    recordId: context || undefined,
                    family: scopeFamily,
                    task,
                    collection: part,
                  });
                  download(
                    `dce-${scopeFamily}-${task}-${part}-part-${exportPart}.csv`,
                    r.csv,
                    "text/csv;charset=utf-8",
                  );
                  setExportCursor(r.nextCursor || "");
                  setExportBoundary(r.beforeDate || "");
                  setExportPart((v) => v + 1);
                  notify(
                    String(r.resources) +
                      (r.complete
                        ? " resources exported; this worksheet is complete."
                        : " resources exported. Click again for the next part."),
                  );
                } catch (e) {
                  setError((e as Error).message);
                }
              }}
            >
              <T
                v={[
                  exportCursor
                    ? "Download next export part"
                    : "Export this worksheet",
                  exportCursor
                    ? "Télécharger la partie suivante"
                    : "Exporter cette feuille",
                  exportCursor ? "تنزيل الجزء التالي" : "تصدير هذه الورقة",
                ]}
              />
            </Button>
          </div>
        </Panel>
        <Panel
          title={
            <T
              v={[
                "2 · Save a resumable preparation",
                "2 · Enregistrer une préparation reprenable",
                "2 · حفظ تحضير قابل للاستئناف",
              ]}
            />
          }
        >
          <input
            type="file"
            aria-label="Import CSV"
            accept=".csv,text/csv"
            disabled={busy}
            onChange={async (e) => {
              const f = e.target.files?.[0];
              if (f) {
                if (f.size > 4 * 1024 * 1024) {
                  setError("Use a CSV up to 4 MiB / 5,000 rows.");
                  return;
                }
                setName(f.name);
                setSource(await f.text());
              }
            }}
          />
          <p>
            {name} · {source.length.toLocaleString()}{" "}
            <T v={["characters", "caractères", "حرف"]} />
          </p>
          <Button
            kind="primary"
            disabled={!source || busy || !boot.actor.rights.manage}
            onClick={prepare}
          >
            <T
              v={[
                "Save preparation source",
                "Enregistrer la source de préparation",
                "حفظ مصدر التحضير",
              ]}
            />
          </Button>
          <p className={s.notice}>
            <T
              v={[
                "Blank updates preserve data. __CLEAR__ explicitly clears an optional field. Exact revisions protect later edits. Sources and receipts stay in DCE; native sellable/import engines are unchanged.",
                "Les cellules vides conservent les données. __CLEAR__ efface explicitement un champ facultatif. Les révisions protègent les modifications ultérieures. Les imports natifs des offres restent intacts.",
                "تحفظ الخلايا الفارغة البيانات. تمسح __CLEAR__ الحقول الاختيارية صراحة. تحمي المراجعات التعديلات اللاحقة وتبقى محركات الاستيراد الأصلية دون تغيير.",
              ]}
            />
          </p>
        </Panel>
      </div>
      {error && (
        <p role="alert" className={`${s.notice} ${s.alertError}`}>
          {error}
        </p>
      )}
      <Panel
        title={
          <T
            v={[
              "3 · Resume a saved batch",
              "3 · Reprendre un lot enregistré",
              "3 · استئناف دفعة محفوظة",
            ]}
          />
        }
      >
        <State {...batches} retry={batches.reload}>
          <select
            aria-label="Saved operator batch"
            value={batch}
            onChange={(e) => {
              setBatch(e.target.value);
              setJobId("");
            }}
          >
            <option value="">Choose…</option>
            {batches.value.rows.map((b: any) => (
              <option key={b.id} value={b.id}>
                {b.source_name} · {b.state}
              </option>
            ))}
          </select>
          <Pager
            page={batchPage}
            total={batches.value.total}
            size={30}
            onPage={setBatchPage}
          />
        </State>
      </Panel>
      {batch && (
        <BatchProgress
          id={batch}
          onJob={(id) => {
            setJobId(id);
            setPage(1);
          }}
        />
      )}
      <Panel
        title={
          <T
            v={[
              "4 · Review, correct and trace draft receipts",
              "4 · Revoir, corriger et tracer les reçus",
              "4 · مراجعة وتصحيح وتتبع الإيصالات",
            ]}
          />
        }
        actions={
          <Button onClick={job.reload} icon="RefreshCw">
            <T v={["Refresh", "Actualiser", "تحديث"]} />
          </Button>
        }
      >
        {jobId ? (
          <State {...job} retry={job.reload}>
            <div className={s.tableScroll}>
              <table className={s.table}>
                <thead>
                  <tr>
                    <th>Source rows</th>
                    <th>Dossier</th>
                    <th>Validation / dependencies</th>
                    <th>Before → after</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {job.value.rows.map((r: any) => (
                    <tr key={r.id}>
                      <td>
                        {r.prepared.sourceRows?.join(", ") || r.row_number}
                      </td>
                      <td>
                        <strong>{r.prepared.record?.title}</strong>
                        <small>{r.prepared.record?.key}</small>
                      </td>
                      <td>
                        <Badge
                          tone={
                            r.state === "applied"
                              ? "green"
                              : r.issues?.length
                                ? "orange"
                                : "blue"
                          }
                        >
                          {r.state}
                        </Badge>
                        <p>{r.issues?.join(" · ") || r.error}</p>
                        <details>
                          <summary>Reference mapping / readiness</summary>
                          {r.prepared.dependencyPlan?.map(
                            (d: any, i: number) => (
                              <p key={"dependency" + i}>
                                {d.source} · {d.status} · {d.nextAction}
                              </p>
                            ),
                          )}
                          {r.prepared.referenceMappings?.map(
                            (m: any, i: number) => (
                              <p key={i}>
                                {m.path} · {m.source} → {m.id}
                              </p>
                            ),
                          )}
                        </details>
                      </td>
                      <td>
                        {r.before_snapshot?.revision || "new"} →{" "}
                        {r.after_snapshot?.revision || "draft plan"}
                      </td>
                      <td>
                        <div className={s.actions}>
                          {["invalid", "ready", "failed", "conflict"].includes(
                            r.state,
                          ) && (
                            <Button
                              disabled={
                                busy ||
                                !boot.actor.rights.manage ||
                                !r.prepared.record
                              }
                              onClick={() => setCorrection(r)}
                            >
                              <T v={["Correct", "Corriger", "تصحيح"]} />
                            </Button>
                          )}
                          {r.state === "ready" && (
                            <Button
                              disabled={busy || !boot.actor.rights.manage}
                              onClick={() => line(r.id, "apply_import")}
                            >
                              <T
                                v={[
                                  "Apply draft",
                                  "Appliquer le brouillon",
                                  "تطبيق المسودة",
                                ]}
                              />
                            </Button>
                          )}
                          {r.state === "applied" && (
                            <Button
                              disabled={busy || !boot.actor.rights.manage}
                              onClick={() => line(r.id, "rollback_import")}
                            >
                              <T
                                v={[
                                  "Guarded rollback",
                                  "Rollback protégé",
                                  "تراجع محمي",
                                ]}
                              />
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pager
              page={page}
              size={100}
              total={job.value.total}
              onPage={setPage}
            />
          </State>
        ) : (
          <Empty
            title={
              <T
                v={[
                  "Select a prepared resource receipt above",
                  "Sélectionnez un reçu de ressource préparée",
                  "اختر إيصال مورد محضّر أعلاه",
                ]}
              />
            }
            detail={
              <T
                v={[
                  "Earlier receipts remain accessible through a job link. Dependent resources must be applied in the guide’s order; unresolved aliases block only their own draft.",
                  "Les anciens reçus restent accessibles par leur lien. Appliquez les dépendances dans l’ordre du guide ; les références non résolues bloquent uniquement leur brouillon.",
                  "تبقى الإيصالات السابقة متاحة عبر روابطها. طبّق الموارد حسب ترتيب الاعتماديات في الدليل؛ تمنع المراجع غير المحلولة مسودتها فقط.",
                ]}
              />
            }
          />
        )}
      </Panel>
      {correction && (
        <Editor
          prepared={correction.prepared.record}
          onClose={() => setCorrection(null)}
          onPrepared={async (r) => {
            await mutate({
              action: "correct_import",
              id: correction.id,
              prepared: { ...correction.prepared, record: r },
            });
            job.reload();
            setCorrection(null);
          }}
        />
      )}
    </>
  );
}
