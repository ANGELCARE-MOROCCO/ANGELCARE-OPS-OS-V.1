import type { ReactNode } from 'react';

type MetricCardProps = {
  label: ReactNode;
  val: ReactNode;
  [key: string]: unknown;
};

export function MetricCard({ label, val }: MetricCardProps) {
  return (
    <div className="metric">
      <span className="label">{label}</span>
      <strong className="value">{val ?? '—'}</strong>
    </div>
  );
}
