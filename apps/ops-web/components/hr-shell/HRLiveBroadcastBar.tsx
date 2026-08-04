"use client";

import Link from "next/link";
import { Activity, Menu, Radio, ShieldCheck } from "lucide-react";
import type { CSSProperties } from "react";
import type { HRShellSnapshot, HRSnapshotTone } from "@/lib/hr-shell/types";
import styles from "./HRSovereignShell.module.css";

const toneClass: Record<HRSnapshotTone, string> = {
  healthy: styles.feedDotHealthy,
  neutral: styles.feedDotNeutral,
  attention: styles.feedDotAttention,
  critical: styles.feedDotCritical,
  unavailable: styles.feedDotUnavailable,
};

function FeedTrack({ snapshot, copy }: { snapshot: HRShellSnapshot; copy: number }) {
  return (
    <div className={styles.feedTrackSet} aria-hidden={copy === 2}>
      {snapshot.factors.map((factor) => (
        <Link className={styles.feedItem} href={factor.href} key={`${copy}-${factor.key}`} tabIndex={copy === 2 ? -1 : 0}>
          <span className={`${styles.feedDot} ${toneClass[factor.tone]}`} />
          <span className={styles.feedLabel}>{factor.label}</span>
          <span className={styles.feedSentence}>{factor.sentence}</span>
        </Link>
      ))}
    </div>
  );
}

export default function HRLiveBroadcastBar({
  snapshot,
  onOpenNavigation,
}: {
  snapshot: HRShellSnapshot;
  onOpenNavigation: () => void;
}) {
  const durationSeconds = Math.max(72, Math.min(132, snapshot.factors.reduce((sum, factor) => sum + factor.sentence.length, 0) / 18));
  const animationStyle = { "--hr-feed-duration": `${durationSeconds}s` } as CSSProperties;
  return (
    <section className={styles.broadcast} aria-label="Diffusion instantanée des indicateurs RH">
      <div className={styles.broadcastIdentity}>
        <button className={styles.mobileMenuButton} onClick={onOpenNavigation} aria-label="Ouvrir la navigation RH" type="button">
          <Menu size={18} />
        </button>
        <span className={styles.livePulse}><Radio size={15} /></span>
        <span>
          <strong>HR LIVE</strong>
          <small>Snapshot {snapshot.generatedLabel}</small>
        </span>
      </div>
      <div className={styles.feedViewport}>
        <div className={styles.feedTrack} style={animationStyle}>
          <FeedTrack snapshot={snapshot} copy={1} />
          <FeedTrack snapshot={snapshot} copy={2} />
        </div>
      </div>
      <div className={styles.broadcastHealth} title={`${snapshot.sourceHealth.available}/${snapshot.sourceHealth.total} facteurs disponibles`}>
        {snapshot.sourceHealth.unavailable ? <Activity size={16} /> : <ShieldCheck size={16} />}
        <span>{snapshot.sourceHealth.available}/{snapshot.sourceHealth.total}</span>
      </div>
    </section>
  );
}
