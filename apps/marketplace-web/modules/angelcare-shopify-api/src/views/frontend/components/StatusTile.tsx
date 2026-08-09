import type { ReactNode } from 'react';

type StatusTileProps = {
  label: ReactNode;
  val: ReactNode;
  valCls?: string;
  detail?: ReactNode;
};

export function StatusTile({ label, val, valCls, detail }: StatusTileProps) {
  return (
    <div className="status-tile">
      <span className="label">{label}</span>
      <strong className={`status-value ${valCls || ''}`}>{val ?? '—'}</strong>
      <span className="status-detail">{detail ?? ''}</span>
    </div>
  );
}
