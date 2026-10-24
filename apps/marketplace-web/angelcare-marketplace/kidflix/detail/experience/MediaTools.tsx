"use client";
import { useEffect, useRef, useState } from "react";
import { tr, type Locale } from "../../catalogue";
import { local, t } from "../copy";
import { rows, num, str, time, type Row } from "../model";
import { Button, ErrorNote, Source } from "../shared";
import { boundedFile } from "../../journey/outputs";
import s from "./experience.module.css";
export function TimedTranscript({
  m,
  d,
  unit,
  locale: l,
  position,
  seek,
}: {
  m: Row;
  d: Row;
  unit: Row;
  locale: Locale;
  position: number;
  seek: (n: number) => void;
}) {
  const [query, setQuery] = useState("");
  const cues = [...rows(d.captions), ...rows(d.cues)]
      .filter(
        (c) =>
          (!c.unitId ||
            c.unitId === unit.id ||
            (m.family === "stories" && d.narrationAssetId)) &&
          (!c.locale || c.locale === l) &&
          num(c.endSeconds) > num(c.startSeconds) &&
          local(c, "text", l),
      )
      .sort((a, b) => num(a.startSeconds) - num(b.startSeconds)),
    active = cues.filter(
      (c) => position >= num(c.startSeconds) && position < num(c.endSeconds),
    ),
    filtered = cues.filter(
      (c) =>
        !query ||
        local(c, "text", l)
          .toLocaleLowerCase(l)
          .includes(query.toLocaleLowerCase(l)),
    );
  if (!cues.length) return null;
  return (
    <section className={s.transcript}>
      <div
        className={s.liveCue}
        aria-label={tr(
          [
            "Current spoken passage",
            "Passage prononcé",
            "المقطع المنطوق الحالي",
          ],
          l,
        )}
      >
        {m.family === "stories"
          ? [...new Set(active.map((c) => str(c.unitId)))].map((id) => {
              const page = rows(d.units).find((u) => u.id === id);
              return page ? (
                <Source
                  key={id}
                  m={m}
                  id={page.assetId}
                  alt={local(page, "alt", l) || local(page, "title", l)}
                />
              ) : null;
            })
          : null}
        {active.map((c) => (
          <p key={c.id}>{local(c, "text", l)}</p>
        ))}
      </div>
      <details open>
        <summary>
          {tr(
            [
              "Searchable timed transcript",
              "Transcription synchronisée avec recherche",
              "نص متزامن قابل للبحث",
            ],
            l,
          )}
        </summary>
        <label className={s.search}>
          <span>{t("search", l)}</span>
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </label>
        <div className={s.cueList}>
          {filtered.map((c) => (
            <button
              key={c.id}
              aria-current={
                active.some((a) => a.id === c.id) ? "true" : undefined
              }
              onClick={() => seek(num(c.startSeconds))}
            >
              <time>{time(num(c.startSeconds))}</time>
              <span>{local(c, "text", l)}</span>
            </button>
          ))}
          {!filtered.length ? (
            <p role="status">
              {tr(
                [
                  "No matching passages.",
                  "Aucun passage correspondant.",
                  "لا توجد مقاطع مطابقة.",
                ],
                l,
              )}
            </p>
          ) : null}
        </div>
      </details>
    </section>
  );
}
export function Waveform({
  url,
  locale: l,
  position,
  duration,
  seek,
}: {
  url: string;
  locale: Locale;
  position: number;
  duration: number;
  seek: (n: number) => void;
}) {
  const [peaks, setPeaks] = useState<number[]>([]),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(false),
    controller = useRef<AbortController | null>(null),
    ctx = useRef<AudioContext | null>(null),
    live = useRef(true),
    locked = useRef(false);
  useEffect(() => {
    live.current = true;
    return () => {
      live.current = false;
      controller.current?.abort();
      void ctx.current?.close();
    };
  }, [url]);
  async function analyse() {
    if (locked.current) return;
    locked.current = true;
    setBusy(true);
    setError(false);
    controller.current = new AbortController();
    try {
      const data = await boundedFile(
        url,
        controller.current.signal,
        15 * 1024 * 1024,
      );
      const audio = new AudioContext();
      ctx.current = audio;
      const buffer = await audio.decodeAudioData(
        data.bytes.buffer as ArrayBuffer,
      );
      const count = 96,
        out = Array.from({ length: count }, (_, i) => {
          let peak = 0;
          for (let c = 0; c < buffer.numberOfChannels; c++) {
            const channel = buffer.getChannelData(c),
              a = Math.floor((i * channel.length) / count),
              b = Math.floor(((i + 1) * channel.length) / count);
            for (let n = a; n < b; n++)
              peak = Math.max(peak, Math.abs(channel[n]));
          }
          return peak;
        });
      await audio.close();
      ctx.current = null;
      if (live.current) setPeaks(out);
    } catch (e) {
      if (live.current && (e as Error).name !== "AbortError") setError(true);
    } finally {
      locked.current = false;
      if (live.current) setBusy(false);
    }
  }
  return (
    <div className={s.waveform}>
      {peaks.length ? (
        <>
          <div className={s.waveBars} aria-hidden="true">
            {peaks.map((p, i) => (
              <span
                key={i}
                style={{
                  height: Math.max(2, p * 64),
                  background:
                    i / peaks.length < position / (duration || 1)
                      ? "#e56249"
                      : "#426ea7",
                }}
              />
            ))}
          </div>
          <label>
            {tr(
              [
                "Seek in the analysed recording",
                "Se déplacer dans l’enregistrement analysé",
                "التنقل في التسجيل المحلل",
              ],
              l,
            )}
            <input
              type="range"
              min="0"
              max={duration || 1}
              step="0.1"
              value={Math.min(position, duration || 1)}
              onChange={(e) => seek(Number(e.target.value))}
            />
          </label>
          <small>
            {tr(
              [
                "Amplitude measured from this audio file.",
                "Amplitude mesurée dans ce fichier audio.",
                "سعة مقاسة من هذا الملف الصوتي.",
              ],
              l,
            )}
          </small>
        </>
      ) : (
        <Button disabled={busy} onClick={() => void analyse()}>
          {busy
            ? t("loading", l)
            : tr(
                [
                  "Analyse the real audio waveform · up to 15 MB",
                  "Analyser la forme d’onde réelle · 15 Mo maximum",
                  "تحليل الموجة الصوتية الفعلية · حتى 15 ميغابايت",
                ],
                l,
              )}
        </Button>
      )}
      {error ? (
        <ErrorNote
          locale={l}
          message={tr(
            [
              "This recording could not be analysed. Playback remains available; check file size and media access.",
              "Cet enregistrement n’a pas pu être analysé. La lecture reste disponible ; vérifiez la taille et l’accès au média.",
              "تعذر تحليل التسجيل. التشغيل متاح؛ تحقق من حجم الملف وإمكانية الوصول إليه.",
            ],
            l,
          )}
        />
      ) : null}
    </div>
  );
}
