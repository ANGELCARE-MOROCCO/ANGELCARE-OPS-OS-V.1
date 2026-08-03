import Link from 'next/link'
import type { Angelcare360FoundationPlane } from '@/types/angelcare360/customer-foundation'
import styles from './FoundationPlaneRail.module.css'

export default function FoundationPlaneRail({ planes, activeKey, tone }: { planes: Angelcare360FoundationPlane[]; activeKey: string; tone: 'direction' | 'governance' | 'people' | 'admissions' }) {
  return <nav className={styles.rail} data-tone={tone} aria-label="Navigation horizontale du workspace">
    <div className={styles.track}>{planes.map((plane, index) => <Link key={plane.key} href={plane.href} className={styles.item} data-active={plane.key === activeKey} aria-current={plane.key === activeKey ? 'page' : undefined}>
      <span className={styles.index}>{String(index + 1).padStart(2, '0')}</span>
      <span className={styles.copy}><strong>{plane.label}</strong><small>{plane.description}</small></span>
    </Link>)}</div>
  </nav>
}
