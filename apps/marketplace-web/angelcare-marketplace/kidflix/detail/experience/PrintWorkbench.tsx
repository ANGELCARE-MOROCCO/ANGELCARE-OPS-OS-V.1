"use client";
import { useEffect, useRef, useState } from "react";
import { tr } from "../../catalogue";
import { capability, LIMITS } from "../../journey/contract";
import { boundedFile, pageSelection, preparePack } from "../../journey/outputs";
import { readyOutputs, type Row } from "../model";
import { Button, ErrorNote, type PlayerProps } from "../shared";
import { local, t } from "../copy";
import { emitVisitor } from "../../journey/events";
import s from "./experience.module.css";
export function PrintWorkbench({
  m,
  locale: l,
  update,
  preview: previewMode,
}: PlayerProps) {
  const outputs = readyOutputs(m).filter((o) =>
      ["application/pdf", "image/png", "image/jpeg"].includes(o.asset.mime),
    ),
    [fileId, setFileId] = useState(outputs[0]?.id || ""),
    [count, setCount] = useState(0),
    [selected, setSelected] = useState<number[]>([]),
    [range, setRange] = useState(""),
    [preview, setPreview] = useState(""),
    [page, setPage] = useState(0),
    [paper, setPaper] = useState("A4"),
    [landscape, setLandscape] = useState(false),
    [normalise, setNormalise] = useState(false),
    [tone, setTone] = useState<"colour" | "grayscale" | "low_ink">("colour"),
    [busy, setBusy] = useState(false),
    [done, setDone] = useState(0),
    [error, setError] = useState(false),
    [rangeError, setRangeError] = useState(false),
    [result, setResult] = useState<{
      url: string;
      pages: number;
      bytes: number;
    } | null>(null),
    controller = useRef<AbortController | null>(null),
    live = useRef(true),
    locked = useRef(false),
    file = outputs.find((o) => o.id === fileId);
  useEffect(() => {
    live.current = true;
    return () => {
      live.current = false;
      controller.current?.abort();
    };
  }, []);
  useEffect(
    () => () => {
      if (preview) URL.revokeObjectURL(preview);
    },
    [preview],
  );
  useEffect(
    () => () => {
      if (result) URL.revokeObjectURL(result.url);
    },
    [result],
  );
  if (previewMode || !capability(m).printPack || !file) return null;
  async function fresh(): Promise<Row> {
    const response = await fetch(
      "/api/kidflix/experience/" +
        encodeURIComponent(m.key) +
        "/journey?locale=" +
        l,
      { signal: controller.current!.signal, cache: "no-store" },
    );
    if (!response.ok) throw Error("PERMISSION_CHANGED");
    const value = await response.json();
    if (
      value.releaseId !== m.releaseId ||
      !capability(value.manifest).printPack
    )
      throw Error("EDITION_OR_RIGHTS_CHANGED");
    const current = readyOutputs(value.manifest).find((o) => o.id === fileId);
    if (!current) throw Error("OUTPUT_CHANGED");
    return current;
  }
  async function inspect() {
    if (locked.current) return;
    locked.current = true;
    setBusy(true);
    setError(false);
    controller.current = new AbortController();
    try {
      const current = await fresh(),
        data = await boundedFile(current.asset.url, controller.current.signal);
      let pages = 1;
      if (current.asset.mime === "application/pdf") {
        const { PDFDocument } = await import("pdf-lib");
        pages = (await PDFDocument.load(data.bytes)).getPageCount();
      }
      if (pages > LIMITS.packPages) throw Error("PAGE_LIMIT");
      if (live.current) {
        setCount(pages);
        setSelected(Array.from({ length: pages }, (_, i) => i));
        setRange("");
        setPage(0);
        setPreview(
          URL.createObjectURL(
            new Blob([data.bytes as BlobPart], { type: current.asset.mime }),
          ),
        );
      }
    } catch (e) {
      if (live.current && (e as Error).name !== "AbortError") setError(true);
    } finally {
      locked.current = false;
      if (live.current) setBusy(false);
    }
  }
  async function prepare() {
    if (locked.current || !selected.length) return;
    locked.current = true;
    setBusy(true);
    setError(false);
    setResult(null);
    setDone(0);
    controller.current = new AbortController();
    emitVisitor(m.key, l, m.releaseId, "output_prepare");
    try {
      const current = await fresh(),
        out = await preparePack(
          [
            {
              url: current.asset.url,
              mime: current.asset.mime,
              selection: selected.map((i) => i + 1).join(","),
            },
          ],
          paper,
          landscape,
          controller.current.signal,
          setDone,
          { normalisePdf: normalise, imageTone: tone },
        );
      if (live.current) {
        setResult({
          url: URL.createObjectURL(out.blob),
          pages: out.pages,
          bytes: out.blob.size,
        });
        update({ prepared: true });
        emitVisitor(m.key, l, m.releaseId, "output_ready");
      }
    } catch (e) {
      if (live.current && (e as Error).name !== "AbortError") {
        setError(true);
        emitVisitor(m.key, l, m.releaseId, "action_failed");
      }
    } finally {
      locked.current = false;
      if (live.current) setBusy(false);
    }
  }
  function invalidate() {
    setResult(null);
  }
  return (
    <section id="r5-print-workbench" className={s.printWorkbench}>
      <div className={s.sectionHead}>
        <div>
          <span className={s.eyebrow}>
            {tr(
              [
                "PRINT PRODUCTION DESK",
                "ATELIER DE PRÉPARATION",
                "ورشة إعداد الطباعة",
              ],
              l,
            )}
          </span>
          <h2>
            {tr(
              [
                "Build the edition you actually need.",
                "Préparez la sélection dont vous avez besoin.",
                "جهّز النسخة التي تحتاجها فعلاً.",
              ],
              l,
            )}
          </h2>
        </div>
        <strong>
          {selected.length}
          {count ? " / " + count : ""} {t("page", l)}
        </strong>
      </div>
      <div className={s.actions}>
        <label>
          {t("files", l)}
          <select
            value={fileId}
            disabled={busy}
            onChange={(e) => {
              setFileId(e.target.value);
              setCount(0);
              setSelected([]);
              setPreview("");
              invalidate();
              setRange("");
            }}
          >
            {outputs.map((o) => (
              <option key={o.id} value={o.id}>
                {local(o, "label", l) || o.label}
              </option>
            ))}
          </select>
        </label>
        <Button primary disabled={busy} onClick={() => void inspect()}>
          {busy
            ? t("loading", l)
            : tr(
                [
                  "Inspect real pages",
                  "Inspecter les pages réelles",
                  "افحص الصفحات الفعلية",
                ],
                l,
              )}
        </Button>
      </div>
      {preview ? (
        <div className={s.printLayout}>
          <div className={s.paperPreview}>
            {file.asset.mime === "application/pdf" ? (
              <iframe
                src={preview + "#page=" + (page + 1)}
                title={tr(
                  [
                    "Original published file",
                    "Fichier original publié",
                    "الملف الأصلي المنشور",
                  ],
                  l,
                )}
              />
            ) : (
              <img src={preview} alt={local(file, "label", l) || file.label} />
            )}
            <small>
              {tr(
                [
                  "Published original. Colour options below affect the generated image-based output.",
                  "Original publié. Les options de couleur s’appliquent à la sortie générée à partir d’images.",
                  "الأصل المنشور. تُطبق خيارات اللون على الإخراج المولد من الصور.",
                ],
                l,
              )}
            </small>
          </div>
          <div>
            <h3>
              {tr(
                [
                  "Select and order pages",
                  "Sélectionner et ordonner les pages",
                  "اختر الصفحات ورتبها",
                ],
                l,
              )}
            </h3>
            <div className={s.actions}>
              <Button
                disabled={busy}
                onClick={() => {
                  setSelected(Array.from({ length: count }, (_, i) => i));
                  invalidate();
                }}
              >
                {tr(["All pages", "Toutes les pages", "كل الصفحات"], l)}
              </Button>
              <Button
                disabled={busy}
                onClick={() => {
                  setSelected([]);
                  invalidate();
                }}
              >
                {tr(
                  ["Clear selection", "Vider la sélection", "إفراغ التحديد"],
                  l,
                )}
              </Button>
            </div>
            <div className={s.pageTiles}>
              {Array.from({ length: count }, (_, i) => (
                <button
                  key={i}
                  disabled={busy}
                  aria-pressed={selected.includes(i)}
                  onClick={() => {
                    setPage(i);
                    setSelected((a) =>
                      a.includes(i) ? a.filter((v) => v !== i) : [...a, i],
                    );
                    invalidate();
                  }}
                >
                  <span>{i + 1}</span>
                  {selected.includes(i) ? "✓" : "+"}
                </button>
              ))}
            </div>
            <label>
              {tr(
                [
                  "Page ranges · e.g. 1-3,5",
                  "Plages de pages · ex. 1-3,5",
                  "نطاق الصفحات · مثال 1-3,5",
                ],
                l,
              )}
              <input
                value={range}
                disabled={busy}
                onChange={(e) => setRange(e.target.value)}
              />
            </label>
            <Button
              disabled={busy}
              onClick={() => {
                try {
                  setSelected(pageSelection(range, count));
                  setRangeError(false);
                  invalidate();
                } catch {
                  setRangeError(true);
                }
              }}
            >
              {tr(
                ["Apply ranges", "Appliquer les plages", "تطبيق النطاقات"],
                l,
              )}
            </Button>
            {rangeError ? (
              <p role="alert">
                {tr(
                  [
                    "Use page numbers within this file.",
                    "Utilisez les numéros de page de ce fichier.",
                    "استخدم أرقام صفحات هذا الملف.",
                  ],
                  l,
                )}
              </p>
            ) : null}
            <ol className={s.orderedPages}>
              {selected.map((i, n) => (
                <li key={i}>
                  {t("page", l)} {i + 1}
                  <Button
                    disabled={busy || n === 0}
                    aria-label={
                      tr(
                        [
                          "Move page earlier",
                          "Avancer la page",
                          "نقل الصفحة للأمام",
                        ],
                        l,
                      ) +
                      " " +
                      (i + 1)
                    }
                    onClick={() => {
                      setSelected((a) => {
                        const b = [...a];
                        [b[n - 1], b[n]] = [b[n], b[n - 1]];
                        return b;
                      });
                      invalidate();
                    }}
                  >
                    ↑
                  </Button>
                  <Button
                    disabled={busy || n === selected.length - 1}
                    aria-label={
                      tr(
                        [
                          "Move page later",
                          "Reculer la page",
                          "نقل الصفحة للخلف",
                        ],
                        l,
                      ) +
                      " " +
                      (i + 1)
                    }
                    onClick={() => {
                      setSelected((a) => {
                        const b = [...a];
                        [b[n], b[n + 1]] = [b[n + 1], b[n]];
                        return b;
                      });
                      invalidate();
                    }}
                  >
                    ↓
                  </Button>
                </li>
              ))}
            </ol>
          </div>
        </div>
      ) : null}
      <fieldset className={s.printSettings} disabled={busy}>
        <legend>
          {tr(["Output settings", "Réglages de sortie", "إعدادات الإخراج"], l)}
        </legend>
        <label>
          {tr(["Paper size", "Format papier", "حجم الورق"], l)}
          <select
            value={paper}
            onChange={(e) => {
              setPaper(e.target.value);
              invalidate();
            }}
          >
            <option>A4</option>
            <option>Letter</option>
          </select>
        </label>
        <label>
          <input
            type="checkbox"
            checked={landscape}
            onChange={(e) => {
              setLandscape(e.target.checked);
              invalidate();
            }}
          />
          {tr(["Landscape", "Paysage", "أفقي"], l)}
        </label>
        {file.asset.mime === "application/pdf" ? (
          <label>
            <input
              type="checkbox"
              checked={normalise}
              onChange={(e) => {
                setNormalise(e.target.checked);
                invalidate();
              }}
            />
            {tr(
              [
                "Fit PDF pages to selected paper; otherwise keep original page sizes",
                "Adapter le PDF au papier choisi ; sinon conserver les formats originaux",
                "ملاءمة صفحات PDF للورق المختار؛ وإلا احتفظ بالأحجام الأصلية",
              ],
              l,
            )}
          </label>
        ) : (
          <label>
            {tr(["Image rendering", "Rendu des images", "معالجة الصور"], l)}
            <select
              value={tone}
              onChange={(e) => {
                setTone(e.target.value as typeof tone);
                invalidate();
              }}
            >
              <option value="colour">
                {tr(
                  ["Original colour", "Couleur originale", "اللون الأصلي"],
                  l,
                )}
              </option>
              <option value="grayscale">
                {tr(["Grayscale", "Niveaux de gris", "تدرج رمادي"], l)}
              </option>
              <option value="low_ink">
                {tr(
                  [
                    "Lighter ink · image pages",
                    "Encre allégée · pages images",
                    "حبر أخف · صفحات الصور",
                  ],
                  l,
                )}
              </option>
            </select>
          </label>
        )}
        <p>
          {tr(
            [
              "PDF colours are preserved. No raster conversion or simulated low-ink preview is applied to PDF files.",
              "Les couleurs du PDF sont conservées. Aucun rendu matriciel ni aperçu d’encre allégée n’est appliqué aux PDF.",
              "تُحفظ ألوان PDF. لا يُطبق تحويل نقطي أو معاينة حبر مخفف على ملفات PDF.",
            ],
            l,
          )}
        </p>
      </fieldset>
      <div className={s.actions}>
        <Button
          primary
          disabled={busy || !selected.length}
          onClick={() => void prepare()}
        >
          {tr(
            [
              "Prepare selected pages",
              "Préparer les pages choisies",
              "جهز الصفحات المختارة",
            ],
            l,
          )}
        </Button>
        {busy ? (
          <>
            <span role="status">{done} / 1</span>
            <Button onClick={() => controller.current?.abort()}>
              {t("cancel", l)}
            </Button>
          </>
        ) : null}
      </div>
      {error ? (
        <ErrorNote
          locale={l}
          message={tr(
            [
              "Preparation could not finish. Check that this edition, its files and printing permission are still available, then retry.",
              "La préparation n’a pas abouti. Vérifiez la disponibilité de cette édition, des fichiers et du droit d’impression, puis réessayez.",
              "تعذر إكمال الإعداد. تحقق من توفر الإصدار والملفات وإذن الطباعة ثم أعد المحاولة.",
            ],
            l,
          )}
        />
      ) : null}
      {result ? (
        <div className={s.preparedOutput}>
          <p role="status">
            {result.pages} {t("page", l)} · {Math.ceil(result.bytes / 1024)} KB
          </p>
          <a
            className={s.primary}
            href={result.url}
            download="KidFlix-selected-pages.pdf"
            onClick={() =>
              emitVisitor(m.key, l, m.releaseId, "download_intent")
            }
          >
            {t("download", l)} · PDF
          </a>
          <iframe
            src={result.url}
            title={tr(
              [
                "Prepared output preview",
                "Aperçu du fichier préparé",
                "معاينة الملف المجهز",
              ],
              l,
            )}
          />
        </div>
      ) : null}
    </section>
  );
}
