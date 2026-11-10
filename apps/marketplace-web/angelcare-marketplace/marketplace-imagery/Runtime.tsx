"use client";
import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  useCallback,
  type ReactNode,
  type CSSProperties,
  type ImgHTMLAttributes,
} from "react";
import { usePathname, useSearchParams } from "next/navigation";
import {
  Flame,
  Zap,
  Megaphone,
  Gift,
  Tag,
  Percent,
  Star,
  Heart,
  Crown,
  Trophy,
  BadgeCheck,
  Clock,
  Calendar,
  Bookmark,
  BookOpen,
  Download,
} from "lucide-react";
import {
  emptyConfig,
  type Config,
  type Descriptor,
  type Placement,
  type Badge,
} from "./model";
import s from "./imagery.module.css";
import { resolveSlot } from "./registry";
import { nextPlayableIndex } from "./public-runtime-contract";
import { pageFromPath } from "./pages";
const icons: Record<string, any> = {
  flame: Flame,
  lightning: Zap,
  megaphone: Megaphone,
  gift: Gift,
  tag: Tag,
  percent: Percent,
  star: Star,
  heart: Heart,
  crown: Crown,
  trophy: Trophy,
  seal: BadgeCheck,
  clock: Clock,
  calendar: Calendar,
  bookmark: Bookmark,
  book: BookOpen,
  download: Download,
};
export function BadgeIcon({
  name,
  size = 16,
}: {
  name: string;
  size?: number;
}) {
  const Icon = icons[name] || Tag;
  return <Icon size={size} aria-hidden="true" />;
}
export const ImageryContext = createContext<{
  page: string;
  config: Config;
  shared: Config;
  editing: boolean;
  selected: string;
  previewScene: string;
  deliveryStatus: string;
  register: (d: Descriptor) => void;
}>({
  page: "home",
  config: emptyConfig(),
  shared: emptyConfig(),
  editing: false,
  selected: "",
  previewScene: "",
  deliveryStatus: "initial",
  register: () => {},
});
export function ImageryProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname(),
    query = useSearchParams(),
    page = pageFromPath(pathname),
    preview = query.get("imageryPreview") === "1";
  const [state, setState] = useState({
      page: "",
      config: emptyConfig(),
      shared: emptyConfig(),
    }),
    [editing, setEditing] = useState(false),
    [selected, setSelected] = useState(""),
    [previewScene, setPreviewScene] = useState(""),
    [deliveryStatus, setDeliveryStatus] = useState("initial");
  const slots = useRef(new Map<string, Descriptor>());
  const previewOverride = useRef(false);
  const register = useCallback(
    (d: Descriptor) => {
      slots.current.set(d.id, d);
      if (preview && window.parent !== window)
        window.parent.postMessage(
          {
            type: "angelcare-imagery-slots",
            page,
            slots: [...slots.current.values()].filter(
              (x) => x.id.startsWith(page + ".") || x.id.startsWith("shared."),
            ),
          },
          location.origin,
        );
    },
    [page, preview],
  );
  useEffect(() => {
    previewOverride.current = false;
    setEditing(false);
    setSelected("");
    if (page === "other") {
      setDeliveryStatus("unsupported-page");
      return;
    }
    const ac = new AbortController();
    let active = true, attempts = 0;
    let timer: ReturnType<typeof setTimeout> | undefined;
    setDeliveryStatus("loading");
    const load = async () => {
      try {
        const response = await fetch(
          "/api/angelcare-marketplace/imagery?page=" + encodeURIComponent(page),
          { signal: ac.signal, cache: "no-store" },
        );
        if (!response.ok) throw Error("HTTP " + response.status);
        const value = await response.json();
        if (!active || previewOverride.current) return;
        setState({
          page,
          config: value.config || emptyConfig(),
          shared: value.shared || emptyConfig(),
        });
        setDeliveryStatus(value.diagnostics?.status || "published");
      } catch {
        if (!active || ac.signal.aborted || previewOverride.current) return;
        if (attempts < 3) {
          setDeliveryStatus("retrying");
          timer = setTimeout(() => { attempts++; void load(); }, [700, 1800, 4000][attempts]);
        } else {
          setDeliveryStatus("unavailable");
          console.warn("ANGELCARE_PUBLIC_IMAGERY_READ_FAILED", { page, attempts: attempts + 1 });
        }
      }
    };
    void load();
    return () => { active = false; ac.abort(); if (timer) clearTimeout(timer); };
  }, [page]);
  useEffect(() => {
    if (!preview || parent === window) return;
    const receive = (e: MessageEvent) => {
      if (e.origin !== location.origin || e.source !== parent) return;
      const v = e.data;
      if (v?.type !== "angelcare-imagery-preview" || v.page !== page) return;
      previewOverride.current = true;
      setDeliveryStatus("preview");
      setState({
        page,
        config: v.config || emptyConfig(),
        shared: v.shared || emptyConfig(),
      });
      setEditing(v.editing === true);
      setSelected(v.selected || "");
      setPreviewScene(v.sceneId || "");
      if (v.selected)
        requestAnimationFrame(() => {
          const target = [
            ...document.querySelectorAll<HTMLElement>("[data-imagery-slot]"),
          ].find((el) => el.dataset.imagerySlot === v.selected);
          target?.scrollIntoView({ block: "center", behavior: "auto" });
        });
    };
    addEventListener("message", receive);
    parent.postMessage(
      { type: "angelcare-imagery-ready", page },
      location.origin,
    );
    return () => removeEventListener("message", receive);
  }, [page, preview]);
  const click = (e: React.MouseEvent) => {
    if (!editing) return;
    const owned = (e.target as HTMLElement).closest<HTMLElement>(
      "[data-imagery-record]",
    );
    if (owned) {
      e.preventDefault();
      e.stopPropagation();
      parent.postMessage(
        { type: "angelcare-imagery-owned", record: owned.dataset.imageryRecord },
        location.origin,
      );
      return;
    }
    const target = (e.target as HTMLElement).closest<HTMLElement>(
      "[data-imagery-slot]",
    );
    if (!target) return;
    e.preventDefault();
    e.stopPropagation();
    setSelected(target.dataset.imagerySlot || "");
    parent.postMessage(
      { type: "angelcare-imagery-select", page, id: target.dataset.imagerySlot },
      location.origin,
    );
  };
  return (
    <ImageryContext.Provider
      value={{
        page,
        config: state.page === page ? state.config : emptyConfig(),
        shared: state.page === page ? state.shared : emptyConfig(),
        editing,
        selected,
        previewScene,
        deliveryStatus,
        register,
      }}
    >
      <div
        className={s.scope}
        data-imagery-editing={editing || undefined}
        data-imagery-delivery-status={deliveryStatus}
        onClickCapture={click}
      >
        {children}
      </div>
    </ImageryContext.Provider>
  );
}
export function ImageScope({
  prefix,
  children,
}: {
  prefix: string;
  children: ReactNode;
}) {
  return <Prefix.Provider value={prefix}>{children}</Prefix.Provider>;
}
const Prefix = createContext("");
function BadgeLayer({
  badges,
  enabled,
}: {
  badges: Badge[];
  enabled: boolean;
}) {
  if (!enabled) return null;
  return (
    <span className={s.badges} aria-hidden="true">
      {badges
        .filter((b) => b.enabled)
        .map((b, i) => (
          <span
            key={b.id}
            className={s.badge}
            data-shape={b.shape}
            data-size={b.size}
            data-corner={b.corner}
            data-relative={b.relative || undefined}
            data-motion={b.motion}
            data-mobile-hide={b.hideMobile || undefined}
            style={
              {
                "--badge-color": b.color,
                "--badge-bg": b.background,
                "--badge-x": b.x + "px",
                "--badge-y":
                  b.y +
                  i *
                    (b.size === "medium" ? 38 : b.size === "small" ? 30 : 24) +
                  "px",
                "--badge-rotate": b.rotation + "deg",
                "--badge-speed": b.speed + "ms",
                "--badge-delay": b.delay + "ms",
                "--badge-repeat": b.loop ? "infinite" : "1",
                "--badge-intensity": b.intensity,
                opacity: b.opacity,
                border: b.border ? "1px solid currentColor" : undefined,
                boxShadow: b.shadow ? "0 2px 6px #10243a25" : undefined,
              } as CSSProperties
            }
          >
            {b.display !== "text" ? <BadgeIcon name={b.icon} /> : null}
            {b.display !== "icon" ? <span>{b.text}</span> : null}
          </span>
        ))}
    </span>
  );
}
export type ArtProps = ImgHTMLAttributes<HTMLImageElement> & {
  slot?: string;
  section?: string;
  label?: string;
  condition?: string;
  sequence?: boolean;
  kind?: "image" | "sprite";
  children?: ReactNode;
};
export function Artwork({
  slot,
  section = "Artwork",
  label,
  condition,
  sequence = false,
  kind = "image",
  children,
  ...props
}: ArtProps) {
  const ctx = useContext(ImageryContext),
    prefix = useContext(Prefix),
    key = slot?.startsWith(ctx.page + ".") ? slot : slot?.startsWith("shared.")
      ? slot
      : slot
        ? ctx.page + "." + (prefix ? prefix + "." : "") + slot
        : "",
    config = key.startsWith("shared.") ? ctx.shared : ctx.config,
    setting = config.slots[key],
    configuredImages = (setting?.images || []).filter((i) => i.enabled),
    images =
      setting?.mode === "single"
        ? configuredImages.slice(0, 1)
        : configuredImages,
    [index, setIndex] = useState(0),
    [ready, setReady] = useState(""),
    [prior, setPrior] = useState(""),
    [failed, setFailed] = useState(false),
    [failedCount, setFailedCount] = useState(0),
    [recoveries, setRecoveries] = useState(0),
    [originalFailed, setOriginalFailed] = useState(false),
    [paused, setPaused] = useState(false),
    [hover, setHover] = useState(false),
    [visible, setVisible] = useState(true),
    [foreground, setForeground] = useState(true),
    [reduced, setReduced] = useState(true),
    [mobile, setMobile] = useState(false),
    [interactive, setInteractive] = useState(false),
    root = useRef<HTMLSpanElement>(null),
    generation = useRef(0),
    readyRef = useRef(""),
    unavailable = useRef(new Set<string>());
  const signature = JSON.stringify(images),
    image = images[index] || images[0],
    source = mobile && image?.mobile ? image.mobile : image?.src;
  useEffect(() => {
    if (key && resolveSlot(ctx.page, key))
      ctx.register({
        id: key,
        section,
        label: label || slot || key,
        condition,
        sequence,
        source: typeof props.src === "string" ? props.src : undefined,
        owner: key.startsWith("shared.") ? "shared" : "editable",
      });
  }, [key, section, label, condition, sequence, props.src, ctx.register]);
  useEffect(() => {
    generation.current++;
    unavailable.current.clear();
    readyRef.current = "";
    setFailedCount(0);
    setRecoveries(0);
    setIndex(0);
    setReady("");
    setPrior("");
    setFailed(false);
  }, [signature]);
  useEffect(() => setOriginalFailed(false), [props.src]);
  useEffect(() => {
    if (!key || (!setting && !ctx.editing)) return;
    const motion = matchMedia("(prefers-reduced-motion: reduce)"),
      small = matchMedia("(max-width:650px)"),
      sync = () => {
        setReduced(
          motion.matches ||
            document.documentElement.dataset.angelcareMotion === "no",
        );
        setMobile(small.matches);
      },
      fg = () => setForeground(!document.hidden);
    sync();
    fg();
    motion.addEventListener("change", sync);
    small.addEventListener("change", sync);
    document.addEventListener("visibilitychange", fg);
    const pref = new MutationObserver(sync);
    pref.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-angelcare-motion"],
    });
    return () => {
      motion.removeEventListener("change", sync);
      small.removeEventListener("change", sync);
      document.removeEventListener("visibilitychange", fg);
      pref.disconnect();
    };
  }, [!!setting, ctx.editing, key]);
  useEffect(() => {
    if (ctx.editing && ctx.selected === key && ctx.previewScene) {
      const target = images.findIndex((i) => i.id === ctx.previewScene);
      if (target >= 0) {
        setIndex(target);
        setPaused(true);
      }
    }
  }, [ctx.previewScene, ctx.selected, key, signature, ctx.editing]);
  useEffect(() => {
    if (!source || !image) return;
    const epoch = ++generation.current,
      img = new Image();
    img.src = source;
    void img.decode().then(() => {
      if (generation.current !== epoch) return;
      unavailable.current.delete(image.id);
      setFailedCount(unavailable.current.size);
      if (readyRef.current !== source) {
        const lastGood = readyRef.current;
        readyRef.current = source;
        setPrior(lastGood);
        setReady(source);
      }
      setFailed(false);
    }).catch(() => {
      if (generation.current !== epoch) return;
      // Do not discard the previously decoded frame or unmount the placement.
      unavailable.current.add(image.id);
      setFailedCount(unavailable.current.size);
      setFailed(true);
      const next = nextPlayableIndex(
        images, index, unavailable.current, 1, setting?.loop !== false,
      );
      if (next !== null && next !== index) setIndex(next);
    });
    return () => { ++generation.current; };
  }, [source, image?.id, index, signature, setting?.loop, recoveries]);
  // All unavailable frames are a real state transition. Retry twice with
  // backoff, never resetting an already decoded frame while recovering.
  useEffect(() => {
    if (!images.length || failedCount < images.length || recoveries >= 2) return;
    const timer = setTimeout(() => {
      unavailable.current.clear();
      setFailedCount(0);
      setRecoveries((count) => count + 1);
      setIndex(0);
    }, 6000 * (recoveries + 1));
    return () => clearTimeout(timer);
  }, [failedCount, recoveries, signature]);
  // Linked promotions use controls outside the anchor; their actions are
  // routed by the real registered slot rather than nested invalid buttons.
  useEffect(() => {
    if (!key || setting?.mode !== "slideshow" || images.length < 2) return;
    const navigate = (event: Event) => {
      const detail = (event as CustomEvent<{ slot: string; direction: 1 | -1 }>).detail;
      if (!detail || detail.slot !== key) return;
      setPaused(true);
      setIndex((current) => nextPlayableIndex(
        images, current, unavailable.current, detail.direction === -1 ? -1 : 1,
      ) ?? current);
    };
    window.addEventListener("angelcare-imagery-navigate", navigate);
    return () => window.removeEventListener("angelcare-imagery-navigate", navigate);
  }, [key, setting?.mode, signature]);
  useEffect(() => {
    if (!setting && !ctx.editing) return;
    if (!root.current) return;
    const insideLink = !!root.current.closest("a,button");
    setInteractive(insideLink);
    if (insideLink) setHover(false);
    const observer = new IntersectionObserver(
      ([e]) => setVisible(e.isIntersecting),
      { threshold: 0.05 },
    );
    observer.observe(root.current);
    return () => observer.disconnect();
  }, [!!setting, ctx.editing]);
  useEffect(() => {
    if (!setting?.autoplay || !sequence || images.length < 2 ||
        paused || (hover && !interactive) || !visible || !foreground || reduced || !ready)
      return;
    // The current scene needs to finish decoding before its display timer starts.
    if (readyRef.current !== source) return;
    const next = nextPlayableIndex(images, index, unavailable.current, 1, setting.loop);
    if (next === null || next === index) return;
    const nextImage = images[next];
    const nextSource = mobile && nextImage.mobile ? nextImage.mobile : nextImage.src;
    // Warm browser cache; the decode effect remains the single commit authority.
    const preload = new Image();
    preload.src = nextSource;
    void preload.decode().catch(() => {});
    const timer = setTimeout(
      () => setIndex(next),
      image?.duration || setting.interval,
    );
    return () => clearTimeout(timer);
  }, [
    setting, signature, index, paused, hover, visible, foreground,
    reduced, ready, mobile, source, sequence, interactive,
  ]);
  useEffect(() => {
    if (!prior) return;
    const timer = setTimeout(() => setPrior(""), setting?.speed || 0);
    return () => clearTimeout(timer);
  }, [prior, setting?.speed]);
  const descriptor = {
    "data-imagery-slot": key || undefined,
    "data-imagery-configured": !!setting,

    "data-imagery-owner": key.startsWith("shared.") ? "shared" : "editable",
    "data-imagery-selected": ctx.selected === key || undefined,
  };
  if (!key || (setting === undefined && !ctx.editing)) {
    if (kind === "sprite")
      return (
        <span {...(props as any)} {...descriptor}>
          {children}
        </span>
      );
    return <img {...props} {...descriptor} />;
  }
  const badgeSet = image?.badges ?? setting?.badges ?? [],
    enabled = !!setting?.badgesEnabled;
  const point = image ? (mobile ? image.mobileFocal : image.focal) : null;
  const style = {
    ...props.style,
    "--image-width": props.width ? props.width + "px" : undefined,
    "--image-aspect":
      props.width && props.height
        ? `${props.width}/${props.height}`
        : undefined,
    "--transition-speed": (reduced ? 0 : setting?.speed || 0) + "ms",
  } as CSSProperties;
  return (
    <span
      ref={root}
      {...Object.fromEntries(Object.entries(props).filter(([key])=>key.startsWith("data-")))}
      {...descriptor}
      aria-hidden={enabled ? undefined : props["aria-hidden"]}
      data-imagery-art
      data-imagery-kind={kind}
      data-imagery-count={images.length}
      data-imagery-frame={index + 1}
      data-imagery-failed={failedCount}
      data-transition={setting?.transition || "cut"}
      data-hidden={setting?.hidden || undefined}
      data-slow-zoom={(setting?.slowZoom && !reduced) || undefined}
      className={`${props.className || ""} ${s.art}`}
      style={style}
      onMouseEnter={() => { if (!interactive) setHover(true); }}
      onMouseLeave={() => setHover(false)}
      onFocusCapture={() => { if (!interactive) setHover(true); }}
      onBlurCapture={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget)) setHover(false);
      }}
    >
      {kind === "sprite" ? (
        <span className={s.originalSprite} style={props.style}>
          {children}
        </span>
      ) : (
        <img
          {...props}
          className={s.original}
          style={undefined}
          alt={props.alt || ""}
          aria-hidden={ready ? true : undefined}
          // An original editorial image failing must never trigger its parent
          // to unmount valid native publication layers.
          onError={(event) => {
            setOriginalFailed(true);
            if (!images.length) props.onError?.(event);
          }}
        />
      )}
      {!ready && originalFailed && images.length > 0 && failedCount >= images.length ? (
        <span className={s.unavailable} role="img" aria-label="Image temporarily unavailable">
          <span>Image temporarily unavailable</span>
        </span>
      ) : null}
      {ready ? (
        <>
          {prior && setting?.transition !== "cut" ? (
            <img className={s.layer} src={prior} alt="" aria-hidden="true" />
          ) : null}
          <img
            key={ready}
            className={`${s.layer} ${s.current}`}
            src={ready}
            onError={() => {
              const visibleScene = images.find((candidate) =>
                (mobile && candidate.mobile ? candidate.mobile : candidate.src) === ready,
              );
              if (visibleScene) {
                unavailable.current.add(visibleScene.id);
                setFailedCount(unavailable.current.size);
              }
              setFailed(true);
              const next = nextPlayableIndex(images, index, unavailable.current);
              if (next !== null && next !== index) setIndex(next);
            }
            alt={image?.alt || props.alt || ""}
            style={{
              objectFit: image?.fit || "cover",
              objectPosition: point ? `${point.x}% ${point.y}%` : undefined,
              transform: `scale(${image ? (mobile ? image.mobileZoom : image.zoom) : 1})`,
            }}
          />
        </>
      ) : null}
      <BadgeLayer badges={badgeSet} enabled={enabled} />
      {enabled ? (
        <span className={s.sr}>
          {badgeSet
            .filter((b) => b.enabled)
            .map((b) => b.text || b.icon)
            .join(", ")}
        </span>
      ) : null}
      {setting?.controls && !interactive && sequence && images.length > 1 ? (
        <span className={s.controls}>
          <button
            type="button"
            aria-label="Previous image"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setPaused(true);
              setIndex(nextPlayableIndex(images, index, unavailable.current, -1) ?? index);
            }}
          >
            ‹
          </button>
          <span>
            {index + 1}/{images.length}
          </span>
          <button
            type="button"
            aria-label="Next image"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setPaused(true);
              setIndex(nextPlayableIndex(images, index, unavailable.current) ?? index);
            }}
          >
            ›
          </button>
          <button
            type="button"
            aria-label={paused ? "Play images" : "Pause images"}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setPaused(!paused);
            }}
          >
            {paused ? "▶" : "Ⅱ"}
          </button>
        </span>
      ) : null}
      {failed && ctx.editing ? (
        <span className={s.error}>
          Image unavailable; current artwork retained.
        </span>
      ) : null}
      {ctx.editing ? (
        <span className={s.selectionLabel}>{label || slot}</span>
      ) : null}
    </span>
  );
}
export function HeroPlacement({
  children,
  slot = "opening.hero",
  ...props
}: ArtProps) {
  const ctx = useContext(ImageryContext),
    key = ctx.page + "." + slot;
  useEffect(() => {
    ctx.register({
      id: key,
      section: "Opening",
      label: "Main hero",
      sequence: true,
      source: typeof props.src === "string" ? props.src : undefined,
    });
  }, [key, ctx.register, props.src]);
  if (!ctx.config.slots[key] && !ctx.editing)
    return (
      <span
        data-imagery-slot={key}
        data-imagery-owner="editable"
        style={{ display: "contents" }}
      >
        {children}
      </span>
    );
  return (
    <Artwork
      {...props}
      slot={slot}
      section="Opening"
      label="Main hero"
      kind="sprite"
      sequence
    >
      {children}
    </Artwork>
  );
}
