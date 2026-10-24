"use client";
import Link from "next/link";
import p from "./production.module.css";
import { useSearchParams } from "next/navigation";
import { references } from "../model";

import { uploadConcurrency } from "../management";
import { Registry } from "./Registry";
import { useEffect, useRef, useState } from "react";
import { BASE, tr, type Data } from "../types";
import {
  Badge,
  Button,
  Empty,
  Icon,
  Pager,
  Panel,
  State,
  T,
  useUI,
  useQuery,
  mutate,
  Switch,
} from "./ui";
import s from "./workspace.module.css";
type Upload = {
  name: string;
  status: string;
  progress: number;
  assetId?: string;
  error?: string;
};
async function nativePost(path: string, body: any) {
  const r = await fetch("/api/angelcare-marketplace/admin/media" + path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const j = await r.json();
  if (!r.ok)
    throw Error(
      j.error?.message || j.message || "Native media request failed.",
    );
  return j.data || j;
}
export function MediaLibrary() {
  const { locale, boot, create, notify, refresh, open: openDossier } = useUI(),
    [page, setPage] = useState(1),
    [search, setSearch] = useState(""),
    [type, setType] = useState(""),
    [uploads, setUploads] = useState<Upload[]>([]),
    [busy, setBusy] = useState(false),
    [autoRegister, setAutoRegister] = useState(true);
  const controller = useRef<AbortController | null>(null);
  const q = useQuery<any>(
    { op: "native", type: "media", page, pageSize: 32, q: search, mime: type },
    { rows: [], total: 0 },
  );
  useEffect(() => () => controller.current?.abort(), []);
  const retainedFiles = useRef<File[]>([]);
  async function upload(files: FileList | File[] | null, retry = false) {
    if (!files?.length || busy) return;
    const list = [...files];
    const indices = retry
      ? uploads
          .map((u, i) =>
            ["failed", "cancelled", "queued"].includes(u.status) ? i : -1,
          )
          .filter((i) => i >= 0)
      : list.map((_, i) => i);
    if (!indices.length) return;
    retainedFiles.current = list;
    if (list.length > 100) {
      notify(
        tr(
          [
            "Use batches of at most 100 files.",
            "Lots de 100 fichiers maximum.",
            "الحد الأقصى 100 ملف في الدفعة.",
          ],
          locale,
        ),
        true,
      );
      return;
    }
    setBusy(true);
    setUploads((old) =>
      retry
        ? old.map((u, i) =>
            indices.includes(i)
              ? { ...u, status: "queued", error: undefined, progress: 0 }
              : u,
          )
        : list.map((f) => ({ name: f.name, status: "queued", progress: 0 })),
    );
    const abort = new AbortController();
    controller.current = abort;
    let next = 0;
    const update = (i: number, p: Partial<Upload>) =>
      setUploads((u) => u.map((v, n) => (n === i ? { ...v, ...p } : v)));
    const run = async () => {
      while (next < indices.length && !abort.signal.aborted) {
        const i = indices[next++],
          file = list[i];
        const inferred: Record<string, string> = {
          mp3: "audio/mpeg",
          pdf: "application/pdf",
          mp4: "video/mp4",
          webm: "video/webm",
          jpg: "image/jpeg",
          jpeg: "image/jpeg",
          png: "image/png",
          webp: "image/webp",
          avif: "image/avif",
          svg: "image/svg+xml",
        };
        const mimeType =
          file.type ||
          inferred[file.name.split(".").pop()?.toLowerCase() || ""] ||
          "";
        try {
          update(i, { status: "hashing" });
          const digest = await crypto.subtle.digest(
            "SHA-256",
            await file.arrayBuffer(),
          );
          const sha256 = [...new Uint8Array(digest)]
            .map((n) => n.toString(16).padStart(2, "0"))
            .join("");
          const preflight = await nativePost("/preflight", {
            files: [
              {
                fileName: file.name,
                mimeType,
                sizeBytes: file.size,
                checksumSha256: sha256,
              },
            ],
          });
          const fileCheck = preflight[0];
          if (fileCheck?.errors?.length || fileCheck?.state === "FAILED")
            throw Error(fileCheck.errors.join(" · "));
          if (fileCheck?.duplicate?.id) {
            if (autoRegister && boot.actor.rights.manage)
              await mutate({
                action: "register_media",
                nativeId: fileCheck.duplicate.id,
              });
            update(i, {
              status: "existing",
              progress: 100,
              assetId: fileCheck.duplicate.id,
            });
            continue;
          }
          const session = await nativePost("/upload-session", {
            fileName: file.name,
            mimeType,
            sizeBytes: file.size,
            checksumSha256: sha256,
            folder: "digital-customer-experience",
            title: file.name,
          });
          if (!session.uploadUrl || !session.assetId)
            throw Error(
              "Native upload session did not return an asset and signed URL.",
            );
          update(i, {
            status: "uploading",
            progress: 30,
            assetId: session.assetId,
          });
          const sent = await fetch(session.uploadUrl, {
            method: session.method || "PUT",
            body: file,
            headers: session.headers || { "Content-Type": mimeType },
            signal: abort.signal,
          });
          if (!sent.ok) throw Error("Vault upload failed: HTTP " + sent.status);
          update(i, { status: "verifying", progress: 75 });
          await nativePost("/" + session.assetId + "/complete", {
            checksumSha256: sha256,
            sizeBytes: file.size,
            mimeType,
          });
          if (autoRegister && boot.actor.rights.manage)
            await mutate({
              action: "register_media",
              nativeId: session.assetId,
            });
          update(i, { status: "ready", progress: 100 });
        } catch (e) {
          update(i, {
            status: abort.signal.aborted ? "cancelled" : "failed",
            error: (e as Error).message,
          });
        }
      }
    };
    await Promise.all(
      Array.from({ length: uploadConcurrency(boot.settings) }, () => run()),
    );
    if (abort.signal.aborted)
      setUploads((old) =>
        old.map((u) =>
          u.status === "queued" ? { ...u, status: "cancelled" } : u,
        ),
      );
    setBusy(false);
    controller.current = null;
    q.reload();
    await refresh();
  }
  async function reference(r: any) {
    try {
      await mutate({ action: "register_media", nativeId: r.id });
      notify(
        tr(
          [
            "Native asset binding registered.",
            "Lien média natif enregistré.",
            "تم تسجيل رابط الملف الأصلي.",
          ],
          locale,
        ),
      );
      await refresh();
    } catch (e) {
      notify((e as Error).message, true);
    }
  }
  const context = useSearchParams()?.get("context") || "",
    contextRecord = useQuery<any>(
      context
        ? { op: "record", id: context }
        : { op: "reference", type: "record" },
      null,
    );
  const rows = q.value.rows;
  return (
    <>
      {context && (
        <Panel title={contextRecord.value?.title || "Dossier media context"}>
          <p>
            <T
              v={[
                "This is the shared source vault. Uploads do not silently change the dossier. Open its language files to assign a verified source; the production timeline below uses this dossier.",
                "Le coffre de sources est partagé. Les uploads ne modifient jamais le dossier implicitement. Ouvrez ses fichiers de langue pour affecter une source vérifiée ; la production suit ce dossier.",
                "هذه خزنة المصادر المشتركة. لا تغير الرفعات الملف ضمنياً. افتح ملفات اللغة لتعيين مصدر متحقق؛ تتبع المعالجة هذا الملف.",
              ]}
            />
          </p>
          <Button onClick={() => openDossier(context, "delivery")}>
            <T
              v={[
                "Assign language files in this dossier",
                "Affecter les fichiers de langue du dossier",
                "تعيين ملفات اللغة لهذا الملف",
              ]}
            />
          </Button>
        </Panel>
      )}
      <div className={s.twoColumns}>
        <Panel
          title={
            <T
              v={[
                "Existing S: media vault",
                "Coffre média S: existant",
                "خزنة وسائط S: الحالية",
              ]}
            />
          }
          subtitle={
            <T
              v={[
                "Source upload → native checksum verification → governed reference. No new storage service.",
                "Source → contrôle natif du checksum → référence gouvernée. Aucun nouveau stockage.",
                "رفع المصدر ثم تحقق البصمة الأصلي ثم مرجع معتمد. دون خدمة تخزين جديدة.",
              ]}
            />
          }
        >
          <div
            className={p.uploadDrop}
            onDragOver={(e) => {
              if (boot.actor.rights.media && !busy) e.preventDefault();
            }}
            onDrop={(e) => {
              e.preventDefault();
              if (boot.actor.rights.media && !busy)
                void upload(e.dataTransfer.files);
            }}
          >
            <Icon name="CloudUpload" size={32} />
            <p>
              <T
                v={[
                  "Images, PDFs, video and MP3",
                  "Images, PDF, vidéo et MP3",
                  "صور وPDF وفيديو وMP3",
                ]}
              />
            </p>
            <input
              aria-label="Upload media sources"
              type="file"
              multiple
              accept="image/*,application/pdf,video/mp4,video/webm,audio/mpeg,.mp3"
              disabled={busy || !boot.actor.rights.media}
              onChange={(e) => upload(e.target.files)}
            />
            <Switch
              disabled={!boot.actor.rights.manage || busy}
              label={
                <T
                  v={[
                    "Register DCE source bindings automatically",
                    "Enregistrer les liens DCE automatiquement",
                    "تسجيل روابط DCE تلقائياً",
                  ]}
                />
              }
              value={autoRegister}
              onChange={setAutoRegister}
            />
            <small>
              <T
                v={[
                  "Concurrency follows native settings. Retry keeps the selected files only while this workspace stays open.",
                  "Le parallélisme suit les réglages natifs. La reprise conserve les fichiers sélectionnés tant que cet espace reste ouvert.",
                  "يتبع التوازي الإعدادات الأصلية. تحتفظ إعادة المحاولة بالملفات أثناء بقاء هذه المساحة مفتوحة فقط.",
                ]}
              />
            </small>
          </div>
          {busy && (
            <Button onClick={() => controller.current?.abort()} icon="Square">
              <T
                v={[
                  "Stop remaining uploads",
                  "Arrêter les uploads restants",
                  "إيقاف الرفعات المتبقية",
                ]}
              />
            </Button>
          )}
          {!busy &&
            uploads.some((u) =>
              ["failed", "cancelled", "queued"].includes(u.status),
            ) && (
              <Button
                disabled={
                  !retainedFiles.current.length || !boot.actor.rights.media
                }
                onClick={() => upload(retainedFiles.current, true)}
              >
                <T
                  v={[
                    "Retry failed / cancelled files",
                    "Réessayer les fichiers échoués / annulés",
                    "إعادة محاولة الملفات الفاشلة أو الملغاة",
                  ]}
                />
              </Button>
            )}
          {context && (
            <Link
              href={
                BASE +
                "/imports?context=" +
                encodeURIComponent(context) +
                "&task=media"
              }
            >
              <T
                v={[
                  "Prepare media associations for this dossier",
                  "Préparer les associations média de ce dossier",
                  "تحضير روابط الوسائط لهذا الملف",
                ]}
              />
            </Link>
          )}
          {uploads.map((u, i) => (
            <div className={s.rowCard} key={i}>
              <strong>{u.name}</strong>
              <Badge
                tone={
                  u.status === "failed"
                    ? "pink"
                    : u.status === "ready"
                      ? "green"
                      : "blue"
                }
              >
                {u.status}
              </Badge>
              <progress
                aria-label={u.name + " · " + u.status}
                max={1}
                value={["ready", "existing"].includes(u.status) ? 1 : undefined}
              />
              {u.assetId && (
                <>
                  <small className={s.longText}>{u.assetId}</small>
                  <Button
                    onClick={async () => {
                      try {
                        await navigator.clipboard.writeText(u.assetId!);
                        notify(
                          tr(
                            [
                              "Native asset ID copied",
                              "Identifiant média copié",
                              "تم نسخ معرف الوسائط",
                            ],
                            locale,
                          ),
                        );
                      } catch {
                        notify(u.assetId!);
                      }
                    }}
                  >
                    <T
                      v={[
                        "Copy native asset ID",
                        "Copier l’identifiant média",
                        "نسخ معرف الوسائط",
                      ]}
                    />
                  </Button>
                </>
              )}
              {u.error && <p role="alert">{u.error}</p>}
            </div>
          ))}
        </Panel>
        <Panel
          title={
            <T
              v={[
                "Rights, renditions & dependencies",
                "Droits, renditions & dépendances",
                "الحقوق والنسخ والاعتماديات",
              ]}
            />
          }
        >
          <div className={s.helpList}>
            <div>
              <h3>
                <T
                  v={[
                    "Keep source and renditions distinct",
                    "Séparer source et renditions",
                    "فصل المصدر والنسخ",
                  ]}
                />
              </h3>
              <p>
                <T
                  v={[
                    "The native vault owns bytes, checksums and delivery. DCE stores bindings and rights decisions.",
                    "Le coffre natif gère les fichiers, checksums et livraison. DCE conserve les liens et droits.",
                    "تملك الخزنة الأصلية الملفات والبصمات والتسليم. تخزن DCE الروابط والحقوق.",
                  ]}
                />
              </p>
            </div>
            <div>
              <h3>
                <T
                  v={[
                    "Private attachments",
                    "Pièces privées",
                    "المرفقات الخاصة",
                  ]}
                />
              </h3>
              <p>
                <T
                  v={[
                    "Customer submissions must not reuse public media URLs. Configure the protected receiving authority before enabling private upload.",
                    "Les pièces client ne réutilisent pas les URL publiques. Une réception privée est requise.",
                    "لا تستخدم المرفقات روابط عامة. يجب تهيئة جهة استقبال محمية.",
                  ]}
                />
              </p>
            </div>
            <div>
              <h3>
                <T
                  v={[
                    "Processing evidence",
                    "Preuves de traitement",
                    "دليل المعالجة",
                  ]}
                />
              </h3>
              <p>
                <T
                  v={[
                    "Dimensions, duration, pages and transcription appear only when produced by the native processing pipeline. No fake conversion status.",
                    "Dimensions, durée, pages et transcription reflètent les traitements natifs réels.",
                    "تظهر الأبعاد والمدة والصفحات والنص عند إنتاجها فعلياً من المعالجة الأصلية.",
                  ]}
                />
              </p>
            </div>
          </div>
          <Button
            onClick={() => create("asset")}
            disabled={!boot.actor.rights.manage}
            icon="Link"
          >
            <T
              v={[
                "Register an existing source",
                "Lier une source existante",
                "ربط مصدر حالي",
              ]}
            />
          </Button>
        </Panel>
      </div>
      <Panel
        title={
          <T
            v={[
              "Native media inventory",
              "Registre média natif",
              "مخزون الوسائط الأصلي",
            ]}
          />
        }
        className=""
        actions={
          <Button onClick={q.reload} icon="RotateCcw">
            <T v={["Refresh", "Actualiser", "تحديث"]} />
          </Button>
        }
      >
        <div className={s.toolbar}>
          <input
            aria-label="Search all media"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder={tr(
              [
                "Search all sources",
                "Rechercher toutes les sources",
                "البحث في كل المصادر",
              ],
              locale,
            )}
          />
          <select
            value={type}
            aria-label="Media type"
            onChange={(e) => {
              setType(e.target.value);
              setPage(1);
            }}
          >
            <option value="">All</option>
            {["image/", "application/pdf", "video/", "audio/"].map((v) => (
              <option key={v}>{v}</option>
            ))}
          </select>
        </div>
        <State {...q} retry={q.reload}>
          <div className={s.mediaGrid}>
            {rows.map((r: any) => (
              <article className={s.mediaCard} key={r.id}>
                <div className={s.cover}>
                  {r.mime?.startsWith("image/") && r.url ? (
                    <img src={r.url} alt="" loading="lazy" />
                  ) : (
                    <Icon
                      name={
                        r.mime?.startsWith("audio/")
                          ? "AudioLines"
                          : r.mime === "application/pdf"
                            ? "FileText"
                            : "Film"
                      }
                      size={35}
                    />
                  )}
                </div>
                <strong>{r.title}</strong>
                <small>
                  {r.mime} ·{" "}
                  {Number.isFinite(Number(r.size)) && Number(r.size) > 0
                    ? (Number(r.size) / 1024 / 1024).toFixed(2) + " MB"
                    : tr(
                        [
                          "Size unavailable",
                          "Taille indisponible",
                          "الحجم غير متاح",
                        ],
                        locale,
                      )}
                </small>
                <small>
                  {r.status} · {r.rights || "rights not classified"}
                </small>
                <p className={s.chartCaption}>
                  {r.metadata?.width &&
                    `${r.metadata.width}×${r.metadata.height}`}{" "}
                  {r.metadata?.duration && `${r.metadata.duration}s`}{" "}
                  {r.metadata?.pages && `${r.metadata.pages}p`}
                </p>
                <Button
                  disabled={!boot.actor.rights.manage}
                  onClick={() => reference(r)}
                  icon="Link"
                >
                  <T
                    v={["Register binding", "Créer le lien", "تسجيل الرابط"]}
                  />
                </Button>
              </article>
            ))}
          </div>
          {!rows.length && (
            <Empty
              title={
                <T
                  v={[
                    "No matching source files",
                    "Aucune source correspondante",
                    "لا توجد ملفات مطابقة",
                  ]}
                />
              }
            />
          )}
          <Pager total={q.value.total} page={page} size={32} onPage={setPage} />
        </State>
      </Panel>
      <Panel
        title={
          <T
            v={[
              "Governed DCE media dossiers",
              "Dossiers média DCE gouvernés",
              "ملفات وسائط DCE المحكومة",
            ]}
          />
        }
      >
        <Registry kind="asset" />
      </Panel>
    </>
  );
}
