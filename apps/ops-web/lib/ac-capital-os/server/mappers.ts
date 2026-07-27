export function mapRowsForApi(rows: unknown[]) {
  return rows.map((row) => {
    if (row && typeof row === "object") return row;
    return { value: row };
  });
}

export function summarizeRows(rows: unknown[]) {
  return {
    count: rows.length,
    hasData: rows.length > 0,
    sample: rows.slice(0, 3),
  };
}
