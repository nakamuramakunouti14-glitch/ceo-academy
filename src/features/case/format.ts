/** 増減の表示。増は「＋」、減は会計の慣習で「△」(赤で出す) */
export function formatDelta(value: number): string {
  const abs = Math.abs(value).toLocaleString("ja-JP", { maximumFractionDigits: 1 });
  if (value > 0) return `＋${abs}`;
  if (value < 0) return `△${abs}`;
  return "±0";
}

/** 回収期間 (年)。小数 1 桁 */
export function paybackYears(investment: number, annualCash: number): number {
  return Math.round((investment / annualCash) * 10) / 10;
}
