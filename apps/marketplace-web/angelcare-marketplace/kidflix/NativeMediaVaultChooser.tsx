"use client";

import {
  useCallback, useEffect, useMemo, useRef, useState,
  type ChangeEvent, type DragEvent,
} from "react";
import {
  ArrowDown, ArrowLeft, ArrowRight, ArrowUp, Check, CheckCheck, ChevronDown,
  ChevronLeft, ChevronRight, CircleAlert, CircleCheck, Clock3, Copy, Download,
  Eye, FileImage, FilterX, FolderOpen, Grid2X2, GripVertical, HardDrive,
  Image as ImageIcon, Info, Layers3, List, Loader2, Maximize2, Search,
  ShieldCheck, SlidersHorizontal, Sparkles, Tags, UploadCloud, X,
} from "lucide-react";
import { Dialog, query, useQuery, useUI } from "../digital-customer-experience/components/ui";
import {
  addUniqueAssets, assetIssue, mediaPassesClientFilters, normalizeNativeAsset,
  publishedSafe, reorderAsset, type NativeMediaAsset, type MediaClientFilters,
} from "./native-media-vault-contract";
import s from "./native-media-vault.module.css";

type Props = {
  max: number;
  excludeIds?: string[];
  onClose: () => void;
  onConfirm: (assets: NativeMediaAsset[]) => void;
};
const emptyFilters: MediaClientFilters = {
  orientation: "", ratio: "", category: "", collection: "", language: "",
  tag: "", uploader: "", used: "", readyOnly: false, hasAlt: false,
  publishedSafe: false, unusedOnly: false,
};
const options = (rows: NativeMediaAsset[], key: keyof NativeMediaAsset): string[] =>
  [...new Set(rows.map(r => r[key]).filter((v): v is string => typeof v === "string" && !!v))].sort();
const fmt = (size: number) => size ? size > 1024 * 1024
  ? (size / (1024 * 1024)).toFixed(1) + " MB"
  : (size / 1024).toFixed(0) + " KB" : "—";
const date = (v: string | null) => v && !Number.isNaN(Date.parse(v))
  ? new Date(v).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" })
  : "Not recorded";
const seen = (id: string, all: NativeMediaAsset[]) => all.some(item => item.id === id);
const text = (v: string) => v || "Not recorded";

export function NativeMediaVaultChooser({ max, excludeIds = [], onClose, onConfirm }: Props) {
  const { locale } = useUI();
  const [search, setSearch] = useState("");
  const [debounced, setDebounced] = useState("");
  const [page, setPage] = useState(1);
  const [mime, setMime] = useState("image/");
  const [format, setFormat] = useState("");
  const [rights, setRights] = useState("");
  const [processing, setProcessing] = useState("");
  const [folder, setFolder] = useState("");
  const [filters, setFilters] = useState<MediaClientFilters>(emptyFilters);
  const [sort, setSort] = useState("name-asc");
  const [grid, setGrid] = useState(true);
  const [selected, setSelected] = useState<NativeMediaAsset[]>([]);
  const [active, setActive] = useState<NativeMediaAsset | null>(null);
  const [view, setView] = useState("all");
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [probe, setProbe] = useState<Record<string, "ok" | "failed" | "testing">>({});
  const [expanded, setExpanded] = useState(false);
  const uploadRef = useRef<HTMLInputElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const dragRef = useRef<number | null>(null);
  const excluded = useMemo(() => new Set(excludeIds), [excludeIds.join("|")]);
  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebounced(search.trim());
      setPage(1);
    }, 250);
    return () => window.clearTimeout(timer);
  }, [search]);
  useEffect(() => {
    const key = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault(); searchRef.current?.focus();
      }
    };
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, []);
  const pageSize = 24;
  const response = useQuery<{ rows: Record<string, unknown>[]; total: number }>({
    op: "native", type: "media", mime: format ? "image/" + format : mime,
    q: debounced, page, pageSize,
  }, { rows: [], total: 0 });
  const all = useMemo(() => response.value.rows.map(normalizeNativeAsset), [response.value.rows]);
  const filtered = useMemo(() => {
    const data = all.filter(a =>
      (!rights || a.rights.toLowerCase() === rights) &&
      (!processing || a.processingState.toLowerCase() === processing) &&
      (!folder || a.folderId === folder) &&
      mediaPassesClientFilters(a, filters)
    );
    return [...data].sort((a, b) => {
      if (sort === "largest") return b.size - a.size;
      if (sort === "smallest") return a.size - b.size;
      if (sort === "name-desc") return b.title.localeCompare(a.title);
      if (sort === "recent") return Date.parse(b.updatedAt || b.createdAt || "") - Date.parse(a.updatedAt || a.createdAt || "") || a.title.localeCompare(b.title);
      return a.title.localeCompare(b.title);
    });
  }, [all, rights, processing, folder, filters, sort]);
  const resultCount = Number(response.value.total || 0);
  const totalPages = Math.max(1, Math.ceil(resultCount / pageSize));
  const shown = Math.min(resultCount, (page - 1) * pageSize + all.length);
  const facets = useMemo(() => ({
    categories: options(all, "category"), collections: options(all, "collection"),
    folders: [...new Map(all.filter(x => x.folderId).map(x => [x.folderId, { id: x.folderId, title: x.folderName || x.folderId }])).values()],
    languages: options(all, "language"), uploaders: options(all, "uploadedBy"),
    rights: options(all, "rights"), processing: options(all, "processingState"),
    tags: [...new Set(all.flatMap(x => x.tags))].sort(),
  }), [all]);
  const activeAsset = active || selected.at(-1) || filtered[0] || null;
  const limited = selected.length >= max;
  const isEligible = (a: NativeMediaAsset) => !assetIssue(a) && !excluded.has(a.id);
  function toggle(a: NativeMediaAsset) {
    if (!isEligible(a)) return;
    setSelected(current => seen(a.id, current)
      ? current.filter(item => item.id !== a.id)
      : addUniqueAssets(current, [a], max, excludeIds));
    setActive(a);
  }
  function setFacet(key: keyof MediaClientFilters, value: string | boolean) {
    setFilters(v => ({ ...v, [key]: value }));
  }
  function preset(value: string) {
    setView(value);
    setFilters({ ...emptyFilters,
      ...(value === "safe" ? { publishedSafe: true, readyOnly: true } : {}),
      ...(value === "unused" ? { unusedOnly: true } : {}),
      ...(value === "square" ? { orientation: "square" } : {}),
    });
    setRights(""); setProcessing(""); setFormat(""); setFolder("");
    setPage(1);
  }
  const reset = () => { preset("all"); setSearch(""); };
  const hasFilters = Boolean(search || rights || processing || format || folder ||
    Object.values(filters).some(Boolean));
  const chips = [
    ...(format ? [{ label: "Format: " + format.toUpperCase(), remove: () => setFormat("") }] : []),
    ...(rights ? [{ label: "Rights: " + rights, remove: () => setRights("") }] : []),
    ...(processing ? [{ label: "Processing: " + processing, remove: () => setProcessing("") }] : []),
    ...(folder ? [{ label: "Folder", remove: () => setFolder("") }] : []),
    ...Object.entries(filters).filter(([, value]) => Boolean(value)).map(([key, value]) => ({
      label: key.replace(/([A-Z])/g, " $1") + (typeof value === "string" ? ": " + value : ""),
      remove: () => setFacet(key as keyof MediaClientFilters, typeof value === "boolean" ? false : ""),
    })),
  ];
  async function testImage(a: NativeMediaAsset) {
    setProbe(p => ({ ...p, [a.id]: "testing" }));
    const img = new window.Image();
    img.src = a.url;
    try {
      await Promise.race([
        img.decode(),
        new Promise<never>((_, reject) => window.setTimeout(() => reject(Error("timeout")), 8000)),
      ]);
      setProbe(p => ({ ...p, [a.id]: img.naturalWidth > 0 ? "ok" : "failed" }));
    } catch { setProbe(p => ({ ...p, [a.id]: "failed" })); }
  }
  async function upload(e: ChangeEvent<HTMLInputElement>) {
    const files = [...(e.target.files || [])];
    e.target.value = "";
    if (!files.length) return;
    setUploadError("");
    setUploading(true);
    try {
      for (const file of files) {
        if (!["image/png", "image/jpeg", "image/webp", "image/avif"].includes(file.type)) throw Error("Unsupported image format.");
        const digest = await crypto.subtle.digest("SHA-256", await file.arrayBuffer());
        const sha256 = [...new Uint8Array(digest)].map(x => x.toString(16).padStart(2, "0")).join("");
        const post = async (path: string, body: unknown) => {
          const res = await fetch("/api/angelcare-marketplace/admin/media" + path, {
            method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body),
          });
          const payload = await res.json().catch(() => ({}));
          if (!res.ok) throw Error(payload.error?.message || payload.message || "Native Media Vault upload failed.");
          return payload.data || payload;
        };
        const preflight = await post("/preflight", {
          files: [{ fileName: file.name, mimeType: file.type, sizeBytes: file.size, checksumSha256: sha256 }],
        });
        const check = Array.isArray(preflight) ? preflight[0] : preflight;
        if (check?.duplicate?.id) continue;
        if (check?.state === "FAILED" || check?.errors?.length) throw Error(check.errors?.join(" · ") || "Media rejected.");
        const session = await post("/upload-session", {
          fileName: file.name, mimeType: file.type, sizeBytes: file.size,
          checksumSha256: sha256, folder: "digital-customer-experience", title: file.name,
        });
        if (!session.uploadUrl || !session.assetId) throw Error("Media Vault did not return a valid upload session.");
        const transfer = await fetch(session.uploadUrl, {
          method: session.method || "PUT", body: file,
          headers: session.headers || { "content-type": file.type },
        });
        if (!transfer.ok) throw Error("Media transfer failed (HTTP " + transfer.status + ").");
        await post("/" + session.assetId + "/complete", {
          checksumSha256: sha256, sizeBytes: file.size, mimeType: file.type,
        });
      }
      response.reload();
      setPage(1);
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : "Upload failed.");
    } finally { setUploading(false); }
  }
  function confirm() {
    if (selected.length && selected.every(isEligible)) onConfirm(selected);
  }
  const localeLabel = locale === "fr" ? "Choisir dans la médiathèque"
    : locale === "ar" ? "اختيار الوسائط الموجودة" : "Choose existing media";

  return <Dialog workspace title={<span className={s.modalHeading}><Layers3 size={19} /> Native Media Vault <span>{localeLabel}</span></span>} onClose={onClose}>
    <section className={s.shell} data-native-media-vault="pro-max" data-selection-mode={max > 1 ? "multiple" : "single"}>
      <header className={s.top}>
        <div className={s.titleBlock}>
          <span className={s.kicker}>ANGELCARE MARKETPLACE · GOVERNED MEDIA</span>
          <strong>Choose existing media</strong>
          <small>Use real native assets in products, services, banners, galleries, and educational experiences.</small>
        </div>
        <div className={s.toolbar}>
          <label className={s.search}><Search size={17} /><input ref={searchRef} type="search"
            placeholder="Search filename, alt text, reference…" value={search}
            onChange={e => setSearch(e.target.value)} aria-label="Search media" />
            <kbd>⌘ K</kbd>
          </label>
          <label className={s.savedView}><span>Saved views</span><select value={view} onChange={e => preset(e.target.value)}
            aria-label="Choose a media view">
            <option value="all">All native images</option><option value="safe">Rights-approved & ready</option>
            <option value="square">Square imagery</option><option value="unused">Unused assets</option>
          </select></label>
          <input ref={uploadRef} type="file" accept="image/png,image/jpeg,image/webp,image/avif"
            multiple={max > 1} hidden onChange={e => void upload(e)} />
          <button type="button" className={s.uploadButton} disabled={uploading}
            onClick={() => uploadRef.current?.click()}><UploadCloud size={16} />{uploading ? "Uploading…" : "Upload new media"}</button>
          <button type="button" className={s.cancelButton} onClick={onClose}>Cancel</button>
          <button type="button" className={s.confirmButton} disabled={!selected.length || uploading}
            onClick={confirm}><Check size={17} /> Confirm selection {selected.length ? "(" + selected.length + ")" : ""}</button>
        </div>
        {uploadError && <p role="alert" className={s.error}><CircleAlert size={15} />{uploadError}</p>}
      </header>
      <div className={s.content}>
        <aside className={s.filters} aria-label="Media filters">
          <div className={s.filterTitle}><strong><SlidersHorizontal size={15} /> Filters</strong>
            <button onClick={reset} type="button">Reset all</button></div>
          <div className={s.filterScroll}>
            <div className={s.field}><strong><FileImage size={14}/>Media type</strong>
              <label className={s.check}><input type="checkbox" checked readOnly /> Images <span>{resultCount || "—"}</span></label>
              <small>This selector only assigns image assets.</small></div>
            <label className={s.field}><strong>Format</strong><select value={format} onChange={e => {setFormat(e.target.value);setPage(1);}}>
              <option value="">All image formats</option><option value="png">PNG</option><option value="jpeg">JPEG</option>
              <option value="webp">WebP</option><option value="avif">AVIF</option></select></label>
            <label className={s.field}><strong><ShieldCheck size={14}/>Rights status</strong>
              <select value={rights} onChange={e => setRights(e.target.value)}><option value="">Any rights status</option>
                {facets.rights.map(x => <option value={x.toLowerCase()} key={x}>{x}</option>)}</select></label>
            <label className={s.field}><strong><CircleCheck size={14}/>Processing status</strong>
              <select value={processing} onChange={e => setProcessing(e.target.value)}><option value="">Any processing status</option>
                {facets.processing.map(x => <option value={x.toLowerCase()} key={x}>{x}</option>)}</select></label>
            <label className={s.field}><strong>Orientation</strong><select value={filters.orientation}
              onChange={e => setFacet("orientation",e.target.value)}><option value="">All orientations</option>
                <option value="square">Square</option><option value="landscape">Landscape</option>
                <option value="portrait">Portrait</option></select></label>
            <label className={s.field}><strong>Aspect ratio</strong><select value={filters.ratio}
              onChange={e => setFacet("ratio", e.target.value)}><option value="">All aspect ratios</option>
                {["1:1","16:9","4:3","3:4"].map(x => <option key={x}>{x}</option>)}</select></label>
            <label className={s.field}><strong><FolderOpen size={14}/>Folder</strong>
              <select value={folder} onChange={e => setFolder(e.target.value)}><option value="">All folders</option>
                {facets.folders.map(x => <option key={x.id} value={x.id}>{x.title}</option>)}</select></label>
            {(["collection","category","language","uploader"] as const).map(key =>
              <label className={s.field} key={key}><strong>{key === "uploader" ? "Uploaded by" : key[0].toUpperCase() + key.slice(1)}</strong>
                <select value={filters[key]} onChange={e => setFacet(key, e.target.value)}>
                  <option value="">Any {key}</option>
                  {(key === "collection" ? facets.collections : key === "category" ? facets.categories : key === "language" ? facets.languages : facets.uploaders)
                    .map(x => <option key={x}>{x}</option>)}</select></label>
            )}
            <label className={s.field}><strong><Tags size={14}/>Tags</strong>
              <select value={filters.tag} onChange={e => setFacet("tag", e.target.value)}>
                <option value="">All tags</option>{facets.tags.map(x => <option key={x}>{x}</option>)}</select></label>
            <label className={s.field}><strong>Usage</strong><select value={filters.used}
              onChange={e => setFacet("used", e.target.value)}><option value="">Any usage</option>
                <option value="used">Used in content</option></select></label>
            <label className={s.field}><strong>Sort by</strong><select value={sort} onChange={e => setSort(e.target.value)}>
              <option value="name-asc">Filename A–Z</option><option value="name-desc">Filename Z–A</option>
              <option value="recent">Recently updated</option><option value="largest">Largest first</option>
              <option value="smallest">Smallest first</option></select></label>
            <div className={s.toggles}>
              {([{key:"readyOnly",label:"Ready only"},{key:"hasAlt",label:"Has alt text"},
                {key:"publishedSafe",label:"Published-safe"},{key:"unusedOnly",label:"Unused only"}] as const)
                .map(x => <label className={s.toggle} key={x.key}>
                  <input type="checkbox" checked={filters[x.key]} onChange={e => setFacet(x.key, e.target.checked)} />
                  <span>{x.label}</span></label>)}
            </div>
            <p className={s.filterNote}><Info size={13}/> Filename/format searches cover the vault; other facets operate on this loaded page and never imply global totals.</p>
          </div>
        </aside>
        <main className={s.catalog}>
          <div className={s.chips}>
            <b>Active filters:</b>
            {chips.map((chip,i) => <button type="button" key={i} onClick={chip.remove}>{chip.label}<X size={11}/></button>)}
            {!chips.length && <span className={s.noFilters}>All images</span>}
            {hasFilters && <button type="button" className={s.clear} onClick={reset}>Clear all</button>}
          </div>
          <div className={s.catalogTop}><div><strong>{resultCount.toLocaleString()} assets</strong>
            <small>Showing {resultCount ? (page - 1) * pageSize + 1 : 0}–{shown} · {filtered.length} match current-page filters</small></div>
            <div className={s.catalogActions}><button type="button" className={grid ? s.activeView : ""} onClick={() => setGrid(true)} aria-label="Grid view"><Grid2X2 size={17}/></button>
              <button type="button" className={!grid ? s.activeView : ""} onClick={() => setGrid(false)} aria-label="List view"><List size={17}/></button>
              <button type="button" className={s.refresh} onClick={() => response.reload()} aria-label="Refresh media">Refresh</button></div></div>
          <div className={s.scroller}>
            {response.loading && <div className={s.state}><Loader2 size={24} className={s.spin} /> Loading native media…</div>}
            {response.error && <div className={s.state} role="alert"><CircleAlert size={24}/>{response.error}
              <button type="button" onClick={() => response.reload()}>Retry</button></div>}
            {!response.loading && !response.error && filtered.length === 0 && <div className={s.state}><FilterX size={28}/>
              No eligible images match the selected filters.
              <button onClick={reset} type="button">Reset filters</button></div>}
            {!response.loading && !response.error && filtered.length > 0 && <div className={grid ? s.assetGrid : s.assetList}>
              {filtered.map(a => {
                const checked = seen(a.id, selected);
                const issue = assetIssue(a) || (excluded.has(a.id) ? "Already assigned to this placement" : "");
                return <article key={a.id} className={s.assetCard} data-selected={checked} data-ineligible={!!issue}>
                  <button type="button" className={s.cardSelect} disabled={!!issue || (limited && !checked)} onClick={() => toggle(a)}
                    aria-pressed={checked} aria-label={(checked ? "Remove " : "Select ") + a.title}>
                    <span className={s.checkbox}>{checked && <Check size={13}/>}</span>
                    <div className={s.thumb}>{a.url ? <img src={a.url} alt="" loading="lazy" /> : <ImageIcon size={28}/>}</div>
                    <div className={s.cardBody}><strong title={a.title}>{a.title}</strong>
                      <small>{a.width && a.height ? a.width + " × " + a.height + " · " : ""}{a.mime.split("/")[1]?.toUpperCase()} · {fmt(a.size)}</small>
                      <div className={s.cardBadges}><span data-tone={publishedSafe(a) ? "good" : "neutral"}>{publishedSafe(a) ? "Rights approved" : a.rights || "Rights unverified"}</span>
                        <span data-tone="blue">{a.processingState || "Unknown status"}</span></div>
                      <small className={s.usage}>Used in: {a.usageCount ?? "—"}</small>
                    </div>
                  </button>
                  {issue && <span className={s.blockReason} title={issue}><CircleAlert size={13}/>{issue}</span>}
                  <button type="button" className={s.inspectButton} onClick={() => {setActive(a); setExpanded(false);}} aria-label={"Inspect " + a.title}><Eye size={15}/></button>
                </article>;
              })}
            </div>}
          </div>
          <nav className={s.pagination} aria-label="Media result pages">
            <button type="button" disabled={page === 1} onClick={() => setPage(p => Math.max(1,p-1))}><ChevronLeft size={14}/>Previous</button>
            <span>Page {page} of {totalPages}</span>
            <button type="button" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>Next<ChevronRight size={14}/></button>
          </nav>
        </main>
        <aside className={s.inspector}>
          <div className={s.inspectorTitle}><strong>Asset preview</strong><small>{selected.length} selected</small></div>
          {activeAsset ? <>
            <div className={s.largeImage}>
              {activeAsset.url && <img src={activeAsset.url} alt={activeAsset.alt || activeAsset.title} />}
              <button type="button" onClick={() => setExpanded(x => !x)} aria-label={expanded ? "Exit large preview" : "Enlarge preview"}><Maximize2 size={16}/></button>
            </div>
            {expanded && <div className={s.zoom} role="dialog" aria-label="Large image preview" onClick={() => setExpanded(false)}>
              <img src={activeAsset.url} alt={activeAsset.alt || activeAsset.title}/>
              <button type="button" onClick={() => setExpanded(false)}><X size={18}/> Close</button>
            </div>}
            <div className={s.assetTitle}><strong>{activeAsset.title}</strong>
              <span data-good={publishedSafe(activeAsset)}>{publishedSafe(activeAsset) ? "Published-safe" : "Review rights"}</span></div>
            <dl className={s.metadata}>
              {[
                ["Asset ID", activeAsset.id],["Filename", activeAsset.fileName],
                ["Alt text", activeAsset.alt], ["Folder", activeAsset.folderName || activeAsset.folderId],
                ["Collection", activeAsset.collection],["Category", activeAsset.category],
                ["Dimensions", activeAsset.width ? activeAsset.width + " × " + activeAsset.height + " px" : ""],
                ["File size", fmt(activeAsset.size)],["Format (MIME)", activeAsset.mime],
                ["Rights",activeAsset.rights],["Expiry",date(activeAsset.expiresAt)],
                ["Processing",activeAsset.processingState],["Variants",activeAsset.variants === null ? "" : String(activeAsset.variants)],
                ["Usage", activeAsset.usageCount === null ? "" : "Used in " + activeAsset.usageCount + " placements"],
                ["Language",activeAsset.language],["Uploader",activeAsset.uploadedBy],
                ["Updated",date(activeAsset.updatedAt)],
              ].map(([name,value]) => <div key={name}><dt>{name}</dt><dd title={value}>{text(value)}</dd></div>)}
            </dl>
            <div className={s.inspectActions}>
              <button type="button" onClick={() => void testImage(activeAsset)}><Eye size={15}/>
                {probe[activeAsset.id] === "testing" ? "Testing…" : probe[activeAsset.id] === "ok" ? "Decoded ✓" : probe[activeAsset.id] === "failed" ? "Image failed" : "Verify image"}</button>
              <button type="button" onClick={() => navigator.clipboard.writeText(activeAsset.id)}><Copy size={15}/> Copy ID</button>
              <a href={activeAsset.url} target="_blank" rel="noreferrer"><Maximize2 size={15}/> Open source</a>
            </div>
          </> : <div className={s.noPreview}><ImageIcon size={32}/> Select an asset to inspect metadata and delivery eligibility.</div>}
        </aside>
      </div>
      <footer className={s.tray}>
        <div className={s.trayLabel}><Layers3 size={20}/><div><strong>Selected {selected.length} / {max}</strong>
          <small>Drag or use arrows to reorder your selection.</small></div></div>
        <div className={s.trayItems}>
          {selected.map((a,i) => <div className={s.selectedAsset} key={a.id} draggable
            onDragStart={() => {dragRef.current = i;}}
            onDragOver={e => e.preventDefault()}
            onDrop={(e: DragEvent) => {e.preventDefault(); if (dragRef.current !== null) setSelected(rows => reorderAsset(rows,dragRef.current!,i));dragRef.current=null;}}>
            <span className={s.position}>{i+1}</span><img src={a.url} alt={a.title}/>
            <button type="button" onClick={() => setSelected(rows => rows.filter(x => x.id !== a.id))} aria-label={"Remove "+a.title}><X size={13}/></button>
            <div className={s.reorder}>
              <button type="button" disabled={i===0} onClick={() => setSelected(rows => reorderAsset(rows,i,i-1))} aria-label={"Move "+a.title+" earlier"}><ArrowLeft size={13}/></button>
              <GripVertical size={13}/>
              <button type="button" disabled={i===selected.length-1} onClick={() => setSelected(rows => reorderAsset(rows,i,i+1))} aria-label={"Move "+a.title+" later"}><ArrowRight size={13}/></button>
            </div>
          </div>)}
          {!selected.length && <div className={s.trayEmpty}><Sparkles size={16}/> Select existing images from the grid to begin.</div>}
        </div>
        <div className={s.trayFooter}><span>{max > 1 ? "Sequence" : "Single image"}</span>
          <button type="button" disabled={!selected.length} onClick={confirm}><CheckCheck size={15}/> Use selected</button></div>
      </footer>
    </section>
  </Dialog>;
}
