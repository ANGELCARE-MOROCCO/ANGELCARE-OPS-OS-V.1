"use client";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  Images,
  Search,
  Upload,
  ChevronLeft,
  ChevronRight,
  Undo2,
  Redo2,
  Eye,
  Save,
  Send,
  Monitor,
  Tablet,
  Smartphone,
  MousePointer2,
  ExternalLink,
  Lock,
  ArrowUp,
  ArrowDown,
  Trash2,
  Plus,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  X,
  Copy,
  History,
  SlidersHorizontal,
} from "lucide-react";
import {
  useUI,
  query,
  mutate,
} from "../../digital-customer-experience/components/ui";
import { WORLDS, path } from "../catalogue";
import { NativeImagePicker } from "../StudioPickers";
import { Atlas } from "../home-reference/HomeShell";
import { ArtIcon } from "../documents/DocumentShell";
import { Art } from "../storefront-reference/CategoryShell";
import { BadgeIcon } from "./Runtime";
import { BatchTools, CopyPageImagery } from "./BatchTools";
import { pageSlots, type Slot } from "./registry";
import {
  PAGES,
  ICONS,
  PRESETS,
  emptyConfig,
  placement,
  newId,
  newBadge,
  normalizeConfig,
  type Config,
  type Scene,
  type Badge,
  type Placement,
} from "./model";
import s from "./studio.module.css";
const stringify = (v: unknown) => JSON.stringify(v);
function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className={s.field}>
      <span>{label}</span>
      {children}
    </label>
  );
}
function Toggle({
  label,
  value,
  onChange,
  disabled = false,
}: {
  label: string;
  value: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <label className={s.toggle}>
      <span>{label}</span>
      <input
        type="checkbox"
        role="switch"
        checked={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.checked)}
      />
    </label>
  );
}
function Thumbnail({ slot, src }: { slot: Slot; src?: string }) {
  if (src || slot.source)
    return <img src={src || slot.source} alt="" loading="lazy" />;
  const a = slot.art;
  if (!a) return <Images size={25} />;
  if (a.kind === "home")
    return (
      <Atlas sheet={a.sheet || "icons"} cell={a.index} rows={a.rows || 4} />
    );
  if (a.kind === "documents") return <ArtIcon index={a.index} />;
  if (a.sheet)
    return (
      <span
        style={{
          display: "block",
          width: "100%",
          height: "100%",
          backgroundImage: `url(/kidflix/categories-reference-r1/${a.sheet}.png)`,
          backgroundSize: "500% auto",
          backgroundPosition: `${a.index * 25}% 60%`,
        }}
      />
    );
  return <Art index={a.index} />;
}
const title = (page: string) =>
  page === "home"
    ? "Homepage"
    : page === "shared"
      ? "Shared category navigation"
      : WORLDS.find((w) => w.key === page)?.title[0] || page;
type UploadItem = {
  id: string;
  name: string;
  state: string;
  progress: number;
  error?: string;
  file: File;
  page: string;
  slot: string;
  mobileFor?: string;
};
async function nativePost(url: string, data: any) {
  const r = await fetch("/api/angelcare-marketplace/admin/media" + url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  const j = await r.json();
  if (!r.ok)
    throw Error(j.error?.message || j.message || "Media request failed.");
  return j.data || j;
}
export function ImageryStudio() {
  const { boot, open: openDossier } = useUI(),
    canEdit = boot.actor.rights.manage,
    canPublish = boot.actor.rights.publish;
  const [scopeKey, setScopeKey] = useState(""),
    [page, setPage] = useState("home"),
    [directory, setDirectory] = useState(true),
    [summaries, setSummaries] = useState<any[]>([]),
    [config, setConfig] = useState<Config>(emptyConfig),
    [shared, setShared] = useState<Config>(emptyConfig),
    [live, setLive] = useState<Config>(emptyConfig),
    [saved, setSaved] = useState<Config>(emptyConfig),
    [revision, setRevision] = useState(0),
    [draftHash, setDraftHash] = useState(""),
    [selected, setSelected] = useState("home.opening.hero"),
    [queryText, setQueryText] = useState(""),
    [filter, setFilter] = useState("all"),
    [tab, setTab] = useState("images"),
    [device, setDevice] = useState(1440),
    [editing, setEditing] = useState(true),
    [before, setBefore] = useState(false),
    [busy, setBusy] = useState(false),
    [loading, setLoading] = useState(true),
    [error, setError] = useState(""),
    [message, setMessage] = useState(""),
    [review, setReview] = useState(false),
    [history, setHistory] = useState<any[] | null>(null),
    [undo, setUndo] = useState<Config[]>([]),
    [redo, setRedo] = useState<Config[]>([]),
    [uploads, setUploads] = useState<UploadItem[]>([]),
    [frameReady, setFrameReady] = useState(false),
    [rendered, setRendered] = useState<string[]>([]),
    [slideId, setSlideId] = useState(""),
    [mobilePick, setMobilePick] = useState(false),
    [badgeSearch, setBadgeSearch] = useState(""),
    [copyOpen, setCopyOpen] = useState(false),
    [targets, setTargets] = useState<string[]>([]),
    [favourites, setFavourites] = useState<string[]>([]),
    [recover, setRecover] = useState<Config | null>(null),
    [publishTargets, setPublishTargets] = useState<string[]>([]);
  const frame = useRef<HTMLIFrameElement>(null),
    stage = useRef<HTMLDivElement>(null),
    [stageWidth, setStageWidth] = useState(700),
    drag = useRef(""),
    activePage = useRef(page),
    activeSlot = useRef(selected),
    queue = useRef<UploadItem[]>([]),
    uploading = useRef(false),
    alive = useRef(true);
  activePage.current = page;
  activeSlot.current = selected;
  const storageKey =
    "kidflix.imagery.draft.v1." + boot.actor.id + "." + scopeKey + "." + page;
  const slots = useMemo(() => pageSlots(page), [page]),
    descriptor = slots.find((x) => x.id === selected) || slots[0],
    current = config.slots[descriptor?.id] || placement(),
    images = current.images,
    image = images.find((x) => x.id === slideId) || images[0],
    dirty = stringify(config) !== stringify(saved),
    changed = [
      ...new Set([...Object.keys(config.slots), ...Object.keys(live.slots)]),
    ].filter((k) => stringify(config.slots[k]) !== stringify(live.slots[k]));
  const read = useCallback(
    async (p: string) => {
      setLoading(true);
      setError("");
      try {
        const v = await query<any>({ op: "kidflix_imagery", page: p });
        if (activePage.current !== p) return;
        if (typeof v.scopeKey !== "string" || !v.scopeKey)
          throw Error(
            "Workspace scope is unavailable. Reload before editing imagery.",
          );
        setScopeKey(v.scopeKey);
        setConfig(v.draft);
        setSaved(v.draft);
        setLive(v.live);
        setRevision(v.record?.revision || 0);
        setDraftHash(v.draftHash);
        setUndo([]);
        setRedo([]);
        setRendered([]);
        try {
          const raw = localStorage.getItem(
            "kidflix.imagery.draft.v1." +
              boot.actor.id +
              "." +
              v.scopeKey +
              "." +
              p,
          );
          const stored = raw ? JSON.parse(raw) : null;
          setRecover(
            stored && stringify(stored.config) !== stringify(v.draft)
              ? normalizeConfig(stored.config, p)
              : null,
          );
        } catch {
          setRecover(null);
        }
      } catch (e) {
        if (activePage.current === p) setError((e as Error).message);
      } finally {
        if (activePage.current === p) setLoading(false);
      }
    },
    [boot.actor.id],
  );
  useEffect(() => {
    void read(page);
    setFrameReady(false);
    setSelected(pageSlots(page)[0]?.id || "");
    setHistory(null);
    setSlideId("");
    setReview(false);
  }, [page, read]);
  useEffect(() => {
    alive.current = true;
    query<any>({ op: "kidflix_imagery", page: "shared" })
      .then((v) => setShared(v.live))
      .catch(() => {});
    query<any>({ op: "kidflix_imagery", page: "all" })
      .then((v) => setSummaries(v.pages))
      .catch(() => {});
    try {
      setFavourites(
        JSON.parse(
          localStorage.getItem("kidflix.imagery.badge-favourites") || "[]",
        ),
      );
    } catch {}
    return () => {
      alive.current = false;
    };
  }, []);
  useEffect(() => {
    if (!stage.current) return;
    const ro = new ResizeObserver(([e]) => setStageWidth(e.contentRect.width));
    ro.observe(stage.current);
    return () => ro.disconnect();
  }, [directory]);
  useEffect(() => {
    if (loading || !dirty || !scopeKey) return;
    const timer = setTimeout(() => {
      try {
        localStorage.setItem(
          storageKey,
          stringify({ config, revision, at: Date.now() }),
        );
      } catch {
        setMessage(
          "Browser draft recovery is unavailable. Save your draft to retain it.",
        );
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [config, dirty, loading, storageKey, revision]);
  const send = useCallback(() => {
    frame.current?.contentWindow?.postMessage(
      {
        type: "kidflix-imagery-preview",
        page: page === "shared" ? "home" : page,
        config: before ? live : config,
        shared: page === "shared" ? (before ? live : config) : shared,
        selected,
        sceneId: slideId,
        editing,
      },
      location.origin,
    );
  }, [page, config, live, shared, before, selected, slideId, editing]);
  useEffect(() => {
    if (frameReady) send();
  }, [frameReady, send]);
  useEffect(() => {
    const receive = (e: MessageEvent) => {
      if (
        e.origin !== location.origin ||
        e.source !== frame.current?.contentWindow
      )
        return;
      const v = e.data;
      if (v?.type === "kidflix-imagery-ready") {
        setFrameReady(true);
        send();
      }
      if (
        v?.type === "kidflix-imagery-owned" &&
        /^[0-9a-f]{8}-[0-9a-f-]{27}$/i.test(v.record || "")
      ) {
        setMessage(
          "Resource-owned cover selected. Opening its native source dossier.",
        );
        openDossier(v.record);
        return;
      }
      if (v?.type === "kidflix-imagery-select") {
        if (v.id?.startsWith("shared.") && page !== "shared") {
          setMessage(
            "This image is shared. Open Shared category navigation to edit it consistently.",
          );
          return;
        }
        setSelected(v.id);
        setSlideId("");
      }
      if (v?.type === "kidflix-imagery-slots")
        setRendered(v.slots.map((d: any) => d.id));
    };
    addEventListener("message", receive);
    return () => removeEventListener("message", receive);
  }, [send, page]);
  function edit(next: Config) {
    if (!canEdit) return;
    setUndo((old) => [...old.slice(-39), config]);
    setRedo([]);
    setConfig(next);
    setMessage("");
  }
  function patch(value: Partial<Placement>) {
    edit({
      ...config,
      slots: { ...config.slots, [descriptor.id]: { ...current, ...value } },
    });
  }
  function patchImage(value: Partial<Scene>) {
    if (image)
      patch({
        images: images.map((i) => (i.id === image.id ? { ...i, ...value } : i)),
      });
  }
  function addAsset(
    asset: { id: string; url: string; title: string },
    mobile = false,
  ) {
    if (mobile && image) {
      patchImage({ mobile: asset.url, mobileAssetId: asset.id });
      return;
    }
    if (images.length >= 12) {
      setError("Use up to twelve images.");
      return;
    }
    const next: Scene = {
      id: newId(),
      src: asset.url,
      assetId: asset.id,
      mobile: "",
      mobileAssetId: "",
      enabled: true,
      alt: asset.title,
      focal: { x: 50, y: 50 },
      mobileFocal: { x: 50, y: 50 },
      fit: "cover",
      zoom: 1,
      mobileZoom: 1,
      duration: 0,
    };
    patch({ images: descriptor.sequence ? [...images, next] : [next] });
    setSlideId(next.id);
  }
  async function operate(action: string, extra: any = {}) {
    setBusy(true);
    setError("");
    try {
      let value = config;
      if (action === "kidflix_imagery_save")
        value = normalizeConfig(config, page);
      const r = await mutate<any>({
        action,
        requestId: newId(),
        page,
        revision,
        ...(action === "kidflix_imagery_save" ? { config: value } : {}),
        ...(action === "kidflix_imagery_publish" ? { draftHash } : {}),
        ...extra,
      } as any);
      const record = r.record;
      if (record) {
        setRevision(record.revision);
        setConfig(record.data.draft || emptyConfig());
        setSaved(record.data.draft || emptyConfig());
        setLive(record.data.live || emptyConfig());
        setDraftHash(r.draftHash || "");
      } else await read(page);
      try {
        localStorage.removeItem(storageKey);
      } catch {}
      setRecover(null);
      setReview(false);
      setMessage(
        action === "kidflix_imagery_publish"
          ? "Page imagery published. Other page drafts were not published."
          : action === "kidflix_imagery_restore"
            ? "Version restored as a draft. Preview before publishing."
            : "Draft saved to the native workspace.",
      );
      const v = await query<any>({ op: "kidflix_imagery", page: "all" });
      setSummaries(v.pages);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  function changePage(next: string) {
    if (dirty) {
      setMessage("Save or discard your unsaved changes before changing pages.");
      return;
    }
    setPage(next);
    setDirectory(false);
  }
  function reorder(id: string, target: string) {
    const a = images.findIndex((i) => i.id === id),
      b = images.findIndex((i) => i.id === target);
    if (a < 0 || b < 0 || a === b) return;
    const next = [...images];
    next.splice(b, 0, next.splice(a, 1)[0]);
    patch({ images: next });
  }
  async function processQueue() {
    if (uploading.current) return;
    uploading.current = true;
    for (const item of queue.current) {
      if (item.state !== "queued") continue;
      const update = (p: Partial<UploadItem>) => {
        Object.assign(item, p);
        if (alive.current) setUploads([...queue.current]);
      };
      try {
        update({ state: "hashing", progress: 5, error: undefined });
        if (
          !["image/png", "image/jpeg", "image/webp", "image/avif"].includes(
            item.file.type,
          ) ||
          item.file.size > 30 * 1024 * 1024
        )
          throw Error("Choose a PNG, JPEG, WebP or AVIF image up to 30 MB.");
        const digest = await crypto.subtle.digest(
            "SHA-256",
            await item.file.arrayBuffer(),
          ),
          sha = [...new Uint8Array(digest)]
            .map((n) => n.toString(16).padStart(2, "0"))
            .join(""),
          pre = await nativePost("/preflight", {
            files: [
              {
                fileName: item.name,
                mimeType: item.file.type,
                sizeBytes: item.file.size,
                checksumSha256: sha,
              },
            ],
          });
        if (pre[0]?.errors?.length || pre[0]?.state === "FAILED")
          throw Error(pre[0].errors?.join(" · ") || "File rejected.");
        let id = pre[0]?.duplicate?.id;
        if (!id) {
          const session = await nativePost("/upload-session", {
            fileName: item.name,
            mimeType: item.file.type,
            sizeBytes: item.file.size,
            checksumSha256: sha,
            folder: "kidflix-imagery",
            title: item.name,
          });
          if (!session.assetId || !session.uploadUrl)
            throw Error("Upload session unavailable.");
          id = session.assetId;
          update({ state: "uploading", progress: 20 });
          await new Promise<void>((resolve, reject) => {
            const xhr = new XMLHttpRequest();
            xhr.open(session.method || "PUT", session.uploadUrl);
            Object.entries(
              session.headers || { "Content-Type": item.file.type },
            ).forEach(([k, v]) => xhr.setRequestHeader(k, String(v)));
            xhr.upload.onprogress = (e) => {
              if (e.lengthComputable)
                update({
                  progress: 20 + Math.round((e.loaded / e.total) * 55),
                });
            };
            xhr.onload = () =>
              xhr.status >= 200 && xhr.status < 300
                ? resolve()
                : reject(Error("Upload failed: " + xhr.status));
            xhr.onerror = () =>
              reject(
                Error(
                  "Upload connection failed. Retry while the file remains selected.",
                ),
              );
            xhr.timeout = 120000;
            xhr.ontimeout = () => reject(Error("Upload timed out. Retry."));
            xhr.send(item.file);
          });
          update({ state: "verifying", progress: 85 });
          await nativePost("/" + id + "/complete", {
            checksumSha256: sha,
            sizeBytes: item.file.size,
            mimeType: item.file.type,
          });
        }
        const result = await query<any>({ op: "native", type: "media", id }),
          asset = result.rows?.find((a: any) => a.id === id);
        if (!asset?.url)
          throw Error(
            "Uploaded image is not available in the native media vault.",
          );
        if (
          activePage.current !== item.page ||
          activeSlot.current !== item.slot
        )
          throw Error(
            "Image uploaded. Return to its original placement and choose it from the media library.",
          );
        setConfig((old) => {
          const p = old.slots[item.slot] || placement();
          const image: Scene = {
            id: newId(),
            src: asset.url,
            assetId: asset.id,
            mobile: "",
            mobileAssetId: "",
            enabled: true,
            alt: asset.title || item.name,
            focal: { x: 50, y: 50 },
            mobileFocal: { x: 50, y: 50 },
            fit: "cover",
            zoom: 1,
            mobileZoom: 1,
            duration: 0,
          };
          if (p.images.length >= 12) return old;
          return {
            ...old,
            slots: {
              ...old.slots,
              [item.slot]: {
                ...p,
                images: pageSlots(item.page).find(
                  (slot) => slot.id === item.slot,
                )?.sequence
                  ? [...p.images, image]
                  : [image],
              },
            },
          };
        });
        update({ state: "ready", progress: 100 });
      } catch (e) {
        update({ state: "failed", error: (e as Error).message });
      }
    }
    uploading.current = false;
  }
  function upload(files: FileList | File[] | null) {
    if (!canEdit || !files?.length) return;
    if (!descriptor.sequence && files.length > 1) {
      setError("Choose one replacement for small navigation artwork.");
      return;
    }
    if (files.length + images.length > 12) {
      setError("Use up to twelve images per placement.");
      return;
    }
    const batch = [...files].map((file) => ({
      id: newId(),
      name: file.name,
      file,
      state: "queued",
      progress: 0,
      page,
      slot: descriptor.id,
    }));
    queue.current.push(...batch);
    setUploads([...queue.current]);
    void processQueue();
  }
  const badgeOverride = !!image && image.badges !== undefined,
    badges = badgeOverride ? image!.badges! : current.badges;
  function setBadges(next: Badge[]) {
    if (badgeOverride) patchImage({ badges: next });
    else patch({ badges: next });
  }
  function patchBadge(id: string, value: Partial<Badge>) {
    setBadges(badges.map((b) => (b.id === id ? { ...b, ...value } : b)));
  }
  const source = image?.src || descriptor?.source,
    scale = Math.min(1, (stageWidth - 24) / device),
    url =
      path(
        "en",
        page === "home" || page === "shared" ? "" : "/explore/" + page,
      ) + "?imageryPreview=1",
    visibleSlots = slots.filter(
      (d) =>
        (!queryText ||
          (d.label + " " + d.section)
            .toLowerCase()
            .includes(queryText.toLowerCase())) &&
        (filter === "all" ||
          (filter === "changed" && changed.includes(d.id)) ||
          (filter === "defaults" && !config.slots[d.id]) ||
          (filter === "attention" &&
            (!rendered.includes(d.id) ||
              config.slots[d.id]?.images.some((i) => !i.enabled)))),
    );
  return (
    <div className={s.studio}>
      <header className={s.title}>
        <div>
          <span className={s.eyebrow}>KIDFLIX · VISUAL OPERATIONS</span>
          <h1>Page Imagery Studio</h1>
          <p>Manage every editorial image, from opening to footer.</p>
        </div>
        <span className={s.status}>
          <CheckCircle2 size={15} />
          {dirty
            ? "Unsaved changes"
            : changed.length
              ? "Draft differs from live"
              : "Saved configuration"}{" "}
          · r{revision}
        </span>
      </header>
      <div className={s.topbar}>
        <button onClick={() => setDirectory(!directory)}>
          <Images size={17} />
          {directory ? "Choose a page" : title(page)}
          <ChevronRight size={14} />
        </button>
        <button
          disabled={!undo.length || busy}
          aria-label="Undo imagery change"
          onClick={() => {
            setRedo((r) => [config, ...r]);
            setConfig(undo[undo.length - 1]);
            setUndo(undo.slice(0, -1));
          }}
        >
          <Undo2 size={16} />
        </button>
        <button
          disabled={!redo.length || busy}
          aria-label="Redo imagery change"
          onClick={() => {
            setUndo((u) => [...u, config]);
            setConfig(redo[0]);
            setRedo(redo.slice(1));
          }}
        >
          <Redo2 size={16} />
        </button>
        <button
          onClick={async () => {
            try {
              const v = await query<any>({
                op: "kidflix_imagery",
                page,
                history: true,
              });
              setHistory(v.versions);
            } catch (e) {
              setError((e as Error).message);
            }
          }}
        >
          <History size={16} />
          Publication history
        </button>
        <span className={s.shared}>Shared across public languages</span>
        <a
          href={url.replace("?imageryPreview=1", "")}
          target="_blank"
          rel="noreferrer"
        >
          View live <ExternalLink size={13} />
        </a>
      </div>
      {error ? (
        <div className={s.error} role="alert">
          <AlertCircle size={16} />
          {error}
          <button onClick={() => void read(page)}>Reload server state</button>
          <button aria-label="Dismiss error" onClick={() => setError("")}>
            <X size={16} />
          </button>
        </div>
      ) : null}
      {message ? (
        <p className={s.notice} role="status">
          {message}
        </p>
      ) : null}
      {recover ? (
        <div className={s.notice}>
          A recoverable browser draft exists.{" "}
          <button
            onClick={() => {
              edit(recover);
              setRecover(null);
            }}
          >
            Recover draft
          </button>
          <button
            onClick={() => {
              setRecover(null);
              localStorage.removeItem(storageKey);
            }}
          >
            Discard recovered copy
          </button>
        </div>
      ) : null}
      {directory ? (
        <section className={s.directory}>
          <div className={s.directoryHeading}>
            <BatchTools
              disabled={!canPublish || dirty || busy}
              onComplete={() => {
                void read(page);
              }}
            />
            <h2>Choose your page</h2>
            <p>
              Each image placement has its own controls. Official marks remain
              protected.
            </p>
          </div>
          {PAGES.map((p) => {
            const d = pageSlots(p)[0],
              summary = summaries.find((x) => x.page === p);
            return (
              <button
                className={s.pageCard}
                key={p}
                onClick={() => changePage(p)}
              >
                <div className={s.pageThumb}>
                  {d ? <Thumbnail slot={d} /> : <Images />}
                </div>
                <strong>{title(p)}</strong>
                <span>{pageSlots(p).length} editable placements</span>
                <small>
                  {summary?.publishedAt
                    ? "Published"
                    : "Using existing public artwork"}
                  {summary?.changed ? " · Draft changes" : ""}
                </small>
                <b>
                  Manage imagery <ChevronRight size={14} />
                </b>
              </button>
            );
          })}
        </section>
      ) : (
        <>
          <div className={s.editor} aria-busy={loading || busy}>
            <aside className={s.map}>
              <h2>Page image map</h2>
              <label className={s.search}>
                <Search size={15} />
                <input
                  placeholder="Find an image or section…"
                  value={queryText}
                  onChange={(e) => setQueryText(e.target.value)}
                  aria-label="Find image placement"
                />
              </label>
              <div className={s.filters}>
                {["all", "changed", "defaults", "attention"].map((k) => (
                  <button
                    key={k}
                    aria-pressed={filter === k}
                    onClick={() => setFilter(k)}
                  >
                    {k === "attention" ? "Needs attention" : k}
                  </button>
                ))}
              </div>
              <nav aria-label="Image placements">
                {[...new Set(visibleSlots.map((d) => d.section))].map(
                  (section) => (
                    <section key={section}>
                      <h3>{section.replaceAll(".", " · ")}</h3>
                      {visibleSlots
                        .filter((d) => d.section === section)
                        .map((d) => (
                          <button
                            key={d.id}
                            className={selected === d.id ? s.selected : ""}
                            onClick={() => {
                              setSelected(d.id);
                              setSlideId("");
                            }}
                          >
                            <span className={s.thumb}>
                              <Thumbnail
                                slot={d}
                                src={config.slots[d.id]?.images[0]?.src}
                              />
                            </span>
                            <span>
                              <strong>{d.label}</strong>
                              <small>
                                {d.owner === "shared" ? "Shared" : "Page only"}
                                {changed.includes(d.id) ? " · Changed" : ""}
                              </small>
                            </span>
                          </button>
                        ))}
                    </section>
                  ),
                )}
              </nav>
              <div className={s.mapFooter}>
                <button
                  aria-label="Previous image placement"
                  onClick={() => {
                    const i = slots.findIndex((x) => x.id === selected);
                    setSelected(
                      slots[(i + slots.length - 1) % slots.length].id,
                    );
                  }}
                >
                  <ChevronLeft size={14} />
                  Previous
                </button>
                <button
                  aria-label="Next image placement"
                  onClick={() => {
                    const i = slots.findIndex((x) => x.id === selected);
                    setSelected(slots[(i + 1) % slots.length].id);
                  }}
                >
                  Next
                  <ChevronRight size={14} />
                </button>
              </div>
              <p className={s.coverage}>
                ● Editable imagery
                <br />● Resource covers → source dossiers
                <br />
                <Lock size={11} /> Official brand marks protected
              </p>
              {page !== "shared" ? (
                <button onClick={() => changePage("shared")}>
                  Manage shared category images
                </button>
              ) : null}
            </aside>
            <section className={s.canvas}>
              <div className={s.canvasBar}>
                <button
                  aria-pressed={editing}
                  onClick={() => setEditing(!editing)}
                >
                  <MousePointer2 size={14} />
                  {editing ? "Select images" : "Browse page"}
                </button>
                {[
                  [1440, Monitor],
                  [820, Tablet],
                  [390, Smartphone],
                ].map(([width, Icon]: any) => (
                  <button
                    key={width}
                    aria-label={"Preview width " + width}
                    aria-pressed={device === width}
                    onClick={() => setDevice(width)}
                  >
                    <Icon size={15} />
                  </button>
                ))}
                <span>{Math.round(scale * 100)}%</span>
                <button
                  aria-pressed={before}
                  onClick={() => setBefore(!before)}
                >
                  {before ? "Before" : "After"}
                </button>
              </div>
              <div ref={stage} className={s.stage}>
                <div style={{ width: device * scale, height: 1050 * scale }}>
                  <iframe
                    title="Actual KidFlix page imagery preview"
                    key={page}
                    ref={frame}
                    src={url}
                    onLoad={() => {
                      setFrameReady(true);
                      send();
                    }}
                    style={{
                      width: device,
                      height: 1050,
                      transform: `scale(${scale})`,
                      transformOrigin: "top left",
                    }}
                  />
                </div>
              </div>
              <p className={s.canvasNote}>
                {descriptor?.condition ||
                  "Click an outlined editorial image to select it."}
                {!rendered.includes(selected)
                  ? " · This placement is not visible in the current page state. Its settings can still be edited."
                  : ""}
              </p>
            </section>
            <aside className={s.inspector}>
              <div className={s.inspectHeading}>
                <div>
                  <h2>{descriptor?.label}</h2>
                  <small>
                    {descriptor?.section} · {descriptor?.id}
                  </small>
                </div>
                <span>{page === "shared" ? "Shared" : "Page only"}</span>
              </div>
              <div className={s.largeThumb}>
                <Thumbnail slot={descriptor} src={source} />
              </div>
              <div className={s.tabs}>
                {["images", "framing", "playback", "badges"].map((t) => (
                  <button
                    key={t}
                    aria-pressed={tab === t}
                    onClick={() => setTab(t)}
                  >
                    {t}
                  </button>
                ))}
              </div>
              <fieldset
                disabled={!canEdit || busy || loading}
                className={s.inspectorBody}
              >
                {tab === "images" ? (
                  <>
                    <h3>Image sequence</h3>
                    <div className={s.sequence}>
                      {images.map((i, n) => (
                        <div
                          key={i.id}
                          draggable
                          onDragStart={() => {
                            drag.current = i.id;
                          }}
                          onDragOver={(e) => e.preventDefault()}
                          onDrop={() => reorder(drag.current, i.id)}
                          className={image?.id === i.id ? s.activeSlide : ""}
                        >
                          <button
                            onClick={() => setSlideId(i.id)}
                            aria-label={"Select image " + (n + 1)}
                          >
                            <img src={i.src} alt="" />
                          </button>
                          <span>
                            {n + 1}
                            <input
                              type="checkbox"
                              aria-label={"Enable image " + (n + 1)}
                              checked={i.enabled}
                              onChange={(e) =>
                                patch({
                                  images: images.map((v) =>
                                    v.id === i.id
                                      ? { ...v, enabled: e.target.checked }
                                      : v,
                                  ),
                                })
                              }
                            />
                            <button
                              aria-label={"Move image " + (n + 1) + " earlier"}
                              disabled={n === 0}
                              onClick={() => reorder(i.id, images[n - 1].id)}
                            >
                              <ArrowUp size={11} />
                            </button>
                            <button
                              aria-label={"Remove image " + (n + 1)}
                              onClick={() =>
                                patch({
                                  images: images.filter((v) => v.id !== i.id),
                                })
                              }
                            >
                              <Trash2 size={11} />
                            </button>
                          </span>
                        </div>
                      ))}
                    </div>
                    {!images.length ? (
                      <p className={s.help}>
                        Original page artwork is active. Upload or select an
                        image to replace it.
                      </p>
                    ) : null}
                    <label
                      className={s.upload}
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={(e) => {
                        e.preventDefault();
                        upload(e.dataTransfer.files);
                      }}
                    >
                      <Upload size={20} />
                      <strong>Upload images</strong>
                      <small>Drop files or choose from your computer</small>
                      <input
                        type="file"
                        multiple
                        accept="image/png,image/jpeg,image/webp,image/avif"
                        onChange={(e) => {
                          upload(e.target.files);
                          e.target.value = "";
                        }}
                      />
                    </label>
                    <NativeImagePicker onSelect={(a) => addAsset(a)} />
                    {image ? (
                      <>
                        <button onClick={() => setMobilePick(!mobilePick)}>
                          Choose a mobile replacement
                        </button>
                        {mobilePick ? (
                          <NativeImagePicker
                            onSelect={(a) => {
                              addAsset(a, true);
                              setMobilePick(false);
                            }}
                          />
                        ) : null}
                        <Field label="Image description">
                          <textarea
                            maxLength={500}
                            value={image.alt}
                            onChange={(e) =>
                              patchImage({ alt: e.target.value })
                            }
                          />
                        </Field>
                        <details className={s.usage}>
                          <summary>Where this image is assigned</summary>
                          <p>
                            Saved drafts across your pages. Removing an
                            assignment keeps the original media file.
                          </p>
                          {[
                            ...new Set([
                              ...Object.entries(config.slots).flatMap(
                                ([id, value]) =>
                                  value.images.some(
                                    (i) =>
                                      i.assetId === image.assetId ||
                                      i.mobileAssetId === image.assetId,
                                  )
                                    ? [title(page) + " · " + id]
                                    : [],
                              ),
                              ...summaries
                                .filter((row) => row.page !== page)
                                .flatMap((row) =>
                                  (row.usage || [])
                                    .filter(
                                      (u: any) =>
                                        u.assetId === image.assetId ||
                                        u.mobileAssetId === image.assetId,
                                    )
                                    .map(
                                      (u: any) =>
                                        title(row.page) + " · " + u.slot,
                                    ),
                                ),
                            ]),
                          ].map((item) => (
                            <small key={item}>{item}</small>
                          ))}
                        </details>
                      </>
                    ) : null}
                    <Toggle
                      label="Hide this editorial artwork"
                      value={current.hidden}
                      disabled={page === "shared"}
                      onChange={(hidden) => patch({ hidden })}
                    />
                    <button
                      onClick={() => {
                        setTargets([]);
                        setCopyOpen(true);
                      }}
                    >
                      <Copy size={14} />
                      Apply to other placements…
                    </button>
                    <p className={s.help}>
                      Replacement affects this position only. Shared navigation
                      changes affect all public pages.
                    </p>
                  </>
                ) : null}
                {tab === "framing" ? (
                  <>
                    {image ? (
                      <>
                        <Field label="Image fit">
                          <select
                            value={image.fit}
                            onChange={(e) =>
                              patchImage({ fit: e.target.value as any })
                            }
                          >
                            <option value="cover">Fill · crop to frame</option>
                            <option value="contain">
                              Fit · preserve entire image
                            </option>
                          </select>
                        </Field>
                        <p className={s.help}>
                          Desktop and mobile use independent focal points. Click
                          the preview below to place the focal point.
                        </p>
                        {["desktop", "mobile"].map((mode) => {
                          const point =
                            mode === "mobile" ? image.mobileFocal : image.focal;
                          return (
                            <section key={mode}>
                              <h3>{mode} framing</h3>
                              <button
                                className={s.focal}
                                aria-label={"Set " + mode + " focal point"}
                                onClick={(e) => {
                                  const r =
                                      e.currentTarget.getBoundingClientRect(),
                                    p = {
                                      x: Math.round(
                                        ((e.clientX - r.left) / r.width) * 100,
                                      ),
                                      y: Math.round(
                                        ((e.clientY - r.top) / r.height) * 100,
                                      ),
                                    };
                                  patchImage(
                                    mode === "mobile"
                                      ? { mobileFocal: p }
                                      : { focal: p },
                                  );
                                }}
                                style={{
                                  backgroundImage: `url(${mode === "mobile" && image.mobile ? image.mobile : image.src})`,
                                }}
                              >
                                <span
                                  style={{
                                    left: point.x + "%",
                                    top: point.y + "%",
                                  }}
                                >
                                  ＋
                                </span>
                              </button>
                              <div className={s.two}>
                                <Field label="Horizontal %">
                                  <input
                                    type="number"
                                    min={0}
                                    max={100}
                                    value={point.x}
                                    onChange={(e) =>
                                      patchImage({
                                        [mode === "mobile"
                                          ? "mobileFocal"
                                          : "focal"]: {
                                          ...point,
                                          x: Number(e.target.value),
                                        },
                                      })
                                    }
                                  />
                                </Field>
                                <Field label="Vertical %">
                                  <input
                                    type="number"
                                    min={0}
                                    max={100}
                                    value={point.y}
                                    onChange={(e) =>
                                      patchImage({
                                        [mode === "mobile"
                                          ? "mobileFocal"
                                          : "focal"]: {
                                          ...point,
                                          y: Number(e.target.value),
                                        },
                                      })
                                    }
                                  />
                                </Field>
                              </div>
                              <Field label="Zoom">
                                <input
                                  type="range"
                                  min={1}
                                  max={2}
                                  step={0.01}
                                  value={
                                    mode === "mobile"
                                      ? image.mobileZoom
                                      : image.zoom
                                  }
                                  onChange={(e) =>
                                    patchImage({
                                      [mode === "mobile"
                                        ? "mobileZoom"
                                        : "zoom"]: Number(e.target.value),
                                    })
                                  }
                                />
                              </Field>
                            </section>
                          );
                        })}
                        <button
                          onClick={() =>
                            patchImage({
                              focal: { x: 50, y: 50 },
                              mobileFocal: { x: 50, y: 50 },
                              zoom: 1,
                              mobileZoom: 1,
                            })
                          }
                        >
                          Reset framing
                        </button>
                      </>
                    ) : (
                      <p className={s.help}>
                        Select a replacement image to adjust its framing.
                        Original measured artwork crops remain preserved.
                      </p>
                    )}
                  </>
                ) : null}
                {tab === "playback" ? (
                  <>
                    {descriptor?.sequence ? (
                      <>
                        <p className={s.help}>
                          {images.filter((i) => i.enabled).length > 1
                            ? "Slideshow"
                            : "Single image / original artwork"}{" "}
                          · timing is shared across public languages.
                        </p>
                        <Field label="Display mode">
                          <select
                            value={current.mode}
                            onChange={(e) =>
                              patch({ mode: e.target.value as any })
                            }
                          >
                            <option value="single">Single image</option>
                            <option value="slideshow">Slideshow</option>
                          </select>
                        </Field>
                        <Field label="Change every (seconds)">
                          <input
                            type="number"
                            min={1.5}
                            max={30}
                            step={0.5}
                            value={current.interval / 1000}
                            onChange={(e) =>
                              patch({ interval: Number(e.target.value) * 1000 })
                            }
                          />
                        </Field>
                        <Field label="Transition">
                          <select
                            value={current.transition}
                            onChange={(e) =>
                              patch({ transition: e.target.value as any })
                            }
                          >
                            {["fade", "slide", "cut"].map((k) => (
                              <option key={k}>{k}</option>
                            ))}
                          </select>
                        </Field>
                        <Field label="Transition speed (milliseconds)">
                          <input
                            type="number"
                            min={0}
                            max={1200}
                            step={50}
                            value={current.speed}
                            onChange={(e) =>
                              patch({ speed: Number(e.target.value) })
                            }
                          />
                        </Field>
                        <Toggle
                          label="Autoplay"
                          value={current.autoplay}
                          onChange={(autoplay) => patch({ autoplay })}
                        />
                        <Toggle
                          label="Loop sequence"
                          value={current.loop}
                          onChange={(loop) => patch({ loop })}
                        />
                        <Toggle
                          label="Visitor arrows and pause control"
                          value={current.controls}
                          onChange={(controls) => patch({ controls })}
                        />
                        <Toggle
                          label="Restrained slow zoom"
                          value={current.slowZoom}
                          onChange={(slowZoom) => patch({ slowZoom })}
                        />
                        {image ? (
                          <Field label="Selected image duration · seconds (0 = default)">
                            <input
                              type="number"
                              min={0}
                              max={30}
                              step={0.5}
                              value={image.duration / 1000}
                              onChange={(e) =>
                                patchImage({
                                  duration: Number(e.target.value) * 1000,
                                })
                              }
                            />
                          </Field>
                        ) : null}
                      </>
                    ) : (
                      <p className={s.help}>
                        This small illustration remains static. Select a hero or
                        promotional panel for slideshow controls.
                      </p>
                    )}
                  </>
                ) : null}
                {tab === "badges" ? (
                  <>
                    <Toggle
                      label="Enable badges on this image placement"
                      value={current.badgesEnabled}
                      disabled={page === "shared"}
                      onChange={(badgesEnabled) => patch({ badgesEnabled })}
                    />
                    <p className={s.help}>
                      Badges start off. Choose one or two small editorial
                      accents. Protected brand marks and source resource covers
                      remain unchanged.
                    </p>
                    {current.badgesEnabled ? (
                      <>
                        {image ? (
                          <Toggle
                            label="Customize badges for selected slide"
                            value={badgeOverride}
                            onChange={(v) =>
                              patchImage({
                                badges: v
                                  ? structuredClone(current.badges)
                                  : undefined,
                              })
                            }
                          />
                        ) : null}
                        <span className={s.inheritance}>
                          {badgeOverride
                            ? "Selected slide override"
                            : "Shared across this image sequence"}
                        </span>
                        <input
                          type="search"
                          placeholder="Find a badge preset…"
                          aria-label="Find badge preset"
                          value={badgeSearch}
                          onChange={(e) => setBadgeSearch(e.target.value)}
                        />
                        <div className={s.presets}>
                          {[...PRESETS]
                            .sort(
                              (a, b) =>
                                Number(favourites.includes(b[0])) -
                                Number(favourites.includes(a[0])),
                            )
                            .filter(([label]) =>
                              label
                                .toLowerCase()
                                .includes(badgeSearch.toLowerCase()),
                            )
                            .map(([label, icon]) => (
                              <div key={label}>
                                <button
                                  disabled={badges.length >= 2}
                                  onClick={() =>
                                    setBadges([
                                      ...badges,
                                      { ...newBadge(), text: label, icon },
                                    ])
                                  }
                                >
                                  <BadgeIcon name={icon} />
                                  {label}
                                </button>
                                <button
                                  aria-label={"Favourite " + label}
                                  aria-pressed={favourites.includes(label)}
                                  onClick={() => {
                                    const next = favourites.includes(label)
                                      ? favourites.filter((f) => f !== label)
                                      : [...favourites, label];
                                    setFavourites(next);
                                    try {
                                      localStorage.setItem(
                                        "kidflix.imagery.badge-favourites",
                                        stringify(next),
                                      );
                                    } catch {}
                                  }}
                                >
                                  ♡
                                </button>
                              </div>
                            ))}
                        </div>
                        <button
                          disabled={badges.length >= 2}
                          onClick={() => setBadges([...badges, newBadge()])}
                        >
                          <Plus size={14} />
                          Add custom badge
                        </button>
                        {badges.map((b, n) => (
                          <section className={s.badgeEditor} key={b.id}>
                            <div className={s.badgeHeading}>
                              <strong>Badge {n + 1}</strong>
                              <button
                                aria-label={"Remove badge " + (n + 1)}
                                onClick={() =>
                                  setBadges(badges.filter((v) => v.id !== b.id))
                                }
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                            <Toggle
                              label="Show this badge"
                              value={b.enabled}
                              onChange={(enabled) =>
                                patchBadge(b.id, { enabled })
                              }
                            />
                            <Field label="Label · up to 24 characters">
                              <input
                                maxLength={24}
                                value={b.text}
                                onChange={(e) =>
                                  patchBadge(b.id, { text: e.target.value })
                                }
                              />
                            </Field>
                            <div className={s.two}>
                              <Field label="Display">
                                <select
                                  value={b.display}
                                  onChange={(e) =>
                                    patchBadge(b.id, {
                                      display: e.target.value as any,
                                    })
                                  }
                                >
                                  {["icon", "text", "both"].map((k) => (
                                    <option key={k}>{k}</option>
                                  ))}
                                </select>
                              </Field>
                              <Field label="Icon">
                                <select
                                  value={b.icon}
                                  onChange={(e) =>
                                    patchBadge(b.id, { icon: e.target.value })
                                  }
                                >
                                  {ICONS.map((k) => (
                                    <option key={k}>{k}</option>
                                  ))}
                                </select>
                              </Field>
                              <Field label="Shape">
                                <select
                                  value={b.shape}
                                  onChange={(e) =>
                                    patchBadge(b.id, {
                                      shape: e.target.value as any,
                                    })
                                  }
                                >
                                  {[
                                    "sticker",
                                    "pill",
                                    "rectangle",
                                    "ribbon",
                                    "folded",
                                    "seal",
                                  ].map((k) => (
                                    <option key={k}>{k}</option>
                                  ))}
                                </select>
                              </Field>
                              <Field label="Size">
                                <select
                                  value={b.size}
                                  onChange={(e) =>
                                    patchBadge(b.id, {
                                      size: e.target.value as any,
                                    })
                                  }
                                >
                                  {["tiny", "small", "medium"].map((k) => (
                                    <option key={k}>{k}</option>
                                  ))}
                                </select>
                              </Field>
                              <Field label="Background">
                                <input
                                  type="color"
                                  value={b.background}
                                  onChange={(e) =>
                                    patchBadge(b.id, {
                                      background: e.target.value,
                                    })
                                  }
                                />
                              </Field>
                              <Field label="Text / icon colour">
                                <input
                                  type="color"
                                  value={b.color}
                                  onChange={(e) =>
                                    patchBadge(b.id, { color: e.target.value })
                                  }
                                />
                              </Field>
                            </div>
                            <Field label="Corner">
                              <select
                                value={b.corner}
                                onChange={(e) =>
                                  patchBadge(b.id, {
                                    corner: e.target.value as any,
                                  })
                                }
                              >
                                {[
                                  "top-right",
                                  "top-left",
                                  "bottom-right",
                                  "bottom-left",
                                ].map((k) => (
                                  <option key={k}>{k}</option>
                                ))}
                              </select>
                            </Field>
                            <Toggle
                              label="Position follows reading direction"
                              value={b.relative}
                              onChange={(relative) =>
                                patchBadge(b.id, { relative })
                              }
                            />
                            <div className={s.two}>
                              {[
                                ["x", "Horizontal inset", 0, 40],
                                ["y", "Vertical inset", 0, 40],
                                ["rotation", "Rotation", -20, 20],
                                ["opacity", "Opacity", 0.5, 1],
                              ].map(([key, label, min, max]: any) => (
                                <Field key={key} label={label}>
                                  <input
                                    type="number"
                                    min={min}
                                    max={max}
                                    step={key === "opacity" ? 0.05 : 1}
                                    value={(b as any)[key]}
                                    onChange={(e) =>
                                      patchBadge(b.id, {
                                        [key]: Number(e.target.value),
                                      })
                                    }
                                  />
                                </Field>
                              ))}
                            </div>
                            <Field label="Motion">
                              <select
                                value={b.motion}
                                onChange={(e) =>
                                  patchBadge(b.id, {
                                    motion: e.target.value as any,
                                  })
                                }
                              >
                                {[
                                  "none",
                                  "pulse",
                                  "glow",
                                  "bounce",
                                  "shine",
                                  "entrance",
                                  "fire",
                                ].map((k) => (
                                  <option key={k}>{k}</option>
                                ))}
                              </select>
                            </Field>
                            <div className={s.two}>
                              <Field label="Motion speed · ms">
                                <input
                                  type="number"
                                  min={1000}
                                  max={10000}
                                  step={100}
                                  value={b.speed}
                                  onChange={(e) =>
                                    patchBadge(b.id, {
                                      speed: Number(e.target.value),
                                    })
                                  }
                                />
                              </Field>
                              <Field label="Delay · ms">
                                <input
                                  type="number"
                                  min={0}
                                  max={10000}
                                  value={b.delay}
                                  onChange={(e) =>
                                    patchBadge(b.id, {
                                      delay: Number(e.target.value),
                                    })
                                  }
                                />
                              </Field>
                            </div>
                            <Field label="Intensity">
                              <input
                                type="range"
                                min={0.25}
                                max={2}
                                step={0.25}
                                value={b.intensity}
                                onChange={(e) =>
                                  patchBadge(b.id, {
                                    intensity: Number(e.target.value),
                                  })
                                }
                              />
                            </Field>
                            <Toggle
                              label="Loop motion"
                              value={b.loop}
                              onChange={(loop) => patchBadge(b.id, { loop })}
                            />
                            <Toggle
                              label="Border"
                              value={b.border}
                              onChange={(border) =>
                                patchBadge(b.id, { border })
                              }
                            />
                            <Toggle
                              label="Shadow"
                              value={b.shadow}
                              onChange={(shadow) =>
                                patchBadge(b.id, { shadow })
                              }
                            />
                            <Toggle
                              label="Hide badge on mobile"
                              value={b.hideMobile}
                              onChange={(hideMobile) =>
                                patchBadge(b.id, { hideMobile })
                              }
                            />
                          </section>
                        ))}
                      </>
                    ) : null}
                  </>
                ) : null}
                <button
                  className={s.restore}
                  onClick={() => {
                    const next = { ...config.slots };
                    delete next[descriptor.id];
                    edit({ ...config, slots: next });
                  }}
                >
                  <RotateCcw size={14} />
                  Restore original artwork and settings
                </button>
              </fieldset>
            </aside>
          </div>
          <CopyPageImagery page={page} disabled={!canEdit || dirty || busy} />
          <div className={s.reviewStrip}>
            <strong>{changed.length} placements differ from live</strong>
            {changed.slice(0, 5).map((id) => (
              <button key={id} onClick={() => setSelected(id)}>
                {slots.find((d) => d.id === id)?.label || id}
              </button>
            ))}
            <button onClick={() => setReview(true)}>
              Review imagery changes
            </button>
          </div>
        </>
      )}
      {uploads.length ? (
        <section className={s.uploadQueue} aria-label="Upload queue">
          {uploads.map((u) => (
            <div key={u.id}>
              <strong>{u.name}</strong>
              <span>
                {u.state} · {u.progress}%
              </span>
              <progress value={u.progress} max={100} />
              {u.error ? <small>{u.error}</small> : null}
              {u.state === "failed" ? (
                <button
                  onClick={() => {
                    u.state = "queued";
                    void processQueue();
                  }}
                >
                  Retry upload
                </button>
              ) : null}
            </div>
          ))}
        </section>
      ) : null}
      <footer className={s.actionBar}>
        <div>
          <strong>
            {dirty
              ? "Unsaved imagery changes"
              : changed.length
                ? "Unpublished imagery changes"
                : "Current page imagery"}
          </strong>
          <small>
            Images and badges only · other page drafts remain independent
          </small>
        </div>
        {dirty ? (
          <button
            onClick={() => {
              setConfig(saved);
              setUndo([]);
              setRedo([]);
              try {
                localStorage.removeItem(storageKey);
              } catch {}
            }}
          >
            Discard unsaved
          </button>
        ) : null}
        <button
          disabled={!canEdit || busy || loading || !dirty}
          onClick={() => void operate("kidflix_imagery_save")}
        >
          <Save size={15} />
          Save draft
        </button>
        <button
          onClick={() => {
            setDirectory(false);
            setEditing(false);
            setBefore(false);
          }}
        >
          <Eye size={15} />
          Preview changes
        </button>
        <button
          className={s.publish}
          disabled={!canPublish || busy || loading || dirty || !changed.length}
          onClick={() => {
            setPublishTargets(changed);
            setReview(true);
          }}
        >
          <Send size={15} />
          Publish page imagery
        </button>
      </footer>
      {review ? (
        <div className={s.modalBackdrop}>
          <section
            className={s.modal}
            role="dialog"
            aria-modal="true"
            aria-labelledby="imagery-review-title"
          >
            <button
              className={s.close}
              aria-label="Close review"
              onClick={() => setReview(false)}
            >
              <X />
            </button>
            <h2 id="imagery-review-title">Review imagery changes</h2>
            <p>
              {title(page)} · only selected image placements, framing, playback
              and badge settings will publish.
            </p>
            {changed.map((id) => (
              <label className={s.reviewRow} key={id}>
                <input
                  type="checkbox"
                  checked={publishTargets.includes(id)}
                  onChange={(e) =>
                    setPublishTargets(
                      e.target.checked
                        ? [...publishTargets, id]
                        : publishTargets.filter((k) => k !== id),
                    )
                  }
                />
                <span>
                  <strong>{slots.find((d) => d.id === id)?.label || id}</strong>
                  <small>{id}</small>
                </span>
                <span className={s.compareThumb}>
                  <Thumbnail
                    slot={slots.find((d) => d.id === id) || descriptor}
                    src={live.slots[id]?.images[0]?.src}
                  />
                </span>
                →
                <span className={s.compareThumb}>
                  <Thumbnail
                    slot={slots.find((d) => d.id === id) || descriptor}
                    src={config.slots[id]?.images[0]?.src}
                  />
                </span>
              </label>
            ))}
            {dirty ? <p>Save your draft before publishing.</p> : null}
            <button
              className={s.publish}
              disabled={dirty || busy || !canPublish || !publishTargets.length}
              onClick={() =>
                void operate("kidflix_imagery_publish", {
                  slots: publishTargets,
                })
              }
            >
              Publish {publishTargets.length} selected placements
            </button>
          </section>
        </div>
      ) : null}
      {history ? (
        <div className={s.modalBackdrop}>
          <section
            className={s.modal}
            role="dialog"
            aria-modal="true"
            aria-label="Imagery publication history"
          >
            <button
              className={s.close}
              aria-label="Close history"
              onClick={() => setHistory(null)}
            >
              <X />
            </button>
            <h2>Configuration history</h2>
            <p>
              Restoring creates a draft. Current public imagery remains until
              you publish.
            </p>
            {!history.length ? (
              <p>No recorded imagery versions yet.</p>
            ) : (
              history.map((v, index) => {
                const version: Config =
                  v.snapshot?.data?.draft || emptyConfig();
                const previous: Config =
                  history[index + 1]?.snapshot?.data?.draft || emptyConfig();
                const changes = [
                  ...new Set([
                    ...Object.keys(version.slots),
                    ...Object.keys(previous.slots),
                  ]),
                ].filter(
                  (id) =>
                    stringify(version.slots[id]) !==
                    stringify(previous.slots[id]),
                );
                return (
                  <div className={s.historyRow} key={v.id}>
                    <span>
                      Revision {v.revision}
                      <small>{new Date(v.created_at).toLocaleString()}</small>
                      <small>
                        Actor:{" "}
                        {v.actor_id ||
                          v.snapshot?.updated_by ||
                          "Recorded operator"}
                      </small>
                      <small>
                        {changes.length} placement changes ·{" "}
                        {v.snapshot?.data?.publishedAt
                          ? "Published snapshot available"
                          : "Draft snapshot"}
                      </small>
                      {changes.slice(0, 4).map((id) => {
                        const slot = slots.find((d) => d.id === id);
                        const value = version.slots[id];
                        return slot ? (
                          <span className={s.historyChange} key={id}>
                            <span className={s.compareThumb}>
                              <Thumbnail
                                slot={slot}
                                src={previous.slots[id]?.images[0]?.src}
                              />
                            </span>
                            →
                            <span className={s.compareThumb}>
                              <Thumbnail
                                slot={slot}
                                src={value?.images[0]?.src}
                              />
                            </span>
                            <small>
                              {slot.label} ·{" "}
                              {value?.images.length || "Original"} images ·{" "}
                              {value?.mode || "default"} ·{" "}
                              {value?.interval || 2000} ms · badges{" "}
                              {value?.badgesEnabled ? "on" : "off"}
                            </small>
                          </span>
                        ) : null;
                      })}
                    </span>
                    <button
                      disabled={!canEdit || busy || dirty}
                      onClick={() => {
                        void operate("kidflix_imagery_restore", {
                          versionId: v.id,
                        });
                        setHistory(null);
                      }}
                    >
                      Restore as draft
                    </button>
                  </div>
                );
              })
            )}
          </section>
        </div>
      ) : null}
      {copyOpen ? (
        <div className={s.modalBackdrop}>
          <section
            className={s.modal}
            role="dialog"
            aria-modal="true"
            aria-label="Apply imagery to other placements"
          >
            <button
              className={s.close}
              aria-label="Close assignment"
              onClick={() => setCopyOpen(false)}
            >
              <X />
            </button>
            <h2>Apply to other placements on this page</h2>
            <p>
              Choose exact destinations. Shared header images use their separate
              shared configuration.
            </p>
            {slots
              .filter(
                (d) =>
                  d.id !== descriptor.id && d.sequence === descriptor.sequence,
              )
              .map((d) => (
                <label className={s.reviewRow} key={d.id}>
                  <input
                    type="checkbox"
                    checked={targets.includes(d.id)}
                    onChange={(e) =>
                      setTargets(
                        e.target.checked
                          ? [...targets, d.id]
                          : targets.filter((k) => k !== d.id),
                      )
                    }
                  />
                  <span className={s.thumb}>
                    <Thumbnail slot={d} />
                  </span>
                  {d.section} · {d.label}
                </label>
              ))}
            <button
              disabled={!targets.length}
              onClick={() => {
                const next = { ...config.slots };
                for (const id of targets) next[id] = structuredClone(current);
                edit({ ...config, slots: next });
                setCopyOpen(false);
              }}
            >
              Assign to {targets.length} placements
            </button>
          </section>
        </div>
      ) : null}
    </div>
  );
}
