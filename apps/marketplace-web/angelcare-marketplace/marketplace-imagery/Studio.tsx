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
  GripVertical,
  FolderOpen,
} from "lucide-react";
import {
  useUI,
  query,
  mutate,
} from "./client";
import { pageTitle, pagePath } from "./pages";
import { imageReferenceIssue } from "./asset-url";
import { NativeImagePicker } from "../kidflix/StudioPickers";



import { BadgeIcon } from "./Runtime";
import { BatchTools, CopyPageImagery } from "./BatchTools";
import { LiveDeliveryInspector } from "./LiveDeliveryInspector";
import { pageSlots, resolveSlot, type Slot } from "./registry";
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
  return <Images size={25} />;
}
const title = pageTitle;
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
  replaceFor?: string;
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
    [directory, setDirectory] = useState(false),
    [summaries, setSummaries] = useState<any[]>([]),
    [config, setConfig] = useState<Config>(emptyConfig),
    [shared, setShared] = useState<Config>(emptyConfig),
    [live, setLive] = useState<Config>(emptyConfig),
    [liveDelivery, setLiveDelivery] = useState<any>(null),
    [saved, setSaved] = useState<Config>(emptyConfig),
    [revision, setRevision] = useState(0),
    [draftHash, setDraftHash] = useState(""),
    [selected, setSelected] = useState("home.opening.hero"),
    [queryText, setQueryText] = useState(""),
    [filter, setFilter] = useState("all"),
    [tab, setTab] = useState("images"),
    [device, setDevice] = useState(1440),
    [previewLocale, setPreviewLocale] = useState<"fr" | "en" | "ar">("fr"),
    [publicHostname, setPublicHostname] = useState(""),
    [savedHostname, setSavedHostname] = useState(""),
    [liveHostname, setLiveHostname] = useState(""),
    [discovered, setDiscovered] = useState<Record<string, Slot[]>>({}),
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
    uploadInput = useRef<HTMLInputElement>(null),
    alive = useRef(true);
  activePage.current = page;
  activeSlot.current = selected;
  const storageKey =
    "angelcare.imagery.draft.v1." + boot.actor.id + "." + scopeKey + "." + page;
  const slots = useMemo(() => [...new Map([...pageSlots(page), ...Object.keys(config.slots).map(id => resolveSlot(page,id)).filter((s): s is Slot => !!s), ...(discovered[page] || [])].map(s => [s.id, s])).values()], [page, discovered, config]),
    descriptor = slots.find((x) => x.id === selected) || slots[0],
    current = config.slots[descriptor?.id] || placement(),
    images = current.images,
    image = images.find((x) => x.id === slideId) || images[0],
    hostChanged = savedHostname !== liveHostname,
    dirty = stringify(config) !== stringify(saved) || publicHostname !== savedHostname,
    changed = [
      ...new Set([...Object.keys(config.slots), ...Object.keys(live.slots)]),
    ].filter((k) => stringify(config.slots[k]) !== stringify(live.slots[k]));
  const read = useCallback(
    async (p: string) => {
      setLoading(true);
      setError("");
      try {
        const v = await query<any>({ op: "angelcare_imagery", page: p });
        if (activePage.current !== p) return;
        if (typeof v.scopeKey !== "string" || !v.scopeKey)
          throw Error(
            "Workspace scope is unavailable. Reload before editing imagery.",
          );
        setScopeKey(v.scopeKey);
        setPublicHostname(v.record?.data?.draftHost || location.hostname);
        setSavedHostname(v.record?.data?.draftHost || location.hostname);
        setLiveHostname(v.record?.data?.liveHost || "");
        setConfig(v.draft);
        setSaved(v.draft);
        setLive(v.live);
        setLiveDelivery(v.liveDelivery || null);
        setRevision(v.record?.revision || 0);
        setDraftHash(v.draftHash);
        setUndo([]);
        setRedo([]);
        setRendered([]);
        try {
          const raw = localStorage.getItem(
            "angelcare.imagery.draft.v1." +
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
    query<any>({ op: "angelcare_imagery", page: "all" })
      .then((v) => setSummaries(v.pages))
      .catch(() => {});
    try {
      setFavourites(
        JSON.parse(
          localStorage.getItem("angelcare.imagery.badge-favourites") || "[]",
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
          stringify({ config, revision, publicHost: publicHostname, at: Date.now() }),
        );
      } catch {
        setMessage(
          "Browser draft recovery is unavailable. Save your draft to retain it.",
        );
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [config, dirty, loading, storageKey, revision, publicHostname]);
  const send = useCallback(() => {
    frame.current?.contentWindow?.postMessage(
      {
        type: "angelcare-imagery-preview",
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
      if (v?.type === "angelcare-imagery-ready" && v.page === page) {
        setFrameReady(true);
        send();
      }
      if (
        v?.type === "angelcare-imagery-owned" &&
        /^[0-9a-f]{8}-[0-9a-f-]{27}$/i.test(v.record || "")
      ) {
        setMessage(
          "Resource-owned cover selected. Opening its native source dossier.",
        );
        openDossier(v.record);
        return;
      }
      if (v?.type === "angelcare-imagery-select" && v.page === page && resolveSlot(page, v.id)) {
        if (v.id?.startsWith("shared.") && page !== "shared") {
          setMessage(
            "This image is shared. Open Shared category navigation to edit it consistently.",
          );
          return;
        }
        setSelected(v.id);
        setSlideId("");
      }
      if (v?.type === "angelcare-imagery-slots" && v.page === page && Array.isArray(v.slots)) {
        const safe = v.slots.filter((d: Slot) => resolveSlot(page, d.id));
        setRendered(safe.map((d: Slot) => d.id));
        setDiscovered(old => ({...old, [page]: [...new Map([...(old[page] || []), ...safe].map(d => [d.id, d])).values()]}));
      }
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
  function addAssets(assets: { id: string; url: string; title: string }[]) {
    const used = new Set(images.map(item => item.assetId));
    const incoming = assets.filter(item => !used.has(item.id) && (used.add(item.id), true));
    const limit = descriptor.sequence ? 12 - images.length : 1;
    if (incoming.length > limit) { setError("Use up to twelve images per placement."); return; }
    for (const asset of incoming) {
      const issue = imageReferenceIssue(asset.url, asset.id);
      if (issue) { setError("Unable to assign this native image: " + issue); return; }
    }
    if (!incoming.length) return;
    const next: Scene[] = incoming.map(asset => ({
      id: newId(), src: asset.url, assetId: asset.id,
      mobile: "", mobileAssetId: "", enabled: true, alt: asset.title,
      focal: { x: 50, y: 50 }, mobileFocal: { x: 50, y: 50 },
      fit: "cover", zoom: 1, mobileZoom: 1, duration: 0,
    }));
    patch({ images: descriptor.sequence ? [...images, ...next] : [next[0]] });
    setSlideId(next[0].id);
    setError("");
  }
  function addAsset(asset: { id: string; url: string; title: string }, mobile = false) {
    const issue = imageReferenceIssue(asset?.url, asset?.id);
    if (issue) { setError("Unable to assign this native image: " + issue); return; }
    if (mobile && image) {
      patchImage({ mobile: asset.url, mobileAssetId: asset.id });
      return;
    }
    addAssets([asset]);
  }
  async function operate(action: string, extra: any = {}) {
    setBusy(true);
    setError("");
    try {
      let value = config;
      if (action === "angelcare_imagery_save")
        value = normalizeConfig(config, page);
      const r = await mutate<any>({
        action,
        requestId: newId(),
        page,
        revision,
        ...(action === "angelcare_imagery_save" ? { config: value, publicHost: publicHostname } : {}),
        ...(action === "angelcare_imagery_publish" ? { draftHash } : {}),
        ...extra,
      } as any);
      const record = r.record;
      if (record) {
        setRevision(record.revision);
        setPublicHostname(record.data.draftHost || publicHostname);
        setSavedHostname(record.data.draftHost || publicHostname);
        setLiveHostname(record.data.liveHost || "");
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
        action === "angelcare_imagery_publish"
          ? "Page imagery published. Other page drafts were not published."
          : action === "angelcare_imagery_restore"
            ? "Version restored as a draft. Preview before publishing."
            : "Draft saved to the native workspace.",
      );
      const v = await query<any>({ op: "angelcare_imagery", page: "all" });
      setSummaries(v.pages);
      if (action === "angelcare_imagery_publish") {
        try {
          const verification = await query<any>({ op: "angelcare_imagery", page });
          setLiveDelivery(verification.liveDelivery || null);
        } catch {
          setLiveDelivery(null);
          setMessage("Published, but the public delivery audit is unavailable. Verify before confirming live imagery.");
        }
      }
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
            folder: "angelcare-imagery",
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
        const uploadedIssue = imageReferenceIssue(asset.url, asset.id);
        if (uploadedIssue)
          throw Error("Native upload cannot be assigned: " + uploadedIssue);
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
          const sequential = !!resolveSlot(item.page, item.slot)?.sequence;
          if (item.replaceFor) {
            if (!p.images.some((scene) => scene.id === item.replaceFor)) return old;
            return {
              ...old,
              slots: {
                ...old.slots,
                [item.slot]: {
                  ...p,
                  images: p.images.map((scene) => scene.id === item.replaceFor
                    ? { ...scene, src: asset.url, assetId: asset.id, alt: asset.title || item.name }
                    : scene),
                },
              },
            };
          }
          if (sequential && p.images.length >= 12) return old;
          return {
            ...old,
            slots: {
              ...old.slots,
              [item.slot]: {
                ...p,
                images: sequential ? [...p.images, image] : [image],
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
    const pending = queue.current.filter((item) =>
      item.page === page && item.slot === descriptor.id &&
      !item.replaceFor && !["ready", "failed"].includes(item.state)).length;
    if (descriptor.sequence && files.length + images.length + pending > 12) {
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
  function uploadReplace(files: FileList | null, targetId: string) {
    if (!canEdit || !files?.length) return;
    if (files.length !== 1 || !images.some((entry) => entry.id === targetId)) {
      setError("Select one valid replacement image.");
      return;
    }
    const file = files[0];
    queue.current.push({
      id: newId(), name: file.name, file, state: "queued", progress: 0,
      page, slot: descriptor.id, replaceFor: targetId,
    });
    setSlideId(targetId);
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
      pagePath(page, previewLocale) + "?imageryPreview=1",
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
        <div className={s.titleLead}>
          <span className={s.titleSymbol}><Images size={23} /></span>
          <div><span className={s.eyebrow}>ANGELCARE MARKETPLACE · VISUAL OPERATIONS</span>
            <h1>AngelCare Imagery Studio</h1>
            <p>Homepage + 12 storefronts · Images, framing, slideshows and visual effects.</p></div>
        </div>
        <div className={s.headerActions}>
          <span className={s.status} data-state={dirty ? "unsaved" : changed.length || hostChanged ? "pending" : "saved"}>
            {dirty || changed.length || hostChanged ? <AlertCircle size={15} /> : <CheckCircle2 size={15} />}
            {dirty ? "Unsaved changes" : changed.length || hostChanged ? "Draft differs from live" : "Saved configuration"}
            <small>r{revision}</small>
          </span>
          <button type="button" className={s.headerSecondary} disabled={!canEdit || busy || loading || !dirty} onClick={() => void operate("angelcare_imagery_save")}><Save size={15} /> Save draft</button>
          <button type="button" className={s.headerSecondary} onClick={() => { setDirectory(false); setEditing(false); setBefore(false); }}><Eye size={15} /> Preview</button>
          <button type="button" className={s.headerPublish} disabled={!canPublish || busy || loading || dirty || (!changed.length && !hostChanged)} onClick={() => { setPublishTargets(changed); setReview(true); }}><Send size={15} /> Publish</button>
        </div>
      </header>
      <section className={s.scopeBar} aria-label="Publication scope">
        <label>Public hostname<input aria-label="Public hostname" value={publicHostname} disabled={!canEdit || busy || loading} onChange={e=>setPublicHostname(e.target.value)} placeholder="my.angelcarehub.com" /></label>
        <label>Preview language<select aria-label="Preview language" value={previewLocale} onChange={e=>setPreviewLocale(e.target.value as "fr"|"en"|"ar")}><option value="fr">Français</option><option value="en">English</option><option value="ar">العربية</option></select></label>
        <p>Live: {liveHostname || "No published imagery override"} · Native product images retain their catalogue authority.</p>
      </section><div className={s.topbar}>
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
                op: "angelcare_imagery",
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
              <div className={s.mapHeading}><div><h2>Page image map</h2><p>Manage the visual placements of {title(page)}.</p></div><span>{slots.length} slots</span></div>
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
                {([
                  ["all", slots.length],
                  ["changed", slots.filter((d) => changed.includes(d.id)).length],
                  ["defaults", slots.filter((d) => !config.slots[d.id]).length],
                  ["attention", slots.filter((d) => (frameReady && rendered.length > 0 && !rendered.includes(d.id)) || !!config.slots[d.id]?.images.some((i) => !i.enabled)).length],
                ] as const).map(([key, count]) => (
                  <button key={key} type="button" aria-pressed={filter === key} onClick={() => setFilter(key)}>
                    {key === "all" ? "All" : key === "changed" ? "Changed" : key === "defaults" ? "Defaults" : "Attention"} <b>{count}</b>
                  </button>
                ))}
              </div>
              <nav aria-label="Image placements">
                {[...new Set(visibleSlots.map((d) => d.section))].map(
                  (section) => (
                    <section key={section}>
                      <h3>{section.replaceAll(".", " · ")} <span>{visibleSlots.filter((d) => d.section === section).length}</span></h3>
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
                              <small>{config.slots[d.id]?.images.length || 0} / {d.sequence ? 12 : 1} images · {config.slots[d.id]?.images.length ? config.slots[d.id]?.mode || "Single" : "Original"}</small>
                              <small>{changed.includes(d.id) ? "● Changed · " : ""}{d.owner === "shared" ? "Shared" : "Page only"}</small>
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
              <div className={s.canvasHeading}><div><h2>Workspace page preview</h2><p>{title(page)} · {before ? "Published snapshot (not a browser live audit)" : "Current draft (not live)"}</p></div><span data-ready={frameReady}>{frameReady ? "Preview connected" : "Loading preview"}</span></div>
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
              <div className={s.previewAddress}><span>{pagePath(page, previewLocale)}</span><small>{previewLocale.toUpperCase()} · {Math.round(scale * 100)}%</small></div>
              <div ref={stage} className={s.stage}>
                <div style={{ width: device * scale, height: 1050 * scale }}>
                  <iframe
                    title="Actual AngelCare page imagery preview"
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
                <span className={s.inspectThumbnail}><Thumbnail slot={descriptor} src={source} /></span>
                <div className={s.inspectMeta}><h2>{descriptor?.label || "Image placement"}</h2>
                  <p>{descriptor?.section} · {descriptor?.sequence ? "Slideshow-ready" : "Static artwork"}</p>
                  <small>{images.length} / {descriptor?.sequence ? 12 : 1} images · {current.mode} · {descriptor?.id}</small></div>
                <span className={s.inspectStatus}>{changed.includes(descriptor?.id) || dirty ? "Modified" : "Ready"}</span>
              </div>
              <div className={s.inspectAux}>
                <strong>{title(page)}</strong>
                <small>{descriptor?.sequence ? "Up to 12 images per placement" : "One static image for this placement"}</small>
                <span className={s.capacity} data-full={images.length === (descriptor?.sequence ? 12 : 1)}>{images.length} / {descriptor?.sequence ? 12 : 1} used</span>
              </div>
              <LiveDeliveryInspector
                placementId={descriptor?.id || ""}
                live={live}
                liveDelivery={liveDelivery}
                liveHostname={liveHostname}
                draft={config}
                previewVisible={rendered.includes(descriptor?.id || "")}
                onRefresh={async () => {
                  const result = await query<any>({ op: "angelcare_imagery", page });
                  setLiveDelivery(result.liveDelivery || null);
                }}
              />
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
                    <div className={s.inspectorSectionTitle}>
                      <div><h3>Placement images</h3><p>{descriptor?.sequence ? "Manage up to 12 images, order and visibility." : "Static artwork: one approved image."}</p></div>
                      <span>{images.length} / {descriptor?.sequence ? 12 : 1} used</span>
                    </div>
                    <div className={s.ingestRow}>
                      <label className={s.upload} onDragOver={(e) => e.preventDefault()}
                        onDrop={(e) => { e.preventDefault(); upload(e.dataTransfer.files); }}>
                        <Upload size={21} /><strong>Upload images</strong>
                        <small>Drop PNG, JPEG, WebP or AVIF · 30 MB max / image</small>
                        <input ref={uploadInput} type="file" multiple={!!descriptor?.sequence}
                          accept="image/png,image/jpeg,image/webp,image/avif"
                          onChange={(e) => { upload(e.target.files); e.target.value = ""; }} />
                      </label>
                      <div className={s.libraryAction}>
                        <FolderOpen size={18} /><strong>Native media library</strong>
                        <NativeImagePicker
                          onSelect={(asset) => addAsset(asset)}
                          onSelectMany={descriptor?.sequence ? addAssets : undefined}
                          max={descriptor?.sequence ? Math.max(1, 12 - images.length) : 1}
                          excludeIds={images.map(item => item.assetId)}
                          disabled={!canEdit || busy || loading || images.length >= (descriptor?.sequence ? 12 : 1)}
                        />
                      </div>
                    </div>
                    <div className={s.sequenceBar}>
                      <div><strong>{descriptor?.sequence ? "Image sequence" : "Static placement"}</strong>
                        <span>{images.filter((i) => i.enabled).length} enabled · {images.length} / {descriptor?.sequence ? 12 : 1} used</span></div>
                      <small><GripVertical size={13} /> Drag to reorder</small>
                    </div>
                    <div className={s.sequenceGrid} role="list" aria-label="Images in the selected placement">
                      {Array.from({ length: descriptor?.sequence ? 12 : 1 }, (_, n) => {
                        const entry = images[n];
                        return entry ? (
                          <div role="listitem" key={entry.id} className={s.sequenceTile}
                            data-active={image?.id === entry.id} data-enabled={entry.enabled}
                            draggable onDragStart={() => { drag.current = entry.id; }}
                            onDragOver={(e) => e.preventDefault()}
                            onDrop={(e) => { e.preventDefault(); reorder(drag.current, entry.id); }}>
                            <div className={s.tileTop}><b>{n + 1}</b>
                              <label className={s.tileToggle} title="Enable image">
                                <input type="checkbox" aria-label={"Enable image " + (n + 1)} checked={entry.enabled}
                                  onChange={(e) => patch({ images: images.map((v) => v.id === entry.id ? { ...v, enabled: e.target.checked } : v) })} />
                                <span />
                              </label>
                            </div>
                            <button type="button" className={s.tileImage} aria-pressed={image?.id === entry.id}
                              aria-label={"Select image " + (n + 1)} onClick={() => { setSlideId(entry.id); setMobilePick(false); }}>
                              <img src={entry.src} alt={entry.alt || "Image"} loading="lazy" />
                              {entry.mobile ? <span className={s.mobileBadge}>Mobile</span> : null}
                            </button>
                            <div className={s.tileActions}>
                              <span title="Drag to reorder"><GripVertical size={13} /></span>
                              <button type="button" disabled={n === 0} aria-label={"Move image " + (n + 1) + " earlier"}
                                onClick={() => reorder(entry.id, images[n - 1].id)}><ArrowUp size={12} /></button>
                              <button type="button" disabled={n === images.length - 1} aria-label={"Move image " + (n + 1) + " later"}
                                onClick={() => reorder(entry.id, images[n + 1].id)}><ArrowDown size={12} /></button>
                              <label className={s.tileReplace} title={"Replace image " + (n + 1)}>
                                <RotateCcw size={12} />
                                <input type="file" accept="image/png,image/jpeg,image/webp,image/avif"
                                  aria-label={"Replace image " + (n + 1)}
                                  onChange={(e) => { uploadReplace(e.target.files, entry.id); e.target.value = ""; }} />
                              </label>
                              <button type="button" aria-label={"Remove image " + (n + 1)}
                                onClick={() => patch({ images: images.filter((v) => v.id !== entry.id) })}><Trash2 size={12} /></button>
                            </div>
                          </div>
                        ) : (
                          <button key={"empty-" + n} type="button" className={s.emptyTile}
                            disabled={!canEdit || busy || loading}
                            aria-label={"Upload image into empty position " + (n + 1)}
                            onClick={() => uploadInput.current?.click()}>
                            <span>{n + 1}</span><Plus size={18} /><small>Add image</small>
                          </button>
                        );
                      })}
                    </div>
                    <div className={s.editorDetails}>
                      <section className={s.detailCard}>
                        <div className={s.detailHeading}><h3>Selected image settings</h3><span>{image ? "Image " + (images.indexOf(image) + 1) : "Choose an image"}</span></div>
                        {image ? (<>
                          <Field label="Alternative text"><input type="text" maxLength={500} value={image.alt}
                            onChange={(e) => patchImage({ alt: e.target.value })} /></Field>
                          <div className={s.focalInline}>
                            <button type="button" className={s.focalCompact}
                              aria-label="Set desktop focal point" style={{ backgroundImage: "url(" + JSON.stringify(image.src) + ")" }}
                              onClick={(e) => {
                                const box = e.currentTarget.getBoundingClientRect();
                                patchImage({ focal: {
                                  x: Math.round(Math.max(0, Math.min(100, (e.clientX - box.left) / box.width * 100))),
                                  y: Math.round(Math.max(0, Math.min(100, (e.clientY - box.top) / box.height * 100))),
                                } });
                              }}>
                              <span style={{ left: image.focal.x + "%", top: image.focal.y + "%" }}>+</span>
                            </button>
                            <div className={s.compactControls}>
                              <Field label="Zoom"><input type="number" min={1} max={2} step={0.05}
                                value={image.zoom} onChange={(e) => patchImage({ zoom: Number(e.target.value) })} /></Field>
                              <Field label="Image fit"><select value={image.fit}
                                onChange={(e) => patchImage({ fit: e.target.value as Scene["fit"] })}>
                                <option value="contain">Contain · show all</option>
                                <option value="cover">Cover · fill frame</option>
                              </select></Field>
                            </div>
                          </div>
                          <div className={s.mobileAction}>
                            <span><Smartphone size={15} /> {image.mobile ? "Mobile variant assigned" : "No mobile variant"}</span>
                            <button type="button" onClick={() => setMobilePick(!mobilePick)}>{mobilePick ? "Close" : image.mobile ? "Change" : "Set mobile image"}</button>
                          </div>
                          {mobilePick ? <NativeImagePicker onSelect={(asset) => {
                            patchImage({ mobile: asset.url, mobileAssetId: asset.id }); setMobilePick(false);
                          }} /> : null}
                          <small className={s.usageNote}>Settings apply only to this placement. The original media-vault asset is preserved.</small>
                        </>) : <p className={s.help}>Upload or choose an image to edit its framing and alternative text.</p>}
                      </section>
                      <section className={s.detailCard}>
                        <div className={s.detailHeading}><h3>Playback preview</h3><span>{descriptor?.sequence ? "Slideshow-ready" : "Static"}</span></div>
                        {descriptor?.sequence ? (<>
                          <div className={s.modeSwitch}>
                            <button type="button" aria-pressed={current.mode === "slideshow"} onClick={() => patch({ mode: "slideshow" })}>Slideshow</button>
                            <button type="button" aria-pressed={current.mode === "single"} onClick={() => patch({ mode: "single" })}>Single image</button>
                          </div>
                          <div className={s.two}>
                            <Field label="Interval (seconds)"><input type="number" min={1.5} max={30} step={0.5}
                              value={current.interval / 1000} onChange={(e) => patch({ interval: Number(e.target.value) * 1000 })} /></Field>
                            <Field label="Transition"><select value={current.transition}
                              onChange={(e) => patch({ transition: e.target.value as Placement["transition"] })}>
                              <option value="fade">Fade</option><option value="slide">Slide</option><option value="cut">Cut</option>
                            </select></Field>
                          </div>
                          <Toggle label="Autoplay" value={current.autoplay} onChange={(autoplay) => patch({ autoplay })} />
                          <Toggle label="Loop sequence" value={current.loop} onChange={(loop) => patch({ loop })} />
                          <Toggle label="Visitor arrows & pause" value={current.controls} onChange={(controls) => patch({ controls })} />
                        </>) : <p className={s.help}>Static artwork has no slideshow playback.</p>}
                        <div className={s.detailsFooter}>
                          <button type="button" onClick={() => setTab("framing")}><SlidersHorizontal size={13} /> Advanced framing</button>
                          <button type="button" onClick={() => setTab("playback")}><Eye size={13} /> Full playback</button>
                        </div>
                      </section>
                    </div>
                    <div className={s.placementUtilities}>
                      <Toggle label="Hide this editorial artwork" value={current.hidden} disabled={page === "shared"} onChange={(hidden) => patch({ hidden })} />
                      <button type="button" onClick={() => { setTargets([]); setCopyOpen(true); }}><Copy size={14} /> Apply to other placements</button>
                    </div>
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
                                        "angelcare.imagery.badge-favourites",
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
              setConfig(saved); setPublicHostname(savedHostname);
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
          onClick={() => void operate("angelcare_imagery_save")}
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
          disabled={!canPublish || busy || loading || dirty || (!changed.length && !hostChanged)}
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
            {hostChanged ? <p>Publication hostname: {liveHostname || "unbound"} → {savedHostname}. Saved hostname changes publish with this review.</p> : null}
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
              disabled={dirty || busy || !canPublish || (!publishTargets.length && !hostChanged)}
              onClick={() =>
                void operate("angelcare_imagery_publish", {
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
                        void operate("angelcare_imagery_restore", {
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
