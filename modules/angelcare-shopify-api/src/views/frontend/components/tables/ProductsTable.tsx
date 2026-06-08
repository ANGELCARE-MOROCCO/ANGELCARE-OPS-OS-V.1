import { useState, useMemo } from 'react';
import { ProductRow } from './ProductRow';
import { flatRows, rowText, stockState, txt, fmt } from '../../utils';

const PAGE_SIZE = 15;

export function ProductsTable({ products, auth, onAdjust }) {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');
  const [stock, setStock]   = useState('all');
  const [sort, setSort]     = useState('title');
  const [page, setPage]     = useState(0);

  function changeSearch(v) { setSearch(v.toLowerCase()); setPage(0); }
  function changeStatus(v) { setStatus(v); setPage(0); }
  function changeStock(v)  { setStock(v);  setPage(0); }
  function changeSort(v)   { setSort(v);   setPage(0); }

  const rows = useMemo(() => {
    const filtered = flatRows(products).filter((row) => {
      if (search && !rowText(row).includes(search)) return false;
      if (status !== 'all' && String(row.p.status || '').toLowerCase() !== status) return false;
      if (stock !== 'all' && stockState(row.v) !== stock) return false;
      return true;
    });

    filtered.sort((a, b) => {
      if (sort === 'inventory') {
        const qa = isFinite(+a.v.inventoryQuantity) ? +a.v.inventoryQuantity : -1;
        const qb = isFinite(+b.v.inventoryQuantity) ? +b.v.inventoryQuantity : -1;
        return qa - qb;
      }
      if (sort === 'updated') return Date.parse(b.p.updatedAt || 0) - Date.parse(a.p.updatedAt || 0);
      if (sort === 'status')  return txt(a.p.status).localeCompare(txt(b.p.status));
      return txt(a.p.title).localeCompare(txt(b.p.title));
    });

    return filtered;
  }, [products, search, status, stock, sort]);

  const productCount = useMemo(
    () => new Set(rows.map((r) => r.p.id || r.p.handle)).size,
    [rows],
  );

  const totalPages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
  const safePage   = Math.min(page, totalPages - 1);
  const pageRows   = rows.slice(safePage * PAGE_SIZE, (safePage + 1) * PAGE_SIZE);

  const firstRow = rows.length ? safePage * PAGE_SIZE + 1 : 0;
  const lastRow  = Math.min((safePage + 1) * PAGE_SIZE, rows.length);

  function exportCSV() {
    const csvVal = (v) => `"${txt(v).replace(/"/g, '""')}"`;
    const header = ['Product', 'Handle', 'Status', 'Variant', 'SKU', 'Price', 'Inventory', 'Stock State', 'Updated'];
    const lines = [
      header.map(csvVal).join(','),
      ...rows.map((r) =>
        [r.p.title, r.p.handle, r.p.status, r.v.title, r.v.sku, r.v.price,
          `${r.v.inventoryQuantity ?? ''}`, `${r.v.tracked === false ? 'untracked' : ''}`, r.p.updatedAt]
          .map(csvVal).join(','),
      ),
    ];
    const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `angelcare-products-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  return (
    <section className="panel">
      <div className="panel-header">
        <div className="panel-hd">
          <div className="panel-icon pb">▦</div>
          <div className="panel-title">
            <h2>Products &amp; Inventory</h2>
            <div className="panel-note">{fmt(rows.length)} variants across {fmt(productCount)} products</div>
          </div>
        </div>
        <div className="toolbar">
          <input
            type="search"
            placeholder="Search products…"
            value={search}
            onInput={(e) => changeSearch(e.currentTarget.value)}
            autoComplete="off"
          />
          <select value={status} onChange={(e) => changeStatus(e.target.value)} aria-label="Status filter">
            <option value="all">All statuses</option>
            <option value="active">Active</option>
            <option value="draft">Draft</option>
            <option value="archived">Archived</option>
          </select>
          <select value={stock} onChange={(e) => changeStock(e.target.value)} aria-label="Stock filter">
            <option value="all">All stock</option>
            <option value="available">Available</option>
            <option value="low">Low stock</option>
            <option value="out">Out of stock</option>
            <option value="unavailable">Unavailable</option>
            <option value="stocked">Stocked</option>
            <option value="untracked">Untracked</option>
          </select>
          <select value={sort} onChange={(e) => changeSort(e.target.value)} aria-label="Sort">
            <option value="title">Sort: Title</option>
            <option value="inventory">Sort: Inventory</option>
            <option value="updated">Sort: Updated</option>
            <option value="status">Sort: Status</option>
          </select>
          <button onClick={exportCSV} type="button">Export CSV</button>
        </div>
      </div>

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Product</th>
              <th>Status</th>
              <th>Variant</th>
              <th>SKU</th>
              <th>Price</th>
              <th>Inventory</th>
              <th>Updated</th>
              <th>Adjust</th>
            </tr>
          </thead>
          <tbody>
            {pageRows.length ? (
              pageRows.map((row, i) => (
                <ProductRow
                  key={`${row.p.id || row.p.handle}_${safePage * PAGE_SIZE + i}`}
                  row={row}
                  auth={auth}
                  onAdjust={onAdjust}
                />
              ))
            ) : (
              <tr><td colSpan={8} className="empty">No products match the current filters.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="pager">
        <span className="pager-info">
          {rows.length
            ? `${fmt(firstRow)}–${fmt(lastRow)} of ${fmt(rows.length)} variants`
            : 'No results'}
        </span>
        <div className="pager-nav">
          <button type="button" title="First page"    disabled={safePage === 0}              onClick={() => setPage(0)}>«</button>
          <button type="button" title="Previous page" disabled={safePage === 0}              onClick={() => setPage((p) => p - 1)}>‹ Prev</button>
          <span className="pager-page">Page {safePage + 1} of {totalPages}</span>
          <button type="button" title="Next page"     disabled={safePage >= totalPages - 1}  onClick={() => setPage((p) => p + 1)}>Next ›</button>
          <button type="button" title="Last page"     disabled={safePage >= totalPages - 1}  onClick={() => setPage(totalPages - 1)}>»</button>
        </div>
      </div>
    </section>
  );
}
