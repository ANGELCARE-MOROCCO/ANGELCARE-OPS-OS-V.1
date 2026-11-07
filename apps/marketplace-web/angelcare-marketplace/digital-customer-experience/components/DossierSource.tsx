"use client";
import { useRef, useState } from "react";
import {
  attachInteractivePackage,
  packageForLocale,
} from "../delivery-contract";
import { blankRecord } from "../model";
import { familyByKey } from "../registry";
import { object, text, tr, type DceRecord, type Locale } from "../types";
import { NativeSourceImport } from "./NativeSourceImport";
import { UniversalInteractiveImport } from "./UniversalInteractiveImport";
import { Button, query, useReceiptMutation, useUI, T } from "./ui";
import s from "./dossier-workspace.module.css";
export function DossierSource({
  record,
  language,
  readOnly,
  onChange,
  onTarget,
  onSave,
  onNavigate,
  onData,
  onBusy,
}: {
  record: Partial<DceRecord>;
  language: Locale;
  readOnly: boolean;
  onChange: (r: Partial<DceRecord>) => void;
  onData: (p: import("../types").Data) => void;
  onBusy: (v: boolean) => void;
  onTarget: (r: DceRecord) => void;
  onSave: () => Promise<DceRecord | undefined>;
  onNavigate: (tab: string) => void;
}) {
  const { locale, boot, open } = useUI(),
    t = (en: string, fr: string, ar: string) => tr([en, fr, ar], locale),
    mutate = useReceiptMutation();
  const [pending, setPending] = useState<any>(null),
    [receipts, setReceipts] = useState<
      { id: string; title: string; revision: number }[]
    >([]);
  const latest = useRef(record);
  latest.current = record;
  const family = familyByKey(record.family || "");
  if (!family) return null;
  function attach(pkg: any, reviewed = false) {
    const record = latest.current;
    if (pkg.family !== record.family || pkg.locale !== language)
      throw Error("PACKAGE_CATEGORY_OR_LANGUAGE_MISMATCH");
    const target = pkg.targetRecord as DceRecord | undefined,
      declared = text(object(pkg.manifest?.catalogue).collection_key);
    if (
      (pkg.recordId && pkg.recordId !== record.id) ||
      (record.id &&
        ((target && target.id !== record.id) ||
          (declared && declared !== record.key)) &&
        !reviewed)
    ) {
      setPending(pkg);
      throw Error("PACKAGE_TARGET_DECISION_REQUIRED");
    }
    if (pkg.recordId && pkg.recordId !== record.id)
      throw Error("PACKAGE_ALREADY_BOUND_TO_OTHER_DOSSIER");
    if (!record.id && target) {
      onTarget(target);
      onChange(attachInteractivePackage(target, pkg, family!));
    } else onChange(attachInteractivePackage(record, pkg, family!));
    setPending(null);
  }
  async function batchAttach(pkg: any) {
    const response = await fetch(
      "/api/angelcare-marketplace/admin/digital-customer-experience/interactive-package?" +
        new URLSearchParams({ operation: "info", id: pkg.id }),
      { credentials: "same-origin", cache: "no-store" },
    );
    const json = await response.json();
    if (!response.ok) throw Error(json.error || "PACKAGE_TARGET_LOOKUP_FAILED");
    const info = json.data;
    if (info.family !== record.family || info.locale !== language)
      throw Error("BATCH_CONTEXT_MISMATCH");
    const base =
        info.targetRecord ||
        blankRecord("experience", family!.key, language, boot.settings),
      next = attachInteractivePackage(base, info, family!);
    const saved = await mutate<any>({
      action: "save",
      id: base.id,
      revision: base.revision || 0,
      record: next,
    });
    setReceipts((rows) => [
      ...rows.filter((r) => r.id !== saved.record.id),
      {
        id: saved.record.id,
        title: saved.record.title,
        revision: saved.record.revision,
      },
    ]);
  }
  return (
    <div className={s.gate}>
      <div className={s.gateHeader}>
        <div>
          <h2>
            {t(
              "Bring your complete experience",
              "Ajouter votre expérience complète",
              "أضف تجربتك الكاملة",
            )}
          </h2>
          <p>
            {t(
              "HTML ZIPs keep their own layout and interactions. Native sources remain available for every category.",
              "Les ZIP HTML conservent leur mise en page et leurs interactions. Les sources natives restent disponibles pour chaque catégorie.",
              "تحفظ حزم HTML تصميمها وتفاعلاتها. تبقى المصادر الأصلية متاحة لكل فئة.",
            )}
          </p>
        </div>
        <Button onClick={() => onNavigate("content")}>
          <T
            v={[
              "Native content & collections",
              "Contenu et collections natifs",
              "المحتوى والمجموعات الأصلية",
            ]}
          />
        </Button>
      </div>
      {pending && (
        <div className={s.issue} role="alert">
          <h3>
            {t(
              "Choose the correct catalogue target",
              "Choisir la bonne destination catalogue",
              "اختر وجهة الكتالوج الصحيحة",
            )}
          </h3>
          <p>
            {t("Current dossier", "Dossier actuel", "الملف الحالي")} :{" "}
            {record.title} · {record.key}
          </p>
          <p>
            {t("Package declaration", "Déclaration du package", "تعريف الحزمة")}{" "}
            :{" "}
            {text(object(pending.manifest?.catalogue).collection_key) ||
              pending.title}
          </p>
          <div className={s.actions}>
            {pending.targetRecord && (
              <Button
                onClick={() =>
                  open(pending.targetRecord.id, "source", language)
                }
              >
                <T
                  v={[
                    "Open matching dossier",
                    "Ouvrir le dossier correspondant",
                    "فتح الملف المطابق",
                  ]}
                />
              </Button>
            )}
            {!pending.recordId && (
              <Button disabled={readOnly} onClick={() => attach(pending, true)}>
                <T
                  v={[
                    "I reviewed this mapping · use current dossier",
                    "Correspondance vérifiée · utiliser ce dossier",
                    "راجعت المطابقة · استخدم هذا الملف",
                  ]}
                />
              </Button>
            )}
            <Button onClick={() => setPending(null)}>
              <T
                v={[
                  "Keep current source",
                  "Conserver la source actuelle",
                  "احتفظ بالمصدر الحالي",
                ]}
              />
            </Button>
          </div>
        </div>
      )}
      <div
        className={s.actions}
        role="group"
        aria-label={t("Delivery profile", "Profil de diffusion", "ملف العرض")}
      >
        <Button
          disabled={readOnly}
          kind={
            packageForLocale(object(record.data), language).id &&
            object(record.data?.delivery).kind !== "native"
              ? "primary"
              : "secondary"
          }
          onClick={() =>
            onData({
              delivery: { ...object(record.data?.delivery), kind: "html" },
            })
          }
        >
          <T v={["HTML experience", "Expérience HTML", "تجربة HTML"]} />
        </Button>
        <Button
          disabled={readOnly}
          kind={
            object(record.data?.delivery).kind === "native"
              ? "primary"
              : "secondary"
          }
          onClick={() =>
            onData({
              delivery: { ...object(record.data?.delivery), kind: "native" },
            })
          }
        >
          <T
            v={[
              "Native category player",
              "Lecteur natif de la catégorie",
              "مشغل الفئة الأصلي",
            ]}
          />
        </Button>
      </div>
      <NativeSourceImport
        record={record}
        language={language}
        disabled={
          readOnly || object(object(record.data).delivery).kind === "html"
        }
        onPersisted={onTarget}
        onBusy={onBusy}
      />
      <UniversalInteractiveImport
        embedded
        currentAgeMin={typeof record.data?.ageMin==="number"?record.data.ageMin:undefined}
        currentAgeMax={typeof record.data?.ageMax==="number"?record.data.ageMax:undefined}
        onUseDeclaredAudience={(ageMin,ageMax)=>onData({ageMin,ageMax})}
        onPreview={()=>onNavigate("preview")}
        locale={language}
        family={family.key}
        canManage={!readOnly}
        attached={packageForLocale(object(record.data), language)}
        recordId={record.id}
        currentTitle={record.title}
        coverAssetId={text(record.data?.coverAssetId)}
        onTitleChange={(title) => onChange({ title })}
        onAttach={(pkg) => attach(pkg)}
        onBatchAttach={batchAttach}
        onCover={(coverAssetId) => onData({ coverAssetId })}
        onSaveDraft={async () => {
          if (!(await onSave())) throw Error("DRAFT_SAVE_FAILED");
        }}
        onContinue={() => onNavigate("delivery")}
        onOpenDossier={() => onNavigate("overview")}
      />
      {!!receipts.length && (
        <div className={s.receipt}>
          <h3>
            {t(
              "Saved batch drafts",
              "Brouillons du lot enregistrés",
              "مسودات الدفعة المحفوظة",
            )}
          </h3>
          {receipts.map((r) => (
            <p key={r.id}>
              {r.title} · r{r.revision}{" "}
              <Button onClick={() => open(r.id, "delivery", language)}>
                <T v={["Open checks", "Ouvrir les contrôles", "فتح الفحوص"]} />
              </Button>
            </p>
          ))}
        </div>
      )}
    </div>
  );
}
