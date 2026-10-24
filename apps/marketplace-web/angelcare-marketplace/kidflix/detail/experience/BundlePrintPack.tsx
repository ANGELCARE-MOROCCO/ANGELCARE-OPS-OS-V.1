"use client";
import { useEffect, useRef, useState } from "react";
import { tr } from "../../catalogue";
import { capability } from "../../journey/contract";
import {
  availableNodes,
  blankContinuity,
} from "../../../digital-customer-experience/continuity";
import { obj, rows, readyOutputs, type Row } from "../model";
import { Button, ErrorNote, type PlayerProps } from "../shared";
import { local, t } from "../copy";
import s from "./experience.module.css";
export function BundlePrintPack(p: PlayerProps) {
  const { m, d, locale: l, state, update } = p,
    completed = Array.isArray(state.completed) ? state.completed : [],
    allowed = new Set(
      availableNodes(rows(d.steps), { ...blankContinuity(), completed }).map(
        (step) => step.id,
      ),
    ),
    children = rows(d.steps)
      .filter((step) => allowed.has(step.id) || completed.includes(step.id))
      .map((step) => obj(m.bindings.records?.[step.experienceId]))
      .filter((child) => child.key && capability(child).printPack),
    files = children.flatMap((child) =>
      readyOutputs(child)
        .filter((o) =>
          ["application/pdf", "image/png", "image/jpeg"].includes(o.asset.mime),
        )
        .map((output) => ({ id: child.key + ":" + output.id, child, output })),
    ),
    [selected, setSelected] = useState<string[]>([]),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(false),
    [done, setDone] = useState(0),
    [ready, setReady] = useState<{ url: string; pages: number } | null>(null),
    controller = useRef<AbortController | null>(null),
    locked = useRef(false),
    live = useRef(true);
  useEffect(() => {
    live.current = true;
    return () => {
      live.current = false;
      controller.current?.abort();
    };
  }, []);
  useEffect(
    () => () => {
      if (ready) URL.revokeObjectURL(ready.url);
    },
    [ready],
  );
  if (
    p.preview ||
    d.kidflixPrintPack !== true ||
    d.printAllowed !== true ||
    !files.length
  )
    return null;
  async function prepare() {
    if (locked.current || !selected.length) return;
    locked.current = true;
    setBusy(true);
    setError(false);
    setReady(null);
    setDone(0);
    controller.current = new AbortController();
    const signal = controller.current.signal;
    try {
      const parent = await fetch(
        "/api/kidflix/experience/" +
          encodeURIComponent(m.key) +
          "/journey?locale=" +
          l,
        { cache: "no-store", signal },
      );
      if (!parent.ok) throw Error("EDITION_CHANGED");
      const currentParent = await parent.json();
      if (
        currentParent.releaseId !== m.releaseId ||
        obj(currentParent.manifest.definition).printAllowed !== true ||
        obj(currentParent.manifest.definition).kidflixPrintPack !== true
      )
        throw Error("PERMISSION_CHANGED");
      const fresh = new Map<string, Row>(),
        plan = [];
      for (const id of selected) {
        const file = files.find((f) => f.id === id);
        if (!file) throw Error("OUTPUT_CHANGED");
        if (!fresh.has(file.child.key)) {
          const r = await fetch(
            "/api/kidflix/experience/" +
              encodeURIComponent(file.child.key) +
              "/journey?locale=" +
              l,
            { cache: "no-store", signal },
          );
          if (!r.ok) throw Error("PERMISSION_CHANGED");
          const value = await r.json();
          if (
            value.releaseId !== file.child.releaseId ||
            !capability(value.manifest).printPack
          )
            throw Error("EDITION_CHANGED");
          fresh.set(file.child.key, value.manifest);
        }
        const output = readyOutputs(fresh.get(file.child.key)!).find(
          (o) => o.id === file.output.id,
        );
        if (!output) throw Error("OUTPUT_CHANGED");
        plan.push({
          url: output.asset.url,
          mime: output.asset.mime,
          selection: "",
        });
      }
      const { preparePack } = await import("../../journey/outputs"),
        out = await preparePack(
          [...new Map(plan.map((file) => [file.url, file])).values()],
          "A4",
          false,
          signal,
          setDone,
        );
      if (live.current) {
        setReady({ url: URL.createObjectURL(out.blob), pages: out.pages });
        update({ prepared: true });
      }
    } catch (e) {
      if (live.current && (e as Error).name !== "AbortError") setError(true);
    } finally {
      locked.current = false;
      if (live.current) setBusy(false);
    }
  }
  return (
    <section className={s.bundlePack}>
      <div className={s.sectionHead}>
        <div>
          <span className={s.eyebrow}>
            {tr(
              [
                "PATHWAY PRINT PACK",
                "DOSSIER IMPRIMABLE DU PARCOURS",
                "حزمة طباعة المسار",
              ],
              l,
            )}
          </span>
          <h2>
            {tr(
              [
                "Bring eligible resources together.",
                "Réunir les ressources autorisées.",
                "اجمع الموارد المصرح بها.",
              ],
              l,
            )}
          </h2>
        </div>
      </div>
      <p>
        {tr(
          [
            "Only currently available, unlocked resources with published printing permission appear here. Original PDF page sizes and colours are preserved.",
            "Seules les ressources disponibles, débloquées et autorisées à l’impression apparaissent ici. Les formats et couleurs des PDF originaux sont conservés.",
            "تظهر هنا الموارد المتاحة والمفتوحة والمصرح بطباعتها فقط. تُحفظ أحجام وألوان PDF الأصلية.",
          ],
          l,
        )}
      </p>
      <div className={s.packFiles}>
        {files.map((file) => (
          <label key={file.id}>
            <input
              type="checkbox"
              disabled={busy}
              checked={selected.includes(file.id)}
              onChange={(e) => {
                setSelected((a) =>
                  e.target.checked
                    ? [...a, file.id]
                    : a.filter((id) => id !== file.id),
                );
                setReady(null);
              }}
            />
            <span>
              {file.child.title}
              <small>
                {local(file.output, "label", l) || file.output.label} ·{" "}
                {file.output.asset.mime === "application/pdf" ? "PDF" : "Image"}
              </small>
            </span>
          </label>
        ))}
      </div>
      <div className={s.actions}>
        <Button
          primary
          disabled={busy || !selected.length}
          onClick={() => void prepare()}
        >
          {tr(
            [
              "Prepare pathway pack",
              "Préparer le dossier du parcours",
              "جهز حزمة المسار",
            ],
            l,
          )}
        </Button>
        {busy ? (
          <>
            <span role="status">
              {done} / {selected.length}
            </span>
            <Button onClick={() => controller.current?.abort()}>
              {t("cancel", l)}
            </Button>
          </>
        ) : null}
      </div>
      {error ? <ErrorNote locale={l} /> : null}
      {ready ? (
        <div className={s.preparedOutput}>
          <p role="status">
            {ready.pages} {t("page", l)}
          </p>
          <a
            href={ready.url}
            download="KidFlix-pathway-pack.pdf"
            className={s.primary}
          >
            {t("download", l)} · PDF
          </a>
          <iframe
            src={ready.url}
            title={tr(
              [
                "Prepared pathway pack",
                "Dossier du parcours préparé",
                "حزمة المسار المجهزة",
              ],
              l,
            )}
          />
        </div>
      ) : null}
    </section>
  );
}
