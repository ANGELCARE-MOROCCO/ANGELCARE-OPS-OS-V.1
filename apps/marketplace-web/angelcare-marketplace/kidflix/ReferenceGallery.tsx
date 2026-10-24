"use client";
import { useEffect, useRef, useState, type CSSProperties } from "react";
import type { Scene } from "./gallery-contract";
import type { Locale } from "./catalogue";
import { tr } from "./catalogue";
import { HomeArtwork } from "./HomeArtwork";
import { I } from "./Icons";
import s from "./reference.module.css";
/** One bounded editorial deck; no carousel changes resource identity or preview content. */
export function ReferenceGallery({
  scenes,
  locale,
}: {
  scenes: Scene[];
  locale: Locale;
}) {
  const [index, setIndex] = useState(0),
    [previous, setPrevious] = useState<Scene | null>(null),
    [paused, setPaused] = useState(false),
    [still, setStill] = useState(true),
    [over, setOver] = useState(false),
    [active, setActive] = useState(true),
    [inView, setInView] = useState(false),
    root = useRef<HTMLDivElement>(null),
    signature = JSON.stringify(scenes);
  useEffect(() => {
    setIndex(0);
    setPrevious(null);
  }, [signature]);
  useEffect(() => {
    const motion = matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () =>
      setStill(
        motion.matches ||
          document.documentElement.dataset.kidflixMotion === "no",
      );
    const visibility = () => setActive(!document.hidden);
    sync();
    visibility();
    const observer = new IntersectionObserver(
      (entries) => setInView(entries[0]?.isIntersecting === true),
      { threshold: 0.05 },
    );
    if (root.current) observer.observe(root.current);
    motion.addEventListener("change", sync);
    document.addEventListener("visibilitychange", visibility);
    const pref = new MutationObserver(sync);
    pref.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-kidflix-motion"],
    });
    return () => {
      motion.removeEventListener("change", sync);
      document.removeEventListener("visibilitychange", visibility);
      pref.disconnect();
      observer.disconnect();
    };
  }, []);
  useEffect(() => {
    if (paused || still || over || !active || !inView || scenes.length < 2)
      return;
    let dead = false;
    const timer = setTimeout(() => {
      const next = (index + 1) % scenes.length,
        img = new Image();
      const advance = () => {
        if (!dead) {
          setPrevious(scenes[index]);
          setIndex(next);
        }
      };
      img.onload = advance;
      img.src = matchMedia("(max-width:760px)").matches
        ? scenes[next].mobile || scenes[next].desktop
        : scenes[next].desktop;
    }, 3000);
    return () => {
      dead = true;
      clearTimeout(timer);
    };
  }, [index, signature, paused, still, over, active, inView]);
  useEffect(() => {
    if (!previous) return;
    const timer = setTimeout(() => setPrevious(null), 650);
    return () => clearTimeout(timer);
  }, [index, previous]);
  const current = scenes[index] || scenes[0];
  if (!current) return null;
  return (
    <div
      ref={root}
      className={s.gallery}
      data-reference-gallery
      data-gallery-factory={current.desktop.startsWith(
        "/kidflix/reference-public-r1/",
      )}
      data-scene-id={current.id}
      data-motion={
        paused || still || over || !active || !inView ? "paused" : "playing"
      }
      onMouseEnter={() => setOver(true)}
      onMouseLeave={() => setOver(false)}
      onFocusCapture={() => setOver(true)}
      onBlurCapture={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget)) setOver(false);
      }}
    >
      {previous ? (
        <div
          className={s.galleryPrevious}
          aria-hidden="true"
          style={
            {
              "--scene-focal": `${previous.focal.x}% ${previous.focal.y}%`,
              "--scene-mobile-focal": `${previous.mobileFocal.x}% ${previous.mobileFocal.y}%`,
            } as CSSProperties
          }
        >
          <HomeArtwork
            src={previous.desktop}
            mobile={previous.mobile}
            alt=""
            width={1536}
            height={1024}
          />
        </div>
      ) : null}
      <div
        className={s.galleryCurrent}
        key={current.id}
        style={
          {
            "--scene-focal": `${current.focal.x}% ${current.focal.y}%`,
            "--scene-mobile-focal": `${current.mobileFocal.x}% ${current.mobileFocal.y}%`,
          } as CSSProperties
        }
      >
        <HomeArtwork
          src={current.desktop}
          mobile={current.mobile}
          alt={current.descriptions[locale]}
          width={1536}
          height={1024}
          loading="eager"
          fetchPriority="high"
        />
      </div>
      {scenes.length > 1 ? (
        <div className={s.galleryControls}>
          <button
            type="button"
            onClick={() => setPaused((v) => !v)}
            disabled={still}
            aria-label={tr(
              paused
                ? ["Resume artwork", "Reprendre les images", "استئناف الصور"]
                : [
                    "Pause artwork",
                    "Mettre les images en pause",
                    "إيقاف الصور",
                  ],
              locale,
            )}
            aria-pressed={paused || still}
          >
            <I name={paused || still ? "Play" : "Pause"} size={12} />
          </button>
          {scenes.map((scene, i) => (
            <button
              type="button"
              key={scene.id}
              aria-label={
                tr(["Artwork", "Image", "صورة"], locale) + " " + (i + 1)
              }
              aria-pressed={index === i}
              onClick={() => {
                setPaused(true);
                setPrevious(scenes[index]);
                setIndex(i);
              }}
            >
              <span />
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
