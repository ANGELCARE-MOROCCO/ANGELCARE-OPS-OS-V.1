"use client";
import { useEffect, useRef, useState } from "react";
import {
  appendSource,
  applyCreationMedia,
  CREATION_PLANS,
  mimeFor,
  newCreation,
} from "../creation-model";
import {
  fileChecksum,
  queueFile,
  uploadCreationFile,
  type UploadCheckpoint,
} from "../creation-upload";
import { array, object, text, tr, type DceRecord, type Locale } from "../types";
import { Button, T, useUI, useWorkingState, useReceiptMutation } from "./ui";
import s from "./dossier-workspace.module.css";
type Transfer = UploadCheckpoint & { recordId?: string; saved?: boolean; saveRecord?:Partial<DceRecord>;saveRequestId?:string };
/** Native uploads use the existing signed media authority; their exact placements survive retries. */
export function NativeSourceImport({
  record,
  language,
  disabled,
  onPersisted,
  onBusy,
}: {
  record: Partial<DceRecord>;
  language: Locale;
  disabled: boolean;
  onPersisted: (r: DceRecord) => void;
  onBusy: (v: boolean) => void;
}) {
  const { locale, boot, open } = useUI(),
    t = (en: string, fr: string, ar: string) => tr([en, fr, ar], locale),
    mutate = useReceiptMutation();
  const initialKey = useRef(record.id || record.key || "new"),
    [receipts, setReceipts] = useWorkingState<Transfer[]>(
      "native-source." + initialKey.current + "." + language,
      [],
    ),
    [separate, setSeparate] = useState(false),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    input = useRef<HTMLInputElement>(null),
    controller = useRef<AbortController | null>(null);
  useEffect(() => () => controller.current?.abort(), []);
  const plan = CREATION_PLANS[record.family || ""],
    accept = (plan?.accept || "")
      .split(",")
      .filter((m) => !m.startsWith("image/") || m === "image/png")
      .join(",");
  async function add(files: File[]) {
    if (disabled || busy || !plan) return;
    if (files.length > 40) {
      setError(
        t(
          "Choose up to 40 files.",
          "Choisissez au maximum 40 fichiers.",
          "اختر حتى 40 ملفاً.",
        ),
      );
      return;
    }
    setBusy(true);
    onBusy(true);
    setError("");
    controller.current = new AbortController();
    let current = record;
    const update = (checkpoint: Transfer) =>
      setReceipts((rows) => [
        ...rows.filter((r) => r.id !== checkpoint.id),
        checkpoint,
      ]);
    try {
      for (const file of files) {
        const mime = mimeFor(file.name, file.type);
        if (
          !accept
            .split(",")
            .some((m) => (m.endsWith("/") ? mime.startsWith(m) : mime === m))
        )
          throw Error(
            t(
              "This source is incompatible with this category: ",
              "Cette source est incompatible avec cette catégorie : ",
              "المصدر غير متوافق مع هذه الفئة: ",
            ) + file.name,
          );
        const previous = receipts.find(
          (r) => r.name === file.name && r.size === file.size && !r.saved,
        );
        let base = separate
          ? newCreation(record.family!, language, boot.settings, {
              audience: record.audience,
              topic: record.topic,
              data: {
                subtype: record.data?.subtype || "",
                ageMin: record.data?.ageMin ?? 0,
                ageMax: record.data?.ageMax ?? 18,
              },
            })
          : current;
        if (previous?.saveRecord && previous.saveRequestId) {
          if ((await fileChecksum(file)) !== previous.checksum)
            throw Error("RESELECT_ORIGINAL_FILE_CHECKSUM_MISMATCH");
          const saved = await mutate<any>({
            action: "save",
            id: previous.saveRecord.id,
            revision: previous.saveRecord.revision || 0,
            record: previous.saveRecord,
            requestId: previous.saveRequestId,
          });
          update({ ...previous, recordId: saved.record.id, saved: true });
          if (!separate) {
            current = saved.record;
            onPersisted(saved.record);
          }
          continue;
        }
        let placement = previous;
        // A recovered upload keeps its original unit only if it still belongs to this dossier.
        if (
          !placement ||
          !array(object(base.data)[placement.collection]).some(
            (u) => u.id === placement!.unit,
          )
        ) {
          const appended = appendSource(
            base,
            { name: file.name, mime },
            language,
          );
          base = appended.record;
          placement = {
            ...queueFile(file, {
              resource: base.id || text(base.key),
              collection: appended.collection,
              unit: text(appended.unit.id),
              field: "assetId",
              locale: language,
            }),
            ...(previous
              ? {
                  checksum: previous.checksum,
                  assetId: previous.assetId,
                  uploaded: previous.uploaded,
                }
              : {}),
          };
        }
        update(placement);
        const uploaded = await uploadCreationFile(
          file,
          placement,
          (patch) => {
            placement = { ...placement!, ...patch };
            update(placement);
          },
          controller.current.signal,
        );
        if (!uploaded.assetId) throw Error("NATIVE_SOURCE_REGISTRATION_FAILED");
        const next = applyCreationMedia(
            base,
            uploaded,
            uploaded.assetId,
            uploaded,
          ),
          saveRequestId = crypto.randomUUID();
        update({ ...uploaded, saveRecord: next, saveRequestId });
        const saved = await mutate<any>({
          requestId: saveRequestId,
          action: "save",
          id: base.id,
          revision: base.revision || 0,
          record: next,
        });
        update({
          ...uploaded,
          saveRecord: next,
          saveRequestId,
          recordId: saved.record.id,
          saved: true,
        });
        if (!separate) {
          current = saved.record;
          onPersisted(saved.record);
        }
      }
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
      onBusy(false);
    }
  }
  if (!accept) return null;
  return (
    <details className={s.tools}>
      <summary>
        {t(
          "Native files · PDF, PNG, video or audio",
          "Fichiers natifs · PDF, PNG, vidéo ou audio",
          "الملفات الأصلية · PDF وPNG والفيديو والصوت",
        )}
      </summary>
      <p>
        {t(
          "Compatible files become real native units. Existing catalogue identity, fields and source designs are retained.",
          "Les fichiers compatibles deviennent des unités natives réelles. L’identité catalogue, les champs et les designs sources sont conservés.",
          "تصبح الملفات المتوافقة وحدات أصلية فعلية. تُحفظ هوية الكتالوج والحقول وتصاميم المصادر.",
        )}
      </p>
      <div className={s.actions}>
        <label>
          <input
            type="checkbox"
            checked={separate}
            disabled={busy || disabled}
            onChange={(e) => setSeparate(e.target.checked)}
          />
          {t(
            "Create one draft per file",
            "Créer un brouillon par fichier",
            "إنشاء مسودة لكل ملف",
          )}
        </label>
        <input
          ref={input}
          type="file"
          hidden
          multiple
          accept={accept}
          onChange={(e) => {
            void add(Array.from(e.target.files || []));
            e.target.value = "";
          }}
        />
        <Button
          kind="primary"
          disabled={disabled || busy}
          onClick={() => input.current?.click()}
        >
          <T
            v={[
              "Add compatible sources",
              "Ajouter les sources compatibles",
              "إضافة مصادر متوافقة",
            ]}
          />
        </Button>
        {busy && (
          <Button onClick={() => controller.current?.abort()}>
            <T
              v={[
                "Pause transfers",
                "Suspendre les transferts",
                "إيقاف النقل مؤقتاً",
              ]}
            />
          </Button>
        )}
      </div>
      {receipts.length > 0 && (
        <>
          <p>
            {receipts.filter((r) => r.saved).length}/{receipts.length}{" "}
            {t("saved placements", "emplacements enregistrés", "مواضع محفوظة")}
          </p>
          {receipts.map((r) => (
            <div className={s.evidence} key={r.id}>
              <strong>{r.name}</strong> ·{" "}
              {r.saved ? t("Saved", "Enregistré", "محفوظ") : r.state} ·{" "}
              {r.progress}%{r.error && <p role="alert">{r.error}</p>}
              {r.saved && r.recordId && (
                <Button onClick={() => open(r.recordId!, "delivery", language)}>
                  <T
                    v={["Open checks", "Ouvrir les contrôles", "فتح الفحوص"]}
                  />
                </Button>
              )}
            </div>
          ))}
          <p>
            {t(
              "To resume an unfinished transfer after reopening, reselect the original file. Its checksum is checked before reuse.",
              "Pour reprendre un transfert après réouverture, resélectionnez le fichier original. Son empreinte est contrôlée avant réutilisation.",
              "لاستئناف نقل غير مكتمل بعد إعادة الفتح، اختر الملف الأصلي. تُفحص بصمته قبل إعادة الاستخدام.",
            )}
          </p>
        </>
      )}
      {error && (
        <p className={s.error} role="alert">
          {error}
        </p>
      )}
    </details>
  );
}
