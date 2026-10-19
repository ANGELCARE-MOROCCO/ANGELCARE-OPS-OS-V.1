"use client";
import { useSearchParams } from "next/navigation";

import { ProductionTrace } from "./OperatorDesk";
import { useEffect, useRef, useState } from "react";
import {
  API,
  array,
  object,
  text,
  number,
  tr,
  type Data,
  type Tri,
} from "../types";
import { RECIPES, type WorkItem } from "../professional-contract";
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
  useReceiptMutation,
} from "./ui";
import { Picker } from "./Editor";
import { WorkStatus } from "./ProfessionalTeam";
import s from "./workspace.module.css";
export function ProductionDesk() {
  const context = useSearchParams()?.get("context") || "";
  const { boot, locale, notify } = useUI(),
    [page, setPage] = useState(1),
    [filter, setFilter] = useState(""),
    [search, setSearch] = useState(""),
    [create, setCreate] = useState(false),
    [selected, setSelected] = useState(""),
    q = useQuery<any>(
      {
        op: "pro_work",
        kind: "media_job",
        page,
        status: filter,
        q: search,
        recordId: context || undefined,
      },
      { rows: [], total: 0, byStatus: {} },
    );
  useEffect(() => {
    if (
      !q.value.rows.some((w: WorkItem) =>
        ["queued", "running", "cancel_requested"].includes(w.status),
      )
    )
      return;
    const timer = setInterval(() => {
      if (!document.hidden) q.reload();
    }, 5000);
    return () => clearInterval(timer);
  }, [q.value.rows]);
  return (
    <>
      <div className={s.metricGrid}>
        {[
          ["queued", ["Waiting", "En attente", "بانتظار المعالجة"]],
          ["running", ["Processing", "En traitement", "قيد المعالجة"]],
          ["needs_review", ["To review", "À vérifier", "للمراجعة"]],
          ["failed", ["Recovery", "Reprise", "استعادة"]],
        ].map(([key, label]) => (
          <Panel key={key as string}>
            <WorkStatus value={key as string} />
            <strong>{q.value.byStatus[key as string] || 0}</strong>
          </Panel>
        ))}
      </div>
      <Panel
        title={
          <T
            v={[
              "Media production studio",
              "Studio de production média",
              "استوديو إنتاج الوسائط",
            ]}
          />
        }
        subtitle={
          <T
            v={[
              "Source → recipe → durable processing → human review → native media. Originals remain intact.",
              "Source → recette → traitement durable → revue humaine → média natif. Les originaux sont conservés.",
              "المصدر ثم الوصفة ثم المعالجة المستمرة ثم المراجعة البشرية ثم الوسائط الأصلية.",
            ]}
          />
        }
        actions={
          <>
            <Button onClick={q.reload} icon="RefreshCw">
              <T v={["Refresh", "Actualiser", "تحديث"]} />
            </Button>
            <Button
              kind="primary"
              disabled={!boot.actor.rights.manage || !boot.actor.rights.media}
              onClick={() => setCreate(true)}
              icon="WandSparkles"
            >
              <T v={["Prepare media", "Préparer un média", "إعداد وسائط"]} />
            </Button>
          </>
        }
      >
        <div className={s.toolbar}>
          <input
            value={search}
            aria-label="Search production jobs"
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder={tr(
              [
                "Search source or processing task",
                "Chercher source ou traitement",
                "البحث عن مصدر أو مهمة معالجة",
              ],
              locale,
            )}
          />
          <select
            aria-label="Production state"
            value={filter}
            onChange={(e) => {
              setFilter(e.target.value);
              setPage(1);
            }}
          >
            <option value="">
              {tr(["All states", "Tous les états", "كل الحالات"], locale)}
            </option>
            {[
              "queued",
              "running",
              "needs_review",
              "ready",
              "failed",
              "cancel_requested",
              "cancelled",
            ].map((v) => (
              <option key={v} value={v}>
                {v}
              </option>
            ))}
          </select>
        </div>
        <State {...q} retry={q.reload}>
          <div className={s.tableScroll}>
            <table className={s.table}>
              <thead>
                <tr>
                  <th>
                    <T
                      v={[
                        "Source / recipe",
                        "Source / recette",
                        "المصدر / الوصفة",
                      ]}
                    />
                  </th>
                  <th>
                    <T v={["Progress", "Progression", "التقدم"]} />
                  </th>
                  <th>
                    <T v={["State", "État", "الحالة"]} />
                  </th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {q.value.rows.map((w: WorkItem) => (
                  <tr key={w.id}>
                    <td>
                      <strong>{w.title}</strong>
                      <small>
                        {text(object(w.data.recipe).language)} ·{" "}
                        {new Date(w.created_at).toLocaleString(locale)}
                      </small>
                    </td>
                    <td>
                      <div className={s.progress}>
                        <i
                          style={{
                            width:
                              Math.max(
                                0,
                                Math.min(100, number(w.data.progress)),
                              ) + "%",
                          }}
                        />
                      </div>
                      <small>
                        {text(w.data.stage) || text(w.data.errorStage)}
                      </small>
                    </td>
                    <td>
                      <WorkStatus value={w.status} />
                    </td>
                    <td>
                      <Button
                        onClick={() => setSelected(w.id)}
                        icon="PanelRightOpen"
                      >
                        <T
                          v={[
                            "Inspect / review",
                            "Inspecter / vérifier",
                            "فحص / مراجعة",
                          ]}
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
              icon="Film"
              title={
                <T
                  v={[
                    "Prepare the first production job",
                    "Préparer le premier traitement",
                    "إعداد أول مهمة إنتاج",
                  ]}
                />
              }
              detail={
                <T
                  v={[
                    "Choose an existing source or upload a presentation. Tools are reported by the designated processing host.",
                    "Choisissez une source existante ou importez une présentation. Les outils sont attestés par la machine de traitement.",
                    "اختر مصدراً حالياً أو ارفع عرضاً. تُرصد الأدوات من مضيف المعالجة المخصص.",
                  ]}
                />
              }
            />
          )}
          <Pager page={page} size={30} total={q.value.total} onPage={setPage} />
        </State>
      </Panel>
      {create && (
        <ProductionForm
          onClose={() => setCreate(false)}
          onSaved={() => {
            setCreate(false);
            q.reload();
          }}
        />
      )}
      {selected && (
        <ProductionReview
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
function ProductionForm({
  onClose,
  onSaved,
}: {
  onClose: () => void;
  onSaved: () => void;
}) {
  const transact = useReceiptMutation();
  const { locale } = useUI(),
    [source, setSource] = useWorkingState("production.new.source", ""),
    [sourceReceipt, setSourceReceipt] = useState(""),
    [uploadName, setUploadName] = useState(""),
    [picker, setPicker] = useState(false),
    [recipe, setRecipe] = useWorkingState<Data>("production.new.recipe", {
      recipe: "image",
      language: "fr",
      start: 0,
      end: 0,
      widths: [480, 960, 1600],
      focalX: 0.5,
      focalY: 0.5,
      crop: false,
      normalize: true,
    }),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [chapters, setChapters] = useWorkingState<Data[]>(
      "production.new.chapters",
      [],
    ),
    [cues, setCues] = useWorkingState<Data[]>("production.new.cues", []);
  const native = useQuery<any>(
      { op: "reference", type: "record", id: source },
      {},
    ),
    receipt = useRef(crypto.randomUUID()),
    patch = (d: Data) => setRecipe((old) => ({ ...old, ...d }));
  async function upload(file?: File) {
    if (!file) return;
    setBusy(true);
    setError("");
    try {
      const mime = file.name.toLowerCase().endsWith(".odp")
          ? "application/vnd.oasis.opendocument.presentation"
          : "application/vnd.openxmlformats-officedocument.presentationml.presentation",
        digest = await crypto.subtle.digest(
          "SHA-256",
          await file.arrayBuffer(),
        ),
        sha256 = [...new Uint8Array(digest)]
          .map((n) => n.toString(16).padStart(2, "0"))
          .join(""),
        session = await transact({
          action: "pro_source_prepare",
          input: { name: file.name, mime, bytes: file.size, sha256 },
        }),
        sent = await fetch(session.uploadUrl, {
          method: "PUT",
          headers: { "Content-Type": mime },
          body: file,
        });
      if (!sent.ok)
        throw Error("Presentation upload failed: HTTP " + sent.status);
      await transact({
        action: "pro_source_complete",
        input: { id: session.id },
      });
      setSourceReceipt(session.id);
      setSource("");
      setUploadName(file.name);
      patch({ recipe: "slides" });
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  async function submit() {
    setBusy(true);
    setError("");
    try {
      const chapterRows = chapters,
        cueRows = cues;
      await transact({
        action: "pro_enqueue",
        requestId: receipt.current,
        input: {
          recordId: source || undefined,
          sourceReceiptId: sourceReceipt || undefined,
          recipe: { ...recipe, chapters: chapterRows, cues: cueRows },
        },
      });
      onSaved();
    } catch (e) {
      setError((e as Error).message);
      receipt.current = crypto.randomUUID();
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
            "Prepare a production recipe",
            "Préparer une recette de production",
            "إعداد وصفة إنتاج",
          ]}
        />
      }
      onClose={onClose}
      footer={
        <Button
          kind="primary"
          disabled={busy || (!source && !sourceReceipt)}
          onClick={submit}
          icon="Send"
        >
          <T
            v={[
              "Queue for processing",
              "Mettre en traitement",
              "إضافة إلى قائمة المعالجة",
            ]}
          />
        </Button>
      }
    >
      <div className={s.twoColumns}>
        <Panel title={<T v={["1 · Source", "1 · Source", "1 · المصدر"]} />}>
          <div className={s.actions}>
            <strong>{uploadName || native.value.title || "—"}</strong>
            <Button
              disabled={busy}
              onClick={() => setPicker(true)}
              icon="Search"
            >
              <T
                v={[
                  "Choose registered source",
                  "Choisir une source liée",
                  "اختيار مصدر مسجل",
                ]}
              />
            </Button>
          </div>
          <Field
            label={
              <T
                v={[
                  "Or upload PPTX / ODP",
                  "Ou importer PPTX / ODP",
                  "أو رفع PPTX / ODP",
                ]}
              />
            }
            hint={
              <T
                v={[
                  "Original presentation stays private until converted outputs are reviewed and promoted.",
                  "L’original reste privé jusqu’à la revue et la promotion des résultats.",
                  "يبقى العرض الأصلي خاصاً حتى مراجعة النتائج وترقيتها.",
                ]}
              />
            }
          >
            <input
              type="file"
              accept=".pptx,.odp"
              disabled={busy}
              onChange={(e) => void upload(e.target.files?.[0])}
            />
          </Field>
          <Field
            label={<T v={["Production task", "Traitement", "مهمة الإنتاج"]} />}
          >
            <select
              value={text(recipe.recipe)}
              onChange={(e) => patch({ recipe: e.target.value })}
            >
              {RECIPES.map((r) => (
                <option key={r.key} value={r.key}>
                  {tr(r.label, locale)}
                </option>
              ))}
            </select>
          </Field>
          <Field
            label={
              <T v={["Language of source", "Langue source", "لغة المصدر"]} />
            }
          >
            <select
              value={text(recipe.language)}
              onChange={(e) => patch({ language: e.target.value })}
            >
              {["fr", "en", "ar"].map((v) => (
                <option key={v}>{v}</option>
              ))}
            </select>
          </Field>
          <p>{RECIPES.find((r) => r.key === recipe.recipe)?.output}</p>
        </Panel>
        <Panel
          title={
            <T
              v={[
                "2 · Processing choices",
                "2 · Choix de traitement",
                "2 · خيارات المعالجة",
              ]}
            />
          }
        >
          {recipe.recipe === "image" ? (
            <>
              <Field
                label={
                  <T
                    v={[
                      "Responsive widths · pixels",
                      "Largeurs responsive · pixels",
                      "العروض المتجاوبة · بكسل",
                    ]}
                  />
                }
              >
                <input
                  value={(recipe.widths as number[]).join(",")}
                  onChange={(e) =>
                    patch({ widths: e.target.value.split(",").map(Number) })
                  }
                />
              </Field>
              <Switch
                label={
                  <T
                    v={[
                      "Create an additional focal crop",
                      "Créer un cadrage focal supplémentaire",
                      "إنشاء اقتصاص بؤري إضافي",
                    ]}
                  />
                }
                value={recipe.crop === true}
                onChange={(v) => patch({ crop: v })}
              />
              {["focalX", "focalY"].map((key) => (
                <Field
                  key={key}
                  label={
                    <T
                      v={
                        key === "focalX"
                          ? [
                              "Horizontal focal point",
                              "Point focal horizontal",
                              "نقطة التركيز الأفقية",
                            ]
                          : [
                              "Vertical focal point",
                              "Point focal vertical",
                              "نقطة التركيز العمودية",
                            ]
                      }
                    />
                  }
                >
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.01"
                    value={number(recipe[key], 0.5)}
                    onChange={(e) => patch({ [key]: Number(e.target.value) })}
                  />
                </Field>
              ))}
              <Field
                label={
                  <T
                    v={[
                      "Accessible description",
                      "Description accessible",
                      "الوصف الميسر",
                    ]}
                  />
                }
              >
                <textarea
                  value={text(recipe.alt)}
                  onChange={(e) => patch({ alt: e.target.value })}
                />
              </Field>
            </>
          ) : ["document", "ocr", "slides"].includes(text(recipe.recipe)) ? (
            <Field
              label={
                <T
                  v={[
                    "Pages / slides · e.g. 1-4,7",
                    "Pages / diapositives · ex. 1-4,7",
                    "الصفحات / الشرائح · مثال 1-4,7",
                  ]}
                />
              }
            >
              <input
                value={text(recipe.pages)}
                onChange={(e) => patch({ pages: e.target.value })}
              />
            </Field>
          ) : (
            <>
              <Field
                label={
                  <T
                    v={[
                      "Start · seconds",
                      "Début · secondes",
                      "البداية · ثوان",
                    ]}
                  />
                }
              >
                <input
                  type="number"
                  min="0"
                  value={number(recipe.start)}
                  onChange={(e) => patch({ start: Number(e.target.value) })}
                />
              </Field>
              <Field
                label={
                  <T
                    v={[
                      "End · seconds · zero uses source end",
                      "Fin · secondes · zéro utilise la fin source",
                      "النهاية · ثوان · صفر يعني نهاية المصدر",
                    ]}
                  />
                }
              >
                <input
                  type="number"
                  min="0"
                  value={number(recipe.end)}
                  onChange={(e) => patch({ end: Number(e.target.value) })}
                />
              </Field>
              <Switch
                label={
                  <T
                    v={[
                      "Normalize audio level",
                      "Normaliser le niveau audio",
                      "توحيد مستوى الصوت",
                    ]}
                  />
                }
                value={recipe.normalize !== false}
                onChange={(v) => patch({ normalize: v })}
              />
            </>
          )}
          {["video", "audio"].includes(text(recipe.recipe)) && (
            <>
              <TimedRows
                rows={chapters}
                onChange={setChapters}
                variant="chapters"
              />
              <TimedRows rows={cues} onChange={setCues} variant="captions" />
            </>
          )}
        </Panel>
      </div>
      <div className={s.notice}>
        <Icon name="ShieldCheck" />
        <T
          v={[
            "Originals remain untouched. Machine recognition requires human review; published media is never replaced automatically.",
            "Les originaux restent intacts. Toute reconnaissance automatique nécessite une revue ; aucun média publié remplacé automatiquement.",
            "تبقى الأصول سليمة. تحتاج نتائج التعرف الآلي إلى مراجعة بشرية ولا تُستبدل الوسائط المنشورة تلقائياً.",
          ]}
        />
      </div>
      {error && <p role="alert">{error}</p>}
      {picker && (
        <Picker
          type="record"
          kind="asset"
          onSelect={(id) => {
            setSource(id);
            setSourceReceipt("");
            setUploadName("");
          }}
          onClose={() => setPicker(false)}
        />
      )}
    </Dialog>
  );
}
function ProductionReview({
  id,
  onClose,
}: {
  id: string;
  onClose: () => void;
}) {
  const transact = useReceiptMutation();
  const { boot, notify, locale, open } = useUI(),
    q = useQuery<any>({ op: "pro_item", id }, { item: null, outputs: [] }),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [review, setReview] = useState<Data | null>(null);
  const w = q.value.item as WorkItem | null;
  useEffect(() => {
    if (!w || !["queued", "running", "cancel_requested"].includes(w.status))
      return;
    const timer = setInterval(() => {
      if (!document.hidden) q.reload();
    }, 5000);
    return () => clearInterval(timer);
  }, [w?.status]);
  async function action(action: string) {
    if (!w) return;
    setBusy(true);
    setError("");
    try {
      const out = await transact({
        action,
        id,
        revision: w.revision,
        input: {
          review: review || { ...object(w.data.result), rights: "unverified" },
        },
      });
      if (action === "pro_create_experience" && out.record) {
        onClose();
        open(out.record.id, "content");
        return;
      }
      q.reload();
      notify(
        tr(
          [
            "Production receipt saved.",
            "Reçu de production enregistré.",
            "تم حفظ إيصال الإنتاج.",
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
  return (
    <Dialog
      wide
      title={
        <T
          v={[
            "Source, results and review",
            "Source, résultats et revue",
            "المصدر والنتائج والمراجعة",
          ]}
        />
      }
      onClose={onClose}
    >
      <ProductionTrace id={id} />
      <State {...q} retry={q.reload}>
        {w && (
          <>
            <div className={s.toolbar}>
              <strong>{w.title}</strong>
              <WorkStatus value={w.status} />
              <Badge>{number(w.data.attempts)} / 3</Badge>
            </div>
            <div className={s.twoColumns}>
              <Panel
                title={
                  <T
                    v={[
                      "Verified outputs",
                      "Résultats vérifiés",
                      "النتائج الموثقة",
                    ]}
                  />
                }
              >
                <div className={s.mediaGrid}>
                  {q.value.outputs.map((o: any) => (
                    <article className={s.mediaCard} key={o.id}>
                      {o.mime_type.startsWith("image/") ? (
                        <div className={s.cover}>
                          <img
                            src={API + "/artifact/" + o.id}
                            alt={text(object(w.data.result).alt) || o.file_name}
                            style={{ objectFit: "contain" }}
                          />
                        </div>
                      ) : (
                        <Icon
                          name={
                            o.mime_type.startsWith("audio/")
                              ? "AudioLines"
                              : "Film"
                          }
                          size={30}
                        />
                      )}
                      <strong>{o.file_name}</strong>
                      <small>
                        {o.role} · {(Number(o.size_bytes) / 1048576).toFixed(2)}{" "}
                        MiB
                      </small>
                      <a
                        href={API + "/artifact/" + o.id}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <T
                          v={[
                            "Inspect file",
                            "Examiner le fichier",
                            "فحص الملف",
                          ]}
                        />
                      </a>
                      {o.mime_type.startsWith("audio/") && (
                        <audio
                          controls
                          preload="none"
                          src={API + "/artifact/" + o.id}
                        />
                      )}{" "}
                      {o.mime_type.startsWith("video/") && (
                        <video
                          controls
                          preload="metadata"
                          src={API + "/artifact/" + o.id}
                          style={{ width: "100%", objectFit: "contain" }}
                        />
                      )}
                    </article>
                  ))}
                </div>
                {!q.value.outputs.length && (
                  <p>
                    <T
                      v={[
                        "No verified output yet.",
                        "Aucun résultat vérifié pour le moment.",
                        "لا توجد نتائج موثقة بعد.",
                      ]}
                    />
                  </p>
                )}
              </Panel>
              <Panel
                title={
                  <T
                    v={["Human review", "Revue humaine", "المراجعة البشرية"]}
                  />
                }
              >
                <Field
                  label={
                    <T
                      v={[
                        "Transcript / extracted text",
                        "Transcription / texte extrait",
                        "التفريغ / النص المستخرج",
                      ]}
                    />
                  }
                >
                  <textarea
                    rows={12}
                    disabled={w.status !== "needs_review"}
                    value={text((review || object(w.data.result)).text)}
                    onChange={(e) =>
                      setReview((old) => ({
                        ...object(w.data.result),
                        ...old,
                        text: e.target.value,
                      }))
                    }
                  />
                </Field>
                <Field
                  label={
                    <T
                      v={[
                        "Accessible image description",
                        "Description accessible des images",
                        "الوصف الميسر للصور",
                      ]}
                    />
                  }
                >
                  <textarea
                    rows={3}
                    disabled={w.status !== "needs_review"}
                    value={
                      text((review || object(w.data.result)).alt) ||
                      text(object(w.data.recipe).alt)
                    }
                    onChange={(e) =>
                      setReview((old) => ({
                        ...object(w.data.result),
                        ...old,
                        alt: e.target.value,
                      }))
                    }
                  />
                </Field>
                <TimedRows
                  variant="captions"
                  rows={array((review || object(w.data.result)).cues)}
                  onChange={(rows) =>
                    setReview((old) => ({
                      ...object(w.data.result),
                      ...old,
                      cues: rows,
                    }))
                  }
                  disabled={w.status !== "needs_review"}
                />
                <Field
                  label={
                    <T
                      v={[
                        "Verified rights classification",
                        "Classification des droits vérifiée",
                        "تصنيف الحقوق المتحقق منه",
                      ]}
                    />
                  }
                >
                  <select
                    disabled={w.status !== "needs_review"}
                    value={text(review?.rights) || "unverified"}
                    onChange={(e) =>
                      setReview((old) => ({
                        ...object(w.data.result),
                        ...old,
                        rights: e.target.value,
                      }))
                    }
                  >
                    {[
                      "unverified",
                      "owned",
                      "licensed",
                      "permission",
                      "public_domain",
                    ].map((v) => (
                      <option key={v}>{v}</option>
                    ))}
                  </select>
                </Field>
                <div className={s.actions}>
                  {w.status === "needs_review" && (
                    <Button
                      disabled={busy || !boot.actor.rights.manage}
                      kind="primary"
                      onClick={() => void action("pro_review_job")}
                      icon="ClipboardCheck"
                    >
                      <T
                        v={[
                          "Approve reviewed results",
                          "Valider les résultats revus",
                          "اعتماد النتائج المراجعة",
                        ]}
                      />
                    </Button>
                  )}
                  {w.status === "ready" && (
                    <Button
                      disabled={busy || !boot.actor.rights.media}
                      kind="primary"
                      onClick={() => void action("pro_promote_job")}
                      icon="CloudUpload"
                    >
                      <T
                        v={[
                          "Register in native media",
                          "Enregistrer dans les médias natifs",
                          "تسجيل في الوسائط الأصلية",
                        ]}
                      />
                    </Button>
                  )}
                  {w.status === "ready" && (
                    <Button
                      disabled={busy || !boot.actor.rights.manage}
                      onClick={() => void action("pro_create_experience")}
                      icon="BookOpen"
                    >
                      <T
                        v={[
                          "Create editable experience draft",
                          "Créer un brouillon d’expérience éditable",
                          "إنشاء مسودة تجربة قابلة للتحرير",
                        ]}
                      />
                    </Button>
                  )}
                  {["failed", "cancelled"].includes(w.status) && (
                    <Button
                      disabled={busy || !boot.actor.rights.manage}
                      onClick={() => void action("pro_retry_job")}
                      icon="RotateCcw"
                    >
                      <T
                        v={[
                          "Retry safely",
                          "Relancer sans doublon",
                          "إعادة المحاولة بأمان",
                        ]}
                      />
                    </Button>
                  )}
                  {["queued", "running", "failed", "needs_review"].includes(
                    w.status,
                  ) && (
                    <Button
                      disabled={busy || !boot.actor.rights.manage}
                      onClick={() => void action("pro_cancel_job")}
                    >
                      <T v={["Cancel", "Annuler", "إلغاء"]} />
                    </Button>
                  )}
                </div>
                {text(w.data.errorCode) && (
                  <p role="alert">
                    {text(w.data.errorCode)} · {text(w.data.errorStage)}
                  </p>
                )}
              </Panel>
            </div>
            <details className={s.advanced}>
              <summary>
                <T
                  v={[
                    "Source lineage and technical evidence",
                    "Filiation source et preuves techniques",
                    "أصل المصدر والأدلة التقنية",
                  ]}
                />
              </summary>
              <pre className={s.mono}>
                {JSON.stringify(
                  {
                    source: w.data.source,
                    recipe: w.data.recipe,
                    result: w.data.result,
                    fingerprint: w.data.fingerprint,
                    reviewedBy: w.data.reviewedBy,
                  },
                  null,
                  2,
                )}
              </pre>
            </details>
          </>
        )}
        {error && <p role="alert">{error}</p>}
      </State>
    </Dialog>
  );
}

function TimedRows({
  rows,
  onChange,
  variant,
  disabled = false,
}: {
  rows: Data[];
  onChange: (rows: Data[]) => void;
  variant: "chapters" | "captions";
  disabled?: boolean;
}) {
  const patch = (id: string, data: Data) =>
    onChange(rows.map((row) => (row.id === id ? { ...row, ...data } : row)));
  return (
    <Panel
      title={
        <T
          v={
            variant === "chapters"
              ? [
                  "Chapter timeline",
                  "Chronologie des chapitres",
                  "التسلسل الزمني للفصول",
                ]
              : [
                  "Timed caption review",
                  "Revue des sous-titres synchronisés",
                  "مراجعة الترجمة الموقوتة",
                ]
          }
        />
      }
      actions={
        <Button
          disabled={disabled}
          icon="Plus"
          onClick={() =>
            onChange([
              ...rows,
              {
                id: crypto.randomUUID(),
                ...(variant === "chapters"
                  ? { seconds: 0, title: "" }
                  : { start: 0, end: 1, text: "" }),
              },
            ])
          }
        >
          <T v={["Add", "Ajouter", "إضافة"]} />
        </Button>
      }
    >
      {rows.map((row, index) => (
        <div key={text(row.id) || index} className={s.rowCard}>
          <div className={s.formGrid}>
            <Field
              label={
                <T
                  v={["Start · seconds", "Début · secondes", "البداية · ثوان"]}
                />
              }
            >
              <input
                type="number"
                min="0"
                step="0.1"
                disabled={disabled}
                value={number(
                  row[variant === "chapters" ? "seconds" : "start"],
                )}
                onChange={(e) =>
                  patch(text(row.id), {
                    [variant === "chapters" ? "seconds" : "start"]: Number(
                      e.target.value,
                    ),
                  })
                }
              />
            </Field>
            {variant === "captions" && (
              <Field
                label={
                  <T
                    v={["End · seconds", "Fin · secondes", "النهاية · ثوان"]}
                  />
                }
              >
                <input
                  type="number"
                  min="0"
                  step="0.1"
                  disabled={disabled}
                  value={number(row.end)}
                  onChange={(e) =>
                    patch(text(row.id), { end: Number(e.target.value) })
                  }
                />
              </Field>
            )}
            <Field
              label={
                <T
                  v={
                    variant === "chapters"
                      ? ["Chapter title", "Titre du chapitre", "عنوان الفصل"]
                      : ["Caption text", "Texte du sous-titre", "نص الترجمة"]
                  }
                />
              }
            >
              <textarea
                rows={2}
                disabled={disabled}
                value={text(row[variant === "chapters" ? "title" : "text"])}
                onChange={(e) =>
                  patch(text(row.id), {
                    [variant === "chapters" ? "title" : "text"]: e.target.value,
                  })
                }
              />
            </Field>
          </div>
          <Button
            disabled={disabled}
            icon="Trash"
            onClick={() => onChange(rows.filter((_, i) => i !== index))}
          >
            <T v={["Remove", "Retirer", "إزالة"]} />
          </Button>
        </div>
      ))}
    </Panel>
  );
}
