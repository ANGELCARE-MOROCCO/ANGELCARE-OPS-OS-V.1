import { useState } from 'react';
import { Pill } from '../Pill';
import { pillCls, invLabel, stockLbl, txt, fmtShort } from '../../utils';

export function ProductRow({ row, auth, onAdjust }) {
  const { p, v } = row;
  const [busy, setBusy] = useState(false);
  const levels = v.tracked === false ? [] : (v.inventoryLevels || []);
  const canAdjust = auth === 'connected' && v.tracked !== false && v.inventoryItemId && levels.length;

  async function handleSubmit(e) {
    e.preventDefault();
    setBusy(true);
    try {
      await onAdjust({
        inventoryItemId: v.inventoryItemId,
        locationId: e.target.elements.locationId.value,
        delta: Number(e.target.elements.delta.value),
      });
    } finally {
      setBusy(false);
    }
  }

  const thumb = p.imageUrl ? (
    <img className="thumb" src={p.imageUrl} alt={p.imageAlt || p.title} loading="lazy" />
  ) : (
    <span className="thumb-fallback">{txt(p.title).slice(0, 2).toUpperCase()}</span>
  );

  let adjustEl;
  if (v.tracked === false) {
    adjustEl = <span className="muted">Not tracked</span>;
  } else if (canAdjust) {
    adjustEl = (
      <form className="inventory-form" onSubmit={handleSubmit}>
        <select name="locationId">
          {levels.map((l, i) => (
            <option key={i} value={l.locationId}>
              {l.locationName} ({l.available ?? '?'} avail)
            </option>
          ))}
        </select>
        <input name="delta" type="number" step="1" defaultValue="1" />
        <button className="primary" type="submit" disabled={busy}>{busy ? '…' : 'Apply'}</button>
      </form>
    );
  } else {
    adjustEl = (
      <span className="muted">
        {auth !== 'connected' ? 'Admin API required' : 'No inventory levels'}
      </span>
    );
  }

  return (
    <tr>
      <td>
        <div className="product-cell">
          {thumb}
          <div>
            <strong>{txt(p.title)}</strong>
            <br />
            <span className="muted">{txt(p.handle)}</span>
          </div>
        </div>
      </td>
      <td><Pill label={txt(p.status)} cls={pillCls(p.status)} /></td>
      <td>{txt(v.title)}</td>
      <td>{txt(v.sku)}</td>
      <td>{txt(v.price)}</td>
      <td>
        {invLabel(v)}
        <br />
        <Pill label={stockLbl(v)} cls={pillCls(stockLbl(v))} />
      </td>
      <td>{fmtShort(p.updatedAt)}</td>
      <td>{adjustEl}</td>
    </tr>
  );
}
