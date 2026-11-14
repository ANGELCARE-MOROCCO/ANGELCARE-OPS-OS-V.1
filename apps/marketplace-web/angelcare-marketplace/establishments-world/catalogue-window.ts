/** One filtered catalogue, shared by numbered pages and additive reveal. No fabricated fill cards. */
export function catalogueWindow(
  total: number,
  size: number,
  requestedPage: number,
  extraPages = 0,
) {
  const count = Number.isFinite(total) ? Math.max(0, Math.trunc(total)) : 0;
  const perPage = [10, 20, 40].includes(size) ? size : 10;
  const pages = Math.max(1, Math.ceil(count / perPage));
  const page = Math.max(
    1,
    Math.min(
      pages,
      Number.isFinite(requestedPage) ? Math.trunc(requestedPage) : 1,
    ),
  );
  const extra = Number.isFinite(extraPages)
    ? Math.max(0, Math.trunc(extraPages))
    : 0;
  const start = (page - 1) * perPage;
  const end = Math.min(count, start + perPage * (extra + 1));
  return {
    page,
    pages,
    start,
    end,
    shown: end - start,
    remaining: count - end,
    nextCount: Math.min(perPage, count - end),
  };
}
