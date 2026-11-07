"use client";
import { useState } from "react";
import { creationId } from "../creation-model";
import { tr } from "../types";
import { query, useUI, useReceiptMutation, useWorkingState } from "./ui";
import s from "./delivery.module.css";
export function DeliveryDraftRepair({ family }: { family: string }) {
  const { locale, boot } = useUI(),
    [rows, setRows] = useWorkingState<any[]>("delivery-repairs."+family+".rows",[]),
    [selected, setSelected] = useState<string[]>([]),
    [busy, setBusy] = useState(false),
    [reviewed, setReviewed] = useState(false),
    [error, setError] = useState(""),
    [receipts, setReceipts] = useWorkingState<Record<string, string>>("delivery-repairs."+family+".receipts",{});
  const mutate=useReceiptMutation();
  const groups=Object.entries(rows.reduce<Record<string,number>>((out,row)=>{for(const fix of row.changes)out[fix.reason]=(out[fix.reason]||0)+1;return out},{}));
  const t = (en: string, fr: string, ar: string) => tr([en, fr, ar], locale);
  async function scan() {
    setBusy(true);
    setError("");
    setReviewed(false);
    try {
      const all: any[] = [];
      let page = 1;
      for (;;) {
        const data = await query<any>({
          op: "delivery_repair_plan",
          family,
          page,
        });
        all.push(...data.rows.filter((r: any) => r.changes.length));
        if (page * data.pageSize >= data.total) break;
        if (page >= 50)
          throw Error(
            t(
              "Scan exceeds 5000 drafts. Narrow the category.",
              "Plus de 5 000 brouillons. Réduisez la catégorie.",
              "أكثر من 5000 مسودة. ضيّق الفئة.",
            ),
          );
        page++;
      }
      setRows(all);
      setSelected(all.map((r) => r.id));
      setReceipts({});
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  async function apply() {
    setBusy(true);
    setError("");
    for (const row of rows.filter(
      (r) => selected.includes(r.id) && receipts[r.id] !== "saved",
    )) {
      try {
        await mutate({
          action: "delivery_repair_apply",
          id: row.id,
          revision: row.revision,
          fingerprint: row.fingerprint,
          requestId: creationId(),
        });
        setReceipts((old) => ({ ...old, [row.id]: "saved" }));
      } catch (e) {
        setReceipts((old) => ({ ...old, [row.id]: (e as Error).message }));
      }
    }
    setBusy(false);
  }
  return (
    <section className={s.repairs}>
      <h3>
        {t(
          "Repair existing drafts in place",
          "Réparer les brouillons existants",
          "إصلاح المسودات الموجودة",
        )}
      </h3>
      <p>
        {t(
          "Scan the category, review every proposed change and apply only to selected drafts. No publication is triggered.",
          "Analysez la catégorie, vérifiez les modifications puis appliquez-les aux brouillons sélectionnés. Cette action ne publie rien.",
          "افحص الفئة وراجع التغييرات وطبّقها على المسودات المحددة. لا يؤدي هذا إلى النشر.",
        )}
      </p>
      <button
        type="button"
        className={s.primary}
        disabled={busy || !boot.actor.rights.manage}
        onClick={() => void scan()}
      >
        {busy
          ? t("Processing…", "Traitement…", "جارٍ المعالجة…")
          : t(
              "Scan category drafts",
              "Analyser les brouillons",
              "فحص المسودات",
            )}
      </button>
      {error && <p role="alert">{error}</p>}
      {rows.length > 0 && (
        <>
          <p>{groups.map(([reason,count])=>reason+" · "+count).join(" | ")}</p>
          <p>{Object.values(receipts).filter(r=>r==="saved").length} / {rows.length} {t("drafts repaired", "brouillons corrigés", "مسودات مصححة")}</p>
          <table>
            <thead>
              <tr>
                <th>{t("Collection", "Collection", "المجموعة")}</th>
                <th>
                  {t(
                    "Reviewed changes",
                    "Changements proposés",
                    "التغييرات المقترحة",
                  )}
                </th>
                <th>{t("Receipt", "Résultat", "النتيجة")}</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id}>
                  <td>
                    <label>
                      <input
                        type="checkbox"
                        disabled={busy}
                        checked={selected.includes(row.id)}
                        onChange={(e) =>
                          setSelected((old) =>
                            e.target.checked
                              ? [...old, row.id]
                              : old.filter((id) => id !== row.id),
                          )
                        }
                      />
                      {row.title}
                    </label>
                    <small>{row.key}</small>
                  </td>
                  <td>
                    {row.changes.map((c: any) => (
                      <div key={c.path}>
                        <b>{c.path}</b>: {String(c.before)} →{" "}
                        {String(c.after) || "—"}
                      </div>
                    ))}
                  </td>
                  <td>{receipts[row.id] || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <label className={s.review}>
            <input
              type="checkbox"
              checked={reviewed}
              disabled={busy}
              onChange={(e) => setReviewed(e.target.checked)}
            />
            {t(
              "I reviewed the proposed changes for the selected drafts.",
              "J’ai vérifié les changements proposés pour les brouillons sélectionnés.",
              "راجعت التغييرات المقترحة للمسودات المحددة.",
            )}
          </label>
          <button
            type="button"
            className={s.primary}
            disabled={busy || !reviewed || !selected.length}
            onClick={() => void apply()}
          >
            {t(
              "Apply to selected drafts",
              "Appliquer aux brouillons sélectionnés",
              "تطبيق على المسودات المحددة",
            )}{" "}
            ({selected.length})
          </button>
        </>
      )}
    </section>
  );
}
