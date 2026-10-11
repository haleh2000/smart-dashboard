/** Categorical color for the n-th series; the palette is the `--chart-series-*` tokens only. */
export const seriesColor = (index: number) => `var(--chart-series-${(index % 6) + 1})`;
