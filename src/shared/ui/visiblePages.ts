/** First, last and the current page ±1; `null` marks a gap («…»). */
export function visiblePages(page: number, pageCount: number): (number | null)[] {
  const pages = [...new Set([1, page - 1, page, page + 1, pageCount])]
    .filter((p) => p >= 1 && p <= pageCount)
    .sort((a, b) => a - b);
  return pages.flatMap((p, i) => (i > 0 && p - pages[i - 1]! > 1 ? [null, p] : [p]));
}
